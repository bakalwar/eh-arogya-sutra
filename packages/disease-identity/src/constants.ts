export const LEDGER_SCHEMA_VERSION = 'ehas2-disease-identity-ledger-v1' as const;
export const DATASET_VERSION = 'ehas2-disease-identity-v1' as const;
export const BUNDLE_SCHEMA_VERSION = 'ehas2-disease-identity-bundle-v1' as const;

export const DISEASE_ID_ALGORITHM = 'EHAS2_CANONICAL_DISEASE_ID_v1_SHA256' as const;
export const MAPPED_ID_ALGORITHM = 'EHAS2_MAPPED_IDENTITY_KEY_v1_SHA256' as const;
export const RELATIONSHIP_ID_ALGORITHM = 'EHAS2_IDENTITY_RELATIONSHIP_v1_SHA256' as const;
export const RAW_MAPPED_REF_ALGORITHM = 'EHAS2_UNNORMALIZABLE_MAPPED_RAW_v1_SHA256' as const;

export const LEGACY_AUTHORITY = 'EHAS2_PINNED_LEGACY_DISEASE_DB_V1' as const;
export const DISEASE_ID_PREFIX = 'ehas2-dis-v1-' as const;
export const MAPPED_ID_PREFIX = 'ehas2-mdx-v1-' as const;
export const RELATIONSHIP_ID_PREFIX = 'ehas2-rel-v1-' as const;
export const RAW_MAPPED_REF_PREFIX = 'ehas2-mdx-raw-v1-' as const;

export const DISEASE_ID_HEX_LENGTH = 64;
export const RECORD_KIND_LEGACY_DB_ROW = 'LEGACY_DB_ROW' as const;
export const RECORD_KIND_MAPPED_CODE_INDEX = 'MAPPED_CODE_INDEX' as const;

export const AUTHORITY_CLASSIFICATION = 'ENGINEERING_IDENTITY_ONLY' as const;

export const CANONICAL_NAMESPACES = ['ICD10', 'MESH', 'OMIM', 'ORPHANET'] as const;
export type CanonicalNamespace = (typeof CANONICAL_NAMESPACES)[number];

export const SOURCE_LABEL_TO_NAMESPACE: Readonly<Record<string, CanonicalNamespace>> = {
  ICD10: 'ICD10',
  OMIM: 'OMIM',
  ORPHANET: 'ORPHANET',
  MESH: 'MESH',
};

export const BRIDGE_DISPOSITIONS = [
  'EXACT_UNIQUE_MATCH',
  'EXACT_MULTIPLE_MATCH',
  'OWNER_REVIEW_REQUIRED',
  'NO_MATCH',
] as const;

export const STRUCTURAL_QUARANTINE_FLAGS = [
  'Q_IDENTITY_INVALID_NAMESPACE',
  'Q_IDENTITY_INVALID_CODE',
  'Q_IDENTITY_NORMALIZATION_COLLISION',
  'Q_DISPLAY_CSV_STRUCT_CORRUPT',
  'Q_DISPLAY_EMPTY',
  'Q_REL_EXACT_MULTIPLE',
  'Q_REL_OWNER_REVIEW',
  'Q_REL_NO_DB_MATCH',
  'Q_REL_DB_UNLINKED',
  'Q_REL_DB_CODE_WITHOUT_MAPPED_PARENT',
  'Q_MAPPED_UNNORMALIZABLE_RAW',
] as const;

export const PROHIBITED_RECORD_FIELDS = [
  'diseasePolarity',
  'requiredTherapeuticPolarity',
  'polarity',
  'medicine',
  'medicineId',
  'formula',
  'potency',
  'electricity',
  'dosage',
  'rx',
  'prescription',
  'patient',
  'consultation',
  'phone',
  'patientName',
  'phi',
] as const;

export const APPROVED_AGGREGATE_COUNTS = {
  legacyDbRows: 116_284,
  mappedUniqueCodes: 50_544,
  bridgeExactUnique: 33_070,
  bridgeExactMultiple: 17_181,
  bridgeOwnerReview: 257,
  bridgeNoMatch: 36,
  failClosedAmbiguousMappedCodes: 17_438,
  dbOnlyRows: 18_103,
  dbCodesWithoutMappedParent: 12_634,
} as const;

export const MAX_FIELD_LENGTH = 512;
export const MAX_CANDIDATE_IDS = 64;
export const MAX_PROVENANCE_VARIANTS = 32;
