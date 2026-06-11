const express = require('express');
const { requirePrescriptionsDb } = require('../middleware/requireDb');
const { asyncHandler } = require('../utils/asyncHandler');
const { getPostgresModels } = require('../utils/dataSource');
const { prescriptionPdfBuffer } = require('../services/prescriptionPdf');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

router.use(requirePrescriptionsDb);

function prescriptionToApi(row) {
  const u = row.get({ plain: true });
  return {
    id: String(u.id),
    patientId: u.patient_id ? String(u.patient_id) : undefined,
    doctorId: u.doctor_id ? String(u.doctor_id) : undefined,
    items: Array.isArray(u.items) ? u.items : [],
    notes: u.notes || '',
    pdfUrl: u.pdf_url || undefined,
    createdAt: u.created_at
  };
}

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { patientId, items, notes, doctorId, anatomy } = req.body || {};
    if (!patientId) {
      return res.status(400).json({ success: false, message: 'patientId is required' });
    }

    const { PrescriptionPg, PatientPg } = getPostgresModels();
    const patient = await PatientPg.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    const rxItems = Array.isArray(items) ? items : [];
    if (anatomy && typeof anatomy === 'object') {
      rxItems.push({ type: 'anatomy', ...anatomy });
    }
    const prescription = await PrescriptionPg.create({
      patient_id: patientId,
      doctor_id: doctorId || null,
      items: rxItems,
      notes: notes || ''
    });
    res.status(201).json({ success: true, data: prescriptionToApi(prescription) });
  })
);

router.post(
  '/pdf',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const buf = await prescriptionPdfBuffer(body, req.user?.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="eh-prescription.pdf"');
    res.send(buf);
  })
);

router.get(
  '/:id/pdf',
  asyncHandler(async (req, res) => {
    const { PrescriptionPg, PatientPg } = getPostgresModels();
    const prescription = await PrescriptionPg.findByPk(req.params.id);
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }
    const plain = prescription.get({ plain: true });
    const patient = await PatientPg.findByPk(plain.patient_id);
    const items = Array.isArray(plain.items) ? plain.items : [];
    const anatomyEntry = items.find((it) => it && it.type === 'anatomy');
    const medItems = items.filter((it) => !it || it.type !== 'anatomy');

    const buf = await prescriptionPdfBuffer(
      {
        patientName: patient?.name || 'Patient',
        doctorName: 'Doctor',
        items: medItems,
        anatomy: anatomyEntry || null,
        notes: plain.notes || ''
      },
      plain.doctor_id || req.user?.id
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="prescription-${req.params.id}.pdf"`);
    res.send(buf);
  })
);

module.exports = router;
