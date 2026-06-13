'use strict';

const { callExpertAnalyzeCompleteClinical, EXPERT_BASE } = require('./ehExpertClient');
const { getConstitutionalTendency } = require('./constitutionalTendency');
const {
  enforceClinicalOutputMode,
  assertClinicalPythonResponse,
  CLINICAL_OUTPUT_MODE,
} = require('./searchEngine');

const FORBIDDEN_KEYS = [
  'mixtures',
  'medicines',
  'formulas',
  'dosage',
  'diet',
  'clinical_summary',
  'prescription_id',
];

function stripPrescriptionFields(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = { ...obj };
  for (const key of FORBIDDEN_KEYS) {
    delete out[key];
  }
  return out;
}

async function fetchOrganInfo(systems) {
  if (!systems?.length) return [];
  try {
    const res = await fetch(`${EXPERT_BASE}/api/v3/organ-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.EH_API_KEY || 'EH_TEST_KEY_2026',
      },
      body: JSON.stringify({ systems }),
    });
    const data = await res.json().catch(() => ({}));
    return data.systems || [];
  } catch {
    return [];
  }
}

/**
 * Report Analysis — EH API only (9 Rule Engines + 14k diseases, clinical_only).
 * NO book RAG, NO Node rule engine, NO prescription output.
 */
async function runClinicalAnalysis({ formData, patient }) {
  enforceClinicalOutputMode(formData);

  const py = assertClinicalPythonResponse(await callExpertAnalyzeCompleteClinical(formData));

  const baseReport = { ...(py.clinical_report || {}) };
  if (!baseReport.active_systems?.length && py.clinical_analysis?.active_systems) {
    baseReport.active_systems = py.clinical_analysis.active_systems;
  }
  if (!baseReport.organ_systems?.length) {
    baseReport.organ_systems = await fetchOrganInfo(baseReport.active_systems || []);
  }

  const constitutionalTendency = getConstitutionalTendency(patient.name);

  return stripPrescriptionFields({
    patient: {
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      date: new Date().toISOString(),
    },
    clinicalReport: baseReport,
    constitutionalTendency,
    pipeline: py.pipeline || 'eh-api-14k-9engine-clinical-analysis',
    analysis_mode: py.analysis_mode,
    output_mode: CLINICAL_OUTPUT_MODE,
    analysis_via: 'eh-api-14k-9engine',
    eh_engine: py.eh_engine || { rule_engines: 9, disease_index: 14000 },
    eh_engine_online: true,
  });
}

module.exports = { runClinicalAnalysis };
