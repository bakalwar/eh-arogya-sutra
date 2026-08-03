import { createHash } from 'node:crypto';

import { canonicalStableDumps } from '../canonicalJson.js';
import type { Rule4PhaseAdapterOutput, Rule4SlotPhaseResolution } from './types.js';

export const RULE4_PHASE_RESOLUTION_FINGERPRINT_V1 =
  'rule4-phase-resolution-fingerprint-v1' as const;

function slotPayload(slot: Rule4SlotPhaseResolution): Record<string, unknown> {
  return {
    formula_slot_id: slot.formulaSlotId,
    formula_target_id: slot.formulaTargetId,
    phase_status: slot.phaseStatus,
    resolved_phase: slot.resolvedPhase,
    phase_resolution_source: slot.phaseResolutionSource,
    calculated_duration_days: slot.calculatedDurationDays,
    supplied_duration_days: slot.suppliedDurationDays,
    duration_consistency_status: slot.durationConsistencyStatus,
    baseline_phase: slot.baselinePhase,
    current_manifestation_phase: slot.currentManifestationPhase,
    target_role: slot.targetRole,
    flare_status: slot.flareStatus,
    evidence_item_ids: [...slot.evidenceItemIds].sort(),
    selected_cascade: slot.selectedCascade,
    selected_dilution: slot.selectedDilution,
    reason_codes: [...slot.reasonCodes].sort(),
    limitation_codes: [...slot.limitationCodes].sort(),
  };
}

export function buildRule4PhaseResolutionFingerprintV1Payload(input: {
  rulesetVersion: string;
  registryVersion: string;
  slotResolutions: readonly Rule4SlotPhaseResolution[];
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
}): Record<string, unknown> {
  const slots = [...input.slotResolutions]
    .sort((a, b) => a.formulaSlotId.localeCompare(b.formulaSlotId))
    .map(slotPayload);
  return {
    fingerprint_version: RULE4_PHASE_RESOLUTION_FINGERPRINT_V1,
    ruleset_version: input.rulesetVersion,
    registry_version: input.registryVersion,
    slot_resolutions: slots,
    reason_codes: [...new Set(input.reasonCodes)].sort(),
    limitation_codes: [...new Set(input.limitationCodes)].sort(),
  };
}

export function rule4PhaseResolutionFingerprintV1Hash(input: {
  rulesetVersion: string;
  registryVersion: string;
  slotResolutions: readonly Rule4SlotPhaseResolution[];
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
}): string {
  const payload = canonicalStableDumps(buildRule4PhaseResolutionFingerprintV1Payload(input));
  return createHash('sha256').update(payload, 'utf8').digest('hex').toUpperCase();
}

export function fingerprintFromPhaseOutput(
  output: Pick<
    Rule4PhaseAdapterOutput,
    'rulesetVersion' | 'registryVersion' | 'slotResolutions' | 'reasonCodes' | 'limitationCodes'
  >,
): string {
  return rule4PhaseResolutionFingerprintV1Hash({
    rulesetVersion: output.rulesetVersion,
    registryVersion: output.registryVersion,
    slotResolutions: output.slotResolutions,
    reasonCodes: output.reasonCodes,
    limitationCodes: output.limitationCodes,
  });
}
