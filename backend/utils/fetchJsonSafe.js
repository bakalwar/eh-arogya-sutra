'use strict';

const { parseJsonSafe } = require('./parseJsonSafe');

/** Fetch JSON with safe parse — handles double-encoded / fenced responses. */
async function fetchJsonSafe(url, options = {}, label = 'fetch') {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    if (!res.ok) {
      console.warn(`[fetchJsonSafe] ${label} HTTP ${res.status}`);
      return { ok: false, status: res.status, data: null };
    }
    const data = parseJsonSafe(text, label);
    return { ok: true, status: res.status, data };
  } catch (e) {
    console.warn(`[fetchJsonSafe] ${label} failed:`, e.message);
    return { ok: false, status: 0, data: null };
  }
}

module.exports = { fetchJsonSafe };
