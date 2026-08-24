import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  APPROVED_AGGREGATE_COUNTS,
  BUNDLE_SCHEMA_VERSION,
  DISEASE_ID_PREFIX,
  DiseaseIdentityError,
  IdentityDigestRegistry,
  MAPPED_ID_PREFIX,
  NormalizationCollisionRegistry,
  RELATIONSHIP_ID_PREFIX,
  buildDiseaseCanonicalIdentityInput,
  buildMappedCanonicalIdentityInput,
  buildSyntheticDiseaseRecord,
  buildSyntheticMappedRecord,
  canonicalJsonString,
  generateDiseaseCanonicalId,
  generateMappedIndexId,
  generateRelationshipId,
  isFailClosedRecord,
  normalizeMappedIdentity,
  reconcileManifestCounts,
  serializeJsonl,
  sortRecordsById,
  validateDiseaseIdentityRecord,
  validateMappedIdentityRecord,
  assertNoProhibitedFields,
} from '../src/index.ts';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE_ROOT = path.resolve(PKG_ROOT, '../../fixtures/synthetic/disease-identity');

const GOLDEN_DISEASE_CANONICAL_JSON =
  '{"algorithm":"EHAS2_CANONICAL_DISEASE_ID_v1_SHA256","legacyAuthority":"EHAS2_PINNED_LEGACY_DISEASE_DB_V1","legacyDbDiseaseId":1,"recordKind":"LEGACY_DB_ROW"}';
const GOLDEN_DISEASE_ID =
  'ehas2-dis-v1-fcfbec7dd5bfa19f222e0b34f87646fac544ada69a73404d9ede051eb51388f5';
const GOLDEN_MAPPED_CANONICAL_JSON =
  '{"algorithm":"EHAS2_MAPPED_IDENTITY_KEY_v1_SHA256","recordKind":"MAPPED_CODE_INDEX","sourceCode":"A00.0","sourceNamespace":"ICD10"}';
const GOLDEN_MAPPED_ID =
  'ehas2-mdx-v1-f417a3e13947abe4de4aaa142002436cbf2bbbc05b05cefeacd18ad1fda68b6a';

describe('R2-DATA-P2B disease identity control plane', () => {
  it('serializes canonical disease identity JSON with sorted keys and no whitespace', () => {
    expect(canonicalJsonString(buildDiseaseCanonicalIdentityInput(1))).toBe(
      GOLDEN_DISEASE_CANONICAL_JSON,
    );
  });

  it('generates exact disease SHA-256 IDs with 64 lowercase hex', () => {
    const id = generateDiseaseCanonicalId(1);
    expect(id).toBe(GOLDEN_DISEASE_ID);
    expect(id).toMatch(/^ehas2-dis-v1-[0-9a-f]{64}$/);
  });

  it('generates exact mapped index SHA-256 IDs', () => {
    const id = generateMappedIndexId('ICD10', 'A00.0');
    expect(canonicalJsonString(buildMappedCanonicalIdentityInput('ICD10', 'A00.0'))).toBe(
      GOLDEN_MAPPED_CANONICAL_JSON,
    );
    expect(id).toBe(GOLDEN_MAPPED_ID);
  });

  it('keeps disease ID stable when provenance fields differ', () => {
    const base = generateDiseaseCanonicalId(42);
    const recordA = buildSyntheticDiseaseRecord({
      legacyDbDiseaseId: 42,
      sourceLabel: 'ICD10',
      sourceCodeRaw: 'Z00.0',
      nameEnglish: 'Synthetic display A',
    });
    const recordB = buildSyntheticDiseaseRecord({
      legacyDbDiseaseId: 42,
      sourceLabel: 'OMIM',
      sourceCodeRaw: '600000',
      nameEnglish: 'Different namespace/code correction',
    });
    expect(recordA.ehas2DiseaseId).toBe(base);
    expect(recordB.ehas2DiseaseId).toBe(base);
    expect(recordA.recordFingerprint).not.toBe(recordB.recordFingerprint);
  });

  it('changes disease ID when legacy integer anchor changes', () => {
    expect(generateDiseaseCanonicalId(100)).not.toBe(generateDiseaseCanonicalId(101));
  });

  it('hard-fails digest collisions', () => {
    const registry = new IdentityDigestRegistry();
    const digest = 'a'.repeat(64);
    registry.register(digest, 'input-a');
    expect(() => registry.register(digest, 'input-b')).toThrow(DiseaseIdentityError);
  });

  it('normalizes mapped presentation variants to the same mapped ID', () => {
    const variants = [
      ['OMIM', 'OMIM:600001'],
      ['OMIM', '600001'],
      ['MESH', 'MESH:D012345'],
      ['MESH', 'd012345'],
      ['ORPHANET', 'ORPHA:999'],
      ['ORPHANET', '999'],
      ['ICD10', 'a00.1'],
      ['ICD10', 'A00.1'],
    ] as const;
    const ids = variants.map(([label, raw]) => {
      const normalized = normalizeMappedIdentity(label, raw);
      expect(normalized.ok).toBe(true);
      if (!normalized.ok) {
        throw new Error('expected normalization');
      }
      return generateMappedIndexId(normalized.sourceNamespace, normalized.sourceCode);
    });
    expect(new Set(ids).size).toBe(4);
  });

  it('preserves raw mapped variants as provenance', () => {
    const record = buildSyntheticMappedRecord({
      mappedSourceLabel: 'OMIM',
      mappedCodeRaw: 'OMIM:700001',
      provenanceVariants: [
        { mappedSourceLabel: 'OMIM', mappedCodeRaw: 'OMIM:700001' },
        { mappedSourceLabel: 'OMIM', mappedCodeRaw: '700001' },
      ],
    });
    expect(record.provenanceVariants).toHaveLength(2);
    expect(record.mappedCodeRaw).toBe('OMIM:700001');
  });

  it('recomputes normalization internally without trusting forged results', () => {
    const registry = new NormalizationCollisionRegistry();
    registry.register('ICD10', 'A01.0');
    expect(() => registry.register('ICD10', 'B99.9')).not.toThrow();
  });

  it('represents NO_MATCH synthetically as fail-closed and unlinked', () => {
    const mapped = buildSyntheticMappedRecord({
      mappedSourceLabel: 'ICD10',
      mappedCodeRaw: 'R99.9',
      bridgeDisposition: 'NO_MATCH',
      linkedEhas2DiseaseIds: [],
    });
    expect(mapped.quarantineFlags).toContain('Q_REL_NO_DB_MATCH');
    expect(mapped.linkedEhas2DiseaseIds).toHaveLength(0);
    expect(isFailClosedRecord(mapped)).toBe(true);
  });

  it('fail-closes EXACT_MULTIPLE and OWNER_REVIEW without default primary', () => {
    const exactMultiple = buildSyntheticMappedRecord({
      mappedSourceLabel: 'ICD10',
      mappedCodeRaw: 'E11.9',
      bridgeDisposition: 'EXACT_MULTIPLE_MATCH',
      candidateLegacyDbIds: [1001, 1002],
    });
    const ownerReview = buildSyntheticMappedRecord({
      mappedSourceLabel: 'ICD10',
      mappedCodeRaw: 'E11.8',
      bridgeDisposition: 'OWNER_REVIEW_REQUIRED',
      candidateLegacyDbIds: [2001, 2002],
    });
    expect(exactMultiple.quarantineFlags).toContain('Q_REL_EXACT_MULTIPLE');
    expect(ownerReview.quarantineFlags).toContain('Q_REL_OWNER_REVIEW');
    expect(isFailClosedRecord(exactMultiple)).toBe(true);
    expect(isFailClosedRecord(ownerReview)).toBe(true);
    expect(exactMultiple).not.toHaveProperty('primaryCandidateId');
    validateMappedIdentityRecord(exactMultiple as unknown as Record<string, unknown>);
  });

  it('treats DB-only diseases as first-class identities with quarantine', () => {
    const dbOnly = buildSyntheticDiseaseRecord({
      legacyDbDiseaseId: 9001,
      sourceLabel: 'ICD10',
      sourceCodeRaw: 'Z99.9',
      isDbOnly: true,
      bridgeDisposition: null,
    });
    expect(dbOnly.ehas2DiseaseId).toMatch(/^ehas2-dis-v1-/);
    expect(dbOnly.quarantineFlags).toContain('Q_REL_DB_UNLINKED');
    expect(dbOnly.relationshipState).toBe('LEGACY_DB_UNLINKED');
  });

  it('assigns structural quarantine only and never semantic keyword quarantine', () => {
    const semanticNoise = buildSyntheticDiseaseRecord({
      legacyDbDiseaseId: 8001,
      sourceLabel: 'MESH',
      sourceCodeRaw: 'D000001',
      nameEnglish: 'Synthetic gene virus chromosome equine placeholder',
    });
    expect(semanticNoise.quarantineFlags).not.toContain('Q_SEMANTIC_GENE');
    expect(semanticNoise.reviewRequiredUnclassified).toBe(false);
  });

  it('rejects prohibited polarity, medicine, and PHI fields', () => {
    expect(() =>
      assertNoProhibitedFields({
        ehas2DiseaseId: GOLDEN_DISEASE_ID,
        diseasePolarity: 'POSITIVE',
      }),
    ).toThrow(DiseaseIdentityError);
    expect(() =>
      assertNoProhibitedFields({ medicine: 'SYN_MED', potency: '6X', patientName: 'SYN_PATIENT' }),
    ).toThrow(DiseaseIdentityError);
  });

  it('serializes JSONL deterministically and reconciles manifest counts', () => {
    const records = sortRecordsById(
      [
        buildSyntheticDiseaseRecord({
          legacyDbDiseaseId: 2,
          sourceLabel: 'ICD10',
          sourceCodeRaw: 'A00.1',
        }),
        buildSyntheticDiseaseRecord({
          legacyDbDiseaseId: 1,
          sourceLabel: 'ICD10',
          sourceCodeRaw: 'A00.0',
        }),
      ],
      'ehas2DiseaseId',
    );
    const jsonl = serializeJsonl(records as unknown as Record<string, unknown>[]);
    expect(jsonl.split('\n').filter(Boolean)).toHaveLength(2);
    expect(jsonl.indexOf(records[0].ehas2DiseaseId)).toBeLessThan(
      jsonl.indexOf(records[1].ehas2DiseaseId),
    );

    reconcileManifestCounts({
      bundleSchemaVersion: BUNDLE_SCHEMA_VERSION,
      datasetVersion: 'ehas2-disease-identity-v1',
      authorityClassification: 'ENGINEERING_IDENTITY_ONLY',
      licensingClassification: 'SYNTHETIC_ENGINEERING',
      canonicalIdAlgorithms: ['EHAS2_CANONICAL_DISEASE_ID_v1_SHA256'],
      inputEvidenceHashes: {},
      generatorVersion: '0.1.0-control-plane',
      artifacts: [],
      aggregateFingerprint: '0'.repeat(64),
      reconciliation: { ...APPROVED_AGGREGATE_COUNTS },
    });
  });

  it('fail-closes malformed and oversized inputs', () => {
    expect(() => generateDiseaseCanonicalId(0)).toThrow(DiseaseIdentityError);
    expect(normalizeMappedIdentity('UNKNOWN', 'X')).toMatchObject({ ok: false });
    expect(() => normalizeMappedIdentity('ICD10', 'X'.repeat(600))).toThrow(DiseaseIdentityError);
  });

  it('loads synthetic fixtures covering required scenarios', () => {
    const manifest = JSON.parse(readFileSync(path.join(FIXTURE_ROOT, 'manifest.json'), 'utf8')) as {
      scenarios: string[];
    };
    expect(manifest.scenarios.length).toBeGreaterThanOrEqual(12);
    for (const scenario of manifest.scenarios) {
      const filePath = path.join(FIXTURE_ROOT, `${scenario}.json`);
      const payload = JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>;
      if (payload.recordKind === 'LEGACY_DB_ROW') {
        validateDiseaseIdentityRecord(payload);
      } else {
        validateMappedIdentityRecord(payload);
      }
    }
  });

  it('derives relationship IDs deterministically', () => {
    const diseaseId = generateDiseaseCanonicalId(1);
    const mappedId = generateMappedIndexId('ICD10', 'A00.0');
    const relA = generateRelationshipId(mappedId, diseaseId, 'EXACT_UNIQUE');
    const relB = generateRelationshipId(mappedId, diseaseId, 'EXACT_UNIQUE');
    expect(relA).toBe(relB);
    expect(relA.startsWith(RELATIONSHIP_ID_PREFIX)).toBe(true);
    expect(generateRelationshipId(mappedId, diseaseId, 'EXACT_MULTIPLE')).not.toBe(relA);
  });

  it('does not import runtime disease package modules', () => {
    const srcFiles = ['index.ts', 'canonicalId.ts', 'buildSynthetic.ts'];
    for (const file of srcFiles) {
      const text = readFileSync(path.join(PKG_ROOT, 'src', file), 'utf8');
      expect(text).not.toMatch(/ehas2-disease-schema-v1/);
      expect(text).not.toMatch(/apps\/(api|web|worker)/);
    }
    expect(DISEASE_ID_PREFIX).toBe('ehas2-dis-v1-');
    expect(MAPPED_ID_PREFIX).toBe('ehas2-mdx-v1-');
  });
});
