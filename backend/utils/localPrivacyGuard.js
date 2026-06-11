'use strict';

const { getOllamaUrlFromEnv } = require('./ollamaUrl');

/** Default ON — clinic data never leaves LAN without explicit opt-out */
function isSummaryLocalOnlyEnforced() {
  return process.env.EH_SUMMARY_LOCAL_ONLY !== '0';
}

function isPrivateOrLoopbackHost(hostname) {
  const h = String(hostname || '').toLowerCase();
  if (h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '[::1]') return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  return false;
}

/** ngrok / tailscale — staging API → clinic PC Ollama */
function isAllowedOllamaTunnelHost(hostname) {
  const h = String(hostname || '').toLowerCase();
  if (/\.ngrok(-free)?\.app$/i.test(h)) return true;
  if (/\.ngrok\.io$/i.test(h)) return true;
  if (/\.ts\.net$/i.test(h)) return true;
  if (process.env.OLLAMA_TUNNEL_HOST_ALLOW) {
    const extra = process.env.OLLAMA_TUNNEL_HOST_ALLOW.split(',').map((s) => s.trim().toLowerCase());
    if (extra.includes(h)) return true;
  }
  return false;
}

function isHybridStagingOllamaAllowed() {
  const { isHybridStagingOllama } = require('../config/environment');
  return (
    process.env.EH_STAGING_HYBRID_OLLAMA === '1' ||
    process.env.EH_SUMMARY_LOCAL_ONLY === '0' ||
    isHybridStagingOllama()
  );
}

const BLOCKED_CLOUD_HOST_PATTERNS = [
  /openai\.com/i,
  /api\.anthropic/i,
  /claude\.ai/i,
  /generativelanguage\.googleapis/i,
  /cohere\.ai/i,
  /together\.xyz/i,
  /groq\.com/i
];

/**
 * Ollama / summary LLM calls — localhost or private LAN only.
 * @throws {Error} if endpoint is public cloud
 */
function assertLocalOllamaEndpoint(url) {
  if (!isSummaryLocalOnlyEnforced()) return;

  let parsed;
  try {
    parsed = new URL(String(url || getOllamaUrlFromEnv()));
  } catch {
    throw new Error(
      'EH privacy lock: invalid OLLAMA_URL — use http://127.0.0.1:11434 on clinic machine only.'
    );
  }

  const host = parsed.hostname;
  if (BLOCKED_CLOUD_HOST_PATTERNS.some((re) => re.test(host) || re.test(parsed.href))) {
    throw new Error(
      `EH privacy lock: cloud LLM endpoint blocked (${host}). Use local Ollama only.`
    );
  }

  if (!isPrivateOrLoopbackHost(host)) {
    if (isHybridStagingOllamaAllowed() && isAllowedOllamaTunnelHost(host)) {
      return;
    }
    throw new Error(
      `EH privacy lock: Ollama URL must be loopback, LAN, or approved tunnel (got ${host}). ` +
        'Staging: EH_STAGING_HYBRID_OLLAMA=1 + ngrok URL. Local: OLLAMA_URL=http://127.0.0.1:11434'
    );
  }
}

/** Patient + book text must not be sent to third-party summary APIs from this module */
function assertNoCloudSummaryRelay(targetUrl) {
  if (!isSummaryLocalOnlyEnforced()) return;
  const s = String(targetUrl || '');
  if (
    /openai|anthropic|claude|cohere|together\.ai|api\.deepseek/i.test(s) &&
    !isPrivateOrLoopbackHost(new URL(s.startsWith('http') ? s : `http://${s}`).hostname)
  ) {
    throw new Error('EH privacy lock: external summary API calls are disabled.');
  }
}

module.exports = {
  isSummaryLocalOnlyEnforced,
  assertLocalOllamaEndpoint,
  assertNoCloudSummaryRelay,
  isPrivateOrLoopbackHost,
  isAllowedOllamaTunnelHost,
  isHybridStagingOllamaAllowed
};
