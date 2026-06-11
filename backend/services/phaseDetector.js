const { DILUTION_BY_PHASE, normalizePhase } = require('./ehMatteiPrinciples');
const { hasDegenerativeSignal } = require('./ehSymptomLexicon');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Parse duration: number (days), or strings like "10 days", "3 weeks", "2 months".
 */
function parseDurationDays(duration, durationDays) {
  if (durationDays != null && durationDays !== '') {
    const n = Number(durationDays);
    if (!Number.isNaN(n) && n >= 0) return Math.round(n);
  }
  if (duration == null) return 0;
  if (typeof duration === 'number' && !Number.isNaN(duration)) return Math.max(0, Math.round(duration));
  const s = String(duration).trim().toLowerCase();
  const num = parseFloat(s);
  if (Number.isNaN(num)) return 0;
  if (/month|mahine|mahina/.test(s)) return Math.round(num * 30);
  if (/week|hafta|sapta/.test(s)) return Math.round(num * 7);
  if (/year|saal|varsh/.test(s)) return Math.round(num * 365);
  if (/day|din/.test(s) || /^\d+$/.test(s)) return Math.round(num);
  return Math.round(num);
}

/**
 * Duration rules:
 * - < 2 weeks → Acute (D6)
 * - 2–8 weeks → Sub-Acute (D10)
 * - > 2 months → Chronic (D30)
 * - tumor/cancer symptoms → Degenerative (D10/D30)
 */
function detectPhase({ symptoms = [], duration, durationDays } = {}) {
  const days = parseDurationDays(duration, durationDays);
  let phase = 'Acute';
  let reason = 'Duration under 2 weeks — acute phase.';

  if (hasDegenerativeSignal(symptoms)) {
    phase = 'Degenerative';
    reason = 'Tumor/cancer-related signal in symptom set — degenerative phase.';
  } else if (days > 60) {
    phase = 'Chronic';
    reason = 'Duration over 2 months — chronic phase.';
  } else if (days >= 14) {
    phase = 'Sub-Acute';
    reason = 'Duration between 2 and 8 weeks — sub-acute phase.';
  } else {
    phase = 'Acute';
    reason = 'Duration under 2 weeks — acute phase.';
  }

  const normalized = normalizePhase(phase) || phase;
  let dilution = DILUTION_BY_PHASE[normalized] || 'D10';
  if (normalized === 'Chronic') dilution = 'D30';
  if (normalized === 'Degenerative') dilution = 'D10/D30';
  if (normalized === 'Acute') dilution = 'D6';

  return {
    phase: normalized,
    dilution,
    durationDays: days,
    reason,
    weeks: days > 0 ? Number((days / 7).toFixed(1)) : 0
  };
}

module.exports = { detectPhase, parseDurationDays };
