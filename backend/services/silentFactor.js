/**
 * Hidden Chaldean name factor for internal confidence adjustment only.
 * Never expose `adj_factor` (or this module) in API responses or UI.
 */

const CHALDEAN = Object.freeze({
  A: 1,
  I: 1,
  J: 1,
  Q: 1,
  Y: 1,
  B: 2,
  K: 2,
  R: 2,
  C: 3,
  G: 3,
  L: 3,
  S: 3,
  D: 4,
  M: 4,
  T: 4,
  E: 5,
  H: 5,
  N: 5,
  X: 5,
  U: 6,
  V: 6,
  W: 6,
  O: 7,
  Z: 7,
  F: 8,
  P: 8
});

function chaldeanSum(name) {
  const s = String(name || '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  if (!s) return 0;
  let sum = 0;
  for (let i = 0; i < s.length; i += 1) {
    sum += CHALDEAN[s[i]] || 0;
  }
  return sum;
}

function reduceToDigit(n) {
  let x = Math.abs(Math.round(n));
  if (x === 0) return 9;
  while (x > 9) {
    x = String(x)
      .split('')
      .reduce((a, d) => a + Number(d), 0);
  }
  return x || 9;
}

/**
 * @returns {{ adj_factor: number }} — internal use only
 */
function computeAdjFactor(patientName) {
  const sum = chaldeanSum(patientName);
  const adj_factor = reduceToDigit(sum);
  return { adj_factor };
}

/**
 * Adjust base confidence (0–100) using adj_factor; never returned to client.
 */
function applyConfidenceAdjustment(baseConfidence, adj_factor) {
  const base = Math.max(0, Math.min(100, Number(baseConfidence) || 0));
  const factor = Number(adj_factor) || 5;
  const delta = (factor - 5) * 1.8;
  return Math.round(Math.max(48, Math.min(96, base + delta)));
}

module.exports = { computeAdjFactor, applyConfidenceAdjustment, chaldeanSum, reduceToDigit };
