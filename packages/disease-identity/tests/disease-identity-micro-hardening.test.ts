import { describe, expect, it } from 'vitest';
import {
  APPROVED_AGGREGATE_COUNTS,
  AUTHORITY_CLASSIFICATION,
  BUNDLE_SCHEMA_VERSION,
  BUNDLE_KIND_SYNTHETIC,
  buildSyntheticMappedRecord,
  DATASET_VERSION,
  DiseaseIdentityError,
  generateDiseaseCanonicalId,
  reconcileManifestCounts,
  sha256HexLower,
  validateBundleManifest,
  validateMappedIdentityRecord,
  validateSyntheticGeneratorInput,
} from '../src/index.ts';

function validExactUniqueRecord() {
  return buildSyntheticMappedRecord({
    mappedSourceLabel: 'ICD10',
    mappedCodeRaw: 'A00.0',
    bridgeDisposition: 'EXACT_UNIQUE_MATCH',
    linkedEhas2DiseaseIds: [generateDiseaseCanonicalId(101)],
    candidateLegacyDbIds: [101],
  }) as unknown as Record<string, unknown>;
}

function validManifestTemplate() {
  return {
    bundleKind: BUNDLE_KIND_SYNTHETIC,
    bundleSchemaVersion: BUNDLE_SCHEMA_VERSION,
    datasetVersion: DATASET_VERSION,
    authorityClassification: AUTHORITY_CLASSIFICATION,
    licensingClassification: 'SYNTHETIC_ENGINEERING',
    canonicalIdAlgorithms: [
      'EHAS2_CANONICAL_DISEASE_ID_v1_SHA256',
      'EHAS2_MAPPED_IDENTITY_KEY_v1_SHA256',
      'EHAS2_IDENTITY_RELATIONSHIP_v1_SHA256',
    ],
    inputEvidenceHashes: {
      note: 'External pinned evidence hashes are declared outside Git in P2B v1',
    },
    generatorVersion: '0.1.0-control-plane',
    artifacts: [],
    aggregateFingerprint: sha256HexLower('synthetic-template'),
    reconciliation: { ...APPROVED_AGGREGATE_COUNTS },
  };
}

describe('R2-DATA-P2B micro-hardening regressions', () => {
  it('rejects EXACT_UNIQUE with zero or multiple candidates', () => {
    const base = validExactUniqueRecord();
    expect(() => validateMappedIdentityRecord({ ...base, candidateLegacyDbIds: [] })).toThrow(
      DiseaseIdentityError,
    );
    expect(() =>
      validateMappedIdentityRecord({ ...base, candidateLegacyDbIds: [101, 102] }),
    ).toThrow(DiseaseIdentityError);
  });

  it('rejects EXACT_UNIQUE with zero, multiple or mismatched links', () => {
    const base = validExactUniqueRecord();
    expect(() => validateMappedIdentityRecord({ ...base, linkedEhas2DiseaseIds: [] })).toThrow(
      DiseaseIdentityError,
    );
    expect(() =>
      validateMappedIdentityRecord({
        ...base,
        linkedEhas2DiseaseIds: [generateDiseaseCanonicalId(101), generateDiseaseCanonicalId(102)],
      }),
    ).toThrow(DiseaseIdentityError);
    expect(() =>
      validateMappedIdentityRecord({
        ...base,
        linkedEhas2DiseaseIds: [generateDiseaseCanonicalId(102)],
      }),
    ).toThrow(DiseaseIdentityError);
  });

  it('rejects NO_MATCH with non-empty candidates', () => {
    const base = validExactUniqueRecord();
    expect(() =>
      validateMappedIdentityRecord({
        ...base,
        bridgeDisposition: 'NO_MATCH',
        relationshipState: 'UNLINKED_MAPPED_CODE',
        quarantineFlags: ['Q_REL_NO_DB_MATCH'],
        candidateLegacyDbIds: [101],
        linkedEhas2DiseaseIds: [],
      }),
    ).toThrow(DiseaseIdentityError);
  });

  it('rejects contradictory disposition quarantine flags', () => {
    const base = validExactUniqueRecord();
    expect(() =>
      validateMappedIdentityRecord({
        ...base,
        quarantineFlags: ['Q_REL_NO_DB_MATCH'],
      }),
    ).toThrow(DiseaseIdentityError);
    expect(() =>
      validateMappedIdentityRecord({
        ...base,
        bridgeDisposition: 'EXACT_MULTIPLE_MATCH',
        quarantineFlags: ['Q_REL_EXACT_MULTIPLE', 'Q_REL_OWNER_REVIEW'],
        candidateLegacyDbIds: [101, 102],
        linkedEhas2DiseaseIds: [],
      }),
    ).toThrow(DiseaseIdentityError);
  });

  it('rejects raw provenance with normalizable or unrelated variants', () => {
    const raw = buildSyntheticMappedRecord({
      mappedSourceLabel: 'UNKNOWN_NS',
      mappedCodeRaw: 'X001',
    }) as unknown as Record<string, unknown>;
    expect(() =>
      validateMappedIdentityRecord({
        ...raw,
        provenanceVariants: [
          { mappedSourceLabel: 'UNKNOWN_NS', mappedCodeRaw: 'X001' },
          { mappedSourceLabel: 'ICD10', mappedCodeRaw: 'A00.0' },
        ],
      }),
    ).toThrow(DiseaseIdentityError);
    expect(() =>
      validateMappedIdentityRecord({
        ...raw,
        provenanceVariants: [
          { mappedSourceLabel: 'UNKNOWN_NS', mappedCodeRaw: 'X001' },
          { mappedSourceLabel: 'OMIM', mappedCodeRaw: '600001' },
        ],
      }),
    ).toThrow(DiseaseIdentityError);
  });

  it('rejects missing own raw provenance variant', () => {
    const raw = buildSyntheticMappedRecord({
      mappedSourceLabel: 'UNKNOWN_NS',
      mappedCodeRaw: 'X001',
    }) as unknown as Record<string, unknown>;
    expect(() =>
      validateMappedIdentityRecord({
        ...raw,
        provenanceVariants: [{ mappedSourceLabel: 'UNKNOWN_NS', mappedCodeRaw: 'X002' }],
      }),
    ).toThrow(DiseaseIdentityError);
  });

  it('rejects duplicate or unsorted provenance variants', () => {
    const base = validExactUniqueRecord();
    expect(() =>
      validateMappedIdentityRecord({
        ...base,
        provenanceVariants: [
          { mappedSourceLabel: 'ICD10', mappedCodeRaw: 'A00.0' },
          { mappedSourceLabel: 'ICD10', mappedCodeRaw: 'A00.0' },
        ],
      }),
    ).toThrow(DiseaseIdentityError);
    expect(() =>
      validateMappedIdentityRecord({
        ...base,
        provenanceVariants: [
          { mappedSourceLabel: 'ICD10', mappedCodeRaw: 'B99.9' },
          { mappedSourceLabel: 'ICD10', mappedCodeRaw: 'A00.0' },
        ],
      }),
    ).toThrow(DiseaseIdentityError);
  });

  it('rejects wrong manifest versions and authority', () => {
    const template = validManifestTemplate();
    expect(() =>
      validateBundleManifest({ ...template, bundleSchemaVersion: 'wrong-version' }),
    ).toThrow(DiseaseIdentityError);
    expect(() => validateBundleManifest({ ...template, datasetVersion: 'wrong-version' })).toThrow(
      DiseaseIdentityError,
    );
    expect(() => validateBundleManifest({ ...template, authorityClassification: 'WRONG' })).toThrow(
      DiseaseIdentityError,
    );
  });

  it('rejects malformed artifact hash, name and path', () => {
    const template = validManifestTemplate();
    expect(() =>
      validateBundleManifest({
        ...template,
        artifacts: [
          {
            name: '../escape.jsonl',
            rowCount: 1,
            bytes: 10,
            sha256: 'bad',
          },
        ],
      }),
    ).toThrow(DiseaseIdentityError);
    expect(() =>
      validateBundleManifest({
        ...template,
        artifacts: [
          {
            name: 'ledger.jsonl',
            rowCount: 1,
            bytes: 10,
            sha256: 'not-a-valid-digest',
          },
        ],
      }),
    ).toThrow(DiseaseIdentityError);
  });

  it('rejects unknown inputEvidenceHashes keys and malformed aggregate fingerprint', () => {
    const template = validManifestTemplate();
    expect(() =>
      validateBundleManifest({
        ...template,
        inputEvidenceHashes: {
          note: 'ok',
          unexpected: 'deadbeef',
        },
      }),
    ).toThrow(DiseaseIdentityError);
    expect(() =>
      validateBundleManifest({
        ...template,
        aggregateFingerprint: 'ZZZZ',
      }),
    ).toThrow(DiseaseIdentityError);
  });

  it('keeps synthetic manifest template with empty artifacts valid', () => {
    expect(() => reconcileManifestCounts(validManifestTemplate())).not.toThrow();
  });

  it('rejects generator input with unknown or prohibited fields', () => {
    expect(() =>
      validateSyntheticGeneratorInput({
        recordKind: 'LEGACY_DB_ROW',
        legacyDbDiseaseId: 1,
        sourceLabel: 'ICD10',
        sourceCodeRaw: 'A00.0',
        unknownField: true,
      }),
    ).toThrow(DiseaseIdentityError);
    expect(() =>
      validateSyntheticGeneratorInput({
        recordKind: 'MAPPED_CODE_INDEX_INPUT',
        mappedSourceLabel: 'ICD10',
        mappedCodeRaw: 'A00.0',
        diseasePolarity: 'POSITIVE',
      }),
    ).toThrow(DiseaseIdentityError);
  });

  it('rejects unsorted generator candidate input', () => {
    expect(() =>
      validateSyntheticGeneratorInput({
        recordKind: 'MAPPED_CODE_INDEX_INPUT',
        mappedSourceLabel: 'ICD10',
        mappedCodeRaw: 'E11.9',
        candidateLegacyDbIds: [102, 101],
      }),
    ).toThrow(DiseaseIdentityError);
  });
});
