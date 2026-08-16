export const RULE3_OUTCOMES = Object.freeze([
  'NOT_APPLICABLE',
  'NOT_EVALUABLE',
  'ADDITIONAL_INFORMATION_REQUIRED',
  'UNRESOLVED_EVIDENCE',
  'DOCTOR_REVIEW_REQUIRED',
  'SHADOW_ORGAN_SYSTEM_ANNOTATIONS_PROPOSED',
  'BLOCKED_BY_CONTRADICTION',
] as const);

export type Rule3Outcome = (typeof RULE3_OUTCOMES)[number];

export const RULE3_FAILURE_CODES = Object.freeze([
  'INVALID_INPUT',
  'UNSUPPORTED_CONTRACT_VERSION',
  'INVALID_EVIDENCE_REGISTRY',
  'CONTRADICTORY_INPUT_STATE',
  'INTERNAL_FAILURE',
] as const);

export type Rule3FailureCode = (typeof RULE3_FAILURE_CODES)[number];

export const RULE3_SYSTEM_ROLES = Object.freeze([
  'PRIMARY',
  'SECONDARY',
  'CANDIDATE',
  'CO_INVOLVEMENT_CANDIDATE',
] as const);

export type Rule3SystemRole = (typeof RULE3_SYSTEM_ROLES)[number];

export const RULE3_VERIFICATION_STATUSES = Object.freeze([
  'VERIFIED',
  'UNVERIFIED',
  'LOW_CONFIDENCE_CANDIDATE',
] as const);

export type Rule3VerificationStatus = (typeof RULE3_VERIFICATION_STATUSES)[number];

export const RULE3_INDICATION_STATUSES = Object.freeze([
  'NOT_APPLICABLE',
  'UNRESOLVED',
  'CANDIDATE_ONLY',
  'SHADOW_ACTIVE_TECHNICAL',
  'BLOCKED_CONTRADICTION',
] as const);

export type Rule3IndicationStatus = (typeof RULE3_INDICATION_STATUSES)[number];

export const RULE3_DETECTION_METHOD_CLASSES = Object.freeze([
  'CHIEF_COMPLAINT_ANCHOR',
  'STRUCTURED_SUPPORTING',
  'VERIFIED_REPORT_ISOLATED',
  'VERIFIED_LOCAL_IMAGE_SUPPORT',
  'KEYWORD_LOW_CONFIDENCE',
  'CO_INVOLVEMENT_CANDIDATE',
  'HYBRID_TECHNICAL',
  'SYNTHETIC_TEST_ONLY',
] as const);

export type Rule3DetectionMethodClass = (typeof RULE3_DETECTION_METHOD_CLASSES)[number];

export const RULE3_LIFECYCLE_CLASSES = Object.freeze([
  'INVENTORY',
  'SUBMITTED',
  'UNDER_REVIEW',
  'TECHNICALLY_SCHEMA_VALID',
  'EVIDENCE_VALIDATED',
  'OWNER_APPROVED',
  'APPROVED_AND_ACTIVE',
  'STALE',
  'DISPUTED',
  'SUPERSEDED',
  'SYNTHETIC_TEST_ONLY',
] as const);

export type Rule3LifecycleClass = (typeof RULE3_LIFECYCLE_CLASSES)[number];

/** Blocking / non-activating lifecycle classes for synthetic technical positive. */
export const RULE3_BLOCKING_LIFECYCLE = Object.freeze([
  'INVENTORY',
  'SUBMITTED',
  'UNDER_REVIEW',
  'TECHNICALLY_SCHEMA_VALID',
  'EVIDENCE_VALIDATED',
  'OWNER_APPROVED',
  'STALE',
  'DISPUTED',
  'SUPERSEDED',
] as const);

export const RULE3_INPUT_KEY_ORDER = Object.freeze([
  'contractVersion',
  'requestId',
  'organSystemAffinityEvidenceRegistry',
  'orderedEvidenceBindingRefs',
  'doctorSuppliedStructuredEvidenceItems',
  'caseOrganSystemSummary',
  'structuredFindingRefs',
  'evidenceDataVersions',
  'upstreamApplicability',
] as const);

export const RULE3_REGISTRY_KEY_ORDER = Object.freeze([
  'registryVersion',
  'entries',
  'activeRealMappingCount',
] as const);

export const RULE3_EVIDENCE_ENTRY_KEY_ORDER = Object.freeze([
  'entryId',
  'bindingRefId',
  'organSystemToken',
  'systemRole',
  'verificationStatus',
  'detectionMethodClass',
  'evidenceSourceId',
  'evidenceValidationStatus',
  'ownerClinicalApprovalStatus',
  'version',
  'effectiveStatus',
  'testClassification',
] as const);

export const RULE3_OUTPUT_KEY_ORDER = Object.freeze([
  'contractVersion',
  'ruleNumber',
  'ruleIdentity',
  'requestId',
  'status',
  'applicability',
  'organSystemAnnotations',
  'caseOrganSystemSummary',
  'evidenceGaps',
  'reasonCodes',
  'blockersOrUnresolvedEvidence',
  'doctorReviewRequired',
  'deterministicFingerprint',
  'shadowOnly',
  'formulaMutation',
  'medicineSelectionInfluence',
  'clinicalActivation',
  'prescriptionEffect',
] as const);

export const RULE3_ANNOTATION_KEY_ORDER = Object.freeze([
  'organSystemIndicationId',
  'bindingRefId',
  'organSystemToken',
  'systemRole',
  'indicationStatus',
  'verificationStatus',
  'detectionMethodClass',
  'unresolvedReason',
  'doctorReviewRequired',
  'evidenceGaps',
  'reasonCodes',
] as const);

export const RULE3_BINDING_REF_KEY_ORDER = Object.freeze(['bindingRefId'] as const);

export const RULE3_DOCTOR_ITEM_KEY_ORDER = Object.freeze([
  'itemId',
  'bindingRefId',
  'evidenceClass',
] as const);

export const RULE3_FINDING_REF_KEY_ORDER = Object.freeze(['findingRefId', 'bindingRefId'] as const);

export const RULE3_SYNTHETIC_TEST_CLASSIFICATION = 'SYNTHETIC_TEST_ONLY' as const;

export const RULE3_UNRESOLVED_REASON = 'INSUFFICIENT_ORGAN_SYSTEM_EVIDENCE' as const;

export const RULE3_SYS_SYN_RE = /^SYS_SYN_[A-Za-z0-9][A-Za-z0-9._:-]{0,120}$/;
export const RULE3_EVID_SYN_RE = /^EVID_SYN_[A-Za-z0-9][A-Za-z0-9._:-]{0,120}$/;

export const RULE3_REASON_CODES = Object.freeze({
  NO_EVIDENCE: 'R3_NO_EVIDENCE',
  ADDITIONAL_INFORMATION_REQUIRED: 'R3_ADDITIONAL_INFORMATION_REQUIRED',
  EVIDENCE_NON_ACTIVATING: 'R3_EVIDENCE_NON_ACTIVATING',
  EVIDENCE_BLOCKING_LIFECYCLE: 'R3_EVIDENCE_BLOCKING_LIFECYCLE',
  CONTRADICTORY_BINDING_EVIDENCE: 'R3_CONTRADICTORY_BINDING_EVIDENCE',
  UPSTREAM_NOT_APPLICABLE: 'R3_UPSTREAM_NOT_APPLICABLE',
  UPSTREAM_NOT_EVALUABLE: 'R3_UPSTREAM_NOT_EVALUABLE',
  FORBIDDEN_EVIDENCE_SOURCE: 'R3_FORBIDDEN_EVIDENCE_SOURCE',
  KEYWORD_LOW_CONFIDENCE_CANDIDATE: 'R3_KEYWORD_LOW_CONFIDENCE_CANDIDATE',
  CO_INVOLVEMENT_CANDIDATE_ONLY: 'R3_CO_INVOLVEMENT_CANDIDATE_ONLY',
  CANDIDATE_ONLY: 'R3_CANDIDATE_ONLY',
  ELIGIBLE_BY_APPROVED_SYNTHETIC_EVIDENCE: 'R3_ELIGIBLE_BY_APPROVED_SYNTHETIC_EVIDENCE',
  CASE_SUMMARY_MUST_NOT_DRIVE_SELECTION: 'R3_CASE_SUMMARY_MUST_NOT_DRIVE_SELECTION',
  BINDING_ORDER_PRESERVED: 'R3_BINDING_ORDER_PRESERVED',
  CATALOG_NOT_CREATED: 'R3_CATALOG_NOT_CREATED',
  UNKNOWN_REAL_TOKEN_REJECTED: 'R3_UNKNOWN_REAL_TOKEN_REJECTED',
  EMPTY_ACTIVE_ANNOTATIONS: 'R3_EMPTY_ACTIVE_ANNOTATIONS',
} as const);

/** Production real organ-system mapping registry remains empty. */
export const RULE3_PRODUCTION_MAPPING_REGISTRY = Object.freeze({
  registryVersion: 'production-empty-v0',
  entries: Object.freeze([] as const),
  activeRealMappingCount: 0 as const,
});
