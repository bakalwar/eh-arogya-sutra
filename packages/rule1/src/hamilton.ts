import { RULE1_REPRESENTATION_ORDER, type Rule1PrimaryTemperament } from './constants.js';
import type { Rule1PercentageMap, Rule1ScoreMap } from './types.js';

/**
 * Exact 0.1%-unit Hamilton / largest-remainder (OWNER-FREEZE-OD-R1-IMPL-01-CORR-v1).
 * Uses integer arithmetic only: floor(score*1000/T) and residual by remainder.
 */
export function computeHamiltonPercentages(scores: Rule1ScoreMap): Rule1PercentageMap {
  const T = scores.BILIOUS + scores.SANGUINE + scores.LYMPHATIC + scores.NERVOUS;
  if (T <= 0) {
    throw new Error('Hamilton requires T > 0');
  }

  const units: Record<Rule1PrimaryTemperament, number> = {
    BILIOUS: 0,
    SANGUINE: 0,
    LYMPHATIC: 0,
    NERVOUS: 0,
  };

  let sumFloor = 0;
  for (const t of RULE1_REPRESENTATION_ORDER) {
    const s = scores[t];
    if (s === 0) {
      units[t] = 0;
      continue;
    }
    const floor = Math.floor((s * 1000) / T);
    units[t] = floor;
    sumFloor += floor;
  }

  const remaining = 1000 - sumFloor;
  const candidates = RULE1_REPRESENTATION_ORDER.filter((t) => scores[t] > 0).slice();
  candidates.sort((a, b) => {
    const remA = (scores[a] * 1000) % T;
    const remB = (scores[b] * 1000) % T;
    if (remB !== remA) return remB - remA;
    return RULE1_REPRESENTATION_ORDER.indexOf(a) - RULE1_REPRESENTATION_ORDER.indexOf(b);
  });

  for (let i = 0; i < remaining; i += 1) {
    const t = candidates[i];
    if (!t) break;
    units[t] += 1;
  }

  return {
    BILIOUS: units.BILIOUS / 10,
    SANGUINE: units.SANGUINE / 10,
    LYMPHATIC: units.LYMPHATIC / 10,
    NERVOUS: units.NERVOUS / 10,
  };
}

/**
 * Exact sum over 0.1%-units (avoids IEEE float drift of 33.3+33.3+33.4).
 * Invariant: for any Hamilton output, this returns exactly 100.
 */
export function sumPercentages(pct: Rule1PercentageMap): number {
  const tenths =
    Math.round(pct.BILIOUS * 10) +
    Math.round(pct.SANGUINE * 10) +
    Math.round(pct.LYMPHATIC * 10) +
    Math.round(pct.NERVOUS * 10);
  return tenths / 10;
}
