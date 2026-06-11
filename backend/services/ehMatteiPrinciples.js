/**
 * E.H. Arogya Sutra — Count Cesare Mattei Electro-Homoeopathy principles (CDSS source of truth).
 * Rule-based only; no generative AI for medical decisions.
 * Core law: "AI Suggests, Doctor Decides"
 */

const PROJECT_IDENTITY = Object.freeze({
  appNameEn: 'E.H. Arogya Sutra',
  appNameHi: 'आरोग्य सूत्र',
  client: 'Jagdamba Clinic, Seoni, Madhya Pradesh, India',
  systemType: 'Clinical Decision Support System (CDSS)',
  medicalBase: "Count Cesare Mattei's Electro Homoeopathy",
  coreLaw: 'AI Suggests, Doctor Decides'
});

/** Human terrain = Blood (Rakt) + Lymph; disease = vitiation */
const VITIATION = Object.freeze({
  blood: {
    key: 'sanguine',
    label: 'Blood (Rakt) / Sanguine',
    typical: ['Fever', 'BP', 'Heart disease']
  },
  lymph: {
    key: 'lymphatic',
    label: 'Lymph / Lymphatic',
    typical: ['Glands', 'Skin', 'Immunity']
  },
  mixed: {
    key: 'mixed',
    label: 'Mixed vitiation',
    typical: ['Complex / chronic diseases']
  }
});

/**
 * POLARITY LAW — medicine type is opposite to rog polarity.
 * Positive rog (energy high) → Negative medicine (attenuated dilution, Yellow Electricity).
 * Negative rog (energy low) → Positive medicine (stronger 1st dilution, Red Electricity).
 */
const POLARITY_LAW = Object.freeze({
  positiveRog: {
    rogLabel: 'Positive',
    medicineType: 'negative',
    dilution: '3rd dilution or D10 / D30',
    electricity: 'Yellow Electricity (Y.E.)'
  },
  negativeRog: {
    rogLabel: 'Negative',
    medicineType: 'positive',
    dilution: '1st dilution (strong dose)',
    electricity: 'Red Electricity (R.E.)'
  }
});

/**
 * REPORT RULE — lab / numeric trend maps to rog polarity (then apply POLARITY_LAW).
 * HIGH (badhna) → Positive rog → Negative medicine.
 * LOW (ghatna) → Negative rog → Positive medicine.
 */
const REPORT_RULE = Object.freeze({
  high: { trend: 'high', rogPolarity: 'positive', medicineType: POLARITY_LAW.positiveRog.medicineType },
  low: { trend: 'low', rogPolarity: 'negative', medicineType: POLARITY_LAW.negativeRog.medicineType }
});

const PHASES = Object.freeze(['Acute', 'Sub-Acute', 'Chronic', 'Degenerative']);

/** Default potency guidance by phase (guide) */
const DILUTION_BY_PHASE = Object.freeze({
  Acute: 'D6',
  'Sub-Acute': 'D10',
  Chronic: 'D10 or D30',
  Degenerative: 'D10 or D30'
});

function normalizePhase(phase) {
  if (!phase || typeof phase !== 'string') return null;
  const p = phase.trim();
  const hit = PHASES.find((x) => x.toLowerCase() === p.toLowerCase());
  return hit || null;
}

function dilutionForPhase(phase) {
  const key = normalizePhase(phase);
  return key ? DILUTION_BY_PHASE[key] : null;
}

module.exports = {
  PROJECT_IDENTITY,
  VITIATION,
  POLARITY_LAW,
  REPORT_RULE,
  PHASES,
  DILUTION_BY_PHASE,
  normalizePhase,
  dilutionForPhase
};
