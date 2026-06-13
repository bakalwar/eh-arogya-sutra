'use strict';

/**
 * Proxy selected EH API v3 routes through Node (production Vercel → Railway).
 * Browser calls same-origin /api/v3/*; Node forwards to eh_api.py on EH_PYTHON_API_URL.
 */
const express = require('express');
const axios = require('axios');
const { asyncHandler } = require('../utils/asyncHandler');
const { EXPERT_BASE } = require('../services/ehExpertClient');

const router = express.Router();

/** GET /api/v3/search — 14k disease fuzzy search (Smart Search autocomplete) */
router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const params = new URLSearchParams();
    if (req.query.q != null) params.set('q', String(req.query.q));
    if (req.query.limit != null) params.set('limit', String(req.query.limit));

    const url = `${EXPERT_BASE}/api/v3/search?${params.toString()}`;
    const { data, status } = await axios.get(url, {
      timeout: Number(process.env.EH_EXPERT_TIMEOUT_MS) || 30000,
      validateStatus: () => true,
    });
    return res.status(status).json(data);
  })
);

module.exports = router;
