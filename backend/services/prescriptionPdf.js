const branding = require('../config/branding');
const { prescriptionToPdfBuffer } = require('./pdfGenerator');
const { loadPdfPayloadForDoctor } = require('./doctorProfile');

async function buildPrescriptionPdfPayload(body, doctorId) {
  let profile = null;
  if (doctorId) {
    profile = await loadPdfPayloadForDoctor(doctorId);
  }
  return {
    clinicName: profile?.clinicName || branding.clinicName,
    clinicPhone: profile?.clinicPhone || branding.clinicPhone,
    doctorName: profile?.doctorName || body.doctorName || 'Doctor',
    patientName: body.patientName || 'Patient',
    items: body.items || [],
    anatomy: body.anatomy || null,
    notes: body.notes || '',
    smartSearch: body.smartSearch || null,
    profile: profile || {
      clinicName: branding.clinicName,
      clinicPhone: branding.clinicPhone,
      headerName: branding.clinicName,
      doctorName: body.doctorName || 'Doctor'
    }
  };
}

async function prescriptionPdfBuffer(body, doctorId) {
  const payload = await buildPrescriptionPdfPayload(body, doctorId);
  return prescriptionToPdfBuffer(payload);
}

module.exports = { buildPrescriptionPdfPayload, prescriptionPdfBuffer };
