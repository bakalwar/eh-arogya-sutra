const express = require('express');
const { personalFactorFromName } = require('../services/mulank');
const { requirePatientsDb } = require('../middleware/requireDb');
const { requireAuth } = require('../middleware/requireAuth');
const { asyncHandler } = require('../utils/asyncHandler');
const { getPostgresModels } = require('../utils/dataSource');

const router = express.Router();

router.use(requirePatientsDb);
router.use(requireAuth);

function patientToApi(pgRow) {
  const u = pgRow.get({ plain: true });
  return {
    id: String(u.id),
    name: u.name,
    age: u.age,
    gender: u.gender,
    weight: u.weight,
    mobile: u.mobile,
    personalFactor: u.personal_factor,
    photoUrl: u.photo_url,
    symptoms: u.symptoms || [],
    notes: u.notes,
    createdAt: u.created_at,
    updatedAt: u.updated_at
  };
}

function buildPatientPayloadFromBody(body, { forCreate } = {}) {
  const payload = {};
  if (body.name != null && body.name !== '') payload.name = String(body.name).trim();
  if (body.age != null && body.age !== '') payload.age = Number(body.age);
  if (body.gender != null && body.gender !== '') payload.gender = String(body.gender).trim();
  if (body.weight != null && body.weight !== '') payload.weight = Number(body.weight);
  if (body.mobile != null && body.mobile !== '') payload.mobile = String(body.mobile).trim();
  if (body.photoUrl !== undefined) payload.photo_url = body.photoUrl;
  if (body.notes !== undefined) payload.notes = body.notes;
  if (Array.isArray(body.symptoms)) payload.symptoms = body.symptoms;

  let pf = body.personalFactor;
  if ((pf == null || pf === '') && body.name) {
    const computed = personalFactorFromName(body.name);
    if (computed != null) pf = computed;
  }
  if (pf != null && pf !== '') payload.personal_factor = Number(pf);

  if (forCreate && !payload.name) return null;
  return payload;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { PatientPg } = getPostgresModels();
    const rows = await PatientPg.findAll({ order: [['updated_at', 'DESC']] });
    res.json({ success: true, data: rows.map((r) => patientToApi(r)) });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { PatientPg } = getPostgresModels();
    const patient = await PatientPg.findByPk(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    res.json({ success: true, data: patientToApi(patient) });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    if (req.body.photoUrl && req.body.photoUrl.length > 240000) {
      return res.status(400).json({ success: false, message: 'Photo payload too large' });
    }
    const { PatientPg } = getPostgresModels();
    const payload = buildPatientPayloadFromBody(req.body, { forCreate: true });
    if (!payload) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    const patient = await PatientPg.create({
      ...payload,
      symptoms: payload.symptoms || []
    });
    res.status(201).json({ success: true, data: patientToApi(patient) });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { PatientPg } = getPostgresModels();
    const patient = await PatientPg.findByPk(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    const patch = buildPatientPayloadFromBody(req.body, { forCreate: false });
    await patient.update(patch);
    await patient.reload();
    res.json({ success: true, data: patientToApi(patient) });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { PatientPg, PrescriptionPg, ReportPg } = getPostgresModels();
    const id = req.params.id;
    const patient = await PatientPg.findByPk(id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    await PrescriptionPg.destroy({ where: { patient_id: id } });
    await ReportPg.destroy({ where: { patient_id: id } });
    await patient.destroy();
    res.json({ success: true, message: 'Patient deleted' });
  })
);

module.exports = router;
