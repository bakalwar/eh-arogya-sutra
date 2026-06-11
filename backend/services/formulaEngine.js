const { selectElectricity } = require('./electricitySelector');

/**
 * Advanced Formula Engine v2.0
 * Implements Algorithmic Composition: [S-Group] + [C-Group] + [Specialty] + [Electricity]
 * Ensures 100% English output and Strict Cross-Mixture Remedy Uniqueness.
 */

const S_GROUP = ['S1', 'S2', 'S3', 'S5', 'S6', 'S10', 'S11', 'S12'];
const C_GROUP = ['C1', 'C2', 'C3', 'C4', 'C5', 'C10', 'C13', 'C15', 'C17'];
const SPECIALTY_GROUP = ['A1', 'A2', 'A3', 'P1', 'P2', 'P3', 'P4', 'F1', 'F2', 'L1', 'L2'];
const ELECTRICITY_GROUP = ['RE', 'BE', 'GE', 'YE', 'WE'];

function getUnused(pool, usedSet) {
  return pool.filter(med => !usedSet.has(med));
}

function buildFormulas(ctx = {}) {
  const {
    rogPolarity = 'unknown',
    phase = 'Chronic',
    bloodLymph = {},
    symptoms = []
  } = ctx;

  const usedRemedies = new Set();
  const vit = bloodLymph.vitiation || 'mixed';
  const primaryGroup = bloodLymph.primaryGroup || 'C';

  // Helper to select a remedy based on bias and uniqueness
  const selectRemedy = (pool, biasGroup = null) => {
    const available = getUnused(pool, usedRemedies);
    if (available.length === 0) return pool[0]; // Fallback
    
    let selected;
    if (biasGroup && available.includes(biasGroup)) {
      selected = biasGroup;
    } else {
      selected = available[0];
    }
    
    usedRemedies.add(selected);
    return selected;
  };

  // 1. Determine Electricity for Mixtures
  const mainElec = selectElectricity(rogPolarity).code?.replace(/\./g, '') || 'WE';
  usedRemedies.add(mainElec);

  const getNextElec = () => {
    const available = getUnused(ELECTRICITY_GROUP, usedRemedies);
    const selected = available[0] || 'WE';
    usedRemedies.add(selected);
    return selected;
  };

  // 2. Compose Mixtures A, B, and C
  const mixtures = [];

  // Mixture A: Primary Systemic Support
  const mixA = {
    id: 'A',
    label: 'Mixture A: Primary Systemic Support',
    meds: [
      selectRemedy(S_GROUP, vit === 'lymph' ? 'S1' : 'S10'),
      selectRemedy(C_GROUP, 'C1'),
      selectRemedy(SPECIALTY_GROUP, vit === 'blood' ? 'A1' : 'F1'),
      mainElec
    ],
    timing: 'Before Breakfast',
    method: 'Oral Drops'
  };
  mixtures.push(mixA);

  // Mixture B: Organ-Specific Correction
  const mixB = {
    id: 'B',
    label: 'Mixture B: Organ-Specific Correction',
    meds: [
      selectRemedy(S_GROUP, 'S5'),
      selectRemedy(C_GROUP, 'C5'),
      selectRemedy(SPECIALTY_GROUP, 'A2'),
      getNextElec()
    ],
    timing: 'Before Lunch',
    method: 'Oral Drops'
  };
  mixtures.push(mixB);

  // Mixture C: Metabolic & Regenerative Support
  const mixC = {
    id: 'C',
    label: 'Mixture C: Metabolic & Regenerative Support',
    meds: [
      selectRemedy(S_GROUP, 'S2'),
      selectRemedy(C_GROUP, 'C10'),
      selectRemedy(SPECIALTY_GROUP, 'P1'),
      getNextElec()
    ],
    timing: 'Before Dinner',
    method: 'Oral Drops'
  };
  mixtures.push(mixC);

  // Mixture D: Dynamic Tablets (3-Tier)
  const mixD = {
    id: 'D',
    label: 'Mixture D: Dynamic Tablets',
    meds: ['S-Lass', 'Slag', 'C-Lass'].slice(0, 3), // Dynamic tiering placeholder
    timing: 'Post-Meal',
    method: 'Tablet'
  };

  // Mixture E: External Application
  const mixE = {
    id: 'E',
    label: 'Mixture E: External Application',
    meds: ['AP-Oil', getNextElec()],
    timing: 'Morning & Night',
    method: 'Topical Application',
    bodyPart: 'Affected Areas' // Dynamic mapping logic would go here
  };

  return [...mixtures, mixD, mixE].map(m => ({
    ...m,
    formula: m.meds.join(' + '),
    status: 'OPTIMIZED'
  }));
}

module.exports = { buildFormulas };
