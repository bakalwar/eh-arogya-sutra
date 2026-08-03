import { createHash } from 'node:crypto';

import { canonicalStableDumps } from '../canonicalJson.js';
import type { Rule4SeverityAdapterOutput, Rule4SlotSeverityResolution } from './types.js';

export const RULE4_SEVERITY_RESOLUTION_FINGERPRINT_V1 =
  'rule4-severity-resolution-fingerprint-v1' as const;

function slotPayload(slot: Rule4SlotSeverityResolution): Record<string, unknown> {
  return {
    formula_slot_id: slot.formulaSlotId,
    formula_target_id: slot.formulaTargetId,
    target_role: slot.targetRole,
    severity_status: slot.severityStatus,
    severity_score: slot.severityScore,
    severity_band: slot.severityBand,
    severity_resolution_source: slot.severityResolutionSource,
    binding_status: slot.bindingStatus,
    evidence_item_ids: [...slot.evidenceItemIds].sort(),
    corroborating_source_ids: [...slot.corroboratingSourceIds].sort(),
    selected_cascade: slot.selectedCascade,
    selected_dilution: slot.selectedDilution,
    upstream_context_status: slot.upstreamContextStatus,
    reason_codes: [...slot.reasonCodes].sort(),
    limitation_codes: [...slot.limitationCodes].sort(),
  };
}

export function rule4SeverityResolutionFingerprintV1Payload(input: {
  rulesetVersion: string;
  registryVersion: string;
  slotResolutions: readonly Rule4SlotSeverityResolution[];
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
}): string {
  const slots = [...input.slotResolutions]
    .sort((a, b) => a.formulaSlotId.localeCompare(b.formulaSlotId))
    .map(slotPayload);
  return canonicalStableDumps({
    fingerprint_version: RULE4_SEVERITY_RESOLUTION_FINGERPRINT_V1,
    ruleset_version: input.rulesetVersion,
    registry_version: input.registryVersion,
    slot_resolutions: slots,
    reason_codes: [...new Set(input.reasonCodes)].sort(),
    limitation_codes: [...new Set(input.limitationCodes)].sort(),
  });
}

export function rule4SeverityResolutionFingerprintV1Hash(input: {
  rulesetVersion: string;
  registryVersion: string;
  slotResolutions: readonly Rule4SlotSeverityResolution[];
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
}): string {
  const payload = rule4SeverityResolutionFingerprintV1Payload(input);
  return createHash('sha256').update(payload, 'utf8').digest('hex').toUpperCase();
}

export function fingerprintFromSeverityOutput(
  output: Pick<
    Rule4SeverityAdapterOutput,
    'rulesetVersion' | 'registryVersion' | 'slotResolutions' | 'reasonCodes' | 'limitationCodes'
  >,
): string {
  return rule4SeverityResolutionFingerprintV1Hash({
    rulesetVersion: output.rulesetVersion,
    registryVersion: output.registryVersion,
    slotResolutions: output.slotResolutions,
    reasonCodes: output.reasonCodes,
    limitationCodes: output.limitationCodes,
  });
}
