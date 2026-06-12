'use strict';

/**
 * EH Engine Service — eh_api.py (9 Rule Engines + summary_engine.py) only.
 * Uses ehExpertClient → POST /api/v3/prescribe (same pipeline as /api/summary/eh-api).
 */
const {
  callExpertAnalyze,
  callEhApiSummary,
  EXPERT_BASE
} = require('./ehExpertClient');

function mapPrescribeToEhAnalysis(rawData) {
  const ca = rawData.clinical_analysis || {};
  const prakriti = ca.prakriti || 'Mixed';
  const summary = rawData.clinical_summary || rawData.summary || '';
  return {
    prakriti: {
      prakriti,
      prakriti_hindi:
        prakriti === 'SANGUINE'
          ? 'Sanguine (रक्त)'
          : prakriti === 'LYMPHATIC'
            ? 'Lymphatic (रस)'
            : prakriti === 'NERVOUS'
              ? 'Nervous (तंत्रिका)'
              : 'Mixed (मिश्रित)'
    },
    polarity: {
      polarity: ca.polarity || 'MIXED',
      polarity_hindi:
        ca.polarity === 'POSITIVE'
          ? 'POSITIVE (धनात्मक)'
          : ca.polarity === 'NEGATIVE'
            ? 'NEGATIVE (ऋणात्मक)'
            : 'MIXED (मिश्रित)'
    },
    potency: {
      potency: ca.potency || 'D10',
      potency_type: ca.potency_type || 'SAMANYA',
      note: ca.potency_note || ''
    },
    mixtures: (rawData.mixtures || []).map((m) => ({
      ...m,
      label: m.label || 'MIXTURE',
      name_en: m.name_en || m.system || '',
      formula_obj: m.formula_obj || m.fo || { full: m.formula || '--' },
      schedule: m.schedule || 'As directed'
    })),
    active_systems: ca.active_systems || [],
    safety: {
      overall_status: rawData.safety?.status || 'SAFE',
      summary: rawData.safety?.reason || '',
      antidote: rawData.safety?.antidote || 'Nimbu-Sirka'
    },
    dosage: rawData.dosage || { matra: '10 drops', frequency: '3-4 times' },
    diet: rawData.diet || { pathya: [], apathya: [] },
    parcha: summary,
    clinical_summary: summary,
    electricity: { elec: rawData.mixtures?.[0]?.electricity || 'BE' },
    engine_result: rawData.engine_result || null,
    pipeline: 'eh-api-9engine-v3',
    summary_via: 'summary_engine.py',
    api_file: 'eh_api.py'
  };
}

/**
 * POST eh_api.py /api/v3/prescribe — 9 Rule Engines + 14k fuzzy diseases
 */
async function analyzeWithEHEngines(patientData) {
  const py = await callExpertAnalyze({
    patient_name: patientData.name || patientData.patient_name || 'Patient',
    age: patientData.age,
    gender: patientData.gender || 'Male',
    bp_systolic: patientData.bp_systolic,
    bp_diastolic: patientData.bp_diastolic,
    chief_complaint: patientData.symptoms || patientData.chief_complaint || '',
    symptoms: patientData.symptoms || '',
    phase: patientData.nature || patientData.condition || 'chronic',
    condition: patientData.nature || patientData.condition || 'chronic'
  });

  if (py.status !== 'success' && !py.ok) {
    const err = new Error(py.detail || py.message || 'EH API prescribe failed');
    err.statusCode = 502;
    throw err;
  }

  return { success: true, data: mapPrescribeToEhAnalysis(py) };
}

/**
 * POST eh_api.py /api/summary/eh-api — clinical summary only path
 */
async function summaryWithEHEngines(caseData) {
  const py = await callEhApiSummary(caseData);
  if (py.status !== 'success' && !py.ok) {
    const err = new Error(py.detail || py.message || 'EH API summary failed');
    err.statusCode = 502;
    throw err;
  }
  return { success: true, data: mapPrescribeToEhAnalysis(py) };
}

async function checkEHEngineHealth() {
  try {
    const res = await fetch(`${EXPERT_BASE}/health`, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    return {
      online: res.ok,
      expert_url: EXPERT_BASE,
      summary_route: `${EXPERT_BASE}/api/summary/eh-api`,
      engine: 'eh_api.py — 9 Rule Engines',
      ...data
    };
  } catch {
    return {
      online: false,
      expert_url: EXPERT_BASE,
      message: `EH API offline — npm run expert-engine (${EXPERT_BASE})`
    };
  }
}

module.exports = {
  analyzeWithEHEngines,
  summaryWithEHEngines,
  checkEHEngineHealth,
  EXPERT_BASE
};
