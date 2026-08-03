import { createHash } from 'node:crypto';

import type { Rule4InputContract } from './input.js';
import { validateRule4InputContract } from './input.js';
import type { Rule4Result } from './output.js';
import { validateRule4OutputCodes } from './outputCodeValidation.js';
import {
  RULE4_CONTRACT_VERSION,
  RULE4_DEFAULT_ENGINE_MODE,
  type Rule4EngineMode,
} from './version.js';

function stableJson(value: unknown): string {
  return JSON.stringify(value, (_k, v) => (v === undefined ? null : v));
}

function fingerprintResult(body: Record<string, unknown>): string {
  return createHash('sha256').update(stableJson(body)).digest('hex');
}

export function parseRule4EngineMode(raw: string | null | undefined): Rule4EngineMode {
  if (raw === undefined || raw === null || raw.trim() === '') {
    return RULE4_DEFAULT_ENGINE_MODE;
  }
  const v = raw.trim().toLowerCase();
  if (v === 'off' || v === 'shadow' || v === 'active') {
    return v;
  }
  throw new Error('RULE4_ENGINE_MODE_INVALID');
}

/** Phase 1 empty evaluator — structure validation only; no clinical inference. */
export function evaluateRule4Empty(input: Rule4InputContract): Rule4Result {
  validateRule4InputContract(input);
  if (input.engineMode === 'active') {
    throw new Error('RULE4_ENGINE_MODE_ACTIVE_NOT_IMPLEMENTED');
  }

  const slots = input.formulaSlots.map((slot) => ({
    formulaSlotId: slot.formulaSlotId,
    formulaTargetId: slot.formulaTargetId,
    potencyStatus: 'NOT_EVALUATED' as const,
    selectedDilution: null,
    selectedCascade: null,
    reasonCodes: ['RULE4_PHASE1_EVALUATOR_NOT_IMPLEMENTED'] as const,
    limitationCodes: ['PHASE1_NO_CLINICAL_EVALUATION'] as const,
    evidenceItemIds: [...slot.structuredEvidenceItemIds],
  }));

  const core = {
    contractVersion: RULE4_CONTRACT_VERSION,
    rulesetVersion: input.rulesetVersion,
    executionStatus: 'NOT_IMPLEMENTED' as const,
    engineMode: input.engineMode,
    automaticPotencyRuntime: false as const,
    automaticPrescriptionIssuanceRuntime: false as const,
    currentRuntimePotencyDelta: 'NONE' as const,
    currentRuntimeIssuanceDelta: 'NONE' as const,
    finalDoctorApprovalRequired: true as const,
    prescriptionIssueAllowed: false as const,
    slots,
    reasonCodes: ['RULE4_PHASE1_EVALUATOR_NOT_IMPLEMENTED'] as const,
    limitationCodes: ['PHASE1_NO_CLINICAL_EVALUATION'] as const,
  };

  validateRule4OutputCodes(core);

  return {
    ...core,
    deterministicFingerprint: fingerprintResult({ ...core, inputFingerprint: stableJson(input) }),
  };
}
