import type { Rule4EligibilityAdapterOutput } from '../eligibility/types.js';
import type { Rule4CandidateFamily } from '../eligibility/types.js';
import type { Rule4GateResult } from '../eligibility/types.js';
import type { Rule4EvidenceAdapterOutput, Rule4EvidenceItemEnvelope } from '../evidence/types.js';
import type { Rule4SafetyGateOutput } from '../output.js';
import type { Rule4VerifiedAgeContext } from '../input.js';

export const RULE4_SELECTION_STATUS_VALUES = [
  'NOT_EVALUATED',
  'UNRESOLVED',
  'BLOCKED_BY_SAFETY',
  'BLOCKED_BY_UPSTREAM',
  'TIE_UNRESOLVED',
  'RESOLVED_DRAFT_CANDIDATE',
] as const;

export type Rule4SelectionStatus = (typeof RULE4_SELECTION_STATUS_VALUES)[number];

export const RULE4_SELECTED_CASCADE_VALUES = [
  'NEGATIVE_D1_D2_SELECTION',
  'POSITIVE_ACUTE_D3_D5_SELECTION',
  'POSITIVE_D10_SELECTION',
  'POSITIVE_D30_SELECTION',
  'POSITIVE_D60_SELECTION',
  'POSITIVE_D60_TO_D10_FALLBACK',
] as const;

export type Rule4SelectedCascade = (typeof RULE4_SELECTED_CASCADE_VALUES)[number];

export const RULE4_FROZEN_DILUTION_VALUES = ['D1', 'D2', 'D3', 'D5', 'D10', 'D30', 'D60'] as const;

export type Rule4FrozenDilution = (typeof RULE4_FROZEN_DILUTION_VALUES)[number];

export const RULE4_SELECTION_BASIS_VALUES = [
  'SINGLE_FAMILY',
  'D1_D2_TEMPERAMENT_TIE_BREAK',
  'CLOSE_D05',
  'DIRECT_D10',
  'DIRECT_D30',
  'DIRECT_D60',
  'D60_D10_FALLBACK',
] as const;

export type Rule4SelectionBasis = (typeof RULE4_SELECTION_BASIS_VALUES)[number];

export const RULE4_TIE_BREAK_STATUS_VALUES = [
  'NOT_APPLICABLE',
  'APPLIED',
  'UNRESOLVED',
  'NO_PREFERENCE',
] as const;

export type Rule4TieBreakStatus = (typeof RULE4_TIE_BREAK_STATUS_VALUES)[number];

export const RULE4_FALLBACK_STATUS_VALUES = [
  'NOT_APPLICABLE',
  'READY_NOT_SELECTED',
  'SELECTED_D10_FALLBACK',
  'BLOCKED',
] as const;

export type Rule4FallbackStatus = (typeof RULE4_FALLBACK_STATUS_VALUES)[number];

export const RULE4_PRE_PEDIATRIC_OVERLAY_STATUS_VALUES = [
  'NOT_APPLICABLE',
  'PEDIATRIC_OVERLAY_REQUIRED',
  'BLOCKED_D13_HS',
  'AGE_UNRESOLVED',
] as const;

export type Rule4PrePediatricOverlayStatus =
  (typeof RULE4_PRE_PEDIATRIC_OVERLAY_STATUS_VALUES)[number];

export const RULE4_PRIMARY_TEMPERAMENT_VALUES = [
  'LYMPHATIC',
  'SANGUINE',
  'NERVOUS',
  'BILIOUS_HEPATIC',
  'MIXED',
  'UNKNOWN',
  'NO_PREFERENCE',
  'UNRESOLVED_TIE',
] as const;

export type Rule4PrimaryTemperament = (typeof RULE4_PRIMARY_TEMPERAMENT_VALUES)[number];

export type Rule4TemperamentSelectionContext = {
  primaryTemperament: Rule4PrimaryTemperament | null;
  primaryTemperamentStatus:
    | 'CONFIRMED'
    | 'UNCONFIRMED'
    | 'LOW_CONFIDENCE'
    | 'ADDITIONAL_INFO_REQUIRED'
    | 'FOLLOW_UP_REQUIRED'
    | 'MISSING'
    | null;
  currentConsultationId: string | null;
  temperamentConsultationId: string | null;
  consultationConfirmationStatus: 'CONFIRMED' | 'UNCONFIRMED' | 'STALE' | 'MISSING' | null;
  staleSnapshotFlag: boolean;
  secondaryTemperament: string | null;
  mixedComponents: readonly string[];
  evidenceItemIds: readonly string[];
};

export type Rule4D08UsabilityStatus = 'USABLE' | 'NOT_USABLE' | 'MISSING' | 'INVALID' | 'AMBIGUOUS';

export type Rule4D08ConfidenceStatus = 'PASS' | 'FAIL' | 'MISSING' | 'NOT_APPLICABLE';

export const RULE4_D3D5_SENSITIVITY_ASSESSMENT_STATUS_VALUES = [
  'ASSESSED_D5_QUALIFIED',
  'ASSESSED_D5_NOT_QUALIFIED',
  'MISSING',
  'INVALID',
  'AMBIGUOUS',
  'CONTRADICTORY',
  'NOT_EVALUATED',
] as const;

export type Rule4D3D5SensitivityAssessmentStatus =
  (typeof RULE4_D3D5_SENSITIVITY_ASSESSMENT_STATUS_VALUES)[number];

export const RULE4_CLOSE_D05_DISCRIMINATOR_STATUS_VALUES = [
  'QUALIFIES_D5',
  'QUALIFIES_D3',
  'UNRESOLVED',
  'CONTRADICTORY',
] as const;

export type Rule4CloseD05DiscriminatorStatus =
  (typeof RULE4_CLOSE_D05_DISCRIMINATOR_STATUS_VALUES)[number];

/** Phase 3–bound provenance row authenticated in discriminator fingerprint v1. */
export type Rule4D3D5EvidenceProvenanceRecord = {
  findingId: string;
  documentId: string;
  itemGatePassed: boolean;
  documentGatePassed: boolean;
};

export type Rule4D3D5DiscriminatorEnvelope = {
  formulaSlotId: string;
  formulaTargetId: string;
  upstreamPhase7EligibilityFingerprint: string;
  q7bfGateResults: readonly Rule4GateResult[];
  d08DocumentStatus: Rule4D08UsabilityStatus;
  d08DocumentConfidence: Rule4D08ConfidenceStatus;
  d08ItemStatus: Rule4D08UsabilityStatus;
  d08ItemConfidence: Rule4D08ConfidenceStatus;
  sensitivityAssessmentStatus: Rule4D3D5SensitivityAssessmentStatus;
  closeD05DiscriminatorStatus: Rule4CloseD05DiscriminatorStatus;
  evidenceItemIds: readonly string[];
  /** Must match Phase 3 item/document gate results for each evidence item (not caller-only). */
  evidenceProvenance: readonly Rule4D3D5EvidenceProvenanceRecord[];
  sourceReferenceIds: readonly string[];
  bindingStatus: 'BOUND' | 'UNBOUND' | 'MISMATCH';
  discriminatorFingerprint: string;
};

export type Rule4TemperamentTieBreakFingerprintInput = {
  primaryTemperament: Rule4PrimaryTemperament | null;
  primaryTemperamentStatus: Rule4TemperamentSelectionContext['primaryTemperamentStatus'];
  currentConsultationId: string | null;
  temperamentConsultationId: string | null;
  consultationConfirmationStatus: Rule4TemperamentSelectionContext['consultationConfirmationStatus'];
  staleSnapshotFlag: boolean;
  tieBreakStatus: Rule4TieBreakStatus;
  tieBreakResult: Rule4FrozenDilution | null;
  evidenceItemIds: readonly string[];
};

/** @deprecated Non-executable — legacy booleans must never select D3/D5. */
export type Rule4D3D5SelectionRecord = {
  formulaSlotId: string;
  formulaTargetId: string;
  q7bfPreconditionsPass?: boolean;
  sensitivityAssessed?: boolean;
  sensitivityExecutableStatus?:
    'PASS' | 'FAIL' | 'MISSING_INPUT' | 'NON_EXECUTABLE_PENDING_FREEZE' | 'CONTRADICTORY' | null;
  closeD05QualifiesD5?: boolean | null;
  d08ConfidencePass?: boolean | null;
  bothD3AndD5Claimed?: boolean;
  evidenceItemIds?: readonly string[];
};

export type Rule4SlotSelectionRecord = {
  formulaSlotId: string;
  formulaTargetId: string;
  upstreamEligibilityFingerprint: string;
  temperamentContext?: Rule4TemperamentSelectionContext | null;
  /** Authenticated shadow-only D3/D5 discriminator (required for D3/D5 family selection). */
  d3D5DiscriminatorEnvelope?: Rule4D3D5DiscriminatorEnvelope | null;
  /** @deprecated Rejected if present without envelope. */
  d3D5Selection?: Rule4D3D5SelectionRecord | null;
};

export type Rule4SelectionAdapterInput = {
  contractVersion: string;
  rulesetVersion: string;
  registryVersion: string;
  label: 'SYNTHETIC' | 'PRODUCTION';
  trustedSyntheticSelectionBypass?: boolean;
  currentConsultationId: string | null;
  formulaSlotIds: readonly string[];
  slotSelectionRecords: readonly Rule4SlotSelectionRecord[];
  quarantineProbe?: Record<string, boolean>;
};

export type Rule4SlotSelectionResolution = {
  formulaSlotId: string;
  formulaTargetId: string | null;
  selectionStatus: Rule4SelectionStatus;
  selectedCascade: Rule4SelectedCascade | null;
  selectedDilution: Rule4FrozenDilution | null;
  selectionBasis: Rule4SelectionBasis | null;
  eligibleFamilyConsumed: Rule4CandidateFamily | null;
  familyOptionsBeforeSelection: readonly Rule4CandidateFamily[];
  tieBreakStatus: Rule4TieBreakStatus;
  fallbackStatus: Rule4FallbackStatus;
  prePediatricOverlayStatus: Rule4PrePediatricOverlayStatus;
  upstreamEligibilityFingerprint: string | null;
  d3D5DiscriminatorFingerprint: string | null;
  temperamentTieBreakInput: Rule4TemperamentTieBreakFingerprintInput | null;
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
};

export type Rule4SelectionAdapterOutput = {
  contractVersion: string;
  rulesetVersion: string;
  registryVersion: string;
  executionStatus: 'NOT_IMPLEMENTED';
  automaticNumericPotencyRuntime: false;
  automaticPrescriptionIssuanceRuntime: false;
  prescriptionIssueAllowed: false;
  finalDoctorApprovalRequired: true;
  currentRuntimePotencyDelta: 'NONE';
  slotResolutions: readonly Rule4SlotSelectionResolution[];
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
  deterministicNumericSelectionFingerprint: string;
};

export type Rule4SelectionEvaluationContext = {
  safetyGate?: Rule4SafetyGateOutput | null;
  verifiedAge?: Rule4VerifiedAgeContext | null;
  eligibilityResolution?: Rule4EligibilityAdapterOutput | null;
  evidenceAdapter?: Rule4EvidenceAdapterOutput | null;
  evidenceItems?: readonly Rule4EvidenceItemEnvelope[] | null;
  bindingGateMandatory?: boolean;
};
