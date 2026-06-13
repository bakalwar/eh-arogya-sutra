'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_NODE_RAILWAY = 'https://eh-arogya-api-production.up.railway.app';
const INVALID_HOSTS = /^https?:\/\/(www\.)?railway\.app\/?$/i;
const LOCAL_PYTHON = 'http://127.0.0.1:8005';
const LOCAL_NODE = 'http://127.0.0.1:5000';

function isLocalDevMode() {
  return (
    process.env.EH_LOCAL_DEV === '1' ||
    String(process.env.APP_ENV || '').toLowerCase() === 'local'
  );
}

function readRailwayConfig() {
  try {
    const p = path.join(__dirname, '../../config/railway-production.json');
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return { apiUrl: DEFAULT_NODE_RAILWAY, pythonApiUrl: 'http://127.0.0.1:8005' };
  }
}

/**
 * Python EH API base (eh_api.py — 9 Rule Engines + summary_engine.py).
 * EH_API_URL must be the Python service URL, NOT https://railway.app (dashboard).
 */
function resolveEhPythonApiBase() {
  if (isLocalDevMode()) {
    return (
      String(process.env.EH_PYTHON_API_URL || process.env.EH_API_URL || process.env.EH_EXPERT_ENGINE_URL || '')
        .trim()
        .replace(/\/$/, '') || LOCAL_PYTHON
    );
  }

  const cfg = readRailwayConfig();
  const candidates = [
    process.env.EH_PYTHON_API_URL,
    process.env.EH_API_URL,
    process.env.EH_EXPERT_ENGINE_URL,
    cfg.pythonApiUrl,
    'http://127.0.0.1:8005'
  ];

  for (const raw of candidates) {
    const url = String(raw || '').trim().replace(/\/$/, '');
    if (!url || INVALID_HOSTS.test(url)) continue;
    if (url === 'https://railway.app' || url === 'http://railway.app') continue;
    return url;
  }

  return 'http://127.0.0.1:8005';
}

/** Node/Railway public API (Vercel rewrites target). Local dev → Node on :5000. */
function resolveNodeRailwayApiBase() {
  if (isLocalDevMode()) {
    const local = String(process.env.NODE_PUBLIC_URL || LOCAL_NODE).trim().replace(/\/$/, '');
    return local || LOCAL_NODE;
  }

  const cfg = readRailwayConfig();
  const fromEnv = String(process.env.RAILWAY_PUBLIC_DOMAIN || '').trim();
  if (fromEnv) {
    const host = fromEnv.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `https://${host}`;
  }
  const url = String(process.env.NODE_PUBLIC_URL || cfg.apiUrl || DEFAULT_NODE_RAILWAY)
    .trim()
    .replace(/\/$/, '');
  if (url && !INVALID_HOSTS.test(url)) return url;
  return DEFAULT_NODE_RAILWAY;
}

module.exports = { resolveEhPythonApiBase, resolveNodeRailwayApiBase, DEFAULT_NODE_RAILWAY };
