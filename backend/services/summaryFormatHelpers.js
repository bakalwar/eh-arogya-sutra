'use strict';

const { normMedKey, hintForMedicine } = require('./summaryMedHints');

function collectAllMedicinesFromFormulas(formulas) {
  const out = [];
  ['formula_a', 'formula_b', 'formula_c', 'formula_d'].forEach((key) => {
    const meds = formulas?.[key]?.medicines;
    if (Array.isArray(meds)) out.push(...meds);
  });
  const seen = new Set();
  return out.filter((m) => {
    const n = normMedKey(m);
    if (!n || seen.has(n)) return false;
    seen.add(n);
    return true;
  });
}

module.exports = { collectAllMedicinesFromFormulas };
