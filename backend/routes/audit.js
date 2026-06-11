const fs = require('fs');
const path = require('path');
const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

const logDir = path.join(__dirname, '../logs');
const logFile = path.join(logDir, 'audit.jsonl');

function appendLine(obj) {
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  const line = JSON.stringify({ ...obj, ts: new Date().toISOString() }) + '\n';
  fs.appendFileSync(logFile, line, 'utf8');
}

router.post(
  '/log',
  asyncHandler(async (req, res) => {
    const { action, reason, meta } = req.body || {};
    if (!action || typeof action !== 'string') {
      return res.status(400).json({ success: false, message: 'action is required' });
    }
    appendLine({ action, reason: reason || null, meta: meta || {} });
    res.json({ success: true, message: 'Audit entry recorded' });
  })
);

module.exports = router;
