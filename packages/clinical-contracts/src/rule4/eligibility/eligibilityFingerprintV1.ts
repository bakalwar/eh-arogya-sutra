import { createHash } from 'node:crypto';

import { canonicalStableDumps } from '../canonicalJson.js';
import type { Rule4EligibilityAdapterOutput, Rule4SlotEligibilityResolution } from './types.js';
import type { Rule4GateResult } from './types.js';

export const RULE4_CANDIDATE_ELIGIBILITY_FINGERPRINT_V1 =
  'rule4-candidate-eligibility-fingerprint-v1' as const;

function gatePayload(gate: Rule4GateResult): Record<string, unknown> {
  return {
    gate_id: gate.gateId,
    outcome: gate.outcome,
    evidence_item_ids: [...gate.evidenceItemIds].sort(),
    reason_codes: [...gate.reasonCodes].sort(),
    limitation_codes: [...gate.limitationCodes].sort(),
  };
}

function slotPayload(slot: Rule4SlotEligibilityResolution): Record<string, unknown> {
  const gates = [...slot.gateResults]
    .sort((a, b) => a.gateId.localeCompare(b.gateId))
    .map(gatePayload);
  return {
    formula_slot_id: slot.formulaSlotId,
    formula_target_id: slot.formulaTargetId,
    target_role: slot.targetRole,
    eligibility_status: slot.eligibilityStatus,
    candidate_family: slot.candidateFamily,
    eligible_family_options: [...slot.eligibleFamilyOptions].sort(),
    family_gate_status: slot.familyGateStatus,
    gate_results: gates,
    blocking_gate_codes: [...slot.blockingGateCodes].sort(),
    upstream_context_status: slot.upstreamContextStatus,
    selection_status: slot.selectionStatus,
    selected_cascade: slot.selectedCascade,
    selected_dilution: slot.selectedDilution,
    reason_codes: [...slot.reasonCodes].sort(),
    limitation_codes: [...slot.limitationCodes].sort(),
  };
}

export function rule4CandidateEligibilityFingerprintV1Payload(input: {
  rulesetVersion: string;
  registryVersion: string;
  selectionStatus: 'NOT_STARTED';
  slotResolutions: readonly Rule4SlotEligibilityResolution[];
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
}): string {
  const slots = [...input.slotResolutions]
    .sort((a, b) => a.formulaSlotId.localeCompare(b.formulaSlotId))
    .map(slotPayload);
  return canonicalStableDumps({
    fingerprint_version: RULE4_CANDIDATE_ELIGIBILITY_FINGERPRINT_V1,
    ruleset_version: input.rulesetVersion,
    registry_version: input.registryVersion,
    selection_status: input.selectionStatus,
    slot_resolutions: slots,
    reason_codes: [...new Set(input.reasonCodes)].sort(),
    limitation_codes: [...new Set(input.limitationCodes)].sort(),
  });
}

export function rule4CandidateEligibilityFingerprintV1Hash(
  input: Parameters<typeof rule4CandidateEligibilityFingerprintV1Payload>[0],
): string {
  const payload = rule4CandidateEligibilityFingerprintV1Payload(input);
  return createHash('sha256').update(payload, 'utf8').digest('hex').toUpperCase();
}

export function fingerprintFromEligibilityOutput(
  output: Pick<
    Rule4EligibilityAdapterOutput,
    | 'rulesetVersion'
    | 'registryVersion'
    | 'selectionStatus'
    | 'slotResolutions'
    | 'reasonCodes'
    | 'limitationCodes'
  >,
): string {
  return rule4CandidateEligibilityFingerprintV1Hash({
    rulesetVersion: output.rulesetVersion,
    registryVersion: output.registryVersion,
    selectionStatus: output.selectionStatus,
    slotResolutions: output.slotResolutions,
    reasonCodes: output.reasonCodes,
    limitationCodes: output.limitationCodes,
  });
}
