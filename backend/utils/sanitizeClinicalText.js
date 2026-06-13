'use strict';

const FORBIDDEN_PATTERNS = [
  /\bType\s+\d+\b/gi,
  /\b(numerology|astrology|planet|grah|dasha)\b/gi,
  /किसी\s+भी\s+(?:व्यक्ति|मरीज|patient|adult)/gi,
  /\bany\s+(?:adult\s+)?patient\b/gi,
  /Constitutional Baseline:/gi,
];

function sanitizeClinicalText(text) {
  let out = String(text || '');
  for (const re of FORBIDDEN_PATTERNS) {
    out = out.replace(re, '');
  }
  return out.replace(/\n{3,}/g, '\n\n').trim();
}

module.exports = { sanitizeClinicalText };
