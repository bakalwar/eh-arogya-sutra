export const RULE7_OUTCOMES = Object.freeze([
  'NOT_APPLICABLE',
  'NOT_EVALUABLE',
  'NOT_CLINICALLY_INDICATED',
  'SHADOW_ROUTE_INDICATIONS_PROPOSED',
  'BLOCKED_BY_SAFETY',
  'UNRESOLVED_EVIDENCE',
] as const);

export type Rule7Outcome = (typeof RULE7_OUTCOMES)[number];

export const RULE7_FAILURE_CODES = Object.freeze([
  'INVALID_INPUT',
  'INVALID_EVIDENCE_REGISTRY',
  'UNSUPPORTED_CONTRACT_VERSION',
  'CONTRADICTORY_UPSTREAM_STATE',
  'INTERNAL_FAILURE',
] as const);

export type Rule7FailureCode = (typeof RULE7_FAILURE_CODES)[number];

export const RULE7_ELIGIBILITY_STATES = Object.freeze([
  'ELIGIBLE',
  'REJECTED',
  'UNRESOLVED',
  'EVIDENCE_INSUFFICIENT',
] as const);

export type Rule7EligibilityState = (typeof RULE7_ELIGIBILITY_STATES)[number];

export const RULE7_INPUT_KEY_ORDER = Object.freeze([
  'contractVersion',
  'requestId',
  'clinicalTargetRefs',
  'bodySiteRefs',
  'rule3OrganSystemRef',
  'severityRef',
  'phaseRef',
  'routeEvidenceRegistry',
  'evidenceDataVersions',
  'upstreamApplicability',
] as const);

export const RULE7_OUTPUT_KEY_ORDER = Object.freeze([
  'contractVersion',
  'ruleNumber',
  'ruleIdentity',
  'requestId',
  'status',
  'applicability',
  'evaluatedBodySites',
  'routeIndications',
  'notClinicallyIndicated',
  'evidenceRefs',
  'reasonCodes',
  'blockersOrUnresolvedEvidence',
  'deterministicFingerprint',
  'shadowOnly',
  'clinicalActivation',
] as const);

/** Closed indication field order (§6.2). */
export const RULE7_INDICATION_KEY_ORDER = Object.freeze([
  'indicationId',
  'routeCode',
  'bodySiteRef',
  'eligibilityState',
  'evidenceRefs',
  'reasonCodes',
] as const);

/** Route evidence entry field order (registry record). */
export const RULE7_ROUTE_EVIDENCE_KEY_ORDER = Object.freeze([
  'entryId',
  'routeCode',
  'bodySiteRef',
  'applicabilityConditions',
  'prohibitionConditions',
  'evidenceSourceId',
  'evidenceValidationStatus',
  'ownerClinicalApprovalStatus',
  'version',
  'effectiveStatus',
  'supersessionMetadata',
] as const);

export const RULE7_NON_ACTIVATING_EVIDENCE_STATES = Object.freeze([
  'draft',
  'inventory-only',
  'queued-for-validation',
  'unvalidated',
  'disputed',
  'stale',
  'superseded',
  'missing-evidence',
  'owner-unapproved',
] as const);

export const RULE7_REASON_CODES = Object.freeze({
  EVIDENCE_INSUFFICIENT: 'R7_EVIDENCE_INSUFFICIENT',
  EVIDENCE_NON_ACTIVATING: 'R7_EVIDENCE_NON_ACTIVATING',
  PROHIBITION_ACTIVE: 'R7_PROHIBITION_ACTIVE',
  CONTRADICTORY_EVIDENCE: 'R7_CONTRADICTORY_EVIDENCE',
  SITE_MISMATCH: 'R7_SITE_MISMATCH',
  UPSTREAM_NOT_EVALUABLE: 'R7_UPSTREAM_NOT_EVALUABLE',
  UPSTREAM_NOT_APPLICABLE: 'R7_UPSTREAM_NOT_APPLICABLE',
  ELIGIBLE_BY_APPROVED_EVIDENCE: 'R7_ELIGIBLE_BY_APPROVED_EVIDENCE',
  NOT_CLINICALLY_INDICATED: 'R7_NOT_CLINICALLY_INDICATED',
  ORAL_COPY_FORBIDDEN: 'R7_ORAL_COPY_FORBIDDEN',
} as const);
