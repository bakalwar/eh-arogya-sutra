import type { Rule4EvidenceAdapterOutput } from '../evidence/types.js';
import type { Rule4SafetyGateOutput } from '../output.js';

export const RULE4_POLARITY_PATHWAY_VALUES = [
  'POSITIVE_DISEASE_NEGATIVE_THERAPEUTIC_GROUP',
  'NEGATIVE_DISEASE_POSITIVE_THERAPEUTIC_GROUP',
  'NEUTRAL_NON_POTENCY',
  'UNRESOLVED_NO_CASCADE',
  'SUPPORT_ONLY_NON_POTENCY',
  'POLARITY_CONTRADICTORY',
  'MIXED_SPLIT_RESOLVED_PER_TARGET',
  'BLOCKED_BY_SAFETY_GATE',
  'NOT_EVALUATED',
] as const;

export type Rule4PolarityPathway = (typeof RULE4_POLARITY_PATHWAY_VALUES)[number];

export const RULE2_DISEASE_POLARITY_VALUES = [
  'POSITIVE',
  'NEGATIVE',
  'NEUTRAL',
  'MIXED',
  'UNRESOLVED',
  'SUPPORT_ONLY',
] as const;

export type Rule2DiseasePolarity = (typeof RULE2_DISEASE_POLARITY_VALUES)[number];

export const RULE2_THERAPEUTIC_POLARITY_VALUES = ['POSITIVE', 'NEGATIVE', 'NEUTRAL'] as const;

export type Rule2TherapeuticPolarity = (typeof RULE2_THERAPEUTIC_POLARITY_VALUES)[number];

export const RULE2_RESOLUTION_STATUS_VALUES = [
  'RESOLVED',
  'RESOLVED_SUPPORT_ROLE',
  'NEUTRAL_FALLBACK_PENDING_REVIEW',
  'UNRESOLVED',
  'CONTRADICTORY',
  'AMBIGUOUS',
] as const;

export type Rule2ResolutionStatus = (typeof RULE2_RESOLUTION_STATUS_VALUES)[number];

/** Frozen Rule 2 per-formula record (sole polarity authority). */
export type Rule2FormulaPolarityRecord = {
  formulaSlotId: string;
  formulaTargetId: string;
  rule2RecordId: string;
  targetPathologyId?: string | null;
  diseasePolarity: string;
  requiredTherapeuticPolarity: string;
  resolutionStatus: string;
  doctorReviewRequired?: boolean;
};

export type Rule4PolarityAdapterInput = {
  contractVersion: string;
  rulesetVersion: string;
  registryVersion: string;
  label: 'SYNTHETIC' | 'PRODUCTION';
  /**
   * Fixture/parity only — ignored when bindingGateMandatory (shadow bundle).
   * Requires label SYNTHETIC; never allowed for PRODUCTION.
   */
  trustedSyntheticBindingBypass?: boolean;
  formulaPolarities: readonly Rule2FormulaPolarityRecord[];
  /** Slot ids expected for routing (isolation boundary). */
  formulaSlotIds: readonly string[];
  /** Audit-only — must not become selector authority. */
  quarantineProbe?: Record<string, boolean>;
  /** Non-authoritative display-only payload — must not drive routing when flagged. */
  casePolaritySummary?: {
    displayOnly?: boolean;
    mustNotDriveSelection?: boolean;
    headline?: string;
  } | null;
};

export type Rule4SlotPolarityRouting = {
  formulaSlotId: string;
  formulaTargetId: string | null;
  rule2RecordId: string | null;
  diseasePolarity: string | null;
  requiredTherapeuticPolarity: string | null;
  resolutionStatus: string | null;
  pathway: Rule4PolarityPathway;
  potencyStatus: 'NOT_EVALUATED' | 'UNRESOLVED' | 'BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE';
  selectedCascade: null;
  selectedDilution: null;
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
};

export type Rule4PolarityAdapterOutput = {
  contractVersion: string;
  rulesetVersion: string;
  registryVersion: string;
  executionStatus: 'NOT_IMPLEMENTED';
  currentRuntimePotencyDelta: 'NONE';
  slotRoutings: readonly Rule4SlotPolarityRouting[];
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
  deterministicPolarityRoutingFingerprint: string;
};

export type Rule4PolarityEvaluationContext = {
  safetyGate?: Rule4SafetyGateOutput | null;
  evidenceAdapter?: Rule4EvidenceAdapterOutput | null;
  /**
   * When true (shadow bundle default), input trustedSyntheticBindingBypass is ignored
   * and GROUP pathways require verified Phase 3 evidence binding.
   */
  bindingGateMandatory?: boolean;
};
