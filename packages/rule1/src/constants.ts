export const RULE1_OUTCOMES = Object.freeze([
  'NOT_APPLICABLE',
  'NOT_EVALUABLE',
  'ADDITIONAL_INFORMATION_REQUIRED',
  'UNRESOLVED_TIE',
  'UNRESOLVED_EVIDENCE',
  'SHADOW_TEMPERAMENT_INDICATION_PROPOSED',
  'BLOCKED_BY_RULE8_CONTRADICTION',
] as const);

export type Rule1Outcome = (typeof RULE1_OUTCOMES)[number];

export const RULE1_FAILURE_CODES = Object.freeze([
  'INVALID_INPUT',
  'UNSUPPORTED_CONTRACT_VERSION',
  'INVALID_EVIDENCE_REGISTRY',
  'CONTRADICTORY_INPUT_STATE',
  'INTERNAL_FAILURE',
] as const);

export type Rule1FailureCode = (typeof RULE1_FAILURE_CODES)[number];

export const RULE1_TEMPERAMENT_TOKENS = Object.freeze([
  'LYMPHATIC',
  'SANGUINE',
  'BILIOUS_HEPATIC',
  'NERVOUS',
  'MIXED',
  'UNKNOWN',
] as const);

export type Rule1TemperamentToken = (typeof RULE1_TEMPERAMENT_TOKENS)[number];

export const RULE1_RESOLUTION_STATES = Object.freeze([
  'OK',
  'ADDITIONAL_INFORMATION_REQUIRED',
  'UNRESOLVED_TIE',
  'FOLLOW_UP_NOT_USED',
  'NOT_EVALUABLE',
  'UNRESOLVED_EVIDENCE',
] as const);

export type Rule1ResolutionState = (typeof RULE1_RESOLUTION_STATES)[number];

export const RULE1_RULE8_COMPARISON_STATES = Object.freeze([
  'NOT_SUPPLIED',
  'UNAVAILABLE',
  'NOT_COMPARED',
  'CONSISTENT',
  'CONFLICT',
  'UNRESOLVED',
] as const);

export type Rule1Rule8ComparisonState = (typeof RULE1_RULE8_COMPARISON_STATES)[number];

export const RULE1_LIFECYCLE_CLASSES = Object.freeze([
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

export type Rule1LifecycleClass = (typeof RULE1_LIFECYCLE_CLASSES)[number];

/** Blocking / non-activating lifecycle classes for positive indication. */
export const RULE1_BLOCKING_LIFECYCLE = Object.freeze([
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

export const RULE1_EVIDENCE_KINDS = Object.freeze([
  'SYMPTOM_OR_OBSERVATION',
  'CLINICIAN_OBSERVED_SIGN',
  'OTHER_NON_BP',
  'BP_SUPPORT',
  'PHOTO_SUPPORT',
] as const);

export type Rule1EvidenceKind = (typeof RULE1_EVIDENCE_KINDS)[number];

export const RULE1_INPUT_KEY_ORDER = Object.freeze([
  'contractVersion',
  'requestId',
  'caseTemperamentEvidenceRegistry',
  'doctorSuppliedEvidenceItems',
  'bloodPressureEvidence',
  'photoEvidenceRef',
  'bloodLymphAxisContext',
  'rule8ComparisonRef',
  'evidenceDataVersions',
  'upstreamApplicability',
] as const);

export const RULE1_OUTPUT_KEY_ORDER = Object.freeze([
  'contractVersion',
  'ruleNumber',
  'ruleIdentity',
  'requestId',
  'status',
  'applicability',
  'primaryTemperament',
  'secondaryTemperament',
  'mixedComponents',
  'resolutionState',
  'doshaMapping',
  'evidenceGaps',
  'reasonCodes',
  'blockersOrUnresolvedEvidence',
  'rule8ComparisonState',
  'deterministicFingerprint',
  'shadowOnly',
  'clinicalActivation',
  'medicineSelectionInfluence',
  'prescriptionEffect',
] as const);

export const RULE1_EVIDENCE_ENTRY_KEY_ORDER = Object.freeze([
  'entryId',
  'temperamentToken',
  'evidenceKind',
  'supportUnits',
  'contradictionMarkers',
  'evidenceSourceId',
  'evidenceValidationStatus',
  'ownerClinicalApprovalStatus',
  'version',
  'effectiveStatus',
  'supersessionMetadata',
  'testClassification',
  'biliousSecondaryRequired',
] as const);

export const RULE1_DOCTOR_ITEM_KEY_ORDER = Object.freeze(['itemId', 'evidenceClass'] as const);

export const RULE1_SYNTHETIC_TEST_CLASSIFICATION = 'SYNTHETIC_TEST_ONLY' as const;

export const RULE1_REASON_CODES = Object.freeze({
  NO_EVIDENCE: 'R1_NO_EVIDENCE',
  ADDITIONAL_INFORMATION_REQUIRED: 'R1_ADDITIONAL_INFORMATION_REQUIRED',
  BP_ALONE_INSUFFICIENT: 'R1_BP_ALONE_INSUFFICIENT',
  PHOTO_ALONE_INSUFFICIENT: 'R1_PHOTO_ALONE_INSUFFICIENT',
  EVIDENCE_NON_ACTIVATING: 'R1_EVIDENCE_NON_ACTIVATING',
  EVIDENCE_BLOCKING_LIFECYCLE: 'R1_EVIDENCE_BLOCKING_LIFECYCLE',
  CONTRADICTORY_EVIDENCE: 'R1_CONTRADICTORY_EVIDENCE',
  UNRESOLVED_TIE: 'R1_UNRESOLVED_TIE',
  BILIOUS_SECONDARY_UNRESOLVED: 'R1_BILIOUS_SECONDARY_UNRESOLVED',
  RULE8_CONFLICT: 'R1_RULE8_CONFLICT',
  RULE8_NOT_SUPPLIED: 'R1_RULE8_NOT_SUPPLIED',
  UPSTREAM_NOT_APPLICABLE: 'R1_UPSTREAM_NOT_APPLICABLE',
  UPSTREAM_NOT_EVALUABLE: 'R1_UPSTREAM_NOT_EVALUABLE',
  FORBIDDEN_EVIDENCE_SOURCE: 'R1_FORBIDDEN_EVIDENCE_SOURCE',
  ELIGIBLE_BY_APPROVED_SYNTHETIC_EVIDENCE: 'R1_ELIGIBLE_BY_APPROVED_SYNTHETIC_EVIDENCE',
  NO_QUESTION_BANK: 'R1_NO_QUESTION_BANK',
} as const);

/** Frozen BP supporting weights (owner-approved; do not invent additional thresholds). */
export const RULE1_BP_SANGUINE_SYSTOLIC_MIN = 140 as const;
export const RULE1_BP_SANGUINE_SUPPORT = 3 as const;
export const RULE1_BP_LYMPHATIC_SYSTOLIC_MAX_EXCLUSIVE = 100 as const;
export const RULE1_BP_LYMPHATIC_SUPPORT = 2 as const;

/** Production real symptom/case→temperament mapping registry remains empty. */
export const RULE1_PRODUCTION_MAPPING_REGISTRY = Object.freeze({
  registryVersion: 'production-empty-v0',
  entries: Object.freeze([] as const),
  activeRealMappingCount: 0 as const,
});
