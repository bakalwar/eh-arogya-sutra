import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  buildSyntheticDiseaseRecord,
  buildSyntheticMappedRecord,
  canonicalJsonString,
  DiseaseIdentityError,
  generateDiseaseCanonicalId,
  NormalizationCollisionRegistry,
  serializeJsonl,
  validateAndIndexRecordBatch,
  validateDiseaseIdentityRecord,
  validateMappedIdentityRecord,
  assertNoProhibitedFields,
} from '../src/index.ts';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE_ROOT = path.resolve(PKG_ROOT, '../../fixtures/synthetic/disease-identity');

function validDiseaseRecord(legacyDbDiseaseId = 101) {
  return buildSyntheticDiseaseRecord({
    legacyDbDiseaseId,
    sourceLabel: 'ICD10',
    sourceCodeRaw: 'A00.0',
    bridgeDisposition: 'EXACT_UNIQUE_MATCH',
  }) as unknown as Record<string, unknown>;
}

function validMappedRecord() {
  return buildSyntheticMappedRecord({
    mappedSourceLabel: 'ICD10',
    mappedCodeRaw: 'A00.0',
    bridgeDisposition: 'EXACT_UNIQUE_MATCH',
    linkedEhas2DiseaseIds: [generateDiseaseCanonicalId(101)],
    candidateLegacyDbIds: [101],
  }) as unknown as Record<string, unknown>;
}

describe('R2-DATA-P2B validator hardening regressions', () => {
  it('rejects invalid legacyDbDiseaseId shapes', () => {
    const base = validDiseaseRecord();
    for (const legacyDbDiseaseId of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53]) {
      expect(() => validateDiseaseIdentityRecord({ ...base, legacyDbDiseaseId })).toThrow(
        DiseaseIdentityError,
      );
    }
  });

  it('rejects valid-format but incorrect disease canonical ID', () => {
    const base = validDiseaseRecord(101);
    expect(() =>
      validateDiseaseIdentityRecord({
        ...base,
        ehas2DiseaseId: generateDiseaseCanonicalId(102),
      }),
    ).toThrow(DiseaseIdentityError);
  });

  it('rejects primary/preferred/selected candidate fields', () => {
    const base = validMappedRecord();
    for (const field of ['primaryCandidateId', 'preferredCandidateId', 'selectedCandidateId']) {
      expect(() => validateMappedIdentityRecord({ ...base, [field]: 101 })).toThrow(
        DiseaseIdentityError,
      );
    }
  });

  it('rejects prohibited fields nested inside arrays', () => {
    expect(() =>
      assertNoProhibitedFields({
        items: [{ nested: [{ diseasePolarity: 'POSITIVE' }] }],
      }),
    ).toThrow(DiseaseIdentityError);
  });

  it('rejects duplicate, unsorted, invalid, and oversized candidate arrays', () => {
    const base = validMappedRecord();
    expect(() => validateMappedIdentityRecord({ ...base, candidateLegacyDbIds: [2, 1] })).toThrow(
      DiseaseIdentityError,
    );
    expect(() => validateMappedIdentityRecord({ ...base, candidateLegacyDbIds: [1, 1] })).toThrow(
      DiseaseIdentityError,
    );
    expect(() => validateMappedIdentityRecord({ ...base, candidateLegacyDbIds: [1.5] })).toThrow(
      DiseaseIdentityError,
    );
    expect(() =>
      validateMappedIdentityRecord({
        ...base,
        candidateLegacyDbIds: Array.from({ length: 65 }, (_, i) => i + 1),
      }),
    ).toThrow(DiseaseIdentityError);
  });

  it('rejects ambiguous mapped records that still link disease IDs', () => {
    const base = validMappedRecord();
    expect(() =>
      validateMappedIdentityRecord({
        ...base,
        bridgeDisposition: 'EXACT_MULTIPLE_MATCH',
        quarantineFlags: ['Q_REL_EXACT_MULTIPLE'],
        linkedEhas2DiseaseIds: [generateDiseaseCanonicalId(101)],
        candidateLegacyDbIds: [101, 102],
      }),
    ).toThrow(DiseaseIdentityError);
  });

  it('rejects NO_MATCH records with fabricated links', () => {
    const base = validMappedRecord();
    expect(() =>
      validateMappedIdentityRecord({
        ...base,
        bridgeDisposition: 'NO_MATCH',
        relationshipState: 'UNLINKED_MAPPED_CODE',
        quarantineFlags: ['Q_REL_NO_DB_MATCH'],
        linkedEhas2DiseaseIds: [generateDiseaseCanonicalId(101)],
        candidateLegacyDbIds: [],
      }),
    ).toThrow(DiseaseIdentityError);
  });

  it('rejects mapped identity XOR violations', () => {
    const normalized = validMappedRecord();
    expect(() =>
      validateMappedIdentityRecord({
        ...normalized,
        rawMappedReferenceId: 'ehas2-mdx-raw-v1-' + 'b'.repeat(64),
      }),
    ).toThrow(DiseaseIdentityError);
    expect(() =>
      validateMappedIdentityRecord({
        ...normalized,
        ehas2MappedIndexId: null,
        rawMappedReferenceId: null,
      }),
    ).toThrow(DiseaseIdentityError);
    expect(() =>
      validateMappedIdentityRecord({
        ...normalized,
        rawMappedReferenceId: 'ehas2-mdx-raw-v1-not-a-full-digest',
      }),
    ).toThrow(DiseaseIdentityError);
  });

  it('rejects mapped ID inconsistent with normalized source/code', () => {
    const base = validMappedRecord();
    expect(() =>
      validateMappedIdentityRecord({
        ...base,
        sourceCode: 'B99.9',
        normalizedIdentityKey: 'ICD10|B99.9',
      }),
    ).toThrow(DiseaseIdentityError);
  });

  it('rejects raw reference inconsistent with raw inputs', () => {
    const raw = buildSyntheticMappedRecord({
      mappedSourceLabel: 'UNKNOWN_NS',
      mappedCodeRaw: 'X001',
    }) as unknown as Record<string, unknown>;
    expect(() =>
      validateMappedIdentityRecord({
        ...raw,
        rawMappedReferenceId: 'ehas2-mdx-raw-v1-' + 'c'.repeat(64),
      }),
    ).toThrow(DiseaseIdentityError);
  });

  it('rejects contradictory provenance variants', () => {
    const base = validMappedRecord();
    expect(() =>
      validateMappedIdentityRecord({
        ...base,
        provenanceVariants: [
          { mappedSourceLabel: 'ICD10', mappedCodeRaw: 'A00.0' },
          { mappedSourceLabel: 'ICD10', mappedCodeRaw: 'B99.9' },
        ],
      }),
    ).toThrow(DiseaseIdentityError);
  });

  it('rejects mismatched record fingerprint', () => {
    const base = validDiseaseRecord();
    expect(() =>
      validateDiseaseIdentityRecord({
        ...base,
        recordFingerprint: 'f'.repeat(64),
      }),
    ).toThrow(DiseaseIdentityError);
  });

  it('recomputes normalization internally in collision registry', () => {
    const registry = new NormalizationCollisionRegistry();
    registry.register('ICD10', 'A01.0');
    expect(() => registry.register('ICD10', 'B99.9')).not.toThrow();
  });

  it('serializes JSONL with canonical key order independent of insertion order', () => {
    const a = { z: 1, a: 2, m: { y: 1, b: 2 } };
    const b = { m: { b: 2, y: 1 }, a: 2, z: 1 };
    const jsonl = serializeJsonl([a, b]);
    const lines = jsonl.trim().split('\n');
    expect(lines[0]).toBe('{"a":2,"m":{"b":2,"y":1},"z":1}');
    expect(lines[0]).toBe(canonicalJsonString(a));
    expect(lines[1]).toBe(canonicalJsonString(b));
    expect(jsonl.endsWith('\n')).toBe(true);
  });

  it('validates fixture batch without duplicate IDs', () => {
    const records: Record<string, unknown>[] = [];
    for (const file of ['exact-unique', 'db-only', 'no-match', 'invalid-namespace']) {
      records.push(
        JSON.parse(readFileSync(path.join(FIXTURE_ROOT, `${file}.json`), 'utf8')) as Record<
          string,
          unknown
        >,
      );
    }
    expect(() => validateAndIndexRecordBatch(records)).not.toThrow();
  });

  it('rejects duplicate record IDs in batch validation', () => {
    const record = validDiseaseRecord(101);
    expect(() => validateAndIndexRecordBatch([record, record])).toThrow(DiseaseIdentityError);
  });
});
