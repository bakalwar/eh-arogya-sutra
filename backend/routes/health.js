'use strict';

const express = require('express');
const { checkEHEngineHealth } = require('../services/ehEngineService');

const router = express.Router();
const NUMEROLOGY_BASE = process.env.EH_NUMEROLOGY_API_URL || 'http://127.0.0.1:8001';

/**
 * GET /api/eh-engine/health
 * Python Rule Engine status
 */
router.get('/health', async (req, res) => {
  const status = await checkEHEngineHealth();
  res.json(status);
});

/**
 * GET /api/eh-engine/numerology-health
 * Constitutional Baseline API (:8001) — proxied for live verification
 */
router.get('/numerology-health', async (_req, res) => {
  try {
    const r = await fetch(`${NUMEROLOGY_BASE}/api/health`, { signal: AbortSignal.timeout(8000) });
    const data = await r.json().catch(() => ({}));
    res.status(r.ok ? 200 : 503).json({
      ok: r.ok,
      url: NUMEROLOGY_BASE,
      ...data,
    });
  } catch (e) {
    res.status(503).json({
      ok: false,
      url: NUMEROLOGY_BASE,
      status: 'down',
      message: e.message,
    });
  }
});

module.exports = router;
