import { createHash } from 'node:crypto';

import { toPhase2VerifiedAge } from '../input.js';
import { resolveVerifiedAge } from '../safety/ageValidator.js';
import { fingerprintFromSelectionOutput } from '../selection/selectionFingerprintV1.js';
import {
  overlayCellForBandAndDilution,
  pediatricMatrixAuthorityForDilution,
} from './overlayMatrix.js';
import { slotPediatricOverlayFingerprintV1Hash } from './pediatricOverlayFingerprintV1.js';
import type {
  Rule4D13DJustificationStatus,
  Rule4OverlayGateRow,
  Rule4PediatricOverlayEvaluationContext,
  Rule4PediatricOverlaySlotRecord,
  Rule4PediatricRestrictGateLedger,
  Rule4SlotPediatricOverlayResolution,
} from './types.js';
import type { Rule4FrozenDilution } from '../selection/types.js';
import type { Rule4PediatricBand } from '../safety/types.js';

const PHASE9_LIMITATION = 'SHADOW_PEDIATRIC_DRAFT_OVERLAY_ONLY';

function ageProvenanceDigest(ctx: Rule4PediatricOverlayEvaluationContext): string {
  const va = ctx.verifiedAge;
  const payload = {
    consultation_assessment_date: va?.consultationAssessmentDate ?? null,
    verified_date_of_birth: va?.verifiedDateOfBirth ?? null,
    verification_status: va?.verificationStatus ?? null,
    upstream_band: va?.upstreamVerifiedPediatricBand ?? null,
  };
  return createHash('sha256').update(JSON.stringify(payload), 'utf8').digest('hex').toUpperCase();
}

function allGatesPass(rows: readonly Rule4OverlayGateRow[] | undefined): boolean {
  if (!rows || rows.length === 0) {
    return false;
  }
  return rows.every((r) => r.outcome === 'PASS');
}

function restrictGatesPass(
  band: Rule4PediatricBand,
  dilution: Rule4FrozenDilution,
  ledger: Rule4PediatricRestrictGateLedger | null | undefined,
): { ok: boolean; d13Status: Rule4D13DJustificationStatus; reason: string | null } {
  const L = ledger ?? {};
  if (dilution === 'D2' && band === 'P13_C') {
    if (!allGatesPass(L.q8DGates)) {
      return { ok: false, d13Status: 'FAIL', reason: 'PEDIATRIC_Q8_D_GATE_LEDGER_INCOMPLETE' };
    }
    return { ok: true, d13Status: 'PASS', reason: null };
  }
  if (dilution === 'D1' && band === 'P13_D') {
    if (!allGatesPass(L.q8CDGates)) {
      return { ok: false, d13Status: 'FAIL', reason: 'PEDIATRIC_Q8_CD_GATE_LEDGER_INCOMPLETE' };
    }
    return { ok: true, d13Status: 'PASS', reason: null };
  }
  if (dilution === 'D3' || dilution === 'D10') {
    const d13 = L.d13DJustification?.status ?? 'FAIL';
    if (d13 !== 'PASS') {
      return { ok: false, d13Status: 'FAIL', reason: 'PEDIATRIC_D13_D_JUSTIFICATION_REQUIRED' };
    }
    if (dilution === 'D10' && !allGatesPass(L.d10fGates)) {
      return { ok: false, d13Status: 'FAIL', reason: 'PEDIATRIC_D10F_GATE_LEDGER_INCOMPLETE' };
    }
    return { ok: true, d13Status: 'PASS', reason: null };
  }
  if (dilution === 'D30' && band === 'P13_D') {
    const d13 = L.d13DJustification?.status ?? 'FAIL';
    if (d13 !== 'PASS' || !allGatesPass(L.d30fGates)) {
      return { ok: false, d13Status: 'FAIL', reason: 'PEDIATRIC_D30F_GATE_LEDGER_INCOMPLETE' };
    }
    return { ok: true, d13Status: 'PASS', reason: null };
  }
  return { ok: false, d13Status: 'FAIL', reason: 'PEDIATRIC_OVERLAY_RESTRICT_UNCONFIGURED' };
}

export function resolveSlotPediatricOverlay(
  record: Rule4PediatricOverlaySlotRecord | undefined,
  slotId: string,
  label: 'SYNTHETIC' | 'PRODUCTION',
  context: Rule4PediatricOverlayEvaluationContext,
  meta: { rulesetVersion: string; registryVersion: string },
): Rule4SlotPediatricOverlayResolution {
  const digest = ageProvenanceDigest(context);
  const safety = context.safetyGate;
  const d13Hs = Boolean(safety?.d13HardStopActive);
  const patientHold = Boolean(safety?.patientWideHold);

  const ageRes = context.verifiedAge
    ? resolveVerifiedAge(toPhase2VerifiedAge(context.verifiedAge))
    : null;
  const band =
    (safety?.pediatricBand as Rule4PediatricBand | null) ?? ageRes?.pediatricBand ?? null;
  const ageStatus =
    ageRes?.verificationStatus ?? context.verifiedAge?.verificationStatus ?? 'MISSING';

  const finish = (
    partial: Omit<Rule4SlotPediatricOverlayResolution, 'deterministicPediatricOverlayFingerprint'>,
  ): Rule4SlotPediatricOverlayResolution => {
    const fp = slotPediatricOverlayFingerprintV1Hash(
      { ...partial, deterministicPediatricOverlayFingerprint: '' },
      {
        rulesetVersion: meta.rulesetVersion,
        registryVersion: meta.registryVersion,
        d13HsActive: d13Hs,
        patientWideHold: patientHold,
        urgentEscalationRequired: Boolean(safety?.urgentEscalationRequired),
        reasonCodes: partial.reasonCodes,
        limitationCodes: partial.limitationCodes,
      },
    );
    return { ...partial, deterministicPediatricOverlayFingerprint: fp };
  };

  if (label === 'PRODUCTION') {
    return finish({
      formulaSlotId: slotId,
      formulaTargetId: record?.formulaTargetId ?? null,
      verifiedAgeBand: band,
      ageVerificationStatus: ageStatus,
      ageProvenanceDigest: digest,
      phase8SelectionFingerprint: null,
      baseSelectedCascade: null,
      baseSelectedDilution: null,
      pediatricMatrixAuthority: 'NOT_APPLICABLE',
      pediatricOverlayStatus: 'NOT_EVALUATED',
      overlayGateResults: [],
      d13DJustificationStatus: 'NOT_APPLICABLE',
      finalDraftCascade: null,
      finalDraftDilution: null,
      reasonCodes: ['PRODUCTION_PEDIATRIC_OVERLAY_NOT_EVALUATED'],
      limitationCodes: [PHASE9_LIMITATION],
      finalDoctorApprovalRequired: true,
      prescriptionIssueAllowed: false,
    });
  }

  if (d13Hs || band === 'P13_A' || band === 'P13_B') {
    return finish({
      formulaSlotId: slotId,
      formulaTargetId: record?.formulaTargetId ?? null,
      verifiedAgeBand: band,
      ageVerificationStatus: ageStatus,
      ageProvenanceDigest: digest,
      phase8SelectionFingerprint: null,
      baseSelectedCascade: null,
      baseSelectedDilution: null,
      pediatricMatrixAuthority: 'NOT_APPLICABLE',
      pediatricOverlayStatus: 'BLOCKED_D13_HS',
      overlayGateResults: [],
      d13DJustificationStatus: 'NOT_APPLICABLE',
      finalDraftCascade: null,
      finalDraftDilution: null,
      reasonCodes: ['PEDIATRIC_D13_HS_BLOCKS_OVERLAY'],
      limitationCodes: [PHASE9_LIMITATION],
      finalDoctorApprovalRequired: true,
      prescriptionIssueAllowed: false,
    });
  }

  if (patientHold) {
    return finish({
      formulaSlotId: slotId,
      formulaTargetId: record?.formulaTargetId ?? null,
      verifiedAgeBand: band,
      ageVerificationStatus: ageStatus,
      ageProvenanceDigest: digest,
      phase8SelectionFingerprint: null,
      baseSelectedCascade: null,
      baseSelectedDilution: null,
      pediatricMatrixAuthority: 'NOT_APPLICABLE',
      pediatricOverlayStatus: 'BLOCKED_BY_SAFETY',
      overlayGateResults: [],
      d13DJustificationStatus: 'NOT_APPLICABLE',
      finalDraftCascade: null,
      finalDraftDilution: null,
      reasonCodes: ['BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE'],
      limitationCodes: [PHASE9_LIMITATION],
      finalDoctorApprovalRequired: true,
      prescriptionIssueAllowed: false,
    });
  }

  if (
    ageStatus === 'MISSING' ||
    ageStatus === 'INVALID' ||
    ageStatus === 'CONTRADICTORY' ||
    ageStatus === 'UNRESOLVED' ||
    band == null
  ) {
    return finish({
      formulaSlotId: slotId,
      formulaTargetId: record?.formulaTargetId ?? null,
      verifiedAgeBand: null,
      ageVerificationStatus: ageStatus,
      ageProvenanceDigest: digest,
      phase8SelectionFingerprint: null,
      baseSelectedCascade: null,
      baseSelectedDilution: null,
      pediatricMatrixAuthority: 'NOT_APPLICABLE',
      pediatricOverlayStatus: 'AGE_UNRESOLVED',
      overlayGateResults: [],
      d13DJustificationStatus: 'NOT_APPLICABLE',
      finalDraftCascade: null,
      finalDraftDilution: null,
      reasonCodes: ageRes?.reasonCodes.length ? [...ageRes.reasonCodes] : ['VERIFIED_AGE_MISSING'],
      limitationCodes: [PHASE9_LIMITATION],
      finalDoctorApprovalRequired: true,
      prescriptionIssueAllowed: false,
    });
  }

  const sel = context.selectionResolution;
  if (!sel) {
    return finish({
      formulaSlotId: slotId,
      formulaTargetId: record?.formulaTargetId ?? null,
      verifiedAgeBand: band,
      ageVerificationStatus: ageStatus,
      ageProvenanceDigest: digest,
      phase8SelectionFingerprint: null,
      baseSelectedCascade: null,
      baseSelectedDilution: null,
      pediatricMatrixAuthority: 'NOT_APPLICABLE',
      pediatricOverlayStatus: 'PHASE8_AUTH_FAILED',
      overlayGateResults: [],
      d13DJustificationStatus: 'NOT_APPLICABLE',
      finalDraftCascade: null,
      finalDraftDilution: null,
      reasonCodes: ['PHASE8_SELECTION_RESOLUTION_MISSING'],
      limitationCodes: [PHASE9_LIMITATION],
      finalDoctorApprovalRequired: true,
      prescriptionIssueAllowed: false,
    });
  }

  const phase8Slot = sel.slotResolutions.find((s) => s.formulaSlotId === slotId);
  if (!phase8Slot || !record) {
    return finish({
      formulaSlotId: slotId,
      formulaTargetId: record?.formulaTargetId ?? phase8Slot?.formulaTargetId ?? null,
      verifiedAgeBand: band,
      ageVerificationStatus: ageStatus,
      ageProvenanceDigest: digest,
      phase8SelectionFingerprint: null,
      baseSelectedCascade: null,
      baseSelectedDilution: null,
      pediatricMatrixAuthority: 'NOT_APPLICABLE',
      pediatricOverlayStatus: 'PHASE8_AUTH_FAILED',
      overlayGateResults: [],
      d13DJustificationStatus: 'NOT_APPLICABLE',
      finalDraftCascade: null,
      finalDraftDilution: null,
      reasonCodes: ['PHASE8_SELECTION_SLOT_MISSING'],
      limitationCodes: [PHASE9_LIMITATION],
      finalDoctorApprovalRequired: true,
      prescriptionIssueAllowed: false,
    });
  }

  const expectedFp = fingerprintFromSelectionOutput(
    sel,
    context.upstreamEligibilityFingerprint ?? null,
  );
  if (record.phase8SelectionFingerprint !== expectedFp) {
    return finish({
      formulaSlotId: slotId,
      formulaTargetId: record.formulaTargetId,
      verifiedAgeBand: band,
      ageVerificationStatus: ageStatus,
      ageProvenanceDigest: digest,
      phase8SelectionFingerprint: expectedFp,
      baseSelectedCascade: phase8Slot.selectedCascade,
      baseSelectedDilution: phase8Slot.selectedDilution,
      pediatricMatrixAuthority: 'NOT_APPLICABLE',
      pediatricOverlayStatus: 'PHASE8_AUTH_FAILED',
      overlayGateResults: [],
      d13DJustificationStatus: 'NOT_APPLICABLE',
      finalDraftCascade: null,
      finalDraftDilution: null,
      reasonCodes: ['PHASE8_SELECTION_FINGERPRINT_MISMATCH'],
      limitationCodes: [PHASE9_LIMITATION],
      finalDoctorApprovalRequired: true,
      prescriptionIssueAllowed: false,
    });
  }

  if (record.formulaSlotId !== slotId || record.formulaTargetId !== phase8Slot.formulaTargetId) {
    return finish({
      formulaSlotId: slotId,
      formulaTargetId: phase8Slot.formulaTargetId,
      verifiedAgeBand: band,
      ageVerificationStatus: ageStatus,
      ageProvenanceDigest: digest,
      phase8SelectionFingerprint: expectedFp,
      baseSelectedCascade: phase8Slot.selectedCascade,
      baseSelectedDilution: phase8Slot.selectedDilution,
      pediatricMatrixAuthority: 'NOT_APPLICABLE',
      pediatricOverlayStatus: 'PHASE8_AUTH_FAILED',
      overlayGateResults: [],
      d13DJustificationStatus: 'NOT_APPLICABLE',
      finalDraftCascade: null,
      finalDraftDilution: null,
      reasonCodes: ['PEDIATRIC_OVERLAY_SLOT_TARGET_MISMATCH'],
      limitationCodes: [PHASE9_LIMITATION],
      finalDoctorApprovalRequired: true,
      prescriptionIssueAllowed: false,
    });
  }

  if (phase8Slot.selectionStatus !== 'RESOLVED_DRAFT_CANDIDATE' || !phase8Slot.selectedDilution) {
    return finish({
      formulaSlotId: slotId,
      formulaTargetId: phase8Slot.formulaTargetId,
      verifiedAgeBand: band,
      ageVerificationStatus: ageStatus,
      ageProvenanceDigest: digest,
      phase8SelectionFingerprint: expectedFp,
      baseSelectedCascade: phase8Slot.selectedCascade,
      baseSelectedDilution: phase8Slot.selectedDilution,
      pediatricMatrixAuthority: 'NOT_APPLICABLE',
      pediatricOverlayStatus: 'PHASE8_AUTH_FAILED',
      overlayGateResults: [],
      d13DJustificationStatus: 'NOT_APPLICABLE',
      finalDraftCascade: null,
      finalDraftDilution: null,
      reasonCodes: ['PHASE8_SELECTION_NOT_RESOLVED_DRAFT'],
      limitationCodes: [PHASE9_LIMITATION],
      finalDoctorApprovalRequired: true,
      prescriptionIssueAllowed: false,
    });
  }

  const dilution = phase8Slot.selectedDilution;
  const authority = pediatricMatrixAuthorityForDilution(dilution);

  if (band === 'P13_E') {
    return finish({
      formulaSlotId: slotId,
      formulaTargetId: phase8Slot.formulaTargetId,
      verifiedAgeBand: band,
      ageVerificationStatus: ageStatus,
      ageProvenanceDigest: digest,
      phase8SelectionFingerprint: expectedFp,
      baseSelectedCascade: phase8Slot.selectedCascade,
      baseSelectedDilution: dilution,
      pediatricMatrixAuthority: 'NOT_APPLICABLE',
      pediatricOverlayStatus: 'NOT_APPLICABLE',
      overlayGateResults: [{ dilution, matrixCell: 'NOT_APPLICABLE', outcome: 'RETAINED' }],
      d13DJustificationStatus: 'NOT_REQUIRED',
      finalDraftCascade: phase8Slot.selectedCascade,
      finalDraftDilution: dilution,
      reasonCodes: ['PEDIATRIC_OVERLAY_NOT_APPLICABLE_P13_E'],
      limitationCodes: [PHASE9_LIMITATION],
      finalDoctorApprovalRequired: true,
      prescriptionIssueAllowed: false,
    });
  }

  const cell = overlayCellForBandAndDilution(band, dilution);

  if (cell === 'PROHIBIT') {
    return finish({
      formulaSlotId: slotId,
      formulaTargetId: phase8Slot.formulaTargetId,
      verifiedAgeBand: band,
      ageVerificationStatus: ageStatus,
      ageProvenanceDigest: digest,
      phase8SelectionFingerprint: expectedFp,
      baseSelectedCascade: phase8Slot.selectedCascade,
      baseSelectedDilution: dilution,
      pediatricMatrixAuthority: authority,
      pediatricOverlayStatus: 'OVERLAY_BLOCKED',
      overlayGateResults: [{ dilution, matrixCell: cell, outcome: 'BLOCKED' }],
      d13DJustificationStatus: 'NOT_REQUIRED',
      finalDraftCascade: null,
      finalDraftDilution: null,
      reasonCodes: ['PEDIATRIC_OVERLAY_PROHIBIT'],
      limitationCodes: [PHASE9_LIMITATION],
      finalDoctorApprovalRequired: true,
      prescriptionIssueAllowed: false,
    });
  }

  if (cell === 'ALLOW') {
    return finish({
      formulaSlotId: slotId,
      formulaTargetId: phase8Slot.formulaTargetId,
      verifiedAgeBand: band,
      ageVerificationStatus: ageStatus,
      ageProvenanceDigest: digest,
      phase8SelectionFingerprint: expectedFp,
      baseSelectedCascade: phase8Slot.selectedCascade,
      baseSelectedDilution: dilution,
      pediatricMatrixAuthority: authority,
      pediatricOverlayStatus: 'OVERLAY_APPLIED',
      overlayGateResults: [{ dilution, matrixCell: cell, outcome: 'RETAINED' }],
      d13DJustificationStatus: 'NOT_REQUIRED',
      finalDraftCascade: phase8Slot.selectedCascade,
      finalDraftDilution: dilution,
      reasonCodes: ['PEDIATRIC_OVERLAY_ALLOW'],
      limitationCodes: [PHASE9_LIMITATION],
      finalDoctorApprovalRequired: true,
      prescriptionIssueAllowed: false,
    });
  }

  if (cell === 'RESTRICT') {
    const gate = restrictGatesPass(band, dilution, record.restrictGateLedger);
    if (!gate.ok) {
      return finish({
        formulaSlotId: slotId,
        formulaTargetId: phase8Slot.formulaTargetId,
        verifiedAgeBand: band,
        ageVerificationStatus: ageStatus,
        ageProvenanceDigest: digest,
        phase8SelectionFingerprint: expectedFp,
        baseSelectedCascade: phase8Slot.selectedCascade,
        baseSelectedDilution: dilution,
        pediatricMatrixAuthority: authority,
        pediatricOverlayStatus: 'OVERLAY_UNRESOLVED',
        overlayGateResults: [{ dilution, matrixCell: cell, outcome: 'BLOCKED' }],
        d13DJustificationStatus: gate.d13Status,
        finalDraftCascade: null,
        finalDraftDilution: null,
        reasonCodes: gate.reason ? [gate.reason] : ['PEDIATRIC_OVERLAY_RESTRICT_FAILED'],
        limitationCodes: [PHASE9_LIMITATION],
        finalDoctorApprovalRequired: true,
        prescriptionIssueAllowed: false,
      });
    }
    return finish({
      formulaSlotId: slotId,
      formulaTargetId: phase8Slot.formulaTargetId,
      verifiedAgeBand: band,
      ageVerificationStatus: ageStatus,
      ageProvenanceDigest: digest,
      phase8SelectionFingerprint: expectedFp,
      baseSelectedCascade: phase8Slot.selectedCascade,
      baseSelectedDilution: dilution,
      pediatricMatrixAuthority: authority,
      pediatricOverlayStatus: 'OVERLAY_APPLIED',
      overlayGateResults: [{ dilution, matrixCell: cell, outcome: 'RETAINED' }],
      d13DJustificationStatus: gate.d13Status,
      finalDraftCascade: phase8Slot.selectedCascade,
      finalDraftDilution: dilution,
      reasonCodes: ['PEDIATRIC_OVERLAY_RESTRICT_SATISFIED'],
      limitationCodes: [PHASE9_LIMITATION],
      finalDoctorApprovalRequired: true,
      prescriptionIssueAllowed: false,
    });
  }

  return finish({
    formulaSlotId: slotId,
    formulaTargetId: phase8Slot.formulaTargetId,
    verifiedAgeBand: band,
    ageVerificationStatus: ageStatus,
    ageProvenanceDigest: digest,
    phase8SelectionFingerprint: expectedFp,
    baseSelectedCascade: phase8Slot.selectedCascade,
    baseSelectedDilution: dilution,
    pediatricMatrixAuthority: authority,
    pediatricOverlayStatus: 'OVERLAY_UNRESOLVED',
    overlayGateResults: [],
    d13DJustificationStatus: 'NOT_APPLICABLE',
    finalDraftCascade: null,
    finalDraftDilution: null,
    reasonCodes: ['PEDIATRIC_OVERLAY_CELL_NOT_APPLICABLE'],
    limitationCodes: [PHASE9_LIMITATION],
    finalDoctorApprovalRequired: true,
    prescriptionIssueAllowed: false,
  });
}
