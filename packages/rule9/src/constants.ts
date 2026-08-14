export const RULE9_OUTCOMES = Object.freeze([
  'NOT_APPLICABLE',
  'NOT_EVALUABLE',
  'INSUFFICIENT_CLINICAL_EVIDENCE',
  'BLOCKED_BY_UPSTREAM_CONTRADICTION',
  'BLOCKED_BY_COUNT_VALIDATION',
  'SHADOW_PACKAGE_READY',
  'UNRESOLVED_EVIDENCE',
] as const);

export type Rule9Outcome = (typeof RULE9_OUTCOMES)[number];

export const RULE9_FAILURE_CODES = Object.freeze([
  'INVALID_INPUT',
  'INVALID_UPSTREAM_ENVELOPE',
  'UNSUPPORTED_CONTRACT_VERSION',
  'CONTRADICTORY_UPSTREAM_STATE',
  'INTERNAL_FAILURE',
] as const);

export type Rule9FailureCode = (typeof RULE9_FAILURE_CODES)[number];

export const RULE9_INPUT_KEY_ORDER = Object.freeze([
  'contractVersion',
  'requestId',
  'complexityTierRef',
  'rule1Envelope',
  'rule2Envelope',
  'rule3Envelope',
  'rule4Envelope',
  'rule5Envelope',
  'rule6Envelope',
  'rule7Envelope',
  'rule8Envelope',
  'proposedOralComposition',
  'evidenceDataVersions',
  'upstreamApplicability',
] as const);

export const RULE9_OUTPUT_KEY_ORDER = Object.freeze([
  'contractVersion',
  'ruleNumber',
  'ruleIdentity',
  'requestId',
  'status',
  'applicability',
  'complexityTierAccepted',
  'requiredOralMixtureCount',
  'observedOralMixtureCount',
  'countValidationState',
  'packagedShadowProposal',
  'rejectionReasons',
  'insufficientClinicalEvidence',
  'doctorReviewRequired',
  'upstreamRuleStates',
  'evidenceRefs',
  'reasonCodes',
  'blockersOrUnresolvedEvidence',
  'deterministicFingerprint',
  'shadowOnly',
  'clinicalActivation',
  'medicineSelectionInfluence',
  'prescriptionEffect',
  'notAClinicallyActivatedPrescription',
] as const);

export const RULE9_PACKAGE_KEY_ORDER = Object.freeze([
  'packageId',
  'sourceRuleEnvelopes',
  'oralMixtures',
  'sectionSeparations',
  'countValidated',
  'packagingNotes',
] as const);

export const RULE9_MIXTURE_KEY_ORDER = Object.freeze([
  'mixtureId',
  'medicineIds',
  'evidenceRefs',
] as const);

/** Technical complexity-tier envelope keys (engineering-closed; not clinical criteria). */
export const RULE9_COMPLEXITY_APPROVED_KEY_ORDER = Object.freeze([
  'tier',
  'ownerApprovalStatus',
  'evidenceSourceId',
  'version',
] as const);

export const RULE9_COMPLEXITY_TIERS = Object.freeze(['SIMPLE', 'MODERATE', 'COMPLEX'] as const);
export type Rule9ComplexityTier = (typeof RULE9_COMPLEXITY_TIERS)[number];

/** Technical approval token only — does not define clinical complexity criteria. */
export const RULE9_COMPLEXITY_APPROVAL_TOKEN = 'explicitly-approved-for-shadow-validation' as const;

export const RULE9_TIER_TO_COUNT = Object.freeze({
  SIMPLE: 3,
  MODERATE: 4,
  COMPLEX: 5,
} as const);

export const RULE9_COMPLEXITY_NONSUCCESS_STATUSES = Object.freeze([
  'UNAVAILABLE',
  'UNAPPROVED',
  'CONTRADICTORY',
  'STALE',
] as const);

export const RULE9_ENVELOPE_ABSENT_STATUSES = Object.freeze([
  'UNAVAILABLE',
  'NOT_IMPLEMENTED',
] as const);

export const RULE9_APPLICABILITY_STATES = Object.freeze([
  'APPLICABLE',
  'NOT_APPLICABLE',
  'NOT_EVALUABLE',
] as const);

export const RULE9_COUNT_VALIDATION_STATES = Object.freeze([
  'PASS',
  'FAIL',
  'NOT_EVALUABLE',
  'NOT_APPLICABLE',
] as const);

export type Rule9CountValidationState = (typeof RULE9_COUNT_VALIDATION_STATES)[number];

export const RULE9_RULE_IDENTITIES = Object.freeze({
  1: 'TEMPERAMENT_PRAKRITI',
  2: 'POLARITY',
  3: 'ORGAN_SYSTEM_AFFINITY',
  4: 'POTENCY',
  5: 'MONITORING_FOLLOW_UP_POST_RELEASE_SAFETY_SURVEILLANCE',
  6: 'MULTI_DISEASE_ORGAN_SYSTEM_TRIAD',
  7: 'EXTERNAL_USE_ROUTES',
  8: 'DISEASE_LEVEL_PRAKRUTI_INFERENCE',
} as const);

export const RULE9_REASON_CODES = Object.freeze({
  TIER_NOT_ACCEPTED: 'R9_TIER_NOT_ACCEPTED',
  TIER_INFERENCE_FORBIDDEN: 'R9_TIER_INFERENCE_FORBIDDEN',
  COUNT_MISMATCH: 'R9_COUNT_MISMATCH',
  COUNT_ONE_OR_TWO: 'R9_COUNT_ONE_OR_TWO',
  PLUS_ONE_FORBIDDEN: 'R9_PLUS_ONE_FORBIDDEN',
  TABLET_IN_ORAL_COUNT: 'R9_TABLET_IN_ORAL_COUNT',
  EXTERNAL_IN_ORAL_COUNT: 'R9_EXTERNAL_IN_ORAL_COUNT',
  ZERO_REQUIRED_CLINICAL_DATA: 'R9_ZERO_REQUIRED_CLINICAL_DATA',
  UPSTREAM_NOT_EVALUABLE: 'R9_UPSTREAM_NOT_EVALUABLE',
  UPSTREAM_NOT_APPLICABLE: 'R9_UPSTREAM_NOT_APPLICABLE',
  UPSTREAM_CONTRADICTION: 'R9_UPSTREAM_CONTRADICTION',
  COMPOSITION_ABSENT: 'R9_COMPOSITION_ABSENT',
  UNRESOLVED_EVIDENCE: 'R9_UNRESOLVED_EVIDENCE',
  SHADOW_PACKAGE_BUILT: 'R9_SHADOW_PACKAGE_BUILT',
  DOCTOR_REVIEW_REQUIRED: 'R9_DOCTOR_REVIEW_REQUIRED',
  INSUFFICIENT_CLINICAL_EVIDENCE: 'R9_INSUFFICIENT_CLINICAL_EVIDENCE',
} as const);

/** Production clinical mapping/composition registry remains empty. */
export const RULE9_PRODUCTION_MAPPING_REGISTRY = Object.freeze({
  registryVersion: 'production-empty-v0',
  entries: Object.freeze([] as const),
});
