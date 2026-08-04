import { fingerprintFromEligibilityOutput } from '../eligibility/eligibilityFingerprintV1.js';
import type { Rule4SlotEligibilityResolution } from '../eligibility/types.js';
import { validateD3D5DiscriminatorEnvelope } from './validateD3D5Discriminator.js';
import type {
  Rule4FrozenDilution,
  Rule4PrePediatricOverlayStatus,
  Rule4SelectedCascade,
  Rule4SelectionBasis,
  Rule4SelectionEvaluationContext,
  Rule4SelectionAdapterInput,
  Rule4SlotSelectionRecord,
  Rule4SlotSelectionResolution,
  Rule4TemperamentSelectionContext,
  Rule4TemperamentTieBreakFingerprintInput,
  Rule4TieBreakStatus,
} from './types.js';

const PHASE8_LIMITATION = 'SHADOW_DRAFT_NUMERIC_SELECTION_ONLY';

const AUDIT_DEFAULT = {
  d3D5DiscriminatorFingerprint: null as string | null,
  temperamentTieBreakInput: null as Rule4TemperamentTieBreakFingerprintInput | null,
};

function emptyResolution(
  slotId: string,
  targetId: string | null,
  status: Rule4SlotSelectionResolution['selectionStatus'],
  reasonCodes: readonly string[],
  extra: Partial<Rule4SlotSelectionResolution> = {},
): Rule4SlotSelectionResolution {
  return {
    formulaSlotId: slotId,
    formulaTargetId: targetId,
    selectionStatus: status,
    selectedCascade: null,
    selectedDilution: null,
    selectionBasis: null,
    eligibleFamilyConsumed: null,
    familyOptionsBeforeSelection: [],
    tieBreakStatus: 'NOT_APPLICABLE',
    fallbackStatus: 'NOT_APPLICABLE',
    prePediatricOverlayStatus: 'NOT_APPLICABLE',
    upstreamEligibilityFingerprint: null,
    ...AUDIT_DEFAULT,
    reasonCodes: [...new Set(reasonCodes)].sort(),
    limitationCodes: [PHASE8_LIMITATION],
    ...extra,
  };
}

function allMandatoryGatesPass(slot: Rule4SlotEligibilityResolution): boolean {
  if (slot.blockingGateCodes.length > 0) {
    return false;
  }
  return slot.gateResults.every((g) => g.outcome === 'PASS');
}

function pediatricOverlayStatus(
  context: Rule4SelectionEvaluationContext,
): Rule4PrePediatricOverlayStatus {
  const safety = context.safetyGate;
  if (safety?.d13HardStopActive) {
    return 'BLOCKED_D13_HS';
  }
  const age = context.verifiedAge;
  if (!age) {
    return 'AGE_UNRESOLVED';
  }
  if (
    age.verificationStatus === 'MISSING' ||
    age.verificationStatus === 'INVALID' ||
    age.verificationStatus === 'CONTRADICTORY' ||
    age.verificationStatus === 'UNRESOLVED'
  ) {
    return 'AGE_UNRESOLVED';
  }
  if (age.ageYears != null && age.ageYears < 1) {
    return 'BLOCKED_D13_HS';
  }
  if (age.ageYears != null && age.ageYears >= 1 && age.ageYears <= 12) {
    return 'PEDIATRIC_OVERLAY_REQUIRED';
  }
  return 'NOT_APPLICABLE';
}

function temperamentExecutable(ctx: Rule4TemperamentSelectionContext | null | undefined): {
  ok: boolean;
  tieStatus: Rule4TieBreakStatus;
  dilution: Rule4FrozenDilution | null;
} {
  if (!ctx) {
    return { ok: false, tieStatus: 'NO_PREFERENCE', dilution: null };
  }
  if (
    ctx.staleSnapshotFlag ||
    ctx.consultationConfirmationStatus === 'STALE' ||
    ctx.consultationConfirmationStatus === 'UNCONFIRMED' ||
    ctx.consultationConfirmationStatus === 'MISSING'
  ) {
    return { ok: false, tieStatus: 'UNRESOLVED', dilution: null };
  }
  const status = ctx.primaryTemperamentStatus;
  if (
    status !== 'CONFIRMED' ||
    !ctx.currentConsultationId ||
    !ctx.temperamentConsultationId ||
    ctx.currentConsultationId !== ctx.temperamentConsultationId
  ) {
    const tieStatus: Rule4TieBreakStatus =
      status === 'LOW_CONFIDENCE' ||
      status === 'ADDITIONAL_INFO_REQUIRED' ||
      status === 'FOLLOW_UP_REQUIRED' ||
      status === 'MISSING'
        ? 'NO_PREFERENCE'
        : 'UNRESOLVED';
    return { ok: false, tieStatus, dilution: null };
  }
  const t = ctx.primaryTemperament;
  if (t === 'LYMPHATIC') {
    return { ok: true, tieStatus: 'APPLIED', dilution: 'D1' };
  }
  if (t === 'SANGUINE' || t === 'NERVOUS' || t === 'BILIOUS_HEPATIC') {
    return { ok: true, tieStatus: 'APPLIED', dilution: 'D2' };
  }
  return { ok: false, tieStatus: 'UNRESOLVED', dilution: null };
}

function temperamentTieBreakInput(
  ctx: Rule4TemperamentSelectionContext | null | undefined,
  tieStatus: Rule4TieBreakStatus,
  tieResult: Rule4FrozenDilution | null,
): Rule4TemperamentTieBreakFingerprintInput | null {
  if (!ctx) {
    return null;
  }
  return {
    primaryTemperament: ctx.primaryTemperament,
    primaryTemperamentStatus: ctx.primaryTemperamentStatus,
    currentConsultationId: ctx.currentConsultationId,
    temperamentConsultationId: ctx.temperamentConsultationId,
    consultationConfirmationStatus: ctx.consultationConfirmationStatus,
    staleSnapshotFlag: ctx.staleSnapshotFlag,
    tieBreakStatus: tieStatus,
    tieBreakResult: tieResult,
    evidenceItemIds: [...ctx.evidenceItemIds].sort(),
  };
}

function isDualD1D2(options: readonly string[]): boolean {
  if (options.includes('BOTH_D1_D2_ELIGIBLE')) {
    return true;
  }
  return options.includes('D1_ELIGIBLE') && options.includes('D2_ELIGIBLE');
}

function contradictoryMultiFamily(options: readonly string[]): boolean {
  const families = [...new Set(options.filter((f) => f !== 'NONE'))];
  if (families.length <= 1) {
    return false;
  }
  if (isDualD1D2(families)) {
    return families.length > 2;
  }
  if (families.includes('D3_D5_FAMILY_ELIGIBLE') && families.length > 1) {
    return true;
  }
  if (families.includes('D60_FAMILY_ELIGIBLE') && families.includes('D60_D10_FALLBACK_READY')) {
    return true;
  }
  return true;
}

function singleFamilyFromOptions(options: readonly string[]): string | null {
  const families = [...new Set(options.filter((f) => f !== 'NONE'))];
  if (families.length === 1) {
    return families[0]!;
  }
  if (isDualD1D2(families) && families.length <= 2) {
    return 'BOTH_D1_D2_ELIGIBLE';
  }
  return null;
}

type DraftBody = Omit<
  Rule4SlotSelectionResolution,
  'formulaSlotId' | 'formulaTargetId' | 'limitationCodes'
> & { reasonCodes: string[] };

function draftFromFamily(
  family: string,
  record: Rule4SlotSelectionRecord,
  eligibility: Rule4SlotEligibilityResolution,
  context: Rule4SelectionEvaluationContext,
): DraftBody {
  const options = [...eligibility.eligibleFamilyOptions];
  const baseReasons: string[] = [];
  const upstreamFp = record.upstreamEligibilityFingerprint;

  const baseAudit = { ...AUDIT_DEFAULT, upstreamEligibilityFingerprint: upstreamFp };

  if (family === 'D1_ELIGIBLE') {
    return {
      selectionStatus: 'RESOLVED_DRAFT_CANDIDATE',
      selectedCascade: 'NEGATIVE_D1_D2_SELECTION',
      selectedDilution: 'D1',
      selectionBasis: 'SINGLE_FAMILY',
      eligibleFamilyConsumed: 'D1_ELIGIBLE',
      familyOptionsBeforeSelection: options,
      tieBreakStatus: 'NOT_APPLICABLE',
      fallbackStatus: 'NOT_APPLICABLE',
      prePediatricOverlayStatus: 'NOT_APPLICABLE',
      ...baseAudit,
      reasonCodes: baseReasons,
    };
  }
  if (family === 'D2_ELIGIBLE') {
    return {
      selectionStatus: 'RESOLVED_DRAFT_CANDIDATE',
      selectedCascade: 'NEGATIVE_D1_D2_SELECTION',
      selectedDilution: 'D2',
      selectionBasis: 'SINGLE_FAMILY',
      eligibleFamilyConsumed: 'D2_ELIGIBLE',
      familyOptionsBeforeSelection: options,
      tieBreakStatus: 'NOT_APPLICABLE',
      fallbackStatus: 'NOT_APPLICABLE',
      prePediatricOverlayStatus: 'NOT_APPLICABLE',
      ...baseAudit,
      reasonCodes: baseReasons,
    };
  }
  if (family === 'BOTH_D1_D2_ELIGIBLE') {
    const tie = temperamentExecutable(record.temperamentContext);
    const tieInput = temperamentTieBreakInput(
      record.temperamentContext,
      tie.tieStatus,
      tie.dilution,
    );
    if (!tie.ok || !tie.dilution) {
      return {
        selectionStatus: 'TIE_UNRESOLVED',
        selectedCascade: null,
        selectedDilution: null,
        selectionBasis: null,
        eligibleFamilyConsumed: 'BOTH_D1_D2_ELIGIBLE',
        familyOptionsBeforeSelection: options,
        tieBreakStatus: tie.tieStatus,
        fallbackStatus: 'NOT_APPLICABLE',
        prePediatricOverlayStatus: 'NOT_APPLICABLE',
        ...baseAudit,
        temperamentTieBreakInput: tieInput,
        reasonCodes: ['TEMPERAMENT_TIE_UNRESOLVED'],
      };
    }
    return {
      selectionStatus: 'RESOLVED_DRAFT_CANDIDATE',
      selectedCascade: 'NEGATIVE_D1_D2_SELECTION',
      selectedDilution: tie.dilution,
      selectionBasis: 'D1_D2_TEMPERAMENT_TIE_BREAK',
      eligibleFamilyConsumed: 'BOTH_D1_D2_ELIGIBLE',
      familyOptionsBeforeSelection: options,
      tieBreakStatus: tie.tieStatus,
      fallbackStatus: 'NOT_APPLICABLE',
      prePediatricOverlayStatus: 'NOT_APPLICABLE',
      ...baseAudit,
      temperamentTieBreakInput: tieInput,
      reasonCodes: baseReasons,
    };
  }
  if (family === 'D3_D5_FAMILY_ELIGIBLE') {
    if (record.d3D5Selection && !record.d3D5DiscriminatorEnvelope) {
      return {
        selectionStatus: 'UNRESOLVED',
        selectedCascade: null,
        selectedDilution: null,
        selectionBasis: null,
        eligibleFamilyConsumed: 'D3_D5_FAMILY_ELIGIBLE',
        familyOptionsBeforeSelection: options,
        tieBreakStatus: 'NOT_APPLICABLE',
        fallbackStatus: 'NOT_APPLICABLE',
        prePediatricOverlayStatus: 'NOT_APPLICABLE',
        ...baseAudit,
        reasonCodes: ['D3_D5_LEGACY_BOOLEAN_AUTHORITY_REJECTED'],
      };
    }
    const d35 = validateD3D5DiscriminatorEnvelope(record.d3D5DiscriminatorEnvelope, {
      formulaSlotId: record.formulaSlotId,
      formulaTargetId: record.formulaTargetId,
      upstreamPhase7EligibilityFingerprint: upstreamFp,
      evidenceAdapter: context.evidenceAdapter,
      evidenceItems: context.evidenceItems,
    });
    if (d35.status !== 'resolved' || !d35.dilution) {
      return {
        selectionStatus: 'UNRESOLVED',
        selectedCascade: null,
        selectedDilution: null,
        selectionBasis: null,
        eligibleFamilyConsumed: 'D3_D5_FAMILY_ELIGIBLE',
        familyOptionsBeforeSelection: options,
        tieBreakStatus: 'NOT_APPLICABLE',
        fallbackStatus: 'NOT_APPLICABLE',
        prePediatricOverlayStatus: 'NOT_APPLICABLE',
        ...baseAudit,
        d3D5DiscriminatorFingerprint: d35.discriminatorFingerprint,
        reasonCodes: d35.reasonCodes,
      };
    }
    return {
      selectionStatus: 'RESOLVED_DRAFT_CANDIDATE',
      selectedCascade: 'POSITIVE_ACUTE_D3_D5_SELECTION',
      selectedDilution: d35.dilution,
      selectionBasis: 'CLOSE_D05',
      eligibleFamilyConsumed: 'D3_D5_FAMILY_ELIGIBLE',
      familyOptionsBeforeSelection: options,
      tieBreakStatus: 'NOT_APPLICABLE',
      fallbackStatus: 'NOT_APPLICABLE',
      prePediatricOverlayStatus: 'NOT_APPLICABLE',
      ...baseAudit,
      d3D5DiscriminatorFingerprint: d35.discriminatorFingerprint,
      reasonCodes: d35.reasonCodes,
    };
  }
  if (family === 'D10_FAMILY_ELIGIBLE') {
    return {
      selectionStatus: 'RESOLVED_DRAFT_CANDIDATE',
      selectedCascade: 'POSITIVE_D10_SELECTION',
      selectedDilution: 'D10',
      selectionBasis: 'DIRECT_D10',
      eligibleFamilyConsumed: 'D10_FAMILY_ELIGIBLE',
      familyOptionsBeforeSelection: options,
      tieBreakStatus: 'NOT_APPLICABLE',
      fallbackStatus: 'NOT_APPLICABLE',
      prePediatricOverlayStatus: 'NOT_APPLICABLE',
      ...baseAudit,
      reasonCodes: baseReasons,
    };
  }
  if (family === 'D30_FAMILY_ELIGIBLE') {
    return {
      selectionStatus: 'RESOLVED_DRAFT_CANDIDATE',
      selectedCascade: 'POSITIVE_D30_SELECTION',
      selectedDilution: 'D30',
      selectionBasis: 'DIRECT_D30',
      eligibleFamilyConsumed: 'D30_FAMILY_ELIGIBLE',
      familyOptionsBeforeSelection: options,
      tieBreakStatus: 'NOT_APPLICABLE',
      fallbackStatus: 'NOT_APPLICABLE',
      prePediatricOverlayStatus: 'NOT_APPLICABLE',
      ...baseAudit,
      reasonCodes: baseReasons,
    };
  }
  if (family === 'D60_FAMILY_ELIGIBLE') {
    return {
      selectionStatus: 'RESOLVED_DRAFT_CANDIDATE',
      selectedCascade: 'POSITIVE_D60_SELECTION',
      selectedDilution: 'D60',
      selectionBasis: 'DIRECT_D60',
      eligibleFamilyConsumed: 'D60_FAMILY_ELIGIBLE',
      familyOptionsBeforeSelection: options,
      tieBreakStatus: 'NOT_APPLICABLE',
      fallbackStatus: 'NOT_APPLICABLE',
      prePediatricOverlayStatus: 'NOT_APPLICABLE',
      ...baseAudit,
      reasonCodes: baseReasons,
    };
  }
  if (family === 'D60_D10_FALLBACK_READY') {
    return {
      selectionStatus: 'RESOLVED_DRAFT_CANDIDATE',
      selectedCascade: 'POSITIVE_D60_TO_D10_FALLBACK',
      selectedDilution: 'D10',
      selectionBasis: 'D60_D10_FALLBACK',
      eligibleFamilyConsumed: 'D60_D10_FALLBACK_READY',
      familyOptionsBeforeSelection: options,
      tieBreakStatus: 'NOT_APPLICABLE',
      fallbackStatus: 'SELECTED_D10_FALLBACK',
      prePediatricOverlayStatus: 'NOT_APPLICABLE',
      ...baseAudit,
      reasonCodes: ['D60_D10_FALLBACK_SELECTED'],
    };
  }
  return {
    selectionStatus: 'UNRESOLVED',
    selectedCascade: null,
    selectedDilution: null,
    selectionBasis: null,
    eligibleFamilyConsumed: null,
    familyOptionsBeforeSelection: options,
    tieBreakStatus: 'NOT_APPLICABLE',
    fallbackStatus: 'NOT_APPLICABLE',
    prePediatricOverlayStatus: 'NOT_APPLICABLE',
    ...baseAudit,
    reasonCodes: ['UNKNOWN_CANDIDATE_FAMILY'],
  };
}

export function resolveSlotSelection(
  record: Rule4SlotSelectionRecord | undefined,
  slotId: string,
  input: Rule4SelectionAdapterInput,
  context: Rule4SelectionEvaluationContext,
): Rule4SlotSelectionResolution {
  const safety = context.safetyGate;
  if (safety?.patientWideHold || safety?.d13HardStopActive) {
    return emptyResolution(slotId, record?.formulaTargetId ?? null, 'BLOCKED_BY_SAFETY', [
      'BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE',
    ]);
  }

  const pediatric = pediatricOverlayStatus(context);
  if (pediatric === 'BLOCKED_D13_HS') {
    return emptyResolution(
      slotId,
      record?.formulaTargetId ?? null,
      'BLOCKED_BY_SAFETY',
      ['PEDIATRIC_D13_HS_BLOCKS_SELECTION'],
      { prePediatricOverlayStatus: pediatric },
    );
  }

  if (input.label === 'PRODUCTION') {
    return emptyResolution(slotId, record?.formulaTargetId ?? null, 'NOT_EVALUATED', [
      'PRODUCTION_SELECTION_UPSTREAM_CHAIN_NOT_CONNECTED',
    ]);
  }

  const trustedBypass =
    input.label === 'SYNTHETIC' && input.trustedSyntheticSelectionBypass === true;
  if (context.bindingGateMandatory !== false && !trustedBypass) {
    return emptyResolution(slotId, record?.formulaTargetId ?? null, 'NOT_EVALUATED', [
      'SYNTHETIC_SELECTION_BYPASS_REQUIRED',
    ]);
  }

  const eligibilityOut = context.eligibilityResolution;
  if (!eligibilityOut) {
    return emptyResolution(slotId, record?.formulaTargetId ?? null, 'NOT_EVALUATED', [
      'SELECTION_UPSTREAM_ELIGIBILITY_MISSING',
    ]);
  }

  const expectedFp = fingerprintFromEligibilityOutput(eligibilityOut);
  if (record && record.upstreamEligibilityFingerprint !== expectedFp) {
    return emptyResolution(slotId, record.formulaTargetId, 'UNRESOLVED', [
      'SELECTION_UPSTREAM_ELIGIBILITY_FINGERPRINT_INVALID',
    ]);
  }

  const eligibility = eligibilityOut.slotResolutions.find((s) => s.formulaSlotId === slotId);
  if (!eligibility) {
    return emptyResolution(slotId, record?.formulaTargetId ?? null, 'NOT_EVALUATED', [
      'SELECTION_ELIGIBILITY_SLOT_MISSING',
    ]);
  }

  if (!record || record.formulaSlotId !== slotId) {
    return emptyResolution(slotId, eligibility.formulaTargetId, 'NOT_EVALUATED', [
      'SELECTION_RECORD_BINDING_MISSING',
    ]);
  }
  if (record.formulaTargetId !== eligibility.formulaTargetId) {
    return emptyResolution(slotId, eligibility.formulaTargetId, 'UNRESOLVED', [
      'CROSS_FORMULA_SELECTION_LEAKAGE_BLOCKED',
    ]);
  }

  if (
    eligibility.eligibilityStatus !== 'FAMILY_ELIGIBLE' ||
    eligibility.familyGateStatus !== 'COMPLETE' ||
    !allMandatoryGatesPass(eligibility)
  ) {
    return emptyResolution(
      slotId,
      eligibility.formulaTargetId,
      'UNRESOLVED',
      ['SELECTION_ENTRY_GATE_NOT_SATISFIED'],
      {
        familyOptionsBeforeSelection: [...eligibility.eligibleFamilyOptions],
        upstreamEligibilityFingerprint: record.upstreamEligibilityFingerprint,
      },
    );
  }

  const options = [...eligibility.eligibleFamilyOptions];
  if (contradictoryMultiFamily(options)) {
    return emptyResolution(
      slotId,
      eligibility.formulaTargetId,
      'UNRESOLVED',
      ['SELECTION_INPUT_CONTRADICTORY'],
      {
        familyOptionsBeforeSelection: options,
        upstreamEligibilityFingerprint: record.upstreamEligibilityFingerprint,
      },
    );
  }

  const family = singleFamilyFromOptions(options);
  if (!family) {
    return emptyResolution(
      slotId,
      eligibility.formulaTargetId,
      'UNRESOLVED',
      ['SELECTION_FAMILY_OPTIONS_EMPTY'],
      {
        familyOptionsBeforeSelection: options,
        upstreamEligibilityFingerprint: record.upstreamEligibilityFingerprint,
      },
    );
  }

  const draft = draftFromFamily(family, record, eligibility, context);
  const prePed =
    draft.selectionStatus === 'RESOLVED_DRAFT_CANDIDATE'
      ? pediatric
      : draft.prePediatricOverlayStatus;

  if (pediatric === 'AGE_UNRESOLVED' && draft.selectionStatus === 'RESOLVED_DRAFT_CANDIDATE') {
    return {
      formulaSlotId: slotId,
      formulaTargetId: eligibility.formulaTargetId,
      selectionStatus: 'UNRESOLVED',
      selectedCascade: null,
      selectedDilution: null,
      selectionBasis: null,
      eligibleFamilyConsumed: draft.eligibleFamilyConsumed,
      familyOptionsBeforeSelection: draft.familyOptionsBeforeSelection,
      tieBreakStatus: draft.tieBreakStatus,
      fallbackStatus: draft.fallbackStatus,
      prePediatricOverlayStatus: 'AGE_UNRESOLVED',
      upstreamEligibilityFingerprint: record.upstreamEligibilityFingerprint,
      d3D5DiscriminatorFingerprint: draft.d3D5DiscriminatorFingerprint,
      temperamentTieBreakInput: draft.temperamentTieBreakInput,
      reasonCodes: [
        ...new Set([...draft.reasonCodes, 'VERIFIED_AGE_REQUIRED_FOR_SELECTION']),
      ].sort(),
      limitationCodes: [PHASE8_LIMITATION],
    };
  }

  return {
    formulaSlotId: slotId,
    formulaTargetId: eligibility.formulaTargetId,
    selectionStatus: draft.selectionStatus,
    selectedCascade: draft.selectedCascade as Rule4SelectedCascade | null,
    selectedDilution: draft.selectedDilution,
    selectionBasis: draft.selectionBasis as Rule4SelectionBasis | null,
    eligibleFamilyConsumed: draft.eligibleFamilyConsumed,
    familyOptionsBeforeSelection: draft.familyOptionsBeforeSelection,
    tieBreakStatus: draft.tieBreakStatus,
    fallbackStatus: draft.fallbackStatus,
    prePediatricOverlayStatus: prePed,
    upstreamEligibilityFingerprint: record.upstreamEligibilityFingerprint,
    d3D5DiscriminatorFingerprint: draft.d3D5DiscriminatorFingerprint,
    temperamentTieBreakInput: draft.temperamentTieBreakInput,
    reasonCodes: [...new Set(draft.reasonCodes)].sort(),
    limitationCodes: [PHASE8_LIMITATION],
  };
}
