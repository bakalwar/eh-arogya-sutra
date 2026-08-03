import type { Rule4BpCrisisEvaluation, Rule4BpReadingInput } from './types.js';
import {
  BP_CANONICAL_UNIT,
  BP_CRISIS_DIASTOLIC_MIN,
  BP_CRISIS_SYSTOLIC_MIN,
  CRISIS_COMPARABLE_BP_STATUSES,
} from './types.js';

function normalizeUnit(unit: string | null): string | null {
  if (unit == null) {
    return null;
  }
  const u = unit.trim();
  if (u === '') {
    return null;
  }
  if (u.toLowerCase() === 'mmhg') {
    return BP_CANONICAL_UNIT;
  }
  return u;
}

function isNumericBp(n: number | null): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0;
}

/** Patient-wide Q06C crisis — OR logic; mmHg only; no default BP. */
export function evaluateBpCrisis(
  readings: readonly Rule4BpReadingInput[],
): Rule4BpCrisisEvaluation {
  const limitationCodes: string[] = [];
  let crisisDetected = false;

  for (const reading of readings) {
    if (!CRISIS_COMPARABLE_BP_STATUSES.has(reading.evidenceStatus)) {
      if (
        reading.evidenceStatus === 'MISSING' ||
        reading.evidenceStatus === 'INVALID' ||
        reading.evidenceStatus === 'CONTRADICTORY'
      ) {
        limitationCodes.push('BP_EVIDENCE_NOT_CRISIS_COMPARABLE');
      }
      continue;
    }
    const unit = normalizeUnit(reading.unit);
    if (unit !== BP_CANONICAL_UNIT) {
      limitationCodes.push('BP_EVIDENCE_NOT_CRISIS_COMPARABLE');
      continue;
    }
    if (!isNumericBp(reading.systolic) && !isNumericBp(reading.diastolic)) {
      limitationCodes.push('BP_EVIDENCE_NOT_CRISIS_COMPARABLE');
      continue;
    }
    const sysCrisis = isNumericBp(reading.systolic) && reading.systolic >= BP_CRISIS_SYSTOLIC_MIN;
    const diaCrisis =
      isNumericBp(reading.diastolic) && reading.diastolic >= BP_CRISIS_DIASTOLIC_MIN;
    if (sysCrisis || diaCrisis) {
      crisisDetected = true;
    }
  }

  const reasonCodes = crisisDetected ? ['BP_CRISIS_PATIENT_WIDE'] : [];
  return {
    crisisDetected,
    reasonCodes,
    limitationCodes: [...new Set(limitationCodes)],
  };
}

export function evaluateBpCrisisFromSingleReading(
  systolic: number | null,
  diastolic: number | null,
  unit: string | null,
  evidenceStatus: Rule4BpReadingInput['evidenceStatus'],
): Rule4BpCrisisEvaluation {
  return evaluateBpCrisis([
    {
      systolic,
      diastolic,
      unit,
      evidenceStatus,
      sourceKind: 'STRUCTURED',
      measuredAt: null,
    },
  ]);
}
