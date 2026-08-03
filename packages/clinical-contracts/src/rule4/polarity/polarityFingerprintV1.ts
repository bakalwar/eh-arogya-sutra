import { createHash } from 'node:crypto';

import { canonicalStableDumps } from '../canonicalJson.js';
import type { Rule4PolarityAdapterOutput, Rule4SlotPolarityRouting } from './types.js';

export const RULE4_POLARITY_ROUTING_FINGERPRINT_V1 =
  'rule4-polarity-routing-fingerprint-v1' as const;

function slotPayload(slot: Rule4SlotPolarityRouting): Record<string, unknown> {
  return {
    formula_slot_id: slot.formulaSlotId,
    formula_target_id: slot.formulaTargetId,
    rule2_record_id: slot.rule2RecordId,
    disease_polarity: slot.diseasePolarity,
    required_therapeutic_polarity: slot.requiredTherapeuticPolarity,
    resolution_status: slot.resolutionStatus,
    pathway: slot.pathway,
    potency_status: slot.potencyStatus,
    selected_cascade: slot.selectedCascade,
    selected_dilution: slot.selectedDilution,
    reason_codes: [...slot.reasonCodes].sort(),
    limitation_codes: [...slot.limitationCodes].sort(),
  };
}

export function buildRule4PolarityRoutingFingerprintV1Payload(input: {
  rulesetVersion: string;
  registryVersion: string;
  slotRoutings: readonly Rule4SlotPolarityRouting[];
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
}): Record<string, unknown> {
  const slots = [...input.slotRoutings]
    .sort((a, b) => a.formulaSlotId.localeCompare(b.formulaSlotId))
    .map(slotPayload);
  return {
    fingerprint_version: RULE4_POLARITY_ROUTING_FINGERPRINT_V1,
    ruleset_version: input.rulesetVersion,
    registry_version: input.registryVersion,
    slot_routings: slots,
    reason_codes: [...new Set(input.reasonCodes)].sort(),
    limitation_codes: [...new Set(input.limitationCodes)].sort(),
  };
}

export function rule4PolarityRoutingFingerprintV1Hash(input: {
  rulesetVersion: string;
  registryVersion: string;
  slotRoutings: readonly Rule4SlotPolarityRouting[];
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
}): string {
  const payload = canonicalStableDumps(buildRule4PolarityRoutingFingerprintV1Payload(input));
  return createHash('sha256').update(payload, 'utf8').digest('hex').toUpperCase();
}

export function fingerprintFromPolarityOutput(
  output: Pick<
    Rule4PolarityAdapterOutput,
    'rulesetVersion' | 'registryVersion' | 'slotRoutings' | 'reasonCodes' | 'limitationCodes'
  >,
): string {
  return rule4PolarityRoutingFingerprintV1Hash({
    rulesetVersion: output.rulesetVersion,
    registryVersion: output.registryVersion,
    slotRoutings: output.slotRoutings,
    reasonCodes: output.reasonCodes,
    limitationCodes: output.limitationCodes,
  });
}
