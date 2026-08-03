import { createHash } from 'node:crypto';

import { canonicalStableDumps } from './canonicalJson.js';

export const RULE4_EMPTY_RESULT_FINGERPRINT_V1 = 'rule4-empty-result-fingerprint-v1' as const;

export type Rule4EmptyResultSlotFingerprint = {
  formulaSlotId: string;
  potencyStatus: string;
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
};

export type Rule4EmptyResultFingerprintV1Input = {
  contractVersion: string;
  rulesetVersion: string;
  executionStatus: string;
  engineMode: string;
  prescriptionIssueAllowed: boolean;
  deterministicSafetyFingerprint: string;
  slots: readonly Rule4EmptyResultSlotFingerprint[];
};

export function buildRule4EmptyResultFingerprintV1Payload(
  input: Rule4EmptyResultFingerprintV1Input,
): Record<string, unknown> {
  const slots = [...input.slots]
    .sort((a, b) => a.formulaSlotId.localeCompare(b.formulaSlotId))
    .map((slot) => ({
      formula_slot_id: slot.formulaSlotId,
      potency_status: slot.potencyStatus,
      reason_codes: [...new Set(slot.reasonCodes)].sort(),
      limitation_codes: [...new Set(slot.limitationCodes)].sort(),
    }));

  return {
    fingerprint_version: RULE4_EMPTY_RESULT_FINGERPRINT_V1,
    contract_version: input.contractVersion,
    ruleset_version: input.rulesetVersion,
    execution_status: input.executionStatus,
    engine_mode: input.engineMode,
    prescription_issue_allowed: input.prescriptionIssueAllowed,
    deterministic_safety_fingerprint: input.deterministicSafetyFingerprint,
    slots,
  };
}

export function rule4EmptyResultFingerprintV1Hash(
  input: Rule4EmptyResultFingerprintV1Input,
): string {
  const payload = canonicalStableDumps(buildRule4EmptyResultFingerprintV1Payload(input));
  return createHash('sha256').update(payload, 'utf8').digest('hex').toUpperCase();
}
