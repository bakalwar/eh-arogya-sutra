const express = require('express');
const eh = require('../services/ehHubLive');

const router = express.Router();

router.get('/api/log', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json(eh.getMergedLog());
});

router.get('/api/stream', (req, res) => {
  eh.attachSse(res);
});

/** Optional: Cursor / script "abhi kya kar raha hoon" — POST JSON { "line": "..." } */
router.post('/api/agent-now', express.json({ limit: '8kb' }), (req, res) => {
  const line = (req.body && req.body.line) || '';
  eh.setAgentLine(line);
  res.json({ success: true });
});

module.exports = router;
