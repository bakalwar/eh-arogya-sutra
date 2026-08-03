import type { Rule4EvidenceAdapterOutput } from '../evidence/types.js';
import type { Rule4PolarityAdapterOutput } from '../polarity/types.js';
import type { Rule4SafetyGateOutput } from '../output.js';

export const RULE4_CLINICAL_PHASE_VALUES = [
  'ACUTE',
  'SUB_ACUTE',
  'CHRONIC_MODERATE',
  'DEEP_CHRONIC',
] as const;

export type Rule4ClinicalPhase = (typeof RULE4_CLINICAL_PHASE_VALUES)[number];

export const RULE4_PHASE_STATUS_VALUES = [
  'NOT_EVALUATED',
  'RESOLVED_BY_DAY_BAND',
  'RESOLVED_BY_EVIDENCE',
  'RESOLVED_BY_CROSS_BOUNDARY_OVERRIDE',
  'PHASE_AMBIGUOUS',
  'PHASE_CONTRADICTORY',
  'PHASE_TARGET_CONTRADICTORY',
  'MISSING_EVIDENCE',
  'INVALID_EVIDENCE',
  'INVALID_DURATION',
  'TARGET_BINDING_MISSING',
  'BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE',
  'BLOCKED_BY_POLARITY_CONTRADICTION',
] as const;

export type Rule4PhaseStatus = (typeof RULE4_PHASE_STATUS_VALUES)[number];

export const RULE4_PHASE_TARGET_ROLE_VALUES = [
  'STANDARD_FORMULA_TARGET',
  'CURRENT_ACUTE_FLARE',
  'UNDERLYING_CHRONIC_TARGET',
] as const;

export type Rule4PhaseTargetRole = (typeof RULE4_PHASE_TARGET_ROLE_VALUES)[number];

export const RULE4_PHASE_RESOLUTION_SOURCE_VALUES = [
  'NONE',
  'DAY_BAND',
  'STRUCTURED_EVIDENCE',
  'CROSS_BOUNDARY_OVERRIDE',
] as const;

export type Rule4PhaseResolutionSource = (typeof RULE4_PHASE_RESOLUTION_SOURCE_VALUES)[number];

export const RULE4_DURATION_CONSISTENCY_STATUS_VALUES = [
  'NONE',
  'MATCH',
  'MISMATCH',
  'CALCULATED_ONLY',
  'SUPPLIED_ONLY',
  'INVALID_DATES',
  'INCOMPLETE_DATES',
] as const;

export type Rule4DurationConsistencyStatus =
  (typeof RULE4_DURATION_CONSISTENCY_STATUS_VALUES)[number];

export const RULE4_FLARE_STATUS_VALUES = [
  'NOT_APPLICABLE',
  'STABLE_BASELINE',
  'ACUTE_EXACERBATION_ON_CHRONIC',
  'SEPARATION_FAILED',
] as const;

export type Rule4FlareStatus = (typeof RULE4_FLARE_STATUS_VALUES)[number];

export const RULE4_PHASE_EVIDENCE_SOURCE_TIER_VALUES = [
  'DOCTOR_STRUCTURED',
  'INDEPENDENT_USABLE',
  'STRUCTURED_PHASE_AMBIGUOUS',
  'INVALID_ITEM',
  'VAGUE_TIMELINE',
  'REGISTRY_KEYWORD',
  'NEGATED',
  'UNVERIFIED',
] as const;

export type Rule4PhaseEvidenceSourceTier = (typeof RULE4_PHASE_EVIDENCE_SOURCE_TIER_VALUES)[number];

export type Rule4PhaseEvidenceAssertion = {
  evidenceItemId: string;
  phaseLabel: Rule4ClinicalPhase | null;
  sourceTier: Rule4PhaseEvidenceSourceTier;
  dedupeKey: string;
  sequenceToken: string;
};

export type Rule4FormulaPhaseRecord = {
  formulaSlotId: string;
  formulaTargetId: string;
  targetRole: Rule4PhaseTargetRole;
  structuredOnsetDate?: string | null;
  consultationAssessmentDate?: string | null;
  rawDurationDays?: number | null;
  baselinePhase?: Rule4ClinicalPhase | null;
  currentManifestationPhase?: 'ACUTE_EXACERBATION_ON_CHRONIC' | 'STABLE_BASELINE' | null;
  verifiedChronicBaseline?: boolean;
  flareSeparationSafe?: boolean;
  patientGlobalAcuteOnChronicLabelOnly?: boolean;
  phaseEvidenceAssertions: readonly Rule4PhaseEvidenceAssertion[];
};

export type Rule4PhaseAdapterInput = {
  contractVersion: string;
  rulesetVersion: string;
  registryVersion: string;
  label: 'SYNTHETIC' | 'PRODUCTION';
  trustedSyntheticBindingBypass?: boolean;
  formulaSlotIds: readonly string[];
  formulaPhaseRecords: readonly Rule4FormulaPhaseRecord[];
  quarantineProbe?: Record<string, boolean>;
};

export type Rule4SlotPhaseResolution = {
  formulaSlotId: string;
  formulaTargetId: string | null;
  phaseStatus: Rule4PhaseStatus;
  resolvedPhase: Rule4ClinicalPhase | null;
  phaseResolutionSource: Rule4PhaseResolutionSource;
  calculatedDurationDays: number | null;
  suppliedDurationDays: number | null;
  durationConsistencyStatus: Rule4DurationConsistencyStatus;
  baselinePhase: Rule4ClinicalPhase | null;
  currentManifestationPhase: 'ACUTE_EXACERBATION_ON_CHRONIC' | 'STABLE_BASELINE' | null;
  targetRole: Rule4PhaseTargetRole;
  flareStatus: Rule4FlareStatus;
  evidenceItemIds: readonly string[];
  selectedCascade: null;
  selectedDilution: null;
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
};

export type Rule4PhaseAdapterOutput = {
  contractVersion: string;
  rulesetVersion: string;
  registryVersion: string;
  executionStatus: 'NOT_IMPLEMENTED';
  automaticPhaseRuntime: false;
  automaticFlareSplitRuntime: false;
  automaticPotencyRuntime: false;
  automaticPrescriptionIssuanceRuntime: false;
  prescriptionIssueAllowed: false;
  currentRuntimePotencyDelta: 'NONE';
  finalDoctorApprovalRequired: true;
  slotResolutions: readonly Rule4SlotPhaseResolution[];
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
  deterministicPhaseResolutionFingerprint: string;
};

export type Rule4PhaseEvaluationContext = {
  safetyGate?: Rule4SafetyGateOutput | null;
  evidenceAdapter?: Rule4EvidenceAdapterOutput | null;
  polarityRouting?: Rule4PolarityAdapterOutput | null;
  bindingGateMandatory?: boolean;
};
