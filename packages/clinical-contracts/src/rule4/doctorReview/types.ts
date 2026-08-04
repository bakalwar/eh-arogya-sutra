export const RULE4_DOCTOR_ACTION_VALUES = [
  'APPROVE',
  'MODIFY',
  'EXCLUDE_UNRESOLVED_SLOT',
  'REJECT',
  'REQUEST_REASSESSMENT',
] as const;

export type Rule4DoctorAction = (typeof RULE4_DOCTOR_ACTION_VALUES)[number];

export const RULE4_PHASE3_REVIEW_STATE_VALUES = [
  'GENERATED_PENDING_REVIEW',
  'NEEDS_CLARIFICATION',
  'ACCEPTED',
  'MODIFIED',
  'REJECTED',
  'ISSUED',
  'SUPERSEDED',
] as const;

export type Rule4Phase3ReviewState = (typeof RULE4_PHASE3_REVIEW_STATE_VALUES)[number];

export const RULE4_DOCTOR_REVIEW_STATUS_VALUES = [
  'NOT_EVALUATED',
  'REVIEW_RECORDED',
  'REVALIDATION_REQUIRED',
  'REJECTED',
  'REASSESSMENT_REQUIRED',
  'BLOCKED',
] as const;

export type Rule4DoctorReviewStatus = (typeof RULE4_DOCTOR_REVIEW_STATUS_VALUES)[number];

export const RULE4_ISSUANCE_ELIGIBILITY_STATUS_VALUES = [
  'NOT_EVALUATED',
  'ISSUANCE_ELIGIBLE',
  'ISSUANCE_BLOCKED',
  'REVALIDATION_REQUIRED',
  'REJECTED',
  'REASSESSMENT_REQUIRED',
] as const;

export type Rule4IssuanceEligibilityStatus =
  (typeof RULE4_ISSUANCE_ELIGIBILITY_STATUS_VALUES)[number];

export const RULE4_GATE_OUTCOME_VALUES = [
  'PASS',
  'FAIL',
  'MISSING_INPUT',
  'NOT_EVALUATED',
  'CONTRADICTORY',
  'BLOCKED',
  'NOT_CONNECTED',
] as const;

export type Rule4GateOutcome = (typeof RULE4_GATE_OUTCOME_VALUES)[number];

export const RULE4_ENGINE_REVALIDATION_STATUS_VALUES = [
  'NOT_REQUIRED',
  'REQUIRED_PENDING',
  'PASSED',
  'FAILED',
] as const;

export type Rule4EngineRevalidationStatus =
  (typeof RULE4_ENGINE_REVALIDATION_STATUS_VALUES)[number];

export const RULE4_ISSUANCE_GATE_IDS = [
  'FINAL_DOCTOR_APPROVAL',
  'GATE_REVALIDATION',
  'Q18_E_HOLDS',
  'Q06C_CRISIS',
  'D13_HS',
  'Q15_PATIENT_HOLD',
  'RULE3_ISSUE_FLAG',
  'RULE4_STRICT_FINAL',
  'D13_RESTRICT_D13D',
  'PEDIATRIC_OVERLAY_COMPLETE',
  'EVIDENCE_CURRENT',
  'SUMMARY_FP_MATCH',
  'FORMULA_ISOLATION',
  'REGISTRY_RULESET',
  'TENANT_AUTH',
  'LEGACY_QUARANTINE',
  'PROFESSIONAL_REGISTRATION',
] as const;

export type Rule4IssuanceGateId = (typeof RULE4_ISSUANCE_GATE_IDS)[number];

export type Rule4IssuanceGateResult = {
  gateId: Rule4IssuanceGateId;
  outcome: Rule4GateOutcome;
  reasonCodes: readonly string[];
};

export type Rule4ReviewerAuthority = {
  doctorId: string;
  organizationId: string;
  clinicId: string;
  consultationId: string;
  actorRole: string;
  activeMembership: boolean;
  treatingDoctorBound: boolean;
  sessionAuthenticated: boolean;
  reviewTimestamp: string;
  professionalRegistrationVerified?: boolean;
};

export type Rule4DraftAuthenticityBundle = {
  draftVersion: string;
  draftContentHash: string;
  slotManifestFingerprint: string;
  evidenceFingerprint: string;
  polarityFingerprint: string;
  phaseFingerprint: string;
  severityFingerprint: string;
  eligibilityFingerprint: string;
  selectionFingerprint: string;
  pediatricFingerprint: string;
  clinicalSummaryFingerprint: string;
  rulesetVersion: string;
  registryVersion: string;
};

export type Rule4DraftAuthenticityExpected = Rule4DraftAuthenticityBundle;

export type Rule4SlotManifestEntry = {
  formulaSlotId: string;
  formulaTargetId: string;
  medicated: boolean;
  slotPotencyStatus: string;
  selectedDilution: string | null;
};

export type Rule4ModificationEnvelope = {
  originalDraftFingerprint: string;
  proposedDraftVersion: string;
  justification: string;
  changes: readonly Record<string, unknown>[];
};

export type Rule4IdempotencyContext = {
  idempotencyKey?: string | null;
  requestHash?: string | null;
  expectedDraftVersion?: string | null;
  priorRequestHash?: string | null;
  priorDecisionHash?: string | null;
};

export type Rule4UpstreamShadowSnapshot = {
  d13HardStopActive?: boolean;
  patientWideHold?: boolean;
  urgentEscalationRequired?: boolean;
  rule3PrescriptionIssueAllowed?: boolean;
  pediatricProhibitActive?: boolean;
  phase8AuthFailed?: boolean;
  unresolvedMedicatedSlot?: boolean;
  d13RestrictJustificationMissing?: boolean;
  formulaIsolationFailed?: boolean;
  registryQuarantine?: boolean;
  legacyAuthorityAttempt?: boolean;
  rulesetRegistryMismatch?: boolean;
  engineRevalidationStatus?: Rule4EngineRevalidationStatus;
  slotManifestChange?: 'ADDED' | 'REMOVED' | null;
  priorApprovedDraftVersion?: string | null;
};

export type Rule4ExpectedReviewerBinding = {
  consultationId: string;
  doctorId: string;
  organizationId: string;
  clinicId: string;
};

export type Rule4DoctorReviewEvaluationContext = {
  expectedAuthenticity?: Rule4DraftAuthenticityExpected | null;
  expectedReviewerBinding?: Rule4ExpectedReviewerBinding | null;
  priorApprovedAuthenticity?: Rule4DraftAuthenticityBundle | null;
  upstream?: Rule4UpstreamShadowSnapshot | null;
  idempotency?: Rule4IdempotencyContext | null;
};

export type Rule4DoctorReviewAdapterInput = {
  contractVersion: string;
  rulesetVersion: string;
  registryVersion: string;
  label: 'SYNTHETIC' | 'PRODUCTION';
  consultationId: string;
  draftVersion: string;
  slotManifest: readonly Rule4SlotManifestEntry[];
  doctorAction: Rule4DoctorAction;
  reviewerAuthority: Rule4ReviewerAuthority;
  draftAuthenticity: Rule4DraftAuthenticityBundle;
  modificationEnvelope?: Rule4ModificationEnvelope | null;
  excludeSlotIds?: readonly string[] | null;
};

export type Rule4DoctorReviewAdapterOutput = {
  contractVersion: string;
  rulesetVersion: string;
  registryVersion: string;
  executionStatus: 'NOT_IMPLEMENTED';
  automaticIssuanceRuntime: false;
  automaticPrescriptionIssuanceRuntime: false;
  prescriptionIssueAllowed: false;
  finalDoctorApprovalRequired: true;
  currentRuntimeIssuanceDelta: 'NONE';
  doctorReviewStatus: Rule4DoctorReviewStatus;
  issuanceEligibilityStatus: Rule4IssuanceEligibilityStatus;
  phase3ReviewState: Rule4Phase3ReviewState;
  engineRevalidationStatus: Rule4EngineRevalidationStatus;
  issuanceGateResults: readonly Rule4IssuanceGateResult[];
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
  deterministicDoctorReviewFingerprint: string;
  idempotencyReplay: boolean;
  shadowAuditEvents: readonly (Rule4ReviewAuditEvent & { auditEventFingerprint: string })[];
};

export type Rule4ReviewAuditEventType =
  | 'REVIEW_OPENED'
  | 'APPROVAL_RECORDED'
  | 'MODIFICATION_PROPOSED'
  | 'REVALIDATION_REQUIRED'
  | 'REVALIDATION_PASSED'
  | 'REVALIDATION_FAILED'
  | 'APPROVAL_SUPERSEDED'
  | 'ISSUANCE_ELIGIBILITY_EVALUATED'
  | 'ISSUANCE_BLOCKED'
  | 'REVIEW_REJECTED'
  | 'REASSESSMENT_REQUESTED';

export type Rule4ReviewAuditEvent = {
  eventType: Rule4ReviewAuditEventType;
  consultationId: string;
  draftVersion: string;
  doctorId: string;
  organizationId: string;
  clinicId: string;
  timestamp: string;
  decisionFingerprint: string;
  reasonCodes: readonly string[];
};
