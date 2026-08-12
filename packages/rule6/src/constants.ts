export const RULE6_OUTCOMES = Object.freeze([
  'NOT_APPLICABLE',
  'NOT_EVALUABLE',
  'EVALUATED_NO_ELIGIBLE_CANDIDATE',
  'SHADOW_CANDIDATES_PROPOSED',
  'BLOCKED_BY_SAFETY',
  'UNRESOLVED_EVIDENCE',
] as const);

export type Rule6Outcome = (typeof RULE6_OUTCOMES)[number];

export const RULE6_FAILURE_CODES = Object.freeze([
  'INVALID_INPUT',
  'INVALID_EVIDENCE_REGISTRY',
  'UNSUPPORTED_CONTRACT_VERSION',
  'CONTRADICTORY_UPSTREAM_STATE',
  'INTERNAL_FAILURE',
] as const);

export type Rule6FailureCode = (typeof RULE6_FAILURE_CODES)[number];

export const RULE6_CANDIDATE_STATES = Object.freeze([
  'CONSIDERED',
  'EVIDENCE_INSUFFICIENT',
  'ELIGIBLE',
  'REJECTED',
  'UNRESOLVED',
  'SELECTED_FOR_SHADOW_PROPOSAL',
] as const);

export type Rule6CandidateState = (typeof RULE6_CANDIDATE_STATES)[number];

export const RULE6_INPUT_KEY_ORDER = Object.freeze([
  'contractVersion',
  'requestId',
  'diseaseConditionRefs',
  'clinicalTargetRefs',
  'rule1TemperamentRef',
  'rule3OrganSystemRef',
  'severityRef',
  'candidateMedicinePool',
  'relationshipEvidenceRegistry',
  'safetyExclusionRefs',
  'evidenceDataVersions',
  'upstreamApplicability',
] as const);

export const RULE6_OUTPUT_KEY_ORDER = Object.freeze([
  'contractVersion',
  'ruleNumber',
  'ruleIdentity',
  'requestId',
  'status',
  'applicability',
  'evaluatedSystemsOrConditions',
  'candidateEvaluations',
  'selectedEligibleCandidates',
  'rejectedCandidates',
  'proposedCompositionCandidates',
  'evidenceRefs',
  'reasonCodes',
  'blockersOrUnresolvedEvidence',
  'rule9SectionFValidationRequired',
  'deterministicFingerprint',
  'shadowOnly',
  'clinicalActivation',
] as const);

export const RULE6_EDGE_KEY_ORDER = Object.freeze([
  'edgeId',
  'sourceMedicineId',
  'targetMedicineIdOrSet',
  'directionality',
  'relationshipType',
  'applicabilityConditions',
  'prohibitionConditions',
  'evidenceSourceId',
  'evidenceValidationStatus',
  'ownerClinicalApprovalStatus',
  'version',
  'effectiveStatus',
  'supersessionMetadata',
] as const);

export const RULE6_NON_ACTIVATING_EDGE_STATES = Object.freeze([
  'draft',
  'inventory-only',
  'unvalidated',
  'disputed',
  'stale',
  'superseded',
  'missing evidence',
  'owner-unapproved',
  'inactive',
] as const);

export const RULE6_REASON_CODES = Object.freeze({
  SAFETY_EXCLUSION: 'R6_SAFETY_EXCLUSION',
  EVIDENCE_INSUFFICIENT: 'R6_EVIDENCE_INSUFFICIENT',
  EDGE_NON_ACTIVATING: 'R6_EDGE_NON_ACTIVATING',
  PROHIBITION_ACTIVE: 'R6_PROHIBITION_ACTIVE',
  CONTRADICTORY_EVIDENCE: 'R6_CONTRADICTORY_EVIDENCE',
  UPSTREAM_NOT_EVALUABLE: 'R6_UPSTREAM_NOT_EVALUABLE',
  UPSTREAM_NOT_APPLICABLE: 'R6_UPSTREAM_NOT_APPLICABLE',
  UNRESOLVED_TIE: 'R6_UNRESOLVED_TIE',
  ELIGIBLE_BY_APPROVED_EDGE: 'R6_ELIGIBLE_BY_APPROVED_EDGE',
  SHADOW_COMPOSITION_PROPOSED: 'R6_SHADOW_COMPOSITION_PROPOSED',
  RULE9_VALIDATION_REQUIRED: 'R6_RULE9_VALIDATION_REQUIRED',
} as const);
