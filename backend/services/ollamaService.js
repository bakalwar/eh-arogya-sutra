'use strict';

/**
 * Ollama helpers — clinical summary via ollamaBookDoctorSummary.js (book + dynamic rules).
 */
const axios = require('axios');
const { getOllamaUrlFromEnv } = require('../utils/ollamaUrl');
const { determineUniversalClinicalRules } = require('./generateClinicalSummary');
const { caseDataToSummaryInput } = require('./summaryCaseAdapter');
const { SUMMARY_ENGINE_VERSION } = require('../constants/clinicalSummaryVersion');

function ollamaBaseUrl() {
  return getOllamaUrlFromEnv();
}

const MODEL_PREF = process.env.OLLAMA_MODEL || 'llama3.2:3b';
const OLLAMA_ENABLED = process.env.OLLAMA_ENABLED !== '0';
const TARGET_WORDS = Number(process.env.OLLAMA_TARGET_WORDS) || 1000;

let resolvedModelCache = null;

function clearOllamaModelCache() {
  resolvedModelCache = null;
}

function wordCount(text) {
  return (text || '').split(/\s+/).filter(Boolean).length;
}

async function listModels() {
  const res = await axios.get(`${ollamaBaseUrl()}/api/tags`, { timeout: 4000 });
  return (res.data.models || []).map((m) => m.name || m.model || '').filter(Boolean);
}

function pickModel(names, preferred) {
  const exact = names.find((n) => n === preferred || n.startsWith(`${preferred}:`));
  if (exact) return exact;
  const small = names.find((n) => /llama3\.2:3b|llama3\.2.*3b/i.test(n));
  if (small) return small;
  const llama = names.find((n) => /llama/i.test(n));
  if (llama) return llama;
  return names[0] || preferred;
}

async function resolveModel() {
  if (resolvedModelCache) return resolvedModelCache;
  try {
    resolvedModelCache = pickModel(await listModels(), MODEL_PREF);
  } catch {
    resolvedModelCache = MODEL_PREF;
  }
  return resolvedModelCache;
}

async function checkOllama() {
  try {
    const names = await listModels();
    const model = await resolveModel();
    return {
      running: true,
      hasModel: names.length > 0,
      model,
      models: names.slice(0, 8)
    };
  } catch {
    return { running: false, hasModel: false, model: MODEL_PREF, models: [] };
  }
}

/** Minimal expert stub — medicines come from Ollama+book, not S10+A3+F1 pool */
function ensureExpertOnCase(caseData = {}) {
  if (caseData.expert?.ok === true) return caseData;
  const summaryInput = caseDataToSummaryInput(caseData);
  const rules = determineUniversalClinicalRules(summaryInput);
  const elec = String(rules.masterElectricity || '').match(/\b(RE|BE|WE|GE|YE)\b/i)?.[1] || 'WE';
  return {
    ...caseData,
    expert: {
      ok: true,
      offline: true,
      engine: 'summary-stub-no-formula-pool',
      overall_polarity: rules.polarity,
      phase: summaryInput.phase || 'ACUTE',
      potency: rules.potency,
      electricity: elec,
      formulas: {
        formula_a: { medicines: [] },
        formula_b: { medicines: [] },
        formula_c: { medicines: [] },
        formula_d: { medicines: [] }
      },
      reasoning_trace: ['औषधि Ollama + पुस्तक से — टेम्पलेट पूल बंद']
    }
  };
}

/**
 * POST /api/summary/generate — same engine as expert-clinical (7-section PDF format only).
 */
async function generateEHSummary(caseData) {
  const { buildClinicalSummaryForCase } = require('./expertClinicalSummaryService');
  const withExpert = ensureExpertOnCase(caseData);
  const out = await buildClinicalSummaryForCase(withExpert);
  return {
    success: true,
    summary: out.summary,
    model: out.model || 'eh-seven-section-only',
    wordCount: out.wordCount ?? wordCount(out.summary),
    targetWords: out.targetWords || TARGET_WORDS,
    source: out.source || 'ollama-book-doctor',
    summary_engine_version: out.summary_engine_version || SUMMARY_ENGINE_VERSION,
    seven_sections: out.seven_sections !== false,
    message: 'Ollama + book + dynamicEhRules — per-patient summary'
  };
}

/** Legacy export — context builder unused by summary path */
function buildSummaryContext() {
  return '';
}

module.exports = {
  generateEHSummary,
  checkOllama,
  buildSummaryContext,
  clearOllamaModelCache,
  resolveModel,
  OLLAMA_ENABLED,
  MODEL_PREF,
  TARGET_WORDS
};
