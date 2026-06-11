'use strict';

const { determineUniversalClinicalRules } = require('./generateClinicalSummary');

function defaultMedicinesForRules(rules) {
  const elecMatch = String(rules.masterElectricity || '').match(/\b(RE|BE|WE|GE|YE)\b/i);
  const elec = elecMatch ? elecMatch[1] : 'WE';
  if (rules.isHyper || rules.polarity === 'POSITIVE') return ['S10', 'A3', 'F1', elec];
  if (rules.polarity === 'NEGATIVE') return ['S10', 'C5', 'A3', elec];
  return ['S10', 'S1', 'C5', elec];
}

/**
 * When EH Expert Python service is down — still return expert.ok for Smart Search + summary.
 */
function buildLocalExpertFallback({ patientIntake, chiefComplaint, symptoms = [], ehBase = {} }) {
  const report_text = [chiefComplaint, patientIntake?.clinical_narrative, ehBase.query]
    .filter(Boolean)
    .join(' ');

  const rules = determineUniversalClinicalRules({
    bp_systolic: ehBase.bp_systolic ?? patientIntake?.bp_systolic,
    bp_diastolic: ehBase.bp_diastolic ?? patientIntake?.bp_diastolic,
    symptoms,
    phase: 'ACUTE',
    report_text,
    report_values: ehBase.lab_values || {}
  });

  const pol = rules.polarity || (rules.isHyper ? 'POSITIVE' : 'NEGATIVE');
  const meds = defaultMedicinesForRules(rules);
  const pot = rules.potency || 'D10';
  const elecMatch = String(rules.masterElectricity || '').match(/\b(RE|BE|WE|GE|YE)\b/i);
  const elec = elecMatch ? elecMatch[1] : 'WE';

  return {
    ok: true,
    offline: true,
    engine: 'eh-local-rule-fallback',
    overall_polarity: pol,
    phase: 'ACUTE',
    potency: pot,
    electricity: elec,
    temperament: rules.isHyper ? 'sanguine' : 'lymphatic',
    formula_medicines: meds,
    formulas: {
      formula_a: {
        medicines: meds,
        potency: pot,
        timing: 'भोजन से 30 मिनट पहले',
        dose: '',
        purpose: 'मुख्य रोग का उपचार (offline rule)'
      },
      formula_b: {
        medicines: pol === 'POSITIVE' ? ['C5', 'S5'] : ['C4', 'S6'],
        potency: pot,
        timing: 'दोपहर के भोजन के बाद',
        dose: '',
        purpose: 'सहायक मिश्रण'
      }
    },
    reasoning_trace: [
      'EH Expert engine उपलब्ध नहीं — Node.js universal rule engine से फॉर्मूला।',
      'पूर्ण विश्लेषण के लिए: npm run expert-engine'
    ],
    matched_pathology: [],
    matched_organs: [],
    knowledge: false
  };
}

module.exports = { buildLocalExpertFallback };
