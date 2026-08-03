import type { Rule4EvidenceAdapterOutput } from '../evidence/types.js';
import type { Rule4PhaseAdapterOutput } from '../phase/types.js';
import type { Rule4PhaseTargetRole } from '../phase/types.js';
import type { Rule4PolarityAdapterOutput } from '../polarity/types.js';
import type { Rule4SafetyGateOutput } from '../output.js';
import type { Rule4SeverityAdapterOutput } from '../severity/types.js';

export const RULE4_GATE_OUTCOME_VALUES = [
  'PASS',
  'FAIL',
  'NOT_EVALUATED',
  'MISSING_INPUT',
  'NON_EXECUTABLE_PENDING_FREEZE',
  'BLOCKED_BY_SAFETY',
  'BLOCKED_BY_UPSTREAM',
  'CONTRADICTORY',
] as const;

export type Rule4GateOutcome = (typeof RULE4_GATE_OUTCOME_VALUES)[number];

export const RULE4_ELIGIBILITY_STATUS_VALUES = [
  'NOT_EVALUATED',
  'NON_POTENCY',
  'BLOCKED_BY_SAFETY',
  'BLOCKED_BY_UPSTREAM',
  'NO_FAMILY_ELIGIBLE',
  'FAMILY_ELIGIBLE',
] as const;

export type Rule4EligibilityStatus = (typeof RULE4_ELIGIBILITY_STATUS_VALUES)[number];

export const RULE4_CANDIDATE_FAMILY_VALUES = [
  'NONE',
  'D1_ELIGIBLE',
  'D2_ELIGIBLE',
  'BOTH_D1_D2_ELIGIBLE',
  'D3_D5_FAMILY_ELIGIBLE',
  'D10_FAMILY_ELIGIBLE',
  'D30_FAMILY_ELIGIBLE',
  'D60_FAMILY_ELIGIBLE',
  'D60_D10_FALLBACK_READY',
] as const;

export type Rule4CandidateFamily = (typeof RULE4_CANDIDATE_FAMILY_VALUES)[number];

export type Rule4GateResult = {
  gateId: string;
  outcome: Rule4GateOutcome;
  evidenceItemIds: readonly string[];
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
};

export type Rule4FormulaBpReading = {
  formulaSlotId: string;
  formulaTargetId: string;
  systolicMmHg: number;
  diastolicMmHg: number;
  unit: 'mmHg';
  verificationStatus: 'VERIFIED' | 'MISSING' | 'INVALID' | 'UNRESOLVED' | 'CONTRADICTORY';
  readingRole: 'CURRENT' | 'REPEATED_CONFIRMED';
  evidenceItemId: string | null;
  organTargetBindingStatus: 'BOUND' | 'MISSING' | 'MISMATCH';
  cardiacTargetClass: 'CARDIAC' | 'VASCULAR' | 'BP_REGULATION' | 'NOT_APPLICABLE' | null;
};

export type Rule4StructuredSensitivityGate = {
  executableStatus: 'PASS' | 'FAIL' | 'MISSING_INPUT' | 'NON_EXECUTABLE_PENDING_FREEZE';
  closeD05QualifiesD5: boolean | null;
  evidenceItemIds: readonly string[];
};

export type Rule4StructuredPathologyClassGate = {
  tier3MappingStatus: 'PENDING' | 'VERIFIED_STRUCTURED' | 'MISSING';
  authority: 'INDEPENDENT_VERIFIED' | 'TIER3_SUGGESTIVE_ONLY' | 'NONE';
  nervousClassVerified: boolean | null;
  recurrentClassVerified: boolean | null;
  functionalClassVerified: boolean | null;
  formulaSpecificPathologyResolved: boolean | null;
  evidenceItemIds: readonly string[];
};

export type Rule4StructuredForceEvidenceGate = {
  pass: boolean;
  evidenceItemIds: readonly string[];
};

export type Rule4D30fStructuredBundle = {
  complete: boolean;
  pathwayAStage2Bp: boolean | null;
  pathwayBHighSeverityManifestation: boolean | null;
  evidenceItemIds: readonly string[];
};

export type Rule4D60StructuredBundle = {
  tripleGatePass: boolean | null;
  extremeHypersensitivityVerified: boolean | null;
  deepChronicPhaseVerified: boolean | null;
  dayBandDays: number | null;
  evidenceItemIds: readonly string[];
};

export type Rule4D60FallbackStructured = {
  ready: boolean;
  evidenceItemIds: readonly string[];
};

export type Rule4CommonGateBundle = {
  negComplete: boolean;
  posComplete: boolean;
  organSystemResolved: boolean;
  evidenceItemIds: readonly string[];
};

export type Rule4FormulaEligibilityRecord = {
  formulaSlotId: string;
  formulaTargetId: string;
  targetRole: Rule4PhaseTargetRole;
  structuredSensitivity?: Rule4StructuredSensitivityGate | null;
  structuredPathology?: Rule4StructuredPathologyClassGate | null;
  structuredHypofunctionEvidence?: Rule4StructuredForceEvidenceGate | null;
  structuredModeratingForceEvidence?: Rule4StructuredForceEvidenceGate | null;
  formulaBpReading?: Rule4FormulaBpReading | null;
  d30fStructuredBundle?: Rule4D30fStructuredBundle | null;
  d60StructuredBundle?: Rule4D60StructuredBundle | null;
  d60FallbackStructured?: Rule4D60FallbackStructured | null;
  d10PathVariant?: 'PATH_B' | 'PATH_C' | null;
  commonGateBundle?: Rule4CommonGateBundle | null;
};

export type Rule4EligibilityAdapterInput = {
  contractVersion: string;
  rulesetVersion: string;
  registryVersion: string;
  label: 'SYNTHETIC' | 'PRODUCTION';
  trustedSyntheticEligibilityBypass?: boolean;
  formulaSlotIds: readonly string[];
  formulaEligibilityRecords: readonly Rule4FormulaEligibilityRecord[];
  quarantineProbe?: Record<string, boolean>;
};

export type Rule4SlotEligibilityResolution = {
  formulaSlotId: string;
  formulaTargetId: string | null;
  targetRole: Rule4PhaseTargetRole;
  eligibilityStatus: Rule4EligibilityStatus;
  candidateFamily: Rule4CandidateFamily;
  eligibleFamilyOptions: readonly Rule4CandidateFamily[];
  familyGateStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE';
  gateResults: readonly Rule4GateResult[];
  blockingGateCodes: readonly string[];
  selectionStatus: 'NOT_STARTED';
  selectedCascade: null;
  selectedDilution: null;
  upstreamContextStatus: string;
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
};

export type Rule4EligibilityAdapterOutput = {
  contractVersion: string;
  rulesetVersion: string;
  registryVersion: string;
  executionStatus: 'NOT_IMPLEMENTED';
  automaticPotencyRuntime: false;
  automaticPrescriptionIssuanceRuntime: false;
  prescriptionIssueAllowed: false;
  currentRuntimePotencyDelta: 'NONE';
  finalDoctorApprovalRequired: true;
  selectionStatus: 'NOT_STARTED';
  slotResolutions: readonly Rule4SlotEligibilityResolution[];
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
  deterministicCandidateEligibilityFingerprint: string;
};

export type Rule4EligibilityEvaluationContext = {
  safetyGate?: Rule4SafetyGateOutput | null;
  evidenceAdapter?: Rule4EvidenceAdapterOutput | null;
  polarityRouting?: Rule4PolarityAdapterOutput | null;
  phaseResolution?: Rule4PhaseAdapterOutput | null;
  severityResolution?: Rule4SeverityAdapterOutput | null;
  bindingGateMandatory?: boolean;
};
