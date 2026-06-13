'use strict';

function stripFences(text) {
  return String(text || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function parseJsonSafe(raw, label = 'response') {
  try {
    if (raw == null) return null;
    if (typeof raw === 'object') return raw;
    let text = stripFences(raw);
    if (!text) return null;
    if (text.startsWith('"') && text.endsWith('"')) {
      try {
        const inner = JSON.parse(text);
        if (typeof inner === 'object') return inner;
        text = stripFences(inner);
      } catch {
        /* continue */
      }
    }
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    return JSON.parse(text);
  } catch (e) {
    console.error(`[parseJsonSafe] ${label}:`, e.message);
    return null;
  }
}

module.exports = { parseJsonSafe, stripFences };
