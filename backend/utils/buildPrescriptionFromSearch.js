'use strict';

/**
 * Map PDF Smart Search session (caseData) → PrescriptionPg row fields.
 */
function buildPrescriptionFromSearch(caseData, { patientId, doctorId } = {}) {
  const patient = caseData?.patient || {};
  const expert = caseData?.expert || {};
  const analysis = caseData?.analysis || {};
  const formulas = expert.formulas || caseData?.medicines || {};

  const items = [];
  for (const key of ['formula_a', 'formula_b', 'formula_c', 'formula_d']) {
    const card = formulas[key];
    if (card?.medicines?.length) {
      items.push({
        type: 'formula',
        slot: key,
        medicines: card.medicines,
        potency: card.potency,
        timing: card.timing,
        dose: card.dose,
        purpose: card.purpose
      });
    }
  }

  const summary = (caseData?.summary || '').trim();
  const chief = analysis.chief_complaint || patient.chiefComplaint || '';

  return {
    patient_id: patientId,
    doctor_id: doctorId || null,
    items,
    notes: summary || chief || 'EH AI Expert PDF analysis',
    patient_name: patient.name || patient.patient_name || null,
    patient_age: patient.age ?? null,
    patient_gender: patient.gender || null,
    patient_weight: patient.weight ?? null,
    bp_systolic: patient.bp_systolic ?? patient.bpSystolic ?? null,
    bp_diastolic: patient.bp_diastolic ?? patient.bpDiastolic ?? null,
    symptoms_json: patient.symptoms || [],
    symptom_count: Array.isArray(patient.symptoms) ? patient.symptoms.length : 0,
    polarity: expert.overall_polarity || analysis.polarity || null,
    vitiation_type: expert.temperament || analysis.temperament || null,
    phase: expert.phase || analysis.phase || null,
    dilution: expert.potency || analysis.dilution || null,
    electricity: expert.electricity || analysis.electricity || null,
    medicines_json: formulas,
    confidence_score: expert.confidence ?? analysis.confidence ?? null,
    summary_hi: summary || null,
    duration_days: patient.durationDays ?? analysis.duration_days ?? null,
    duration_label: patient.durationDays ? `${patient.durationDays} days` : null
  };
}

module.exports = { buildPrescriptionFromSearch };
