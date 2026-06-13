'use strict';

/** Constitutional Health Tendency — Chaldean name mapping (display only; never expose method labels). */
const CHALDEAN = Object.freeze({
  A: 1, I: 1, J: 1, Q: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8,
});

const ND = Object.freeze({
  1: { organs: 'Heart, Arteries, Eyes', note: 'Vitality is high but prone to heat-related issues.', watch: ['BP', 'Vision'] },
  2: { organs: 'Stomach, Digestive Fluids, Lymph', note: 'Sensitive digestion; needs fluid balance.', watch: ['Gastritis', 'Water Retention'] },
  3: { organs: 'Liver, Lungs, Thighs', note: 'Metabolism is strong; watch for over-exertion.', watch: ['Liver Enzymes', 'Chest Congestion'] },
  4: { organs: 'Kidneys, Spleen, Lower Back', note: 'Prone to sudden shifts in health; needs stability.', watch: ['Uric Acid', 'Nervous exhaustion'] },
  5: { organs: 'Nervous System, Throat, Hands', note: 'Highly active mind; watch for stress-related symptoms.', watch: ['Thyroid', 'Insomnia'] },
  6: { organs: 'Veins, Reproductive System, Face', note: 'Prone to congestion and circulatory slow-down.', watch: ['Hormones', 'Skin elasticity'] },
  7: { organs: 'Skin, Pineal Gland, Mental Health', note: 'Deep-seated issues often manifest on skin.', watch: ['Eczema', 'Psychosomatic stress'] },
  8: { organs: 'Bones, Teeth, Knees, Large Intestine', note: 'Chronic tendencies; needs mineral support.', watch: ['Joint Pain', 'Constipation'] },
  9: { organs: 'Blood, Muscles, Head, Marrow', note: 'High inflammatory response; watch for fevers.', watch: ['Inflammation', 'Headaches'] },
});

function reduceToDigit(n) {
  let x = Math.abs(Math.round(n));
  if (x === 0) return 9;
  while (x > 9) {
    x = String(x).split('').reduce((a, d) => a + Number(d), 0);
  }
  return x || 9;
}

function chaldeanDigit(name) {
  const s = String(name || '').toUpperCase().replace(/[^A-Z]/g, '');
  if (!s) return 5;
  const sum = [...s].reduce((acc, ch) => acc + (CHALDEAN[ch] || 0), 0);
  return reduceToDigit(sum);
}

function getConstitutionalTendency(patientName) {
  const digit = chaldeanDigit(patientName);
  const row = ND[digit] || ND[5];
  return {
    focusAreas: row.organs,
    note: row.note,
    watch: row.watch,
  };
}

module.exports = { getConstitutionalTendency, chaldeanDigit, ND };
