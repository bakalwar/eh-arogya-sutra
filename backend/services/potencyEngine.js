/**
 * Advanced Potency & Dosage Engine v2.0
 * Calculates dynamic dosage frequency and method based on Phase and Severity.
 * Ensures 100% English output.
 */

const PHASES = {
  ACUTE: { dilution: 'D6', frequency: '6-8 times daily', drops: 10 },
  SUB_ACUTE: { dilution: 'D10', frequency: '4-5 times daily', drops: 10 },
  CHRONIC: { dilution: 'D30', frequency: '3 times daily', drops: 10 },
  DEGENERATIVE: { dilution: 'D200', frequency: '1-2 times daily', drops: 5 }
};

function resolveCasePotency(phase = 'Chronic', polarity = 'MIXED', severity = 5) {
  const ph = String(phase).toUpperCase().replace(/-/g, '_');
  const config = PHASES[ph] || PHASES.CHRONIC;

  // Adjust frequency based on severity (1-10 scale)
  let frequency = config.frequency;
  if (severity >= 8) {
    frequency = ph === 'ACUTE' ? 'Every 1-2 hours' : '5-6 times daily';
  } else if (severity <= 3) {
    frequency = '2 times daily';
  }

  return {
    potency: config.dilution,
    frequency: frequency,
    drops: config.drops,
    method: severity >= 8 ? 'Direct on Tongue' : 'Mix in 30ml Water',
    explanation: `Phase: ${phase} | Severity: ${severity}/10 → Optimized for ${config.dilution} protocol.`
  };
}

function extractLockedElectricityCode(raw) {
  const s = String(raw || '').toUpperCase();
  const match = s.match(/\b(RE|BE|WE|GE|YE)\b/i);
  return match ? match[1].toUpperCase() : 'WE';
}

function syncFormulaElectricity(formulas, elecCode) {
  const code = extractLockedElectricityCode(elecCode);
  
  if (formulas.formula_a) {
    const meds = formulas.formula_a.medicines || [];
    if (!meds.some(m => String(m).toUpperCase().includes(code))) {
      formulas.formula_a.medicines = [...meds.filter(m => !/\b(RE|BE|WE|GE|YE)\b/i.test(m)), code];
    }
  }

  if (formulas.formula_d) {
    formulas.formula_d.medicines = [code];
  }

  return formulas;
}

function applyHighBpAngiticoRule(meds, bp) {
  const sys = Number(bp);
  if (sys >= 140) {
    // Ensure A-1 is present for high BP
    if (!meds.some(m => m.includes('A-1') || m.includes('A1'))) {
      return ['A-1', ...meds.slice(0, meds.length - 1)];
    }
  }
  return meds;
}

module.exports = { 
  resolveCasePotency, 
  extractLockedElectricityCode, 
  syncFormulaElectricity,
  applyHighBpAngiticoRule
};
