import type { Rule4EvidenceAdapterOutput } from '../evidence/types.js';
import type { Rule4PhaseAdapterOutput } from '../phase/types.js';
import type { Rule4PhaseTargetRole } from '../phase/types.js';
import type { Rule4PolarityAdapterOutput } from '../polarity/types.js';
import type { Rule4SafetyGateOutput } from '../output.js';
import type { Rule4SeverityBand } from './severityScale.js';

export const RULE4_SEVERITY_STATUS_VALUES = [
  'NOT_EVALUATED',
  'RESOLVED_NUMERIC',
  'RESOLVED_BAND_ONLY',
  'MISSING_EVIDENCE',
  'INVALID_EVIDENCE',
  'INSUFFICIENT_CORROBORATION',
  'SEVERITY_CONTRADICTORY',
  'TARGET_BINDING_MISSING',
  'BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE',
] as const;

export type Rule4SeverityStatus = (typeof RULE4_SEVERITY_STATUS_VALUES)[number];

export const RULE4_SEVERITY_RESOLUTION_SOURCE_VALUES = [
  'NONE',
  'DOCTOR_STRUCTURED',
  'INDEPENDENT_CORROBORATION',
  'STRUCTURED_BAND_ONLY',
] as const;

export type Rule4SeverityResolutionSource =
  (typeof RULE4_SEVERITY_RESOLUTION_SOURCE_VALUES)[number];

export const RULE4_SEVERITY_EVIDENCE_SOURCE_TIER_VALUES = [
  'DOCTOR_STRUCTURED',
  'INDEPENDENT_USABLE',
  'STRUCTURED_SEVERITY_AMBIGUOUS',
  'INVALID_ITEM',
  'INVALID_SCORE',
  'INVALID_BAND',
  'VAGUE_TEXT',
  'REGISTRY_KEYWORD',
  'NEGATED',
  'UNVERIFIED',
] as const;

export type Rule4SeverityEvidenceSourceTier =
  (typeof RULE4_SEVERITY_EVIDENCE_SOURCE_TIER_VALUES)[number];

export type Rule4SeverityEvidenceAssertion = {
  evidenceItemId: string;
  severityScore: number | null;
  severityBand: Rule4SeverityBand | null;
  sourceTier: Rule4SeverityEvidenceSourceTier;
  dedupeKey: string;
  sequenceToken: string;
  parentSourceId?: string | null;
  /** Authoritative target role when assertion is referenced across acute/chronic slots. */
  boundFormulaSlotId?: string | null;
  boundFormulaTargetId?: string | null;
  boundTargetRole?: Rule4PhaseTargetRole | null;
};

export const RULE4_UPSTREAM_CONTEXT_STATUS_VALUES = [
  'READY_FOR_FUTURE_GATE_EVALUATION',
  'AUDIT_ONLY_NON_POTENCY_CONTEXT',
  'AUDIT_ONLY_UPSTREAM_UNRESOLVED',
  'NOT_EVALUATED',
] as const;

export type Rule4UpstreamContextStatus = (typeof RULE4_UPSTREAM_CONTEXT_STATUS_VALUES)[number];

export type Rule4FormulaSeverityRecord = {
  formulaSlotId: string;
  formulaTargetId: string;
  targetRole: Rule4PhaseTargetRole;
  baselineSeverityScore?: number | null;
  baselineSeverityBand?: Rule4SeverityBand | null;
  currentManifestationSeverityScore?: number | null;
  currentManifestationSeverityBand?: Rule4SeverityBand | null;
  patientGlobalMaxSeverityLabelOnly?: boolean;
  severityEvidenceAssertions: readonly Rule4SeverityEvidenceAssertion[];
};

export type Rule4SeverityAdapterInput = {
  contractVersion: string;
  rulesetVersion: string;
  registryVersion: string;
  label: 'SYNTHETIC' | 'PRODUCTION';
  trustedSyntheticBindingBypass?: boolean;
  formulaSlotIds: readonly string[];
  formulaSeverityRecords: readonly Rule4FormulaSeverityRecord[];
  quarantineProbe?: Record<string, boolean>;
};

export type Rule4SlotSeverityResolution = {
  formulaSlotId: string;
  formulaTargetId: string | null;
  targetRole: Rule4PhaseTargetRole;
  severityStatus: Rule4SeverityStatus;
  severityScore: number | null;
  severityBand: Rule4SeverityBand | null;
  severityResolutionSource: Rule4SeverityResolutionSource;
  bindingStatus: 'BOUND' | 'NOT_EVALUATED' | 'LEAKAGE_BLOCKED';
  evidenceItemIds: readonly string[];
  corroboratingSourceIds: readonly string[];
  selectedCascade: null;
  selectedDilution: null;
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
  /** Phase 6 upstream audit boundary — not potency eligibility. Excluded from severity fingerprint v1. */
  upstreamContextStatus: Rule4UpstreamContextStatus;
};

export type Rule4SeverityAdapterOutput = {
  contractVersion: string;
  rulesetVersion: string;
  registryVersion: string;
  executionStatus: 'NOT_IMPLEMENTED';
  automaticSeverityRuntime: false;
  automaticFreeTextSeverityRuntime: false;
  automaticLabVitalSeverityRuntime: false;
  automaticPotencyRuntime: false;
  automaticPrescriptionIssuanceRuntime: false;
  prescriptionIssueAllowed: false;
  currentRuntimePotencyDelta: 'NONE';
  finalDoctorApprovalRequired: true;
  registryQ13SelectorStatus: 'NOT_EXECUTABLE_AS_Q13_SELECTOR';
  slotResolutions: readonly Rule4SlotSeverityResolution[];
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
  deterministicSeverityResolutionFingerprint: string;
};

export type Rule4SeverityEvaluationContext = {
  safetyGate?: Rule4SafetyGateOutput | null;
  evidenceAdapter?: Rule4EvidenceAdapterOutput | null;
  polarityRouting?: Rule4PolarityAdapterOutput | null;
  phaseResolution?: Rule4PhaseAdapterOutput | null;
  bindingGateMandatory?: boolean;
};
