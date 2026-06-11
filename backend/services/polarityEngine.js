const {
  POLARITY_LAW,
  REPORT_RULE,
  dilutionForPhase,
  PROJECT_IDENTITY
} = require('./ehMatteiPrinciples');
const {
  countPatternHits,
  POSITIVE_SYMPTOM_PATTERNS,
  NEGATIVE_SYMPTOM_PATTERNS
} = require('./ehSymptomLexicon');

/**
 * Advanced Polarity Engine for EH CDSS.
 * Decides if a disease state is Positive (Hyper/Inflammatory) or Negative (Hypo/Degenerative).
 */

function analyzeSymptomPolarity(symptoms = []) {
  const list = Array.isArray(symptoms) ? symptoms : [];
  const pos = countPatternHits(list, POSITIVE_SYMPTOM_PATTERNS);
  const neg = countPatternHits(list, NEGATIVE_SYMPTOM_PATTERNS);

  let rogPolarity = 'unknown';
  let rogLabel = 'Pending';
  
  if (pos.hits > neg.hits) {
    rogPolarity = 'positive';
    rogLabel = 'POSITIVE STATE';
  } else if (neg.hits > pos.hits) {
    rogPolarity = 'negative';
    rogLabel = 'NEGATIVE STATE';
  } else if (pos.hits > 0 || neg.hits > 0) {
    // Tie-break based on average severity
    const avg = list.reduce((acc, s) => acc + (Number(s.severity) || 5), 0) / Math.max(1, list.length);
    rogPolarity = avg >= 6 ? 'positive' : 'negative';
    rogLabel = rogPolarity === 'positive' ? 'POSITIVE STATE (Severity Bias)' : 'NEGATIVE STATE (Severity Bias)';
  }

  const medicineType = rogPolarity === 'positive' ? 'negative' : rogPolarity === 'negative' ? 'positive' : null;
  const dilutionNote = rogPolarity === 'positive' ? '3rd Dilution (D10/D30)' : rogPolarity === 'negative' ? '1st Dilution (D4/D6)' : null;

  return {
    positiveCount: pos.hits,
    negativeCount: neg.hits,
    positiveMatched: pos.matched,
    negativeMatched: neg.matched,
    rogPolarity,
    rogLabel,
    medicineType,
    dilutionNote
  };
}

function evaluatePolarity(caseInput = {}) {
  const phase = typeof caseInput.phase === 'string' ? caseInput.phase : 'Chronic';
  const potencyHint = dilutionForPhase(phase);

  const base = {
    coreLaw: PROJECT_IDENTITY.coreLaw,
    phase,
    potencyHint,
    engine: 'Polarity Engine v2.0'
  };

  // 1. Check Report Trend (Highest Priority)
  const trend = caseInput.reportTrend;
  if (trend === 'high' || trend === 'HIGH') {
    return {
      ...base,
      source: 'lab_report',
      rogPolarity: 'positive',
      rogLabel: 'POSITIVE STATE',
      medicineType: 'negative',
      electricity: 'Yellow Electricity (Y.E.)',
      dilutionNote: '3rd Dilution (D10/D30)',
      explanation: 'Lab values are ELEVATED, indicating a Positive (Hyper) state. Protocol requires Negative (Attenuated) remedies.'
    };
  }
  if (trend === 'low' || trend === 'LOW') {
    return {
      ...base,
      source: 'lab_report',
      rogPolarity: 'negative',
      rogLabel: 'NEGATIVE STATE',
      medicineType: 'positive',
      electricity: 'Red Electricity (R.E.)',
      dilutionNote: '1st Dilution (D4/D6)',
      explanation: 'Lab values are LOW, indicating a Negative (Hypo) state. Protocol requires Positive (Strong) remedies.'
    };
  }

  // 2. Check Explicit Polarity
  const explicitRog = caseInput.rogPolarity;
  if (explicitRog === 'positive' || explicitRog === 'POSITIVE') {
    return {
      ...base,
      source: 'clinical_observation',
      rogPolarity: 'positive',
      rogLabel: 'POSITIVE STATE',
      medicineType: 'negative',
      electricity: 'Yellow Electricity (Y.E.)',
      dilutionNote: '3rd Dilution (D10/D30)',
      explanation: 'Clinical observation confirms a Positive state (Inflammation/Pain). Using Negative remedies for balance.'
    };
  }
  if (explicitRog === 'negative' || explicitRog === 'NEGATIVE') {
    return {
      ...base,
      source: 'clinical_observation',
      rogPolarity: 'negative',
      rogLabel: 'NEGATIVE STATE',
      medicineType: 'positive',
      electricity: 'Red Electricity (R.E.)',
      dilutionNote: '1st Dilution (D4/D6)',
      explanation: 'Clinical observation confirms a Negative state (Weakness/Degeneration). Using Positive remedies for stimulation.'
    };
  }

  // 3. Analyze Symptoms (Fallback)
  const symptoms = Array.isArray(caseInput.symptoms) ? caseInput.symptoms : [];
  if (symptoms.length) {
    const analyzed = analyzeSymptomPolarity(symptoms);
    if (analyzed.rogPolarity !== 'unknown') {
      const isPos = analyzed.rogPolarity === 'positive';
      return {
        ...base,
        source: 'symptom_analysis',
        ...analyzed,
        electricity: isPos ? 'Yellow Electricity (Y.E.)' : 'Red Electricity (R.E.)',
        explanation: isPos
          ? `Positive symptom markers (${analyzed.positiveCount}) outweigh negative markers (${analyzed.negativeCount}). Diagnosis: Positive State.`
          : `Negative symptom markers (${analyzed.negativeCount}) outweigh positive markers (${analyzed.positiveCount}). Diagnosis: Negative State.`
      };
    }
  }

  return {
    ...base,
    source: 'none',
    rogPolarity: 'mixed',
    rogLabel: 'MIXED STATE',
    medicineType: 'neutral',
    electricity: 'White Electricity (W.E.)',
    dilutionNote: 'D10 (Balanced)',
    explanation: 'Insufficient specific markers for polarity. Defaulting to Mixed State with balanced (D10) remedies.'
  };
}

module.exports = { evaluatePolarity, analyzeSymptomPolarity };
