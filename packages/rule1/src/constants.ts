/** Canonical Rule 1 v1 primary temperament tokens (OWNER-FREEZE-R1-OD-01 + IMPL-02). */
export const RULE1_PRIMARY_TEMPERAMENTS = Object.freeze([
  'BILIOUS',
  'SANGUINE',
  'LYMPHATIC',
  'NERVOUS',
] as const);

export type Rule1PrimaryTemperament = (typeof RULE1_PRIMARY_TEMPERAMENTS)[number];

/**
 * Representation / residual / equal-rank order only.
 * NEVER a clinical primary tie-breaker (OWNER-FREEZE-OD-R1-IMPL-01-CORR-v1).
 */
export const RULE1_REPRESENTATION_ORDER = Object.freeze([
  'BILIOUS',
  'SANGUINE',
  'LYMPHATIC',
  'NERVOUS',
] as const satisfies readonly Rule1PrimaryTemperament[]);

export const RULE1_PROFILE_STATUSES = Object.freeze([
  'TEMPERAMENT_INSUFFICIENT_EVIDENCE',
  'TEMPERAMENT_CONTRADICTORY',
  'TEMPERAMENT_PROFILE_RESOLVED',
  'MIXED_TEMPERAMENT',
  'RULE1_INPUT_REJECTED',
] as const);

export type Rule1ProfileStatus = (typeof RULE1_PROFILE_STATUSES)[number];

export const RULE1_MIXED_SUBTYPES = Object.freeze([
  'DUAL_TEMPERAMENT',
  'MULTI_TEMPERAMENT',
] as const);
export type Rule1MixedSubtype = (typeof RULE1_MIXED_SUBTYPES)[number];

export const RULE1_FAILURE_CODES = Object.freeze([
  'INVALID_INPUT',
  'UNSUPPORTED_CONTRACT_VERSION',
  'UNKNOWN_CONCEPT_ID',
  'MALFORMED_FINGERPRINT',
  'CALLER_SUPPLIED_WEIGHT_OR_TEMPERAMENT',
  'RAW_TEXT_FORBIDDEN',
  'CONFLICTING_CONCEPTS_SAME_FINGERPRINT',
  'MALFORMED_VITAL',
  'INTERNAL_FAILURE',
] as const);

export type Rule1FailureCode = (typeof RULE1_FAILURE_CODES)[number];

export const RULE1_REASON_CODES = Object.freeze({
  INSUFFICIENT_EVIDENCE: 'R1_INSUFFICIENT_EVIDENCE',
  THERMAL_CONTRADICTION: 'R1_THERMAL_CONTRADICTION',
  PROFILE_RESOLVED: 'R1_PROFILE_RESOLVED',
  MIXED_DUAL: 'R1_MIXED_DUAL',
  MIXED_MULTI: 'R1_MIXED_MULTI',
  DEDUPE_CONCEPT_CAP: 'R1_DEDUPE_CONCEPT_CAP',
  DEDUPE_FINGERPRINT: 'R1_DEDUPE_FINGERPRINT',
  EXCLUDED_NEGATED: 'R1_EXCLUDED_NEGATED',
  EXCLUDED_HISTORICAL: 'R1_EXCLUDED_HISTORICAL',
  EXCLUDED_UNACCEPTED: 'R1_EXCLUDED_UNACCEPTED',
  BP_SANGUINE_APPLIED: 'R1_BP_SANGUINE_APPLIED',
  BP_LYMPHATIC_APPLIED: 'R1_BP_LYMPHATIC_APPLIED',
  BP_LYMPHATIC_LACKS_NON_BP_SUPPORT: 'R1_BP_LYMPHATIC_LACKS_NON_BP_SUPPORT',
  BP_NOT_APPLICABLE: 'R1_BP_NOT_APPLICABLE',
  EVIDENCE_ACCEPTED: 'R1_EVIDENCE_ACCEPTED',
  NO_SINGULAR_SECONDARY: 'R1_NO_SINGULAR_SECONDARY',
  BILIOUS_CANONICAL: 'R1_BILIOUS_CANONICAL',
  LEGACY_ALIAS_MAPPED: 'R1_LEGACY_ALIAS_MAPPED_TO_BILIOUS',
} as const);

/** Frozen BP thresholds (batch freezes; do not invent additional). */
export const RULE1_BP_SANGUINE_SYSTOLIC_MIN = 140 as const;
export const RULE1_BP_SANGUINE_WEIGHT = 3 as const;
export const RULE1_BP_LYMPHATIC_SYSTOLIC_MAX_EXCLUSIVE = 100 as const;
export const RULE1_BP_LYMPHATIC_WEIGHT = 2 as const;

/** Production real mapping registry remains empty (fail-closed). */
export const RULE1_PRODUCTION_MAPPING_REGISTRY = Object.freeze({
  registryVersion: 'production-empty-v0',
  entries: Object.freeze([] as const),
  activeRealMappingCount: 0 as const,
});

/** Forbidden v1 output tokens / fields (docs freezes). */
export const RULE1_FORBIDDEN_OUTPUT_TOKENS = Object.freeze([
  'BILIOUS_HEPATIC',
  'UNRESOLVED_TIE',
] as const);

export const RULE1_INPUT_KEY_ORDER = Object.freeze([
  'inputSchemaVersion',
  'ruleContractVersion',
  'consultationId',
  'episodeId',
  'evidence',
  'structuredVitals',
] as const);

export const RULE1_EVIDENCE_KEY_ORDER = Object.freeze([
  'conceptId',
  'sourceFactFingerprint',
  'temporalPosture',
  'negationPosture',
  'acceptancePosture',
] as const);

export const RULE1_OUTPUT_KEY_ORDER = Object.freeze([
  'inputSchemaVersion',
  'ruleContractVersion',
  'outputSchemaVersion',
  'percentageAlgorithm',
  'catalogVersion',
  'scoringAlgorithmVersion',
  'catalogFingerprint',
  'inputFingerprint',
  'status',
  'mixedSubtype',
  'primaryTemperament',
  'dominantTemperaments',
  'scores',
  'percentages',
  'rankedPercentageProfile',
  'acceptedContributions',
  'excludedEvidence',
  'reasonCodes',
  'clinicallyUsed',
  'shadowOnly',
  'clinicalActivation',
  'medicineSelectionInfluence',
  'prescriptionEffect',
  'orchestrationStatus',
  'runtimeStatus',
] as const);
