'use strict';

/**
 * Normalize Ollama base URL for Node's `fetch` / `ollama` SDK on Windows.
 * `localhost` often resolves to ::1 while Ollama listens on 127.0.0.1 → "fetch failed".
 */
function normalizeOllamaBaseUrl(raw) {
  let s = String(raw || '').trim().replace(/\/$/, '');
  if (!s) s = 'http://127.0.0.1:11434';
  if (!/^https?:\/\//i.test(s)) s = `http://${s.replace(/^\/\//, '')}`;
  try {
    const u = new URL(s);
    if (u.hostname === 'localhost') u.hostname = '127.0.0.1';
    return u.toString().replace(/\/$/, '');
  } catch {
    return 'http://127.0.0.1:11434';
  }
}

/**
 * Prefer OLLAMA_URL; else OLLAMA_HOST (Ollama app style: host:port or full URL).
 */
function getOllamaUrlFromEnv() {
  const explicit = process.env.OLLAMA_URL;
  if (explicit && String(explicit).trim()) return normalizeOllamaBaseUrl(explicit);
  const oh = process.env.OLLAMA_HOST;
  if (oh && String(oh).trim()) {
    const h = String(oh).trim();
    if (h.startsWith('http://') || h.startsWith('https://')) return normalizeOllamaBaseUrl(h);
    return normalizeOllamaBaseUrl(`http://${h}`);
  }
  return normalizeOllamaBaseUrl('http://127.0.0.1:11434');
}

function formatOllamaFailureDetail(err, host) {
  const msg = err && err.message ? String(err.message) : String(err || '');
  const code = (err && err.cause && err.cause.code) || err.code || '';
  const isNet =
    /fetch failed|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ECONNRESET|ETIMEDOUT/i.test(msg) ||
    /ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ECONNRESET|ETIMEDOUT/i.test(code);
  if (!isNet) return msg;
  return `${msg} (URL: ${host}) — अक्सर कारण: Ollama बंद है, या Windows पर localhost IPv6 मिसमैच। .env में OLLAMA_URL=http://127.0.0.1:11434 रखें और टर्मिनल में ollama serve / Ollama ऐप चालू करें।`;
}

module.exports = {
  normalizeOllamaBaseUrl,
  getOllamaUrlFromEnv,
  formatOllamaFailureDetail
};
