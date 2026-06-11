'use strict';

const express = require('express');
const { checkEHEngineHealth } = require('../services/ehEngineService');

const router = express.Router();

/**
 * GET /api/eh-engine/health
 * Python Rule Engine status
 */
router.get('/health', async (req, res) => {
  const status = await checkEHEngineHealth();
  res.json(status);
});

module.exports = router;
