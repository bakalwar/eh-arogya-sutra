const { POLARITY_LAW } = require('./ehMatteiPrinciples');

/**
 * Positive Rog → Yellow Electricity (Y.E.)
 * Negative Rog → Red Electricity (R.E.)
 */
function selectElectricity(rogPolarity) {
  const rog = String(rogPolarity || '').toLowerCase();
  if (rog === 'positive') {
    return {
      code: 'Y.E.',
      type: 'yellow',
      label: POLARITY_LAW.positiveRog.electricity,
      medicineType: POLARITY_LAW.positiveRog.medicineType,
      dilutionNote: POLARITY_LAW.positiveRog.dilution
    };
  }
  if (rog === 'negative') {
    return {
      code: 'R.E.',
      type: 'red',
      label: POLARITY_LAW.negativeRog.electricity,
      medicineType: POLARITY_LAW.negativeRog.medicineType,
      dilutionNote: POLARITY_LAW.negativeRog.dilution
    };
  }
  return {
    code: null,
    type: 'unknown',
    label: 'Undetermined — complete symptom review',
    medicineType: null,
    dilutionNote: null
  };
}

module.exports = { selectElectricity };
