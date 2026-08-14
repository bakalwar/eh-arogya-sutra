export const RULE2_OUTCOMES = Object.freeze([
  'NOT_APPLICABLE',
  'NOT_EVALUABLE',
  'ADDITIONAL_INFORMATION_REQUIRED',
  'UNRESOLVED_EVIDENCE',
  'DOCTOR_REVIEW_REQUIRED',
  'SHADOW_POLARITY_ANNOTATIONS_PROPOSED',
  'BLOCKED_BY_SLOT_CONTRADICTION',
] as const);

export type Rule2Outcome = (typeof RULE2_OUTCOMES)[number];

export const RULE2_FAILURE_CODES = Object.freeze([
  'INVALID_INPUT',
  'UNSUPPORTED_CONTRACT_VERSION',
  'INVALID_EVIDENCE_REGISTRY',
  'CONTRADICTORY_INPUT_STATE',
  'INTERNAL_FAILURE',
] as const);

export type Rule2FailureCode = (typeof RULE2_FAILURE_CODES)[number];

export const RULE2_DISEASE_POLARITY_TOKENS = Object.freeze([
  'POSITIVE',
  'NEGATIVE',
  'NEUTRAL',
  'MIXED',
  'UNRESOLVED',
  'SUPPORT_ONLY',
] as const);

export type Rule2DiseasePolarityToken = (typeof RULE2_DISEASE_POLARITY_TOKENS)[number];

export const RULE2_THERAPEUTIC_POLARITY_TOKENS = Object.freeze([
  'POSITIVE',
  'NEGATIVE',
  'NEUTRAL',
] as const);

export type Rule2TherapeuticPolarityToken = (typeof RULE2_THERAPEUTIC_POLARITY_TOKENS)[number];

export const RULE2_RESOLUTION_STATUS_TOKENS = Object.freeze([
  'RESOLVED',
  'RESOLVED_SUPPORT_ROLE',
  'NEUTRAL_FALLBACK_PENDING_REVIEW',
  'UNRESOLVED',
  'CONTRADICTORY',
] as const);

export type Rule2ResolutionStatus = (typeof RULE2_RESOLUTION_STATUS_TOKENS)[number];

export const RULE2_LIFECYCLE_CLASSES = Object.freeze([
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

export type Rule2LifecycleClass = (typeof RULE2_LIFECYCLE_CLASSES)[number];

/** Blocking / non-activating lifecycle classes for positive polarity annotation. */
export const RULE2_BLOCKING_LIFECYCLE = Object.freeze([
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

export const RULE2_SUPPORT_SIGNAL_CLASSES = Object.freeze(['BP', 'REPORT', 'PHOTO'] as const);

export type Rule2SupportSignalClass = (typeof RULE2_SUPPORT_SIGNAL_CLASSES)[number];

export const RULE2_INPUT_KEY_ORDER = Object.freeze([
  'contractVersion',
  'requestId',
  'formulaSlotPolarityEvidenceRegistry',
  'orderedFormulaSlotRefs',
  'doctorSuppliedSlotBoundEvidenceItems',
  'casePolaritySummary',
  'slotBoundSupportingSignalRefs',
  'evidenceDataVersions',
  'upstreamApplicability',
] as const);

export const RULE2_OUTPUT_KEY_ORDER = Object.freeze([
  'contractVersion',
  'ruleNumber',
  'ruleIdentity',
  'requestId',
  'status',
  'applicability',
  'formulaSlotAnnotations',
  'casePolaritySummary',
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

export const RULE2_ANNOTATION_KEY_ORDER = Object.freeze([
  'formulaSlotId',
  'formulaTargetId',
  'rule2RecordId',
  'targetPathologyRef',
  'diseasePolarity',
  'requiredTherapeuticPolarity',
  'resolutionStatus',
  'fallbackPolicy',
  'doctorReviewRequired',
  'evidenceGaps',
  'reasonCodes',
  'mutatesMixtures',
] as const);

export const RULE2_EVIDENCE_ENTRY_KEY_ORDER = Object.freeze([
  'entryId',
  'formulaSlotId',
  'formulaTargetId',
  'diseasePolarity',
  'contradictionMarkers',
  'evidenceSourceId',
  'evidenceValidationStatus',
  'ownerClinicalApprovalStatus',
  'version',
  'effectiveStatus',
  'supersessionMetadata',
  'testClassification',
] as const);

export const RULE2_SLOT_REF_KEY_ORDER = Object.freeze([
  'formulaSlotId',
  'formulaTargetId',
] as const);

export const RULE2_DOCTOR_ITEM_KEY_ORDER = Object.freeze([
  'itemId',
  'formulaSlotId',
  'evidenceClass',
] as const);

export const RULE2_SUPPORT_SIGNAL_KEY_ORDER = Object.freeze([
  'formulaSlotId',
  'signalClass',
  'signalRefId',
] as const);

export const RULE2_SYNTHETIC_TEST_CLASSIFICATION = 'SYNTHETIC_TEST_ONLY' as const;

export const RULE2_FALLBACK_OWNER_APPROVED_NEUTRAL = 'OWNER_APPROVED_NEUTRAL_FALLBACK' as const;

export const RULE2_REASON_CODES = Object.freeze({
  NO_EVIDENCE: 'R2_NO_EVIDENCE',
  ADDITIONAL_INFORMATION_REQUIRED: 'R2_ADDITIONAL_INFORMATION_REQUIRED',
  EVIDENCE_NON_ACTIVATING: 'R2_EVIDENCE_NON_ACTIVATING',
  EVIDENCE_BLOCKING_LIFECYCLE: 'R2_EVIDENCE_BLOCKING_LIFECYCLE',
  CONTRADICTORY_SLOT_EVIDENCE: 'R2_CONTRADICTORY_SLOT_EVIDENCE',
  UPSTREAM_NOT_APPLICABLE: 'R2_UPSTREAM_NOT_APPLICABLE',
  UPSTREAM_NOT_EVALUABLE: 'R2_UPSTREAM_NOT_EVALUABLE',
  FORBIDDEN_EVIDENCE_SOURCE: 'R2_FORBIDDEN_EVIDENCE_SOURCE',
  FORBIDDEN_MEDICINE_REGISTRY_POLARITY: 'R2_FORBIDDEN_MEDICINE_REGISTRY_POLARITY',
  MIXED_REQUIRES_DOCTOR_REVIEW: 'R2_MIXED_REQUIRES_DOCTOR_REVIEW',
  UNRESOLVED_NEUTRAL_FALLBACK: 'R2_UNRESOLVED_NEUTRAL_FALLBACK',
  SUPPORT_ONLY_ANNOTATED: 'R2_SUPPORT_ONLY_ANNOTATED',
  ELIGIBLE_BY_APPROVED_SYNTHETIC_EVIDENCE: 'R2_ELIGIBLE_BY_APPROVED_SYNTHETIC_EVIDENCE',
  CASE_SUMMARY_MUST_NOT_DRIVE_SELECTION: 'R2_CASE_SUMMARY_MUST_NOT_DRIVE_SELECTION',
  SLOT_ORDER_PRESERVED: 'R2_SLOT_ORDER_PRESERVED',
  CATALOG_NOT_CREATED: 'R2_CATALOG_NOT_CREATED',
} as const);

/** Production real formula/slot→disease-polarity mapping registry remains empty. */
export const RULE2_PRODUCTION_MAPPING_REGISTRY = Object.freeze({
  registryVersion: 'production-empty-v0',
  entries: Object.freeze([] as const),
  activeRealMappingCount: 0 as const,
});
