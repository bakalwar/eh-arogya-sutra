'use strict';

const { buildLocalExpertFallback } = require('./localExpertFallback');
const { detectAffectedOrgans } = require('../utils/ehOrganDetect');

/** Smart-search caseData → generateClinicalSummary input */
function numBp(v) {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function pickBloodPressure(caseData = {}) {
  const expert = caseData.expert || {};
  const patient = caseData.patient || {};
  const analysis = caseData.analysis || {};
  const intake = analysis.patient_intake || {};

  const sys =
    numBp(patient.bp_systolic) ??
    numBp(patient.bpSystolic) ??
    numBp(intake.bp_systolic) ??
    numBp(intake.bpSystolic) ??
    numBp(expert.bp_systolic);

  const dia =
    numBp(patient.bp_diastolic) ??
    numBp(patient.bpDiastolic) ??
    numBp(intake.bp_diastolic) ??
    numBp(intake.bpDiastolic) ??
    numBp(expert.bp_diastolic);

  return { bp_systolic: sys, bp_diastolic: dia };
}

function caseDataToSummaryInput(caseData = {}) {
  const expert = caseData.expert || {};
  const patient = caseData.patient || {};
  const analysis = caseData.analysis || {};
  /** Smart Search `medicines` व Expert `formulas` दोनों में फॉर्मूला हो सकता है — वरना सार खाली सूत्र दिखता है */
  const pack =
    caseData.medicines && typeof caseData.medicines === 'object' ? caseData.medicines : {};
  const fromExpert =
    expert.formulas && typeof expert.formulas === 'object' ? expert.formulas : {};
  const { bp_systolic: bpSys, bp_diastolic: bpDia } = pickBloodPressure(caseData);

  let formulas = {
    formula_a:
      fromExpert.formula_a ||
      pack.formula_a || {
        medicines: expert.formula_medicines || pack.formula_a?.medicines || []
      },
    formula_b: fromExpert.formula_b || pack.formula_b || {},
    formula_c: fromExpert.formula_c || pack.formula_c || {},
    formula_d: fromExpert.formula_d || pack.formula_d || {}
  };

  const faMeds = formulas.formula_a?.medicines;
  const useTemplatePool = process.env.EH_ALLOW_TEMPLATE_FALLBACK === '1';
  if ((!Array.isArray(faMeds) || faMeds.length === 0) && useTemplatePool) {
    const offline = buildLocalExpertFallback({
      patientIntake: analysis.patient_intake || patient,
      chiefComplaint: analysis.chief_complaint || patient.chiefComplaint || '',
      symptoms: (patient.symptoms || []).map((s) =>
        typeof s === 'object' ? s : { name: String(s) }
      ),
      ehBase: {
        bp_systolic: bpSys,
        bp_diastolic: bpDia,
        query: analysis.chief_complaint || patient.chiefComplaint || ''
      }
    });
    formulas = offline.formulas;
  } else if (!Array.isArray(faMeds) || faMeds.length === 0) {
    formulas = {
      formula_a: { medicines: [] },
      formula_b: { medicines: [] },
      formula_c: { medicines: [] },
      formula_d: { medicines: [] }
    };
  }

  const symptoms = [];
  if (patient.chiefComplaint) symptoms.push({ name: patient.chiefComplaint });
  if (analysis.chief_complaint) symptoms.push({ name: analysis.chief_complaint });
  (patient.symptoms || []).forEach((s) => {
    if (s) symptoms.push(typeof s === 'object' ? s : { name: String(s) });
  });

  const report_values = { ...(analysis.report_values || patient.report_values || {}) };
  const cr = caseData.combinedReports || analysis.combined_reports;
  (cr?.found_values || []).forEach((v) => {
    const key = String(v.test_key || v.test_name || '')
      .toLowerCase()
      .replace(/\s+/g, '_');
    if (key && v.value != null) report_values[key] = Number(v.value) || v.value;
  });

  const reportParts = [];
  if (cr?.raw_text) reportParts.push(String(cr.raw_text));
  if (cr?.ocr_text) reportParts.push(String(cr.ocr_text));
  if (analysis.report_text) reportParts.push(String(analysis.report_text));
  if (analysis.blood_report) reportParts.push(String(analysis.blood_report));
  if (analysis.mri_report) reportParts.push(String(analysis.mri_report));
  if (analysis.sonography) reportParts.push(String(analysis.sonography));
  if (caseData.processedReports?.raw_text) {
    reportParts.push(String(caseData.processedReports.raw_text));
  }

  const symText = symptoms
    .map((s) => (typeof s === 'object' ? s.name || s.hindi || '' : String(s)))
    .filter(Boolean)
    .join(' ');
  const affected_organs =
    (analysis.affected_organs?.length && analysis.affected_organs) ||
    detectAffectedOrgans(symText, report_values);
  const face = caseData.faceAnalysis || analysis.face_analysis || null;
  const temperament =
    face?.temperament ||
    expert.temperament ||
    analysis.temperament ||
    (affected_organs.includes('cardiovascular') ? 'Sanguine' : 'Mixed');

  return {
    age: patient.age ?? analysis.patient_intake?.age ?? 30,
    gender: patient.gender || analysis.patient_intake?.gender || 'Male',
    weight: patient.weight ?? analysis.patient_intake?.weight ?? 60,
    bp_systolic: bpSys,
    bp_diastolic: bpDia,
    pulse: patient.pulse ?? analysis.patient_intake?.pulse ?? 72,
    duration_days: patient.durationDays ?? analysis.duration_days ?? 0,
    symptoms,
    report_text: reportParts.join('\n').slice(0, 12000),
    report_values,
    blood_report: reportParts.join('\n').slice(0, 3000),
    face_analysis: face,
    temperament,
    affected_organs,
    phase: String(expert.phase || analysis.phase || 'SUB_ACUTE').replace(/-/g, '_'),
    polarity: expert.overall_polarity || analysis.polarity || 'POSITIVE',
    confidence: expert.confidence ?? 80,
    electricity:
      caseData.electricity ||
      expert.electricity ||
      expert.eh_clinical?.elecCode ||
      expert.eh_clinical?.formulas?.electricity,
    masterElectricity:
      caseData.electricity ||
      expert.electricity ||
      expert.eh_clinical?.elecCode,
    formulas
  };
}

module.exports = { caseDataToSummaryInput };
