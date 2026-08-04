import { createHash } from 'node:crypto';

import { canonicalStableDumps } from '../canonicalJson.js';
import type { Rule4SelectionAdapterOutput, Rule4SlotSelectionResolution } from './types.js';
import type { Rule4TemperamentTieBreakFingerprintInput } from './types.js';

export const RULE4_NUMERIC_SELECTION_FINGERPRINT_V1 =
  'rule4-numeric-selection-fingerprint-v1' as const;

function tieBreakInputPayload(
  input: Rule4TemperamentTieBreakFingerprintInput | null,
): Record<string, unknown> | null {
  if (!input) {
    return null;
  }
  return {
    primary_temperament: input.primaryTemperament,
    primary_temperament_status: input.primaryTemperamentStatus,
    current_consultation_id: input.currentConsultationId,
    temperament_consultation_id: input.temperamentConsultationId,
    consultation_confirmation_status: input.consultationConfirmationStatus,
    stale_snapshot_flag: input.staleSnapshotFlag,
    tie_break_status: input.tieBreakStatus,
    tie_break_result: input.tieBreakResult,
    evidence_item_ids: [...input.evidenceItemIds].sort(),
  };
}

function slotPayload(slot: Rule4SlotSelectionResolution): Record<string, unknown> {
  return {
    formula_slot_id: slot.formulaSlotId,
    formula_target_id: slot.formulaTargetId,
    selection_status: slot.selectionStatus,
    selected_cascade: slot.selectedCascade,
    selected_dilution: slot.selectedDilution,
    selection_basis: slot.selectionBasis,
    eligible_family_consumed: slot.eligibleFamilyConsumed,
    family_options_before_selection: [...slot.familyOptionsBeforeSelection].sort(),
    tie_break_status: slot.tieBreakStatus,
    fallback_status: slot.fallbackStatus,
    pre_pediatric_overlay_status: slot.prePediatricOverlayStatus,
    upstream_eligibility_fingerprint: slot.upstreamEligibilityFingerprint,
    d3_d5_discriminator_fingerprint: slot.d3D5DiscriminatorFingerprint,
    temperament_tie_break_input: tieBreakInputPayload(slot.temperamentTieBreakInput),
    reason_codes: [...slot.reasonCodes].sort(),
    limitation_codes: [...slot.limitationCodes].sort(),
  };
}

export function rule4NumericSelectionFingerprintV1Payload(input: {
  rulesetVersion: string;
  registryVersion: string;
  upstreamEligibilityFingerprint: string | null;
  slotResolutions: readonly Rule4SlotSelectionResolution[];
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
}): string {
  const slots = [...input.slotResolutions]
    .sort((a, b) => a.formulaSlotId.localeCompare(b.formulaSlotId))
    .map(slotPayload);
  return canonicalStableDumps({
    fingerprint_version: RULE4_NUMERIC_SELECTION_FINGERPRINT_V1,
    ruleset_version: input.rulesetVersion,
    registry_version: input.registryVersion,
    upstream_eligibility_fingerprint: input.upstreamEligibilityFingerprint,
    slot_resolutions: slots,
    reason_codes: [...new Set(input.reasonCodes)].sort(),
    limitation_codes: [...new Set(input.limitationCodes)].sort(),
  });
}

export function rule4NumericSelectionFingerprintV1Hash(
  input: Parameters<typeof rule4NumericSelectionFingerprintV1Payload>[0],
): string {
  const payload = rule4NumericSelectionFingerprintV1Payload(input);
  return createHash('sha256').update(payload, 'utf8').digest('hex').toUpperCase();
}

export function fingerprintFromSelectionOutput(
  output: Pick<
    Rule4SelectionAdapterOutput,
    'rulesetVersion' | 'registryVersion' | 'slotResolutions' | 'reasonCodes' | 'limitationCodes'
  >,
  upstreamEligibilityFingerprint: string | null,
): string {
  return rule4NumericSelectionFingerprintV1Hash({
    rulesetVersion: output.rulesetVersion,
    registryVersion: output.registryVersion,
    upstreamEligibilityFingerprint,
    slotResolutions: output.slotResolutions,
    reasonCodes: output.reasonCodes,
    limitationCodes: output.limitationCodes,
  });
}
