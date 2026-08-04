import { createHash } from 'node:crypto';

import { canonicalStableDumps } from '../canonicalJson.js';
import type { Rule4SlotPediatricOverlayResolution } from './types.js';

export const RULE4_PEDIATRIC_OVERLAY_FINGERPRINT_V1 =
  'rule4-pediatric-overlay-fingerprint-v1' as const;

function slotPayload(slot: Rule4SlotPediatricOverlayResolution): Record<string, unknown> {
  return {
    age_provenance_digest: slot.ageProvenanceDigest,
    age_verification_status: slot.ageVerificationStatus,
    base_selected_cascade: slot.baseSelectedCascade,
    base_selected_dilution: slot.baseSelectedDilution,
    d13_d_justification_status: slot.d13DJustificationStatus,
    final_draft_cascade: slot.finalDraftCascade,
    final_draft_dilution: slot.finalDraftDilution,
    formula_slot_id: slot.formulaSlotId,
    formula_target_id: slot.formulaTargetId,
    overlay_gate_results: slot.overlayGateResults.map((g) => ({
      dilution: g.dilution,
      matrix_cell: g.matrixCell,
      outcome: g.outcome,
    })),
    pediatric_matrix_authority: slot.pediatricMatrixAuthority,
    pediatric_overlay_status: slot.pediatricOverlayStatus,
    phase8_selection_fingerprint: slot.phase8SelectionFingerprint,
    prescription_issue_allowed: slot.prescriptionIssueAllowed,
    reason_codes: [...slot.reasonCodes].sort(),
    limitation_codes: [...slot.limitationCodes].sort(),
    verified_age_band: slot.verifiedAgeBand,
  };
}

export function rule4PediatricOverlayFingerprintV1Payload(input: {
  rulesetVersion: string;
  registryVersion: string;
  d13HsActive: boolean;
  patientWideHold: boolean;
  urgentEscalationRequired: boolean;
  slotResolutions: readonly Rule4SlotPediatricOverlayResolution[];
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
}): string {
  const slots = [...input.slotResolutions]
    .sort((a, b) => a.formulaSlotId.localeCompare(b.formulaSlotId))
    .map(slotPayload);
  return canonicalStableDumps({
    d13_hs_active: input.d13HsActive,
    fingerprint_version: RULE4_PEDIATRIC_OVERLAY_FINGERPRINT_V1,
    limitation_codes: [...new Set(input.limitationCodes)].sort(),
    patient_wide_hold: input.patientWideHold,
    reason_codes: [...new Set(input.reasonCodes)].sort(),
    registry_version: input.registryVersion,
    ruleset_version: input.rulesetVersion,
    slot_resolutions: slots,
    urgent_escalation_required: input.urgentEscalationRequired,
  });
}

export function rule4PediatricOverlayFingerprintV1Hash(
  input: Parameters<typeof rule4PediatricOverlayFingerprintV1Payload>[0],
): string {
  const payload = rule4PediatricOverlayFingerprintV1Payload(input);
  return createHash('sha256').update(payload, 'utf8').digest('hex').toUpperCase();
}

export function fingerprintFromPediatricOverlayOutput(
  output: Pick<
    import('./types.js').Rule4PediatricOverlayAdapterOutput,
    'rulesetVersion' | 'registryVersion' | 'slotResolutions' | 'reasonCodes' | 'limitationCodes'
  >,
  safety: {
    d13HsActive: boolean;
    patientWideHold: boolean;
    urgentEscalationRequired: boolean;
  },
): string {
  return rule4PediatricOverlayFingerprintV1Hash({
    rulesetVersion: output.rulesetVersion,
    registryVersion: output.registryVersion,
    d13HsActive: safety.d13HsActive,
    patientWideHold: safety.patientWideHold,
    urgentEscalationRequired: safety.urgentEscalationRequired,
    slotResolutions: output.slotResolutions,
    reasonCodes: output.reasonCodes,
    limitationCodes: output.limitationCodes,
  });
}

export function slotPediatricOverlayFingerprintV1Hash(
  slot: Rule4SlotPediatricOverlayResolution,
  input: {
    rulesetVersion: string;
    registryVersion: string;
    d13HsActive: boolean;
    patientWideHold: boolean;
    urgentEscalationRequired: boolean;
    reasonCodes: readonly string[];
    limitationCodes: readonly string[];
  },
): string {
  return rule4PediatricOverlayFingerprintV1Hash({
    ...input,
    slotResolutions: [slot],
  });
}
