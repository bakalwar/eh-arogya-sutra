import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  writeFileSync,
  rmSync,
  symlinkSync,
  readFileSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import {
  ALLOWED_DISEASE_IDENTITY_SQL,
  assertExternalOutputPath,
  assertExternalOutputPathAsync,
  assertFullCorpusBuildAuthorized,
  assertMinimumFreeBytes,
  assertSqlMatchesDiseaseIdentityAllowlist,
  buildFullCorpusArtifacts,
  buildPinnedByteSqliteUri,
  compareFullBuilds,
  dedupeMappedRows,
  FULL_CORPUS_BUILD_AUTHORIZATION_TOKEN,
  parseBridgeJsonlRow,
  PINNED_BRIDGE_V3_SHA256,
  PINNED_LEGACY_DB_SHA256,
  PINNED_MAPPED_JSON_SHA256,
  reconcileBridgeMappedKeys,
  resolveDbRowNamespace,
  streamMappedJsonArrayObjects,
  validateBridgeBatch,
  writeAtomicBundle,
  verifyFullBundle,
  captureFileIdentity,
  assertFileIdentityUnchanged,
} from '../src/index.js';
import { readLegacyDiseaseRows as readLegacyDiseaseRowsTool } from '../../../tools/disease-identity-generator/lib/readLegacyDb.mjs';

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function makeSyntheticDb(dir: string, options?: { expectedCountOverride?: boolean }): string {
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
      const dbRows = readLegacyDiseaseRowsTool(dbPath, { expectedCount: 6 });

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
      const dbIdSet = new Set(dbRows.map((r: { id: number }) => r.id));
      validateBridgeBatch(bridgeRows, {
        expectedRowCount: 4,
        dbIdSet,
        expectedReferencedDbIds: 5,
        expectedDbOnlyIds: 1,
        expectedDispositionCounts: {
          EXACT_UNIQUE_MATCH: 1,
          EXACT_MULTIPLE_MATCH: 1,
          OWNER_REVIEW_REQUIRED: 1,
          NO_MATCH: 1,
        },
      });

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

describe('R2-DATA-P2C-A tooling safety hardening', () => {
  it('parses mapped.json with braces/quotes/escapes/unicode inside strings', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ehas2-parser-'));
    const file = path.join(dir, 'mapped.json');
    writeFileSync(
      file,
      JSON.stringify([
        { source: 'ICD10', code: 'A00.0', note: 'has { brace } and "quote" and \\ backslash' },
        { source: 'OMIM', code: '100100', nested: { deep: [{ x: '}' }] }, name: 'ユニコード' },
      ]),
      'utf8',
    );
    const rows = [];
    for await (const row of streamMappedJsonArrayObjects(file)) {
      rows.push(row);
    }
    expect(rows).toEqual([
      { source: 'ICD10', code: 'A00.0' },
      { source: 'OMIM', code: '100100' },
    ]);
    rmSync(dir, { recursive: true, force: true });
  });

  it('rejects truncated, trailing, and oversized mapped objects', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ehas2-parser-bad-'));
    const truncated = path.join(dir, 'trunc.json');
    writeFileSync(truncated, '[{"source":"ICD10","code":"A00.0"', 'utf8');
    await expect(async () => {
      for await (const _ of streamMappedJsonArrayObjects(truncated)) {
        // drain
      }
    }).rejects.toThrow(/not closed|Incomplete|Trailing|Malformed/i);

    const trailing = path.join(dir, 'trail.json');
    writeFileSync(trailing, '[{"source":"ICD10","code":"A00.0"}]{"x":1}', 'utf8');
    await expect(async () => {
      for await (const _ of streamMappedJsonArrayObjects(trailing)) {
        // drain
      }
    }).rejects.toThrow(/Trailing/);

    const oversized = path.join(dir, 'big.json');
    writeFileSync(
      oversized,
      `[{"source":"ICD10","code":"${'X'.repeat(2000)}","pad":"${'Y'.repeat(2000)}"}]`,
      'utf8',
    );
    await expect(async () => {
      for await (const _ of streamMappedJsonArrayObjects(oversized, { maxObjectBytes: 512 })) {
        // drain
      }
    }).rejects.toThrow(/maxObjectBytes/);
    rmSync(dir, { recursive: true, force: true });
  });

  it('reads sqlite via pinned-byte immutable URI and iterates rows', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ehas2-sqlite-'));
    const dbPath = makeSyntheticDb(dir);
    const uri = buildPinnedByteSqliteUri(dbPath);
    expect(uri).toContain('immutable=1');
    expect(uri).toContain('mode=ro');
    const rows = readLegacyDiseaseRowsTool(dbPath, { expectedCount: 6 });
    expect(rows).toHaveLength(6);
    expect(rows[0]).toEqual({ id: 1, icd10_code: 'A00.0' });
    rmSync(dir, { recursive: true, force: true });
  });

  it('rejects bridge unknown/duplicate/oversized/unsafe candidate ids and reconciles DB sets', () => {
    expect(() =>
      parseBridgeJsonlRow(
        {
          mapped_source_label: 'ICD10',
          mapped_code: 'A00.0',
          recommended_disposition: 'EXACT_UNIQUE_MATCH',
          candidateLegacyDbIds: [1, 1],
        },
        1,
      ),
    ).toThrow(/duplicate/i);

    expect(() =>
      parseBridgeJsonlRow(
        {
          mapped_source_label: 'ICD10',
          mapped_code: 'A00.0',
          recommended_disposition: 'EXACT_MULTIPLE_MATCH',
          candidateLegacyDbIds: Array.from({ length: 65 }, (_, i) => i + 1),
        },
        1,
      ),
    ).toThrow(/64/);

    expect(() =>
      parseBridgeJsonlRow(
        {
          mapped_source_label: 'ICD10',
          mapped_code: 'A00.0',
          recommended_disposition: 'EXACT_UNIQUE_MATCH',
          candidateLegacyDbIds: [Number.MAX_SAFE_INTEGER + 1],
        },
        1,
      ),
    ).toThrow(/Invalid bridge candidate/);

    const rows = [
      parseBridgeJsonlRow(
        {
          mapped_source_label: 'ICD10',
          mapped_code: 'A00.0',
          recommended_disposition: 'EXACT_UNIQUE_MATCH',
          candidate_eh_disease_id: '99',
        },
        1,
      ),
    ];
    expect(() =>
      validateBridgeBatch(rows, {
        expectedRowCount: 1,
        dbIdSet: new Set([1]),
        expectedReferencedDbIds: 1,
        expectedDbOnlyIds: 0,
        expectedDispositionCounts: {
          EXACT_UNIQUE_MATCH: 1,
          EXACT_MULTIPLE_MATCH: 0,
          OWNER_REVIEW_REQUIRED: 0,
          NO_MATCH: 0,
        },
      }),
    ).toThrow(/not present in the disease DB/);
  });

  it('hard-fails bridge/mapped key mismatch and missing exact-unique relationship', () => {
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
    ];
    expect(() =>
      reconcileBridgeMappedKeys({
        bridgeRows,
        mappedDedupeKeys: ['OMIM\u0000100100'],
      }),
    ).toThrow(/Bridge-only|Mapped-only|mismatch/);
  });

  it('uses ambiguous bridge evidence and flags namespace conflicts without picking a disease', () => {
    const ambiguous = resolveDbRowNamespace({
      icd10_code: 'A00.0',
      bridgeEvidenceRows: [
        { sourceLabel: 'ICD10', mappedCodeRaw: 'A00.0' },
        { sourceLabel: 'ICD10', mappedCodeRaw: 'A00.1' },
      ],
    });
    expect(ambiguous).toMatchObject({ kind: 'RESOLVED', reason: 'BRIDGE_EVIDENCED' });

    const conflict = resolveDbRowNamespace({
      icd10_code: 'A00.0',
      bridgeEvidenceRows: [
        { sourceLabel: 'ICD10', mappedCodeRaw: 'A00.0' },
        { sourceLabel: 'OMIM', mappedCodeRaw: '100100' },
      ],
    });
    expect(conflict).toMatchObject({ kind: 'UNRESOLVED', reason: 'NAMESPACE_CONFLICT' });
    expect(conflict.sourceCodeRaw).toBeNull();
  });

  it('rejects low free space via injectable adapter', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ehas2-space-'));
    await expect(
      assertMinimumFreeBytes(dir, 1_500_000_000, async () => ({ bavail: 1n, bsize: 4096n })),
    ).rejects.toThrow(/Insufficient free space/);
    const ok = await assertMinimumFreeBytes(dir, 1000, async () => ({
      bavail: 10_000n,
      bsize: 4096n,
    }));
    expect(ok.availableBytes).toBeGreaterThan(1000);
    rmSync(dir, { recursive: true, force: true });
  });

  it('rejects symlink escape into the repository when supported', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'ehas2-repo-'));
    const outside = mkdtempSync(path.join(tmpdir(), 'ehas2-out-'));
    mkdirSync(path.join(root, 'inside'));
    const link = path.join(outside, 'escape-link');
    try {
      symlinkSync(path.join(root, 'inside'), link, 'junction');
    } catch (error) {
      rmSync(root, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
      // Skip only with explicit platform reason
      expect(String(error)).toMatch(/EPERM|EINVAL|platform|privilege|not supported/i);
      return;
    }
    await expect(assertExternalOutputPathAsync(root, path.join(link, 'bundle'))).rejects.toThrow(
      /outside the repository/,
    );
    rmSync(root, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  });

  it('detects input replacement via identity snapshots', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ehas2-race-'));
    const file = path.join(dir, 'input.json');
    writeFileSync(file, '[]', 'utf8');
    const before = await captureFileIdentity(file);
    writeFileSync(file, '[{}]', 'utf8');
    await expect(assertFileIdentityUnchanged(file, before)).rejects.toThrow(/changed during/);
    rmSync(dir, { recursive: true, force: true });
  });

  it('rejects staging corruption before promotion (byte-identical two-build still holds)', async () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-stage-'));
    const dbRows = readLegacyDiseaseRowsTool(makeSyntheticDb(base), { expectedCount: 6 });
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
    const artifacts = buildFullCorpusArtifacts({
      dbRows,
      mappedEntries,
      bridgeRows,
      inputEvidenceHashes: {
        legacyDbSha256: sha256('a'),
        mappedJsonSha256: sha256('b'),
        bridgeSha256: sha256('c'),
        note: 'synthetic',
      },
      inventoryVerified: false,
      skipManifestReconciliation: true,
    });

    const corrupted = {
      ...artifacts.serialized,
      'relationship-edges.jsonl': `${artifacts.serialized['relationship-edges.jsonl']}CORRUPT\n`,
    };
    const dest = path.join(base, 'bad-bundle');
    await expect(
      writeAtomicBundle({
        destinationDir: dest,
        serialized: corrupted,
        manifest: artifacts.manifest,
      }),
    ).rejects.toThrow();
    expect(existsSync(dest)).toBe(false);

    const goodA = path.join(base, 'good-a');
    const goodB = path.join(base, 'good-b');
    await writeAtomicBundle({
      destinationDir: goodA,
      serialized: artifacts.serialized,
      manifest: artifacts.manifest,
    });
    await writeAtomicBundle({
      destinationDir: goodB,
      serialized: artifacts.serialized,
      manifest: artifacts.manifest,
    });
    await compareFullBuilds(goodA, goodB);
    rmSync(base, { recursive: true, force: true });
  });
});
