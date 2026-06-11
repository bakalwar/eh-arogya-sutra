const { VITIATION } = require('./ehMatteiPrinciples');
const {
  countPatternHits,
  BLOOD_VITIATION_PATTERNS,
  LYMPH_VITIATION_PATTERNS
} = require('./ehSymptomLexicon');

/**
 * Advanced Human Terrain Analyzer (Blood vs Lymph).
 * Maps clinical symptoms to Sanguine (Blood/A-Group) or Lymphatic (Lymph/S-Group) vitiation.
 */

function analyze(symptoms = []) {
  const list = Array.isArray(symptoms) ? symptoms : [];
  const blood = countPatternHits(list, BLOOD_VITIATION_PATTERNS);
  const lymph = countPatternHits(list, LYMPH_VITIATION_PATTERNS);

  let vitiation = 'mixed';
  let primaryGroup = 'C';
  let label = 'Mixed (Bilio-Lymphatic)';
  let engineNote = 'Balanced treatment required (S + A + C combinations).';

  if (blood.hits > lymph.hits) {
    vitiation = 'blood';
    primaryGroup = 'A';
    label = 'Sanguine (Blood Vitiation)';
    engineNote = 'Primary vitiation in the circulatory system. Prioritize A-Group (Angiotico) remedies.';
  } else if (lymph.hits > blood.hits) {
    vitiation = 'lymph';
    primaryGroup = 'S';
    label = 'Lymphatic (Lymph Vitiation)';
    engineNote = 'Primary vitiation in the lymphatic system/glands. Prioritize S-Group (Scrofoloso) remedies.';
  } else if (blood.hits === 0 && lymph.hits === 0) {
    vitiation = 'unknown';
    primaryGroup = 'C';
    label = 'Undetermined Vitiation';
    engineNote = 'Insufficient clinical markers to determine human terrain. Defaulting to systemic support.';
  }

  return {
    vitiation,
    label,
    bloodScore: blood.hits,
    lymphScore: lymph.hits,
    bloodSignals: blood.matched,
    lymphSignals: lymph.matched,
    primaryGroup,
    engineNote,
    medicineGroupHint:
      vitiation === 'blood'
        ? 'A-Group (Angiotico / Sanguine)'
        : vitiation === 'lymph'
          ? 'S-Group (Scrofoloso / Lymphatic)'
          : 'Mixed (A + S + C Groups)'
  };
}

module.exports = { analyze };
