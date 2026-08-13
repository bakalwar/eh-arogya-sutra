export const RULE8_OUTCOMES = Object.freeze([
  'NOT_APPLICABLE',
  'NOT_EVALUABLE',
  'NOT_CLINICALLY_INDICATED',
  'SHADOW_PRAKRUTI_INDICATIONS_PROPOSED',
  'BLOCKED_BY_RULE1_CONTRADICTION',
  'UNRESOLVED_EVIDENCE',
] as const);

export type Rule8Outcome = (typeof RULE8_OUTCOMES)[number];

export const RULE8_FAILURE_CODES = Object.freeze([
  'INVALID_INPUT',
  'INVALID_EVIDENCE_REGISTRY',
  'UNSUPPORTED_CONTRACT_VERSION',
  'CONTRADICTORY_UPSTREAM_STATE',
  'INTERNAL_FAILURE',
] as const);

export type Rule8FailureCode = (typeof RULE8_FAILURE_CODES)[number];

export const RULE8_ELIGIBILITY_STATES = Object.freeze([
  'ELIGIBLE',
  'REJECTED',
  'UNRESOLVED',
  'EVIDENCE_INSUFFICIENT',
] as const);

export type Rule8EligibilityState = (typeof RULE8_ELIGIBILITY_STATES)[number];

export const RULE8_RULE1_COMPARISON_STATES = Object.freeze([
  'NOT_COMPARED',
  'UNAVAILABLE',
  'CONSISTENT',
  'CONFLICT',
  'UNRESOLVED',
] as const);

export type Rule8Rule1ComparisonState = (typeof RULE8_RULE1_COMPARISON_STATES)[number];

export const RULE8_INPUT_KEY_ORDER = Object.freeze([
  'contractVersion',
  'requestId',
  'diseaseConditionRefs',
  'rule1TemperamentRef',
  'prakritiEvidenceRegistry',
  'evidenceDataVersions',
  'upstreamApplicability',
] as const);

export const RULE8_OUTPUT_KEY_ORDER = Object.freeze([
  'contractVersion',
  'ruleNumber',
  'ruleIdentity',
  'requestId',
  'status',
  'applicability',
  'evaluatedDiseaseRefs',
  'prakritiIndications',
  'notClinicallyIndicated',
  'rule1ComparisonState',
  'evidenceRefs',
  'reasonCodes',
  'blockersOrUnresolvedEvidence',
  'deterministicFingerprint',
  'shadowOnly',
  'clinicalActivation',
  'medicineSelectionInfluence',
  'notRequiredForPrescription',
] as const);

/** Closed indication field order (§6.2). */
export const RULE8_INDICATION_KEY_ORDER = Object.freeze([
  'indicationId',
  'diseaseConditionRef',
  'prakritiCategoryRef',
  'eligibilityState',
  'evidenceRefs',
  'reasonCodes',
] as const);

/** Prakriti evidence entry field order (registry record). */
export const RULE8_PRAKRITI_EVIDENCE_KEY_ORDER = Object.freeze([
  'entryId',
  'diseaseConditionRef',
  'prakritiCategoryRef',
  'applicabilityConditions',
  'contradictionMarkers',
  'evidenceSourceId',
  'evidenceValidationStatus',
  'ownerClinicalApprovalStatus',
  'version',
  'effectiveStatus',
  'supersessionMetadata',
  'testClassification',
] as const);

export const RULE8_NON_ACTIVATING_EVIDENCE_STATES = Object.freeze([
  'draft',
  'inventory-only',
  'queued-for-validation',
  'under-review',
  'submitted',
  'unvalidated',
  'disputed',
  'stale',
  'superseded',
  'missing-evidence',
  'owner-unapproved',
  'inactive',
] as const);

/** Only this classification may participate in positive synthetic shadow indication. */
export const RULE8_SYNTHETIC_TEST_CLASSIFICATION = 'explicitly-synthetic-fixture' as const;

export const RULE8_REASON_CODES = Object.freeze({
  EVIDENCE_INSUFFICIENT: 'R8_EVIDENCE_INSUFFICIENT',
  EVIDENCE_NON_ACTIVATING: 'R8_EVIDENCE_NON_ACTIVATING',
  EVIDENCE_MISSING: 'R8_EVIDENCE_MISSING',
  CONTRADICTORY_EVIDENCE: 'R8_CONTRADICTORY_EVIDENCE',
  DISEASE_MISMATCH: 'R8_DISEASE_MISMATCH',
  UPSTREAM_NOT_EVALUABLE: 'R8_UPSTREAM_NOT_EVALUABLE',
  UPSTREAM_NOT_APPLICABLE: 'R8_UPSTREAM_NOT_APPLICABLE',
  RULE1_CONFLICT: 'R8_RULE1_CONFLICT',
  RULE1_UNAVAILABLE: 'R8_RULE1_UNAVAILABLE',
  RULE1_NOT_COMPARED: 'R8_RULE1_NOT_COMPARED',
  ELIGIBLE_BY_APPROVED_SYNTHETIC_EVIDENCE: 'R8_ELIGIBLE_BY_APPROVED_SYNTHETIC_EVIDENCE',
  NOT_CLINICALLY_INDICATED: 'R8_NOT_CLINICALLY_INDICATED',
  NON_SYNTHETIC_CLASSIFICATION: 'R8_NON_SYNTHETIC_CLASSIFICATION',
} as const);

/** Production real disease→prakriti mapping registry remains empty. */
export const RULE8_PRODUCTION_MAPPING_REGISTRY = Object.freeze({
  registryVersion: 'production-empty-v0',
  entries: Object.freeze([] as const),
});
