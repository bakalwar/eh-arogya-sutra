'use strict';

/**
 * Smart Search summary — EH API v3 only:
 * 14,000 fuzzy diseases + 9 Rule Engines (summary_engine.py).
 * No book RAG / Ollama book pipeline.
 */
const { caseDataToSummaryInput } = require('./summaryCaseAdapter');
const { callExpertAnalyze, EXPERT_BASE } = require('./ehExpertClient');
const { mapEhApiV3PrescribeToApp } = require('./pdfExpertMapper');
const { buildFallbackSummary } = require('./ehSummary7SectionFallback');
const { buildClinicalData } = require('./ehSourceOfTruthClinical');
const {
  EH_SUMMARY_PY,
  EH_API_PY,
  SUMMARY_ENGINE_VERSION,
  SUMMARY_SECTION_COUNT
} = require('../constants/clinicalSummaryVersion');
const { getSummaryWordTargets } = require('../config/environment');

const MODEL_PREF = 'eh-api-9engine-v3';
const TARGET_WORDS = getSummaryWordTargets().targetWords;

function wordCount(text) {
  return (text || '').split(/\s+/).filter(Boolean).length;
}

function extractCachedSummary(caseData = {}) {
  return String(
    caseData.clinical_summary ||
      caseData.summary ||
      caseData.eh_analysis?.clinical_summary ||
      caseData.eh_analysis?.parcha ||
      caseData.expert?.clinical_summary ||
      ''
  ).trim();
}

/** caseData → EH API /api/v3/prescribe body */
function caseDataToPrescribeInput(caseData = {}) {
  const patient = caseData.patient || {};
  const analysis = caseData.analysis || {};
  const parts = [];
  if (patient.chiefComplaint) parts.push(patient.chiefComplaint);
  if (analysis.chief_complaint) parts.push(analysis.chief_complaint);
  if (caseData.chief_complaint) parts.push(caseData.chief_complaint);
  if (caseData.chiefComplaint) parts.push(caseData.chiefComplaint);
  (patient.symptoms || []).forEach((s) => {
    if (s) parts.push(typeof s === 'object' ? s.name || s.hindi || '' : String(s));
  });

  const symptomsText = parts.filter(Boolean).join(', ');
  const phase = String(analysis.phase || patient.condition || caseData.phase || 'chronic')
    .toLowerCase()
    .replace(/-/g, '_');
  const condition = ['acute', 'sub_acute', 'chronic', 'degenerative'].includes(phase) ? phase : 'chronic';

  return {
    patient_name: patient.name || caseData.name || caseData.patient_name || 'Patient',
    age: patient.age ?? caseData.age ?? 30,
    gender: patient.gender || caseData.gender || 'Male',
    bp_systolic: patient.bp_systolic ?? caseData.bp_systolic ?? 120,
    bp_diastolic: patient.bp_diastolic ?? caseData.bp_diastolic ?? 80,
    chief_complaint: symptomsText,
    symptoms: symptomsText,
    phase,
    condition
  };
}

function formatEhApiResult(summary, caseData, mapped = {}, extra = {}) {
  return {
    summary,
    summary_json: null,
    engine_result:
      mapped.engine_result ||
      mapped.eh_analysis?.engine_result ||
      caseData.engine_result ||
      caseData.eh_analysis?.engine_result ||
      null,
    model: MODEL_PREF,
    wordCount: wordCount(summary),
    targetWords: TARGET_WORDS,
    source: 'eh-api-9engine-v3',
    potency:
      mapped.eh_analysis?.potency?.potency ||
      caseData.eh_analysis?.potency?.potency ||
      caseData.analysis?.dilution,
    electricity:
      mapped.eh_analysis?.electricity?.elec ||
      caseData.eh_analysis?.electricity?.elec ||
      caseData.analysis?.electricity,
    confidence: mapped.expert?.confidence ?? caseData.expert?.confidence ?? 95,
    no_applicable_rule: false,
    seven_sections: true,
    summary_layout: 'eh_api_professional_summary',
    summary_section_count: SUMMARY_SECTION_COUNT,
    summary_engine: 'summary_engine.py',
    summary_engine_version: SUMMARY_ENGINE_VERSION,
    book_rag_chars: 0,
    bookPassagesUsed: 0,
    bookHintsCount: 0,
    has_applicable_clinical_rule: true,
    summary_via: EH_SUMMARY_PY,
    via: EH_API_PY,
    ollama_error: null,
    ollama_seconds: null,
    ...extra
  };
}

/** Primary: POST eh-api /api/v3/prescribe (14k diseases + 9 engines) */
async function buildEhApiNineEngineSummary(caseData = {}) {
  const cached = extractCachedSummary(caseData);
  if (cached) {
    console.log('[EH SUMMARY] Cached 9-Rule-Engine summary (%d chars)', cached.length);
    return formatEhApiResult(cached, caseData, caseData);
  }

  const caseInput = caseDataToPrescribeInput(caseData);
  if (!caseInput.chief_complaint && !caseInput.symptoms) {
    const err = new Error('Symptoms / chief complaint required for EH API summary');
    err.statusCode = 400;
    throw err;
  }

  console.log(
    '[EH SUMMARY] EH API v3 prescribe — 14k diseases + 9 Rule Engines (%s)',
    EXPERT_BASE
  );
  const py = await callExpertAnalyze(caseInput);
  if (!py.ok && py.status !== 'success') {
    const err = new Error(py.detail || py.message || 'EH API prescribe failed');
    err.statusCode = 502;
    throw err;
  }

  const mapped = mapEhApiV3PrescribeToApp(py, caseInput);
  const summary = extractCachedSummary(mapped);
  if (!summary) {
    const err = new Error('EH API returned empty clinical_summary');
    err.statusCode = 502;
    throw err;
  }

  return formatEhApiResult(summary, caseData, mapped, {
    mixtures: mapped.mixtures
  });
}

async function buildEhApiSummaryWithFallback(caseData = {}) {
  try {
    return await buildEhApiNineEngineSummary(caseData);
  } catch (err) {
    console.warn('[EH SUMMARY] EH API path failed:', err.message);

    if (process.env.EH_ALLOW_TEMPLATE_FALLBACK === '1') {
      const summaryInput = caseDataToSummaryInput(caseData);
      const cd = buildClinicalData(summaryInput);
      const raw = buildFallbackSummary(summaryInput, cd, caseData.eh_analysis || null);
      return {
        summary: `> *EH API offline — Node rule-engine fallback (not book RAG)*\n\n${raw}`,
        summary_json: null,
        model: 'clinicalFallbackSeven',
        wordCount: wordCount(raw),
        targetWords: TARGET_WORDS,
        source: 'clinicalFallbackSeven-fallback',
        summary_engine: 'clinicalFallbackSeven.js',
        summary_engine_version: SUMMARY_ENGINE_VERSION,
        seven_sections: true,
        summary_via: 'template-fallback',
        fallback_reason: err.message
      };
    }

    return {
      summary:
        `# ⚠️ EH API Summary — 9 Rule Engines\n\n` +
        `**त्रुटि:** ${err.message}\n\n` +
        `1. Expert engine चलाएं: npm run expert-engine (${EXPERT_BASE})\n` +
        '2. npm run dev restart\n' +
        `3. Dubara Analyze / सारांश\n\n` +
        `*Book / Ollama pipeline उपयोग नहीं होता — केवल EH API + 14,000 rog database.*`,
      summary_json: { ehApiError: true },
      model: MODEL_PREF,
      wordCount: 0,
      targetWords: TARGET_WORDS,
      source: 'eh-api-error',
      summary_engine: 'summary_engine.py',
      summary_engine_version: SUMMARY_ENGINE_VERSION,
      seven_sections: false,
      summary_via: 'error',
      fallback_reason: err.message
    };
  }
}

async function generateExpertClinicalSummary(caseData) {
  return buildEhApiSummaryWithFallback(caseData);
}

async function buildClinicalSummaryForCase(caseData) {
  return buildEhApiSummaryWithFallback(caseData);
}

module.exports = {
  generateExpertClinicalSummary,
  buildClinicalSummaryForCase,
  buildEhApiNineEngineSummary,
  MODEL_PREF,
  TARGET_WORDS,
  SUMMARY_ENGINE_VERSION
};
