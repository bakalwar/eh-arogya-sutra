'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_NODE_RAILWAY = 'https://eh-arogya-api-production.up.railway.app';
const INVALID_HOSTS = /^https?:\/\/(www\.)?railway\.app\/?$/i;

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

/** Node/Railway public API (Vercel rewrites target). */
function resolveNodeRailwayApiBase() {
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
