'use strict';

const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/requireAuth');
const axios = require('axios');
const { generateEHSummary, checkOllama } = require('../services/ollamaService');
const { generateOllamaSummary } = require('../services/ehOllamaCompleteSummary');
const { caseDataToSummaryInput } = require('../services/summaryCaseAdapter');
const {
  generateExpertClinicalSummary,
  MODEL_PREF,
  TARGET_WORDS
} = require('../services/expertClinicalSummaryService');
const { EXPERT_BASE } = require('../services/ehExpertClient');

const router = express.Router();

/** GET /api/summary/status — legacy Ollama probe */
router.get(
  '/status',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const status = await checkOllama();
    res.json({
      success: true,
      data: {
        ...status,
        targetWords: TARGET_WORDS,
        preferredModel: MODEL_PREF,
        message: status.running
          ? `EH Expert summary — ${status.model || MODEL_PREF} (~${TARGET_WORDS} shabd, 7 खंड)`
          : 'Ollama offline — rule-engine सार उपलब्ध'
      }
    });
  })
);

/** GET /api/summary/engine-version — frontend cache bust (no auth) */
router.get('/engine-version', (_req, res) => {
  const { SUMMARY_ENGINE_VERSION, isValidCompleteEngineSummary } = require('../constants/clinicalSummaryVersion');
  res.json({
    success: true,
    data: {
      version: SUMMARY_ENGINE_VERSION,
      engine: 'universal-clinical-rule-engine',
      sections: 7,
      file: 'ollamaBookDoctorSummary.js',
      pipeline: 'ollama-book-primary'
    },
  });
});

/** GET /api/summary/stack-status — EH Expert + Ollama (Smart Search UI) */
router.get(
  '/stack-status',
  asyncHandler(async (_req, res) => {
    const ollama = await checkOllama();
    let expertOk = false;
    let expertDetail = {};
    try {
      const { data } = await axios.get(`${EXPERT_BASE}/health`, { timeout: 5000 });
      expertOk = !!data?.ok;
      expertDetail = {
        tesseract: data?.tesseract_available,
        langs: data?.tesseract_langs,
        materia: data?.materia_medica_rows
      };
    } catch {
      expertOk = false;
    }
    res.json({
      success: true,
      data: {
        expert_ok: expertOk,
        expert_url: EXPERT_BASE,
        ollama_running: ollama.running,
        ollama_model: ollama.model || MODEL_PREF,
        ollama_preferred: MODEL_PREF,
        summary_target_words: TARGET_WORDS,
        summary_sections: 7,
        summary_engine: 'ollamaBookDoctorSummary.js',
        summary_mode: process.env.EH_SUMMARY_MODE || 'ollama-book',
        label: expertOk
          ? `EH Expert ✓ · 7 खंड सारांश (~1000 शब्द)`
          : 'Expert engine — npm run expert-engine'
      }
    });
  })
);

/**
 * POST /api/summary/generate — 1500 word EH summary (background; do not block /analyze)
 * Body: { caseData } — smart search result object
 */
router.post(
  '/generate',
  requireAuth,
  asyncHandler(async (req, res) => {
    const caseData = req.body?.caseData || req.body;
    if (!caseData?.patient && !caseData?.analysis) {
      return res.status(400).json({
        success: false,
        message: 'caseData with patient and analysis required'
      });
    }

    const useComplete =
      process.env.EH_USE_COMPLETE_ENGINE_PDF !== '0' && process.env.EH_SUMMARY_LEGACY_GENERATE !== '1';
    const result = useComplete
      ? await generateOllamaSummary(caseDataToSummaryInput(caseData))
      : await generateEHSummary(caseData);

    res.json({
      success: true,
      data: {
        summary: result.summary,
        model: result.model || 'eh-complete-engine',
        wordCount: result.wordCount,
        targetWords: result.targetWords || TARGET_WORDS,
        source: result.source,
        note: result.message || null,
        language: 'hi'
      }
    });
  })
);

/**
 * POST /api/summary/expert-clinical — Step 3.4: ~1000-word systematic Hindi summary from EH Expert JSON (Ollama)
 * Body: { caseData } — must include expert.ok === true
 */
router.post(
  '/expert-clinical',
  requireAuth,
  asyncHandler(async (req, res) => {
    const caseData = req.body?.caseData || req.body;
    if (!caseData?.expert || caseData.expert.ok === false) {
      return res.status(400).json({
        success: false,
        message:
          caseData?.expert?.expert_error ||
          caseData?.expert?.error ||
          'Smart Search Analyze required — expert result missing or failed'
      });
    }

    let out;
    try {
      out = await generateExpertClinicalSummary(caseData);
      if (!out?.summary?.trim()) {
        throw new Error('Empty summary from engine');
      }
    } catch (err) {
      console.error('[expert-clinical] engine error:', err.message);
      const { NO_APPLICABLE_RULE_MESSAGE } = require('../constants/noApplicableRule');
      out = {
        summary:
          `${NO_APPLICABLE_RULE_MESSAGE}\n\n` +
          `*त्रुटि: ${err.message}*\n\n` +
          '1. `ollama serve` चलाएं\n2. `npm run dev` restart\n3. Dubara सारांश',
        model: 'eh-summary-error',
        wordCount: 0,
        targetWords: 1000,
        source: 'summary-error',
        potency: null,
        electricity: null,
        no_applicable_rule: false,
        seven_sections: false,
        summary_engine_version: require('../constants/clinicalSummaryVersion').SUMMARY_ENGINE_VERSION,
        fallback_reason: err.message
      };
    }
    if (res.headersSent) return;
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.json({
      success: true,
      data: {
        summary: out.summary,
        summary_json: out.summary_json || null,
        engine_result: out.engine_result || null,
        confidence: out.confidence ?? null,
        no_applicable_rule: out.no_applicable_rule === true,
        model: out.model || 'eh-expert-summary',
        wordCount: out.wordCount || 0,
        targetWords: out.targetWords || 1000,
        source: out.source || 'eh-api-v3',
        bookPassagesUsed: out.bookPassagesUsed ?? 0,
        bookHintsCount: out.bookHintsCount ?? 0,
        bookVersion: out.bookVersion || null,
        five_sections: out.five_sections === true,
        seven_sections: out.seven_sections !== false,
        eleven_sections: false,
        summary_engine_version: out.summary_engine_version || '3.1.0',
        potency: out.potency || null,
        electricity: out.electricity || null,
        summary_engine: out.summary_engine || out.source || 'clinicalFallbackSeven.js',
        fallback_reason: out.fallback_reason || null,
        summary_via: out.summary_via || (out.summary_engine?.includes('ollama') ? 'ollama' : 'template'),
        ollama_error: out.ollama_error || null,
        ollama_seconds: out.ollama_seconds ?? null,
        language: 'hi',
        step: '3.4'
      }
    });
  })
);

/** GET /api/summary/health — Ollama probe (PDF STEP 4) */
router.get('/health', async (_req, res) => {
  const axios = require('axios');
  const url = (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
  try {
    await axios.get(`${url}/api/tags`, { timeout: 5000 });
    res.json({ success: true, ollama: 'running', status: 'ok', engine: 'ehOllamaCompleteSummary.js' });
  } catch {
    res.json({ success: true, ollama: 'offline', status: 'warning', engine: 'ehOllamaCompleteSummary.js' });
  }
});

module.exports = router;
