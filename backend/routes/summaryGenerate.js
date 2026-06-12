'use strict';

const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/requireAuth');
const axios = require('axios');
const {
  buildClinicalSummaryForCase,
  MODEL_PREF,
  TARGET_WORDS
} = require('../services/expertClinicalSummaryService');
const { EXPERT_BASE } = require('../services/ehExpertClient');
const {
  normalizeSummaryCaseData,
  hasSummaryPayload
} = require('../utils/normalizeSummaryCaseData');

const router = express.Router();

function ehSummaryJson(result) {
  return {
    success: true,
    data: {
      summary: result.summary,
      model: result.model || MODEL_PREF,
      wordCount: result.wordCount,
      targetWords: result.targetWords || TARGET_WORDS,
      source: result.source || 'eh-api-9engine-v3',
      summary_via: result.summary_via || 'summary_engine.py',
      summary_engine: result.summary_engine || 'summary_engine.py',
      engine_result: result.engine_result || null,
      pipeline: 'eh-api-14k-diseases-9-rule-engines',
      note: result.fallback_reason || null,
      language: 'hi'
    }
  };
}

/** GET /api/summary/engine-version */
router.get('/engine-version', (_req, res) => {
  const { SUMMARY_ENGINE_VERSION } = require('../constants/clinicalSummaryVersion');
  res.json({
    success: true,
    data: {
      version: SUMMARY_ENGINE_VERSION,
      engine: 'eh-api-9engine-v3',
      sections: 7,
      file: 'summary_engine.py',
      api_file: 'eh_api.py',
      pipeline: 'eh-api-14k-diseases-9-rule-engines'
    }
  });
});

/** GET /api/summary/stack-status — EH API only (no book/Ollama) */
router.get(
  '/stack-status',
  asyncHandler(async (_req, res) => {
    let expertOk = false;
    try {
      const { data } = await axios.get(`${EXPERT_BASE}/health`, { timeout: 5000 });
      expertOk = !!data?.ok || data?.status === 'ok';
    } catch {
      expertOk = false;
    }
    res.json({
      success: true,
      data: {
        expert_ok: expertOk,
        expert_url: EXPERT_BASE,
        summary_engine: 'summary_engine.py',
        api_engine: 'eh_api.py',
        summary_mode: 'eh-api-9engine',
        diseases_index: 14000,
        rule_engines: 9,
        label: expertOk
          ? 'EH API ✓ · 14k diseases + 9 Rule Engines (eh_api.py)'
          : 'Expert engine — npm run expert-engine'
      }
    });
  })
);

/** EH API summary — shared handler */
async function runEhEngineSummary(req, res) {
  const caseData = normalizeSummaryCaseData(req.body);
  if (!hasSummaryPayload(caseData)) {
    return res.status(400).json({
      success: false,
      message:
        'Analyze data missing — pehle Symptom Search par Analyze Case chalayein (symptoms / eh_analysis required)'
    });
  }

  const result = await buildClinicalSummaryForCase(caseData);
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.json(ehSummaryJson(result));
}

/**
 * POST /api/summary/eh-api — PRIMARY: eh_api.py + summary_engine.py (14k diseases, 9 engines)
 */
router.post('/eh-api', requireAuth, asyncHandler(runEhEngineSummary));

/** Aliases */
router.post('/eh-engine', requireAuth, asyncHandler(runEhEngineSummary));
router.post('/generate', requireAuth, asyncHandler(runEhEngineSummary));
router.post('/expert-clinical', requireAuth, asyncHandler(runEhEngineSummary));

/** GET /api/summary/health — EH API (eh_api.py) */
router.get('/health', async (_req, res) => {
  try {
    const { data } = await axios.get(`${EXPERT_BASE}/health`, { timeout: 5000 });
    res.json({
      success: true,
      eh_api: 'running',
      engine: 'eh_api.py',
      summary_engine: 'summary_engine.py',
      status: 'ok',
      detail: data
    });
  } catch {
    res.json({
      success: true,
      eh_api: 'offline',
      engine: 'eh_api.py',
      status: 'warning',
      message: 'npm run expert-engine'
    });
  }
});

module.exports = router;
