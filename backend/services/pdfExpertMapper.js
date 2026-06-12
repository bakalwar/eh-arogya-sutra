'use strict';

/**
 * Primary: EH API v3 (9 Rule Engines + fuzzy ICD diseases + English summary).
 */

function mapExpertToApp(expert, patient = {}) {
  const formulas = expert.formulas || {};
  return {
    patient: {
      name: patient.name || patient.patient_name || 'Patient',
      age: patient.age ?? 30,
      gender: patient.gender || 'Male',
      weight: patient.weight ?? null,
      mobile: patient.mobile || null,
      bp_systolic: patient.bp_systolic ?? null,
      bp_diastolic: patient.bp_diastolic ?? null,
      pulse: patient.pulse ?? null,
      chiefComplaint: patient.chief_complaint || patient.chiefComplaint || '',
      durationDays: patient.duration_days ?? patient.durationDays ?? 0
    },
    analysis: {
      chief_complaint: patient.chief_complaint || patient.chiefComplaint || '',
      polarity: expert.overall_polarity,
      phase: expert.phase || patient.phase,
      dilution: expert.potency,
      electricity: expert.electricity,
      confidence: expert.confidence,
      temperament: expert.temperament,
      eh_expert_reasoning: (expert.reasoning_trace || []).join('\n'),
      duration_days: patient.duration_days ?? 0,
      report_values: patient.report_values || {},
      affected_organs: patient.affected_organs || [],
      blood_report: patient.blood_report || '',
      mri_report: patient.mri_report || '',
      sonography: patient.sonography || ''
    },
    medicines: formulas,
    expert: {
      ...expert,
      ok: expert.ok !== false,
      formulas
    },
    ehAi: {
      dilution: expert.potency,
      phase: expert.phase,
      engine: 'eh-api-9engine-v3'
    },
    faceAnalysis: patient.faceAnalysis || null,
    combinedReports: patient.combinedReports || null,
    inputMeta: {
      engine: 'eh_api.py'
    },
    clinical_summary: expert.clinical_summary || expert.summary || expert.parcha || '',
    summary: expert.clinical_summary || expert.summary || expert.parcha || '',
    summary_source: expert.clinical_summary ? 'Node Rule Engine' : '',
    summary_via: expert.clinical_summary ? 'node' : ''
  };
}

/**
 * EH API v3 /api/v3/prescribe → Smart Search shape (9 Rule Engines + English summary).
 */
function mapEhApiV3PrescribeToApp(py, patient = {}) {
  const ca = py.clinical_analysis || {};
  const summary = py.clinical_summary || py.summary || py.parcha || '';
  const prakriti = ca.prakriti || 'Mixed';
  const polarity = ca.polarity || 'MIXED';
  const potency = ca.potency || 'D10';
  const mixtures = (py.mixtures || []).map((m, idx) => ({
    ...m,
    label: m.label || `MIXTURE ${String.fromCharCode(65 + idx)}`,
    system_key: m.system || m.system_key || (ca.active_systems || [])[idx] || 'GENERAL'
  }));
  const formulas = {};
  mixtures.forEach((m, i) => {
    formulas[String.fromCharCode(65 + i)] = m.formula || m.formula_obj?.full || '';
  });

  const ehAnalysis = {
    prakriti: { prakriti },
    polarity: { polarity },
    potency: { potency, potency_type: ca.potency_type, note: ca.potency_note },
    mixtures,
    active_systems: ca.active_systems || [],
    safety: py.safety || {},
    dosage: py.dosage || {},
    diet: py.diet || {},
    parcha: summary,
    clinical_summary: summary,
    engine_result: py.engine_result || null
  };

  return {
    patient: {
      name: patient.name || patient.patient_name || py.patient?.name || 'Patient',
      age: patient.age ?? py.patient?.age ?? 30,
      gender: patient.gender || py.patient?.gender || 'Male',
      weight: patient.weight ?? null,
      mobile: patient.mobile || null,
      bp_systolic: patient.bp_systolic ?? null,
      bp_diastolic: patient.bp_diastolic ?? null,
      pulse: patient.pulse ?? null,
      chiefComplaint: patient.chief_complaint || patient.chiefComplaint || '',
      durationDays: patient.duration_days ?? patient.durationDays ?? 0
    },
    analysis: {
      chief_complaint: patient.chief_complaint || patient.chiefComplaint || '',
      polarity,
      phase: ca.phase || patient.phase || 'chronic',
      dilution: potency,
      electricity: mixtures[0]?.electricity || null,
      confidence: 95,
      temperament: prakriti,
      eh_expert_reasoning: `9 Rule Engines | Systems: ${(ca.active_systems || []).join(', ')}`,
      duration_days: patient.duration_days ?? 0,
      report_values: patient.report_values || {},
      affected_organs: patient.affected_organs || [],
      blood_report: patient.blood_report || '',
      mri_report: patient.mri_report || '',
      sonography: patient.sonography || ''
    },
    medicines: formulas,
    mixtures,
    expert: {
      ok: py.status === 'success' || py.ok !== false,
      formulas,
      overall_polarity: polarity,
      potency,
      temperament: prakriti,
      phase: ca.phase || 'chronic',
      confidence: 95,
      reasoning_trace: [`EH API v3 — 9 Rule Engines`, `Fuzzy diseases: ${ca.active_systems?.length || 0} systems`],
      clinical_summary: summary
    },
    eh_analysis: ehAnalysis,
    ehAi: {
      dilution: potency,
      phase: ca.phase || 'chronic',
      engine: 'eh-api-9engine-v3'
    },
    faceAnalysis: patient.faceAnalysis || null,
    combinedReports: patient.combinedReports || null,
    inputMeta: {
      engine: 'eh-api-9engine-v3',
      prescription_id: py.prescription_id,
      pipeline: '9-rule-engines-fuzzy-diseases'
    },
    clinical_summary: summary,
    summary,
    summary_source: 'EH API — 9 Rule Engines (English)',
    summary_via: 'summary_engine.py',
    via: 'eh_api.py'
  };
}

function mapCompleteAnalyzeToApp(py) {
  if (!py || py.success === false) {
    const err = py?.error || py?.expert?.error || 'Expert analyze failed';
    return {
      success: false,
      message: err,
      data: {
        expert: { ok: false, error: err },
        patient: py?.patient_data || {}
      }
    };
  }

  // EH API v3 prescribe-style response from analyze-report
  if (py.status === 'success' && py.clinical_analysis) {
    const pd = py.patient_data || py.patient || {};
    const patient = {
      name: pd.patient_name || pd.name || 'Patient',
      patient_name: pd.patient_name || pd.name,
      age: pd.age,
      gender: pd.gender,
      weight: pd.weight,
      bp_systolic: pd.bp_systolic,
      bp_diastolic: pd.bp_diastolic,
      chief_complaint: pd.chief_complaint || '',
      duration_days: pd.duration_days ?? 0,
      faceAnalysis: py.face_analysis
        ? {
            findings: py.face_analysis.findings,
            temperament: py.face_analysis.temperament,
            polarity: py.face_analysis.polarity || py.face_analysis.polarity_hint,
            vitiation: py.face_analysis.vitiation,
            face_detected: py.face_analysis.face_detected,
            engine: py.face_analysis.engine
          }
        : null,
      combinedReports: py.ocr_result
        ? {
            raw_text: py.ocr_result.raw_text,
            found_values: Object.entries(py.ocr_result.report_values || {}).map(([k, v]) => ({
              test_key: k,
              ...v
            })),
            problems: py.ocr_result.pathologies
          }
        : null
    };
    const data = mapEhApiV3PrescribeToApp(py, patient);
    const { SUMMARY_ENGINE_VERSION } = require('../constants/clinicalSummaryVersion');
    data.summary_engine_version = SUMMARY_ENGINE_VERSION;
    return { success: true, data, pipeline: 'eh-api-9engine-analyze-report' };
  }

  const pd = py.patient_data || {};
  const expert = py.expert || py.formula || {};
  const patient = {
    name: pd.patient_name || 'Patient',
    patient_name: pd.patient_name,
    age: pd.age,
    gender: pd.gender,
    weight: pd.weight,
    bp_systolic: pd.bp_systolic,
    bp_diastolic: pd.bp_diastolic,
    chief_complaint: pd.chief_complaint || '',
    duration_days: pd.duration_days ?? 0,
    faceAnalysis: py.face_analysis
      ? {
          findings: py.face_analysis.findings,
          temperament: py.face_analysis.temperament,
          polarity: py.face_analysis.polarity || py.face_analysis.polarity_hint,
          vitiation: py.face_analysis.vitiation,
          face_detected: py.face_analysis.face_detected,
          engine: py.face_analysis.engine
        }
      : null,
    combinedReports: py.ocr_result
      ? {
          raw_text: py.ocr_result.raw_text,
          found_values: Object.entries(py.ocr_result.report_values || {}).map(([k, v]) => ({
            test_key: k,
            ...v
          })),
          problems: py.ocr_result.pathologies
        }
      : null
  };

  const data = mapExpertToApp(expert, patient);

  if (py.clinical_summary || py.parcha) {
    data.clinical_summary = py.clinical_summary || py.parcha;
    data.summary = py.clinical_summary || py.parcha;
    data.summary_source = 'EH API — 9 Rule Engines (English)';
    data.summary_via = 'summary_engine.py';
    data.via = 'eh_api.py';
  }

  const { SUMMARY_ENGINE_VERSION } = require('../constants/clinicalSummaryVersion');
  data.summary_engine_version = SUMMARY_ENGINE_VERSION;

  return { success: true, data, pipeline: py };
}

module.exports = { mapExpertToApp, mapEhApiV3PrescribeToApp, mapCompleteAnalyzeToApp };
