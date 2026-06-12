'use strict';

/**
 * Smart Search summary — proxies to Python EH API POST /api/summary/eh-api only.
 * 14,000 fuzzy diseases + 9 Rule Engines (summary_engine.py). No Node/rule-engine fallbacks.
 */
const { callEhApiSummary, EXPERT_BASE } = require('./ehExpertClient');
const { mapEhApiV3PrescribeToApp } = require('./pdfExpertMapper');
const {
  EH_SUMMARY_PY,
  EH_API_PY,
  SUMMARY_ENGINE_VERSION,
  SUMMARY_SECTION_COUNT
} = require('../constants/clinicalSummaryVersion');
const { getSummaryWordTargets } = require('../config/environment');

const MODEL_PREF = 'eh-api-9engine-v3';
const TARGET_WORDS = getSummaryWordTargets().targetWords;

const REJECTED_SUMMARY_MARKERS = [
  /^error generating summary/i,
  /^eh prescription\s*—/i,
  /rule-engine fallback/i,
  /node rule-engine/i,
  /template-fallback/i,
  /clinicalfallbackseven/i,
  /eh api offline/i,
  /⚠️\s*eh api summary/i
];

function wordCount(text) {
  return (text || '').split(/\s+/).filter(Boolean).length;
}

function extractEhApiSummary(payload = {}) {
  return String(
    payload.clinical_summary ||
      payload.summary ||
      payload.parcha ||
      payload.eh_analysis?.clinical_summary ||
      payload.eh_analysis?.parcha ||
      ''
  ).trim();
}

function isRejectedSummaryText(text) {
  const s = String(text || '').trim();
  if (!s) return true;
  return REJECTED_SUMMARY_MARKERS.some((re) => re.test(s));
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
    summary_engine: EH_SUMMARY_PY,
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

/** Node BFF → Python POST /api/summary/eh-api */
async function buildEhApiNineEngineSummary(caseData = {}) {
  console.log(
    '[EH SUMMARY] Proxy → %s/api/summary/eh-api (14k diseases + 9 Rule Engines)',
    EXPERT_BASE
  );

  const py = await callEhApiSummary(caseData);
  if (!py.ok && py.status !== 'success') {
    const err = new Error(py.detail || py.message || 'EH API /api/summary/eh-api failed');
    err.statusCode = 502;
    throw err;
  }

  const mapped = mapEhApiV3PrescribeToApp(py, caseData.patient || caseData);
  const summary = extractEhApiSummary(mapped) || extractEhApiSummary(py);
  if (isRejectedSummaryText(summary)) {
    const err = new Error(
      'EH API returned invalid or empty clinical_summary from /api/summary/eh-api'
    );
    err.statusCode = 502;
    throw err;
  }

  return formatEhApiResult(summary, caseData, mapped, {
    mixtures: mapped.mixtures
  });
}

async function generateExpertClinicalSummary(caseData) {
  return buildEhApiNineEngineSummary(caseData);
}

async function buildClinicalSummaryForCase(caseData) {
  return buildEhApiNineEngineSummary(caseData);
}

module.exports = {
  generateExpertClinicalSummary,
  buildClinicalSummaryForCase,
  buildEhApiNineEngineSummary,
  MODEL_PREF,
  TARGET_WORDS,
  SUMMARY_ENGINE_VERSION
};
