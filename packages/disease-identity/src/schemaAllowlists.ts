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

export const DISEASE_RELATIONSHIP_STATES = ['LEGACY_DB_LINKED', 'LEGACY_DB_UNLINKED'] as const;

export const MAPPED_RELATIONSHIP_STATES = ['MAPPED_INDEX', 'UNLINKED_MAPPED_CODE'] as const;

export const MAX_VALIDATION_DEPTH = 32;
export const MAX_VALIDATION_NODES = 4096;
export const MAX_LINKED_DISEASE_IDS = 64;
export const MAX_MAPPED_INDEX_REFS = 64;
