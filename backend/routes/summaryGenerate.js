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
      python_proxy: `${EXPERT_BASE}/api/summary/eh-api`,
      language: 'en'
    }
  };
}

/** GET /api/summary/routes — route map (debug 404s) */
router.get('/routes', (_req, res) => {
  res.json({
    success: true,
    data: {
      primary: 'POST /api/summary/eh-api',
      node_handler: 'POST /api/summary/eh-api → proxy Python /api/summary/eh-api',
      python_url: `${EXPERT_BASE}/api/summary/eh-api`,
      aliases: [
        'POST /api/summary/generate',
        'POST /api/summary/expert-clinical',
        'POST /api/summary/eh-engine'
      ],
      body: '{ caseData: { patient, analysis, eh_analysis, ... } }'
    }
  });
});

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
      pipeline: 'eh-api-14k-diseases-9-rule-engines',
      python_proxy: `${EXPERT_BASE}/api/summary/eh-api`
    }
  });
});

/** GET /api/summary/stack-status — EH API only */
router.get(
  '/stack-status',
  asyncHandler(async (_req, res) => {
    let expertOk = false;
    try {
      const { data } = await axios.get(`${EXPERT_BASE}/health`, { timeout: 5000 });
      expertOk = !!data?.ok || data?.status === 'ok' || data?.status === 'online';
    } catch {
      expertOk = false;
    }
    res.json({
      success: true,
      data: {
        expert_ok: expertOk,
        expert_url: EXPERT_BASE,
        summary_route: `${EXPERT_BASE}/api/summary/eh-api`,
        summary_engine: 'summary_engine.py',
        api_engine: 'eh_api.py',
        summary_mode: 'eh-api-9engine',
        diseases_index: 14000,
        rule_engines: 9,
        label: expertOk
          ? 'EH API ✓ · 14k diseases + 9 Rule Engines (eh_api.py)'
          : 'EH Python API offline — check EH_API_URL on Railway'
      }
    });
  })
);

/** Node Express → Python EH API /api/summary/eh-api (+ prescribe fallback) */
async function runEhEngineSummary(req, res) {
  const raw = req.body || {};
  const caseData = normalizeSummaryCaseData(raw.caseData || raw);
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

/** GET — POST-only; return 405 not 404 */
router.get('/eh-api', (_req, res) => {
  res.status(405).json({
    success: false,
    message:
      'Use POST /api/summary/eh-api with JSON { caseData }. Node proxies to Python ' +
      `${EXPERT_BASE}/api/summary/eh-api`
  });
});

router.post('/eh-api', requireAuth, asyncHandler(runEhEngineSummary));

/** Aliases (same handler) */
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
      summary_route: `${EXPERT_BASE}/api/summary/eh-api`,
      status: 'ok',
      detail: data
    });
  } catch {
    res.json({
      success: true,
      eh_api: 'offline',
      engine: 'eh_api.py',
      status: 'warning',
      message: 'Set EH_API_URL to Python Railway service URL'
    });
  }
});

module.exports = router;
module.exports.runEhEngineSummary = runEhEngineSummary;
