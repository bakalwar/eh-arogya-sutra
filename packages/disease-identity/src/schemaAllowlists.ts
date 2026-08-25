export const DISPOSITION_PRIMARY_FIELDS = [
  'primaryCandidateId',
  'preferredCandidateId',
  'selectedCandidateId',
] as const;

export const DISEASE_RECORD_ALLOWED_KEYS = [
  'ehas2DiseaseId',
  'ledgerSchemaVersion',
  'recordKind',
  'legacyAuthority',
  'legacyDbDiseaseId',
  'sourceNamespace',
  'sourceCode',
  'normalizedIdentityKey',
  'relationshipState',
  'bridgeDisposition',
  'mappedIndexRefs',
  'candidateLegacyDbIds',
  'quarantineFlags',
  'reviewRequiredUnclassified',
  'provenance',
  'recordFingerprint',
  'lifecycleStatus',
] as const;

export const MAPPED_RECORD_ALLOWED_KEYS = [
  'ehas2MappedIndexId',
  'rawMappedReferenceId',
  'mappedCodeRaw',
  'mappedSourceLabel',
  'sourceNamespace',
  'sourceCode',
  'normalizedIdentityKey',
  'bridgeDisposition',
  'relationshipState',
  'linkedEhas2DiseaseIds',
  'candidateLegacyDbIds',
  'provenanceVariants',
  'quarantineFlags',
  'reviewRequiredUnclassified',
  'provenance',
  'recordFingerprint',
] as const;

export const PROVENANCE_ALLOWED_KEYS = ['authorityClassification', 'datasetVersion'] as const;

export const PROVENANCE_VARIANT_ALLOWED_KEYS = ['mappedCodeRaw', 'mappedSourceLabel'] as const;

export const MANIFEST_ALLOWED_KEYS = [
  'bundleKind',
  'bundleSchemaVersion',
  'datasetVersion',
  'authorityClassification',
  'licensingClassification',
  'canonicalIdAlgorithms',
  'inputEvidenceHashes',
  'generatorVersion',
  'artifacts',
  'aggregateFingerprint',
  'reconciliation',
] as const;

export const MANIFEST_ARTIFACT_ALLOWED_KEYS = ['name', 'rowCount', 'sha256', 'bytes'] as const;

export const MANIFEST_EVIDENCE_HASH_KEYS = [
  'note',
  'legacyDbSha256',
  'mappedJsonSha256',
  'bridgeSha256',
] as const;

export const APPROVED_LICENSING_CLASSIFICATIONS = [
  'SYNTHETIC_ENGINEERING',
  'PRIVATE_ENGINEERING_IDENTITY_PENDING_LEGAL_CLEARANCE',
] as const;

export const APPROVED_MANIFEST_ALGORITHMS = [
  'EHAS2_CANONICAL_DISEASE_ID_v1_SHA256',
  'EHAS2_MAPPED_IDENTITY_KEY_v1_SHA256',
  'EHAS2_IDENTITY_RELATIONSHIP_v1_SHA256',
  'EHAS2_UNNORMALIZABLE_MAPPED_RAW_v1_SHA256',
] as const;

export const SYNTHETIC_DISEASE_INPUT_KEYS = [
  'recordKind',
  'legacyDbDiseaseId',
  'sourceLabel',
  'sourceCodeRaw',
  'nameEnglish',
  'nameHindi',
  'bridgeDisposition',
  'mappedIndexRefs',
  'candidateLegacyDbIds',
  'isDbOnly',
  'codeWithoutMappedParent',
] as const;

export const SYNTHETIC_MAPPED_INPUT_KEYS = [
  'recordKind',
  'mappedSourceLabel',
  'mappedCodeRaw',
  'bridgeDisposition',
  'candidateLegacyDbIds',
  'linkedEhas2DiseaseIds',
  'provenanceVariants',
] as const;

export const RELATIONSHIP_DISPOSITION_QUARANTINE_FLAGS = [
  'Q_REL_EXACT_MULTIPLE',
  'Q_REL_OWNER_REVIEW',
  'Q_REL_NO_DB_MATCH',
] as const;

export const DISEASE_RELATIONSHIP_STATES = ['LEGACY_DB_LINKED', 'LEGACY_DB_UNLINKED'] as const;

export const MAPPED_RELATIONSHIP_STATES = ['MAPPED_INDEX', 'UNLINKED_MAPPED_CODE'] as const;

export const MAX_VALIDATION_DEPTH = 32;
export const MAX_VALIDATION_NODES = 4096;
export const MAX_LINKED_DISEASE_IDS = 64;
export const MAX_MAPPED_INDEX_REFS = 64;
export const MAX_MANIFEST_ARTIFACTS = 64;
export const MAX_MANIFEST_ALGORITHMS = 8;
export const MAX_GENERATOR_VERSION_LENGTH = 64;
