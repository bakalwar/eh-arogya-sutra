import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import {
  ALLOWED_DISEASE_IDENTITY_SQL,
  assertExternalOutputPath,
  assertFullCorpusBuildAuthorized,
  assertSqlMatchesDiseaseIdentityAllowlist,
  buildFullCorpusArtifacts,
  compareFullBuilds,
  dedupeMappedRows,
  FULL_CORPUS_BUILD_AUTHORIZATION_TOKEN,
  parseBridgeJsonlRow,
  PINNED_BRIDGE_V3_SHA256,
  PINNED_LEGACY_DB_SHA256,
  PINNED_MAPPED_JSON_SHA256,
  resolveDbRowNamespace,
  validateBridgeBatch,
  writeAtomicBundle,
  verifyFullBundle,
  DiseaseIdentityError,
} from '../src/index.js';

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function makeSyntheticDb(dir: string): string {
  const dbPath = path.join(dir, 'synthetic.db');
  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE diseases (
      id INTEGER PRIMARY KEY,
      icd10_code TEXT,
      name_english TEXT,
      consultations_id INTEGER
    );
    CREATE TABLE consultations (id INTEGER PRIMARY KEY, patient TEXT);
    INSERT INTO diseases (id, icd10_code, name_english) VALUES
      (1, 'A00.0', 'Cholera'),
      (2, 'OMIM:100100', 'OmimRow'),
      (3, 'ORPHA:558', 'OrphaRow'),
      (4, 'MESH:D000001', 'MeshRow'),
      (5, '', 'DbOnlyEmpty'),
      (6, 'ZZZ_UNKNOWN', 'DbOnlyUnresolved');
  `);
  db.close();
  return dbPath;
}

describe('R2-DATA-P2C-A full-corpus tooling (synthetic)', () => {
  it('rejects SQL outside disease-identity allowlist', () => {
    expect(() => assertSqlMatchesDiseaseIdentityAllowlist('SELECT * FROM diseases')).toThrow(
      /outside the approved disease identity allowlist/,
    );
    expect(() =>
      assertSqlMatchesDiseaseIdentityAllowlist('SELECT id, name_english FROM diseases'),
    ).toThrow(/outside the approved disease identity allowlist/);
    expect(() =>
      assertSqlMatchesDiseaseIdentityAllowlist(ALLOWED_DISEASE_IDENTITY_SQL),
    ).not.toThrow();
  });

  it('rejects output paths inside the repository', () => {
    const root = path.resolve('C:/repo/root');
    expect(() => assertExternalOutputPath(root, path.join(root, 'out'))).toThrow(
      /outside the repository/,
    );
    expect(() => assertExternalOutputPath(root, 'C:/external/bundle')).not.toThrow();
  });

  it('requires exact authorization token and input hashes', () => {
    expect(() =>
      assertFullCorpusBuildAuthorized({
        authorizeFullCorpusFlag: true,
        ownerToken: 'WRONG',
        legacyDbSha256: PINNED_LEGACY_DB_SHA256,
        mappedJsonSha256: PINNED_MAPPED_JSON_SHA256,
        bridgeSha256: PINNED_BRIDGE_V3_SHA256,
        legacyDbPath: '/x.db',
        mappedJsonPath: '/m.json',
        bridgePath: '/b.jsonl',
        outputPath: '/out',
      }),
    ).toThrow(/authorization token mismatch/);

    expect(() =>
      assertFullCorpusBuildAuthorized({
        authorizeFullCorpusFlag: false,
        ownerToken: FULL_CORPUS_BUILD_AUTHORIZATION_TOKEN,
        legacyDbSha256: PINNED_LEGACY_DB_SHA256,
        mappedJsonSha256: PINNED_MAPPED_JSON_SHA256,
        bridgeSha256: PINNED_BRIDGE_V3_SHA256,
        legacyDbPath: '/x.db',
        mappedJsonPath: '/m.json',
        bridgePath: '/b.jsonl',
        outputPath: '/out',
      }),
    ).toThrow(/authorize-full-corpus/);
  });

  it('resolves namespaces deterministically without inventing ICD10 for all DB codes', () => {
    expect(
      resolveDbRowNamespace({
        icd10_code: 'A00.0',
        bridgeSourceLabel: null,
        bridgeMappedCodeRaw: null,
        bridgeNamespaces: [],
      }).kind,
    ).toBe('RESOLVED');

    expect(
      resolveDbRowNamespace({
        icd10_code: 'OMIM:100100',
        bridgeSourceLabel: null,
        bridgeMappedCodeRaw: null,
        bridgeNamespaces: [],
      }),
    ).toMatchObject({ kind: 'RESOLVED', reason: 'DB_CODE_PREFIX' });

    expect(
      resolveDbRowNamespace({
        icd10_code: 'ZZZ_UNKNOWN',
        bridgeSourceLabel: null,
        bridgeMappedCodeRaw: null,
        bridgeNamespaces: [],
      }).kind,
    ).toBe('UNRESOLVED');

    expect(
      resolveDbRowNamespace({
        icd10_code: 'A00.0',
        bridgeSourceLabel: 'ICD10',
        bridgeMappedCodeRaw: 'A00.0',
        bridgeNamespaces: ['ICD10'],
      }),
    ).toMatchObject({ kind: 'RESOLVED', reason: 'BRIDGE_EVIDENCED' });
  });

  it('deduplicates mapped rows and rejects count mismatches', () => {
    const rows = [
      { source: 'ICD10', code: 'A00.0' },
      { source: 'ICD10', code: 'A00.0' },
      { source: 'OMIM', code: '100100' },
    ];
    expect(() => dedupeMappedRows(rows)).toThrow(/Expected 102320/);
    const entries = dedupeMappedRows(rows, { expectedRawRows: 3, expectedUniqueKeys: 2 });
    expect(entries).toHaveLength(2);
  });

  it('parses bridge rows and rejects invalid candidate ids / default primary', () => {
    const row = parseBridgeJsonlRow(
      {
        mapped_source_label: 'ICD10',
        mapped_code: 'A00.0',
        recommended_disposition: 'EXACT_UNIQUE_MATCH',
        candidate_eh_disease_id: '1',
      },
      1,
    );
    expect(row.candidateLegacyDbIds).toEqual([1]);
    expect(() =>
      parseBridgeJsonlRow(
        {
          mapped_source_label: 'ICD10',
          mapped_code: 'A00.1',
          recommended_disposition: 'EXACT_UNIQUE_MATCH',
          candidate_eh_disease_id: '1;2',
        },
        2,
      ),
    ).toThrow(/exactly one candidate/);
    expect(() =>
      parseBridgeJsonlRow(
        {
          mapped_source_label: 'ICD10',
          mapped_code: 'A00.2',
          recommended_disposition: 'EXACT_UNIQUE_MATCH',
          candidate_eh_disease_id: '1',
          primaryCandidateId: 1,
        },
        3,
      ),
    ).toThrow(/Unknown bridge field/);
  });

  it('builds deterministic synthetic full-corpus artifacts and compares two builds', async () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-p2c-'));
    try {
      const dbPath = makeSyntheticDb(base);
      const db = new Database(dbPath, { readonly: true, fileMustExist: true });
      const dbRows = db.prepare(ALLOWED_DISEASE_IDENTITY_SQL).all() as Array<{
        id: number;
        icd10_code: string | null;
      }>;
      db.close();

      const mappedEntries = dedupeMappedRows(
        [
          { source: 'ICD10', code: 'A00.0' },
          { source: 'OMIM', code: '100100' },
          { source: 'ORPHANET', code: '558' },
          { source: 'MESH', code: 'D000001' },
        ],
        { expectedRawRows: 4, expectedUniqueKeys: 4 },
      );

      const bridgeRows = [
        parseBridgeJsonlRow(
          {
            mapped_source_label: 'ICD10',
            mapped_code: 'A00.0',
            recommended_disposition: 'EXACT_UNIQUE_MATCH',
            candidate_eh_disease_id: '1',
          },
          1,
        ),
        parseBridgeJsonlRow(
          {
            mapped_source_label: 'OMIM',
            mapped_code: '100100',
            recommended_disposition: 'EXACT_MULTIPLE_MATCH',
            candidate_eh_disease_id: '2;5',
          },
          2,
        ),
        parseBridgeJsonlRow(
          {
            mapped_source_label: 'ORPHANET',
            mapped_code: '558',
            recommended_disposition: 'OWNER_REVIEW_REQUIRED',
            candidate_eh_disease_id: '3;6',
          },
          3,
        ),
        parseBridgeJsonlRow(
          {
            mapped_source_label: 'MESH',
            mapped_code: 'D000001',
            recommended_disposition: 'NO_MATCH',
            candidate_eh_disease_id: '',
          },
          4,
        ),
      ];
      validateBridgeBatch(bridgeRows, { expectedRowCount: 4 });

      const buildOnce = () =>
        buildFullCorpusArtifacts({
          dbRows,
          mappedEntries,
          bridgeRows,
          inputEvidenceHashes: {
            legacyDbSha256: sha256('synthetic-db'),
            mappedJsonSha256: sha256('synthetic-mapped'),
            bridgeSha256: sha256('synthetic-bridge'),
            note: 'synthetic fixture hashes',
          },
          inventoryVerified: false,
          skipManifestReconciliation: true,
        });

      const first = buildOnce();
      const second = buildOnce();
      expect(first.serialized).toEqual(second.serialized);
      expect(first.relationshipEdges).toHaveLength(1);
      expect(first.unresolvedQueue).toHaveLength(3);
      expect(first.diseaseRecords).toHaveLength(6);
      expect(first.mappedRecords).toHaveLength(4);

      const outA = path.join(base, 'bundle-a');
      const outB = path.join(base, 'bundle-b');
      await writeAtomicBundle({
        destinationDir: outA,
        serialized: first.serialized,
        manifest: first.manifest,
      });
      await writeAtomicBundle({
        destinationDir: outB,
        serialized: second.serialized,
        manifest: second.manifest,
      });
      await verifyFullBundle(outA);
      await compareFullBuilds(outA, outB);

      await expect(
        writeAtomicBundle({
          destinationDir: outA,
          serialized: first.serialized,
          manifest: first.manifest,
        }),
      ).rejects.toThrow(/already exists/);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });
});
