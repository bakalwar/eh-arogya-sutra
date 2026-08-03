import type { Rule4FormulaBpReading } from './types.js';

/** Q06C Stage 1: sys 140–159 or dia 90–99. Stage 2: sys 160–179 or dia 100–109. Crisis handled in Phase 2. */
export function evaluateFormulaBpStageGate(
  reading: Rule4FormulaBpReading | null | undefined,
  requiredStage: 1 | 2,
): {
  outcome: 'PASS' | 'FAIL' | 'MISSING_INPUT' | 'CONTRADICTORY';
  reasonCodes: string[];
} {
  if (!reading) {
    return { outcome: 'MISSING_INPUT', reasonCodes: ['FORMULA_BP_READING_MISSING'] };
  }
  if (reading.unit !== 'mmHg') {
    return { outcome: 'MISSING_INPUT', reasonCodes: ['FORMULA_BP_NOT_VERIFIED'] };
  }
  if (reading.verificationStatus !== 'VERIFIED') {
    return { outcome: 'MISSING_INPUT', reasonCodes: ['FORMULA_BP_NOT_VERIFIED'] };
  }
  if (reading.organTargetBindingStatus === 'MISMATCH') {
    return { outcome: 'CONTRADICTORY', reasonCodes: ['FORMULA_BP_TARGET_MISMATCH'] };
  }
  if (reading.organTargetBindingStatus === 'MISSING') {
    return { outcome: 'MISSING_INPUT', reasonCodes: ['FORMULA_BP_BINDING_MISSING'] };
  }
  const sys = reading.systolicMmHg;
  const dia = reading.diastolicMmHg;
  if (requiredStage === 1) {
    const stage1 = (sys >= 140 && sys <= 159) || (dia >= 90 && dia <= 99);
    return stage1
      ? { outcome: 'PASS', reasonCodes: [] }
      : { outcome: 'FAIL', reasonCodes: ['FORMULA_BP_STAGE1_NOT_MET'] };
  }
  const stage2 = (sys >= 160 && sys <= 179) || (dia >= 100 && dia <= 109);
  return stage2
    ? { outcome: 'PASS', reasonCodes: [] }
    : { outcome: 'FAIL', reasonCodes: ['FORMULA_BP_STAGE2_NOT_MET'] };
}
