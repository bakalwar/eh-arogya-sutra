import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  writeFileSync,
  rmSync,
  symlinkSync,
  existsSync,
  readFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import {
  ALLOWED_DISEASE_IDENTITY_SQL,
  APPROVED_AGGREGATE_COUNTS,
  assertExternalOutputPath,
  assertExternalOutputPathAsync,
  assertFullCorpusBuildAuthorized,
  assertMinimumFreeBytes,
  assertProductionDbCoverage,
  assertProductionDispositionCounts,
  assertSqlMatchesDiseaseIdentityAllowlist,
  buildFullCorpusArtifacts,
  buildFullCorpusArtifactsSyntheticStreaming,
  BUNDLE_KIND_SYNTHETIC,
  buildPinnedByteSqliteUri,
  compareFullBuilds,
  dedupeMappedRows,
  ESTIMATED_PEAK_MEMORY_BUDGET_BYTES,
  EXPECTED_BRIDGE_ROW_COUNT,
  EXPECTED_LEGACY_DB_DISEASE_COUNT,
  EXPECTED_REFERENCED_UNIQUE_DB_IDS,
  FULL_CORPUS_BUILD_AUTHORIZATION_TOKEN,
  parseBridgeJsonlRow,
  parsePinnedBridgeV3JsonlRow,
  parseBridgeRowForSchema,
  parseJsonObjectRejectDuplicateRootKeys,
  BRIDGE_INGEST_SCHEMA_PINNED_V3,
  BRIDGE_INGEST_SCHEMA_SYNTHETIC,
  PINNED_BRIDGE_V3_REQUIRED_KEYS,
  PINNED_BRIDGE_V3_SHA256,
  PINNED_LEGACY_DB_SHA256,
  PINNED_MAPPED_JSON_SHA256,
  PRODUCTION_BRIDGE_DISPOSITION_COUNTS,
  reconcileBridgeMappedKeys,
  resolveDbRowNamespace,
  streamMappedJsonArrayObjects,
  streamMappedJsonArrayFromAsyncIterable,
  SYNTHETIC_TEST_COMMIT,
  validateBridgeBatch,
  validateBridgeBatchSynthetic,
  validateBridgeBatchProduction,
  writeAtomicBundle,
  verifyFullBundle,
  captureFileIdentity,
  assertFileIdentityUnchanged,
  pinnedByteSqliteOpenOptions,
} from '../src/index.js';
import { ingestBridgeToBuildIndex } from '../../../tools/disease-identity-generator/lib/streamBridgeJsonl.mjs';
import { createProductionBuildIndex } from '../src/productionBuildIndex.js';
import { readLegacyDiseaseRows as readLegacyDiseaseRowsTool } from '../../../tools/disease-identity-generator/lib/readLegacyDb.mjs';

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

function makeSyntheticBridgeRows() {
  return [
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
}

function makeSyntheticMappedEntries() {
  return dedupeMappedRows(
    [
      { source: 'ICD10', code: 'A00.0' },
      { source: 'OMIM', code: '100100' },
      { source: 'ORPHANET', code: '558' },
      { source: 'MESH', code: 'D000001' },
    ],
    { expectedRawRows: 4, expectedUniqueKeys: 4 },
  );
}

async function* chunkString(content: string, size: number): AsyncGenerator<string> {
  for (let i = 0; i < content.length; i += size) {
    yield content.slice(i, i + size);
  }
}

/** Yield chunks split exactly at the given character offsets (must be ascending). */
async function* chunkAtOffsets(
  content: string,
  offsets: readonly number[],
): AsyncGenerator<string> {
  let prev = 0;
  for (const offset of offsets) {
    yield content.slice(prev, offset);
    prev = offset;
  }
  if (prev < content.length) {
    yield content.slice(prev);
  }
}

async function collectMapped(
  chunks: AsyncIterable<string>,
): Promise<Array<{ source: string; code: string }>> {
  const rows = [];
  for await (const row of streamMappedJsonArrayFromAsyncIterable(chunks)) {
    rows.push(row);
  }
  return rows;
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
      const mappedEntries = makeSyntheticMappedEntries();
      const bridgeRows = makeSyntheticBridgeRows();
      const dbIdSet = new Set(dbRows.map((r: { id: number }) => r.id));
      validateBridgeBatchSynthetic(bridgeRows, {
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
          generatorSourceCommit: SYNTHETIC_TEST_COMMIT,
        });

      const first = buildOnce();
      const second = buildOnce();
      expect(first.serialized).toEqual(second.serialized);
      expect(first.buildEvidence.generatorSourceCommit).toBe(SYNTHETIC_TEST_COMMIT);
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
      await verifyFullBundle(outA, { expectedBundleKind: BUNDLE_KIND_SYNTHETIC });
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

  it('parses correctly across artificial chunk sizes 1/2/3/7', async () => {
    const payload = JSON.stringify([
      { source: 'ICD10', code: 'A00.0', note: 'brace { } and "q" and \\x' },
      { source: 'OMIM', code: '100100', name: 'ユニ\u0041' },
      { source: 'MESH', code: 'D000001', esc: 'tab\there' },
    ]);
    for (const size of [1, 2, 3, 7]) {
      const rows = [];
      for await (const row of streamMappedJsonArrayFromAsyncIterable(chunkString(payload, size))) {
        rows.push(row);
      }
      expect(rows).toEqual([
        { source: 'ICD10', code: 'A00.0' },
        { source: 'OMIM', code: '100100' },
        { source: 'MESH', code: 'D000001' },
      ]);
    }
  });

  it('rejects invalid escapes and incomplete unicode escapes across chunks', async () => {
    await expect(async () => {
      for await (const unused of streamMappedJsonArrayFromAsyncIterable(
        chunkString('[{"source":"ICD10","code":"A\\q"}]', 1),
      )) {
        void unused;
      }
    }).rejects.toThrow(/Invalid JSON string escape/);

    await expect(async () => {
      for await (const unused of streamMappedJsonArrayFromAsyncIterable(
        chunkString('[{"source":"ICD10","code":"A\\u00G1"}]', 2),
      )) {
        void unused;
      }
    }).rejects.toThrow(/Invalid JSON unicode escape/);
  });

  it('rejects truncated, trailing, and oversized mapped objects', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ehas2-parser-bad-'));
    const truncated = path.join(dir, 'trunc.json');
    writeFileSync(truncated, '[{"source":"ICD10","code":"A00.0"', 'utf8');
    await expect(async () => {
      for await (const unused of streamMappedJsonArrayObjects(truncated)) {
        void unused;
      }
    }).rejects.toThrow(/not closed|Incomplete|Trailing|Malformed/i);

    const trailing = path.join(dir, 'trail.json');
    writeFileSync(trailing, '[{"source":"ICD10","code":"A00.0"}]{"x":1}', 'utf8');
    await expect(async () => {
      for await (const unused of streamMappedJsonArrayObjects(trailing)) {
        void unused;
      }
    }).rejects.toThrow(/Trailing/);

    const oversized = path.join(dir, 'big.json');
    writeFileSync(
      oversized,
      `[{"source":"ICD10","code":"${'X'.repeat(2000)}","pad":"${'Y'.repeat(2000)}"}]`,
      'utf8',
    );
    await expect(async () => {
      for await (const unused of streamMappedJsonArrayObjects(oversized, {
        maxObjectBytes: 512,
      })) {
        void unused;
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

  it('fails closed when WAL/SHM sidecars exist next to the DB', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ehas2-wal-'));
    const dbPath = makeSyntheticDb(dir);
    writeFileSync(`${dbPath}-wal`, '', 'utf8');
    writeFileSync(`${dbPath}-shm`, '', 'utf8');
    const uri = buildPinnedByteSqliteUri(dbPath);
    expect(uri).toContain('immutable=1');
    expect(uri).toContain('mode=ro');
    const opts = pinnedByteSqliteOpenOptions();
    expect(opts).toEqual({ readonly: true, fileMustExist: true, uri: true });
    expect(() => readLegacyDiseaseRowsTool(dbPath, { expectedCount: 6 })).toThrow(
      /WAL\/SHM sidecars/,
    );
    rmSync(dir, { recursive: true, force: true });
  });

  it('rejects unsafe / non-safe-integer candidate ids', () => {
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
    expect(() =>
      parseBridgeJsonlRow(
        {
          mapped_source_label: 'ICD10',
          mapped_code: 'A00.0',
          recommended_disposition: 'EXACT_UNIQUE_MATCH',
          candidateLegacyDbIds: [0],
        },
        1,
      ),
    ).toThrow(/Invalid bridge candidate/);
    expect(() =>
      parseBridgeJsonlRow(
        {
          mapped_source_label: 'ICD10',
          mapped_code: 'A00.0',
          recommended_disposition: 'EXACT_UNIQUE_MATCH',
          candidateLegacyDbIds: [-1],
        },
        1,
      ),
    ).toThrow(/Invalid bridge candidate/);
  });

  it('rejects bridge unknown/duplicate/oversized candidate ids and reconciles DB sets', () => {
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
      validateBridgeBatchSynthetic(rows, {
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

  it('production validateBridgeBatch rejects non-full-corpus synthetic batches', () => {
    const bridgeRows = makeSyntheticBridgeRows();
    const dbIdSet = new Set([1, 2, 3, 4, 5, 6]);
    expect(() => validateBridgeBatchProduction(bridgeRows, dbIdSet)).toThrow(
      new RegExp(`Expected ${EXPECTED_BRIDGE_ROW_COUNT}`),
    );
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

  it('rejects low free space via injectable adapter using BigInt math', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ehas2-space-'));
    await expect(
      assertMinimumFreeBytes(dir, 1_500_000_000, async () => ({ bavail: 1n, bsize: 4096n })),
    ).rejects.toThrow(/Insufficient free space/);
    const ok = await assertMinimumFreeBytes(dir, 1000, async () => ({
      bavail: 10_000n,
      bsize: 4096n,
    }));
    expect(ok.availableBytes).toBeGreaterThan(1000);
    // Large bigint product must not lose precision via Number coercion before compare.
    const huge = await assertMinimumFreeBytes(dir, 1000, async () => ({
      bavail: 9007199254740991n,
      bsize: 4096n,
    }));
    expect(huge.availableBytes).toBeGreaterThan(1000);
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
    const mappedEntries = makeSyntheticMappedEntries();
    const bridgeRows = makeSyntheticBridgeRows();
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
      generatorSourceCommit: SYNTHETIC_TEST_COMMIT,
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

  it('verifyFullBundle rejects semantic tampers (endpoint / disposition / fingerprint)', async () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-tamper-'));
    const dbRows = readLegacyDiseaseRowsTool(makeSyntheticDb(base), { expectedCount: 6 });
    const artifacts = buildFullCorpusArtifacts({
      dbRows,
      mappedEntries: makeSyntheticMappedEntries(),
      bridgeRows: makeSyntheticBridgeRows(),
      inputEvidenceHashes: {
        legacyDbSha256: sha256('t1'),
        mappedJsonSha256: sha256('t2'),
        bridgeSha256: sha256('t3'),
        note: 'tamper-fixture',
      },
      inventoryVerified: false,
      skipManifestReconciliation: true,
      generatorSourceCommit: SYNTHETIC_TEST_COMMIT,
    });

    const good = path.join(base, 'good');
    await writeAtomicBundle({
      destinationDir: good,
      serialized: artifacts.serialized,
      manifest: artifacts.manifest,
    });
    await verifyFullBundle(good, { expectedBundleKind: BUNDLE_KIND_SYNTHETIC });

    // Tamper relationship endpoint to a non-existent disease id while keeping hashes out of sync
    // by rewriting both file and manifest artifact entry — still fail semantic check.
    const tamperDir = path.join(base, 'tamper-rel');
    mkdirSync(tamperDir);
    for (const [name, content] of Object.entries(artifacts.serialized)) {
      writeFileSync(path.join(tamperDir, name), content, 'utf8');
    }
    const relPath = path.join(tamperDir, 'relationship-edges.jsonl');
    const relLines = readFileSync(relPath, 'utf8').trimEnd().split('\n');
    const relObj = JSON.parse(relLines[0]!) as Record<string, unknown>;
    relObj.ehas2DiseaseId = 'ehas2-dis-v1-' + '0'.repeat(64);
    const tamperedRel = `${JSON.stringify(relObj)}\n`;
    writeFileSync(relPath, tamperedRel, 'utf8');
    // Update manifest hash so hash pass succeeds but semantic endpoint check fails.
    const manifestPath = path.join(tamperDir, 'bundle-manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      artifacts: Array<{ name: string; sha256: string; bytes: number; rowCount: number }>;
      aggregateFingerprint: string;
    };
    const relArtifact = manifest.artifacts.find((a) => a.name === 'relationship-edges.jsonl')!;
    relArtifact.sha256 = sha256(tamperedRel);
    relArtifact.bytes = Buffer.byteLength(tamperedRel, 'utf8');
    manifest.aggregateFingerprint = sha256(
      manifest.artifacts.map((a) => `${a.name}:${a.sha256}`).join('|'),
    );
    // Manifest must be canonical JSON + newline for verify — use JSON.stringify then
    // write; validateBundleManifest may still accept. Semantic check is the target.
    writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`, 'utf8');
    await expect(
      verifyFullBundle(tamperDir, { expectedBundleKind: BUNDLE_KIND_SYNTHETIC }),
    ).rejects.toThrow();

    rmSync(base, { recursive: true, force: true });
  });

  it('parses identically when chunks split inside escapes and unicode sequences', async () => {
    const payload =
      '[{"source":"ICD10","code":"A\\"B\\\\C\\u0041"},{"source":"OMIM","code":"100100"}]';
    const expected = await collectMapped(chunkString(payload, payload.length));

    const backslashAt = payload.indexOf('\\');
    const unicodeU = payload.indexOf('\\u');
    const splitPlans: number[][] = [
      [backslashAt + 1], // after backslash, before escaped quote
      [backslashAt + 2], // after escaped quote opener sequence
      [payload.indexOf('\\\\') + 1], // mid escaped backslash
      [unicodeU + 2], // after \u
      [unicodeU + 3], // after first hex digit
      [unicodeU + 4],
      [unicodeU + 5],
      [unicodeU + 6],
      [1, 2, 3, 7, unicodeU + 2, unicodeU + 5],
    ];

    for (const offsets of splitPlans) {
      const rows = await collectMapped(chunkAtOffsets(payload, offsets));
      expect(rows).toEqual(expected);
      expect(rows[0]).toEqual({ source: 'ICD10', code: 'A"B\\CA' });
    }
  });

  it('rejects production bridge validation without full-corpus invariants', () => {
    const bridgeRows = makeSyntheticBridgeRows();
    const dbIdSet = new Set([1, 2, 3, 4, 5, 6]);

    expect(() => validateBridgeBatch(bridgeRows)).toThrow(/requires dbIdSet/);
    expect(() => validateBridgeBatchProduction(bridgeRows, dbIdSet)).toThrow(
      new RegExp(`Expected ${EXPECTED_BRIDGE_ROW_COUNT}`),
    );

    expect(() =>
      assertProductionDispositionCounts({
        EXACT_UNIQUE_MATCH: 1,
        EXACT_MULTIPLE_MATCH: 1,
        OWNER_REVIEW_REQUIRED: 1,
        NO_MATCH: 1,
      }),
    ).toThrow(/EXACT_UNIQUE count mismatch/);

    expect(() =>
      assertProductionDispositionCounts({
        ...PRODUCTION_BRIDGE_DISPOSITION_COUNTS,
        NO_MATCH: PRODUCTION_BRIDGE_DISPOSITION_COUNTS.NO_MATCH + 1,
      }),
    ).toThrow(/NO_MATCH count mismatch/);

    const tinyReferenced = new Set([1]);
    const tinyDb = new Set([1, 2]);
    expect(() => assertProductionDbCoverage(tinyReferenced, tinyDb)).toThrow(
      new RegExp(`${EXPECTED_REFERENCED_UNIQUE_DB_IDS}`),
    );

    // Build sets with wrong referenced/db-only/total against production constants.
    const fakeReferenced = new Set(
      Array.from({ length: EXPECTED_REFERENCED_UNIQUE_DB_IDS }, (_, i) => i + 1),
    );
    const fakeDbWrongTotal = new Set(
      Array.from({ length: EXPECTED_REFERENCED_UNIQUE_DB_IDS + 1 }, (_, i) => i + 1),
    );
    expect(() => assertProductionDbCoverage(fakeReferenced, fakeDbWrongTotal)).toThrow(
      /DB-only ids/,
    );

    const fakeDbCorrectOnly = new Set(
      Array.from(
        { length: EXPECTED_REFERENCED_UNIQUE_DB_IDS + APPROVED_AGGREGATE_COUNTS.dbOnlyRows },
        (_, i) => i + 1,
      ),
    );
    // Correct coverage sizes but wrong total if we shrink total expectation via wrong set size:
    expect(fakeDbCorrectOnly.size).toBe(EXPECTED_LEGACY_DB_DISEASE_COUNT);
    // Alter referenced count:
    fakeReferenced.delete(1);
    expect(() => assertProductionDbCoverage(fakeReferenced, fakeDbCorrectOnly)).toThrow(
      new RegExp(`${EXPECTED_REFERENCED_UNIQUE_DB_IDS}`),
    );
  });

  it('production builder forbids skip reconciliation and requires generator commit', async () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-prod-api-'));
    const dbRows = readLegacyDiseaseRowsTool(makeSyntheticDb(base), { expectedCount: 6 });
    await expect(
      buildFullCorpusArtifactsSyntheticStreaming({
        dbRows,
        mappedEntries: makeSyntheticMappedEntries().slice(0, 1),
        bridgeRows: makeSyntheticBridgeRows(),
        inputEvidenceHashes: {
          legacyDbSha256: sha256('p1'),
          mappedJsonSha256: sha256('p2'),
          bridgeSha256: sha256('p3'),
        },
        inventoryVerified: false,
        stagingDir: path.join(base, 'staging'),
        generatorSourceCommit: SYNTHETIC_TEST_COMMIT,
      }),
    ).rejects.toThrow(/Bridge|Mapped|mismatch|counterpart/i);

    await expect(
      buildFullCorpusArtifactsSyntheticStreaming({
        dbRows,
        mappedEntries: makeSyntheticMappedEntries(),
        bridgeRows: makeSyntheticBridgeRows(),
        inputEvidenceHashes: {
          legacyDbSha256: sha256('p1'),
          mappedJsonSha256: sha256('p2'),
          bridgeSha256: sha256('p3'),
        },
        inventoryVerified: false,
        stagingDir: path.join(base, 'staging-unset'),
        generatorSourceCommit: 'SOURCE_COMMIT_UNSET',
      }),
    ).rejects.toThrow(/generatorSourceCommit/);
    rmSync(base, { recursive: true, force: true });
  });

  it('fails closed for WAL-only, SHM-only, and both sidecars', () => {
    for (const mode of ['wal', 'shm', 'both'] as const) {
      const dir = mkdtempSync(path.join(tmpdir(), `ehas2-${mode}-`));
      const dbPath = makeSyntheticDb(dir);
      if (mode === 'wal' || mode === 'both') {
        writeFileSync(`${dbPath}-wal`, Buffer.alloc(0));
      }
      if (mode === 'shm' || mode === 'both') {
        writeFileSync(`${dbPath}-shm`, Buffer.alloc(0));
      }
      expect(() => readLegacyDiseaseRowsTool(dbPath, { expectedCount: 6 })).toThrow(
        /WAL\/SHM sidecars/,
      );
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects fractional candidate ids, ATTACH SQL, and alternate queries', () => {
    expect(() =>
      parseBridgeJsonlRow(
        {
          mapped_source_label: 'ICD10',
          mapped_code: 'A00.0',
          recommended_disposition: 'EXACT_UNIQUE_MATCH',
          candidateLegacyDbIds: [1.5],
        },
        1,
      ),
    ).toThrow(/Invalid bridge candidate/);

    expect(() => assertSqlMatchesDiseaseIdentityAllowlist('ATTACH DATABASE "x" AS other')).toThrow(
      /allowlist/,
    );
    expect(() =>
      assertSqlMatchesDiseaseIdentityAllowlist('SELECT id, icd10_code, name_english FROM diseases'),
    ).toThrow(/allowlist/);
    expect(() =>
      assertSqlMatchesDiseaseIdentityAllowlist(ALLOWED_DISEASE_IDENTITY_SQL),
    ).not.toThrow();
  });

  it('documents peak memory as estimate and verifies without loading all member bodies', async () => {
    expect(ESTIMATED_PEAK_MEMORY_BUDGET_BYTES).toBe(512 * 1024 * 1024);
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-bound-'));
    const artifacts = buildFullCorpusArtifacts({
      dbRows: readLegacyDiseaseRowsTool(makeSyntheticDb(base), { expectedCount: 6 }),
      mappedEntries: makeSyntheticMappedEntries(),
      bridgeRows: makeSyntheticBridgeRows(),
      inputEvidenceHashes: {
        legacyDbSha256: sha256('b1'),
        mappedJsonSha256: sha256('b2'),
        bridgeSha256: sha256('b3'),
        note: 'boundedness',
      },
      inventoryVerified: false,
      skipManifestReconciliation: true,
      generatorSourceCommit: SYNTHETIC_TEST_COMMIT,
    });
    const dest = path.join(base, 'bundle');
    await writeAtomicBundle({
      destinationDir: dest,
      serialized: artifacts.serialized,
      manifest: artifacts.manifest,
    });
    // verifyFullBundle streams JSONL line-by-line; success proves no all-body Map requirement.
    await verifyFullBundle(dest, { expectedBundleKind: BUNDLE_KIND_SYNTHETIC });
    rmSync(base, { recursive: true, force: true });
  });

  it('rejects a matrix of semantic tampers beyond hash mismatches', async () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-tamper-matrix-'));
    const artifacts = buildFullCorpusArtifacts({
      dbRows: readLegacyDiseaseRowsTool(makeSyntheticDb(base), { expectedCount: 6 }),
      mappedEntries: makeSyntheticMappedEntries(),
      bridgeRows: makeSyntheticBridgeRows(),
      inputEvidenceHashes: {
        legacyDbSha256: sha256('m1'),
        mappedJsonSha256: sha256('m2'),
        bridgeSha256: sha256('m3'),
        note: 'tamper-matrix',
      },
      inventoryVerified: false,
      skipManifestReconciliation: true,
      generatorSourceCommit: SYNTHETIC_TEST_COMMIT,
    });

    async function cloneBundle(label: string): Promise<string> {
      const dir = path.join(base, label);
      mkdirSync(dir);
      for (const [name, content] of Object.entries(artifacts.serialized)) {
        writeFileSync(path.join(dir, name), content, 'utf8');
      }
      return dir;
    }

    function rewriteManifestHashes(dir: string): void {
      const manifestPath = path.join(dir, 'bundle-manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
        artifacts: Array<{ name: string; sha256: string; bytes: number; rowCount: number }>;
        aggregateFingerprint: string;
      };
      for (const artifact of manifest.artifacts) {
        const body = readFileSync(path.join(dir, artifact.name));
        artifact.sha256 = createHash('sha256').update(body).digest('hex');
        artifact.bytes = body.byteLength;
        if (artifact.name.endsWith('.jsonl')) {
          const text = body.toString('utf8');
          artifact.rowCount = text.trim().length === 0 ? 0 : text.trimEnd().split('\n').length;
        }
      }
      manifest.aggregateFingerprint = sha256(
        manifest.artifacts.map((a) => `${a.name}:${a.sha256}`).join('|'),
      );
      writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`, 'utf8');
    }

    // Non-canonical JSONL (extra spaces) with refreshed hashes — semantic/canonical fail.
    {
      const dir = await cloneBundle('noncanon');
      const ledger = path.join(dir, 'disease-identity-ledger.jsonl');
      const lines = readFileSync(ledger, 'utf8').trimEnd().split('\n');
      const obj = JSON.parse(lines[0]!);
      lines[0] = JSON.stringify(obj, null, 2).replace(/\n/g, ' ');
      writeFileSync(ledger, `${lines.join('\n')}\n`, 'utf8');
      rewriteManifestHashes(dir);
      await expect(
        verifyFullBundle(dir, { expectedBundleKind: BUNDLE_KIND_SYNTHETIC }),
      ).rejects.toThrow();
    }

    // Forged disease id (not recomputed from legacy id).
    {
      const dir = await cloneBundle('forged-disease');
      const ledger = path.join(dir, 'disease-identity-ledger.jsonl');
      const lines = readFileSync(ledger, 'utf8').trimEnd().split('\n');
      const obj = JSON.parse(lines[0]!) as Record<string, unknown>;
      obj.ehas2DiseaseId = 'ehas2-dis-v1-' + 'a'.repeat(64);
      lines[0] = JSON.stringify(obj);
      writeFileSync(ledger, `${lines.join('\n')}\n`, 'utf8');
      rewriteManifestHashes(dir);
      await expect(
        verifyFullBundle(dir, { expectedBundleKind: BUNDLE_KIND_SYNTHETIC }),
      ).rejects.toThrow(/recompute|canonical|fingerprint|order/i);
    }

    // Missing build-evidence artifact.
    {
      const dir = await cloneBundle('no-evidence');
      rmSync(path.join(dir, 'p2c-build-evidence.json'));
      await expect(
        verifyFullBundle(dir, { expectedBundleKind: BUNDLE_KIND_SYNTHETIC }),
      ).rejects.toThrow();
    }

    // Prohibited nested field.
    {
      const dir = await cloneBundle('prohibited');
      const ledger = path.join(dir, 'disease-identity-ledger.jsonl');
      const lines = readFileSync(ledger, 'utf8').trimEnd().split('\n');
      const obj = JSON.parse(lines[0]!) as Record<string, unknown>;
      obj.patientName = 'should-not-exist';
      lines[0] = JSON.stringify(obj);
      writeFileSync(ledger, `${lines.join('\n')}\n`, 'utf8');
      rewriteManifestHashes(dir);
      await expect(
        verifyFullBundle(dir, { expectedBundleKind: BUNDLE_KIND_SYNTHETIC }),
      ).rejects.toThrow();
    }

    // Altered artifact byte count in manifest only (hash still old) — hash/size fail.
    {
      const dir = await cloneBundle('bytes');
      const manifestPath = path.join(dir, 'bundle-manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
        artifacts: Array<{ name: string; sha256: string; bytes: number; rowCount: number }>;
        aggregateFingerprint: string;
      };
      manifest.artifacts[0]!.bytes += 1;
      writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`, 'utf8');
      await expect(
        verifyFullBundle(dir, { expectedBundleKind: BUNDLE_KIND_SYNTHETIC }),
      ).rejects.toThrow();
    }

    // Fabricated edge for a NO_MATCH disposition is impossible on synthetic EXACT_UNIQUE-only
    // edges; deleting an unresolved entry leaves incomplete queue vs mapped dispositions.
    {
      const dir = await cloneBundle('incomplete-queue');
      const q = path.join(dir, 'unresolved-queue.jsonl');
      const lines = readFileSync(q, 'utf8').trimEnd().split('\n');
      writeFileSync(q, `${lines.slice(0, -1).join('\n')}\n`, 'utf8');
      rewriteManifestHashes(dir);
      await expect(
        verifyFullBundle(dir, { expectedBundleKind: BUNDLE_KIND_SYNTHETIC }),
      ).rejects.toThrow();
    }

    rmSync(base, { recursive: true, force: true });
  });
});

function makeSyntheticPinnedV3Row(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    ambiguity: false,
    bridge_id: 'syn-bridge-unique-001',
    candidate_eh_disease_id: 1,
    majority_polarity: 'MIXED',
    mapped_code: 'A00.0',
    mapped_name: 'SyntheticNameOnly',
    match_confidence: 'HIGH',
    match_method: 'exact_code_multinamespace_icd10_code_col',
    polarity_conflict: false,
    polarity_counts: { MIXED: 1 },
    recommended_disposition: 'EXACT_UNIQUE_MATCH',
    source_system: 'ICD10',
    technical_disposition: 'EXACT_UNIQUE_MATCH',
    ...overrides,
  };
}

describe('R2-DATA-P2C-C pinned Bridge V3 actual-schema adapter (synthetic)', () => {
  it('accepts exact 13-key actual V3 row and maps source_system', () => {
    const row = parsePinnedBridgeV3JsonlRow(makeSyntheticPinnedV3Row(), 1);
    expect(Object.keys(makeSyntheticPinnedV3Row()).sort()).toEqual(
      [...PINNED_BRIDGE_V3_REQUIRED_KEYS].sort(),
    );
    expect(row.mappedSourceLabel).toBe('ICD10');
    expect(row.mappedCodeRaw).toBe('A00.0');
    expect(row.disposition).toBe('EXACT_UNIQUE_MATCH');
    expect(row.candidateLegacyDbIds).toEqual([1]);
    expect(row).not.toHaveProperty('bridge_id');
    expect(row).not.toHaveProperty('mapped_name');
    expect(row).not.toHaveProperty('majority_polarity');
    expect(row).not.toHaveProperty('polarity_counts');
    expect(row).not.toHaveProperty('polarity_conflict');
  });

  it('accepts and structurally validates bridge_id uniqueness option', () => {
    const seen = new Set<string>();
    parsePinnedBridgeV3JsonlRow(makeSyntheticPinnedV3Row({ bridge_id: 'id-a' }), 1, {
      seenBridgeIds: seen,
    });
    expect(() =>
      parsePinnedBridgeV3JsonlRow(
        makeSyntheticPinnedV3Row({
          bridge_id: 'id-a',
          mapped_code: 'A00.1',
        }),
        2,
        { seenBridgeIds: seen },
      ),
    ).toThrow(/Duplicate bridge_id/);
  });

  it('rejects missing required key, unknown extra key, and hybrid actual/projected rows', () => {
    const missing = makeSyntheticPinnedV3Row();
    delete missing.bridge_id;
    expect(() => parsePinnedBridgeV3JsonlRow(missing, 1)).toThrow(/exactly 13 keys|Missing/);

    expect(() =>
      parsePinnedBridgeV3JsonlRow({ ...makeSyntheticPinnedV3Row(), extra_field: 1 }, 1),
    ).toThrow(/Unknown bridge field|exactly 13/);

    expect(() =>
      parsePinnedBridgeV3JsonlRow(
        {
          ...makeSyntheticPinnedV3Row(),
          mapped_source_label: 'ICD10',
        } as Record<string, unknown>,
        1,
      ),
    ).toThrow(/Unknown bridge field|exactly 13|Hybrid/);
  });

  it('rejects invalid source_system and case variants', () => {
    expect(() =>
      parsePinnedBridgeV3JsonlRow(makeSyntheticPinnedV3Row({ source_system: 'icd10' }), 1),
    ).toThrow(/Unknown source_system/);
    expect(() =>
      parsePinnedBridgeV3JsonlRow(makeSyntheticPinnedV3Row({ source_system: 'ICD-10' }), 1),
    ).toThrow(/Unknown source_system/);
    expect(() =>
      parsePinnedBridgeV3JsonlRow(makeSyntheticPinnedV3Row({ source_system: '' }), 1),
    ).toThrow(/Unknown source_system/);
  });

  it('enforces disposition-specific candidate number/string/null forms', () => {
    expect(
      parsePinnedBridgeV3JsonlRow(makeSyntheticPinnedV3Row({ candidate_eh_disease_id: 42 }), 1)
        .candidateLegacyDbIds,
    ).toEqual([42]);

    expect(() =>
      parsePinnedBridgeV3JsonlRow(makeSyntheticPinnedV3Row({ candidate_eh_disease_id: '42' }), 1),
    ).toThrow(/positive safe integer/);

    const multi = makeSyntheticPinnedV3Row({
      ambiguity: true,
      bridge_id: 'syn-multi-1',
      candidate_eh_disease_id: '3;1;2',
      match_confidence: 'MEDIUM',
      recommended_disposition: 'EXACT_MULTIPLE_MATCH',
      technical_disposition: 'EXACT_MULTIPLE_MATCH',
    });
    expect(parsePinnedBridgeV3JsonlRow(multi, 1).candidateLegacyDbIds).toEqual([1, 2, 3]);

    const owner = makeSyntheticPinnedV3Row({
      ambiguity: true,
      bridge_id: 'syn-owner-1',
      candidate_eh_disease_id: '9;8',
      match_confidence: 'MEDIUM',
      polarity_conflict: true,
      recommended_disposition: 'OWNER_REVIEW_REQUIRED',
      technical_disposition: 'EXACT_MULTIPLE_MATCH',
    });
    const ownerRow = parsePinnedBridgeV3JsonlRow(owner, 1);
    expect(ownerRow.disposition).toBe('OWNER_REVIEW_REQUIRED');
    expect(ownerRow.candidateLegacyDbIds).toEqual([8, 9]);

    const none = makeSyntheticPinnedV3Row({
      ambiguity: false,
      bridge_id: 'syn-none-1',
      candidate_eh_disease_id: null,
      match_confidence: 'N/A',
      match_method: 'exact_code_failed',
      recommended_disposition: 'NO_MATCH',
      technical_disposition: 'NO_MATCH',
    });
    expect(parsePinnedBridgeV3JsonlRow(none, 1).candidateLegacyDbIds).toEqual([]);
  });

  it('rejects duplicate/unsafe candidates and unexpected disposition pairs', () => {
    expect(() =>
      parsePinnedBridgeV3JsonlRow(
        makeSyntheticPinnedV3Row({
          ambiguity: true,
          candidate_eh_disease_id: '1;1',
          match_confidence: 'MEDIUM',
          recommended_disposition: 'EXACT_MULTIPLE_MATCH',
          technical_disposition: 'EXACT_MULTIPLE_MATCH',
        }),
        1,
      ),
    ).toThrow(/duplicate/i);

    expect(() =>
      parsePinnedBridgeV3JsonlRow(
        makeSyntheticPinnedV3Row({
          ambiguity: true,
          candidate_eh_disease_id: '1;0',
          match_confidence: 'MEDIUM',
          recommended_disposition: 'EXACT_MULTIPLE_MATCH',
          technical_disposition: 'EXACT_MULTIPLE_MATCH',
        }),
        1,
      ),
    ).toThrow(/Unsafe|Invalid/);

    expect(() =>
      parsePinnedBridgeV3JsonlRow(
        makeSyntheticPinnedV3Row({
          recommended_disposition: 'OWNER_REVIEW_REQUIRED',
          technical_disposition: 'OWNER_REVIEW_REQUIRED',
          ambiguity: true,
          polarity_conflict: true,
          match_confidence: 'MEDIUM',
          candidate_eh_disease_id: '1;2',
        }),
        1,
      ),
    ).toThrow(/Unexpected recommended\/technical/);
  });

  it('rejects ambiguity contradiction and malformed match/polarity fields', () => {
    expect(() =>
      parsePinnedBridgeV3JsonlRow(makeSyntheticPinnedV3Row({ ambiguity: true }), 1),
    ).toThrow(/ambiguity contradicts/);

    expect(() =>
      parsePinnedBridgeV3JsonlRow(makeSyntheticPinnedV3Row({ match_method: 'unknown_method' }), 1),
    ).toThrow(/Invalid match_method/);

    expect(() =>
      parsePinnedBridgeV3JsonlRow(
        makeSyntheticPinnedV3Row({
          polarity_counts: { MIXED: 1, UNKNOWN: 2 },
        }),
        1,
      ),
    ).toThrow(/Unknown polarity_counts key/);

    expect(() =>
      parsePinnedBridgeV3JsonlRow(
        makeSyntheticPinnedV3Row({
          polarity_counts: { MIXED: -1 },
        }),
        1,
      ),
    ).toThrow(/Invalid polarity_counts value/);
  });

  it('polarity-value variation yields identical identity outputs with no polarity keys', () => {
    const a = parsePinnedBridgeV3JsonlRow(
      makeSyntheticPinnedV3Row({
        majority_polarity: 'POSITIVE',
        polarity_counts: { POSITIVE: 3 },
      }),
      1,
    );
    const b = parsePinnedBridgeV3JsonlRow(
      makeSyntheticPinnedV3Row({
        bridge_id: 'syn-bridge-unique-002',
        majority_polarity: 'NEGATIVE',
        polarity_counts: { NEGATIVE: 9, MIXED: 1 },
      }),
      2,
    );
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    const serialized = JSON.stringify(a);
    expect(serialized).not.toMatch(/polarity/i);
    expect(serialized).not.toMatch(/majority/i);
    expect(serialized).not.toMatch(/mapped_name|bridge_id|match_method/);
  });

  it('rejects unknown keys before destination creation via production ingest path', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ehas2-v3-ingest-'));
    const indexDir = path.join(dir, 'index');
    mkdirSync(indexDir, { recursive: true });
    let index: ReturnType<typeof createProductionBuildIndex> | undefined;
    let pendingCleanupError: unknown;
    try {
      const bridgePath = path.join(dir, 'bridge.jsonl');
      writeFileSync(
        bridgePath,
        `${JSON.stringify({ ...makeSyntheticPinnedV3Row(), rogue: true })}\n`,
        'utf8',
      );
      index = createProductionBuildIndex(indexDir, {
        mode: 'synthetic-test',
        expectedDbRows: 1,
        expectedMappedRawRows: 1,
        expectedMappedUniqueRows: 1,
        expectedBridgeRows: 1,
      });
      await expect(ingestBridgeToBuildIndex(bridgePath, index)).rejects.toThrow(
        /Unknown bridge field|exactly 13/,
      );
      expect(index.counts().bridgeRows).toBe(0);
    } finally {
      index?.destroy();
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch (error) {
        // Known Windows ENOTEMPTY on SQLite teardown; Linux CI remains authoritative.
        if ((error as NodeJS.ErrnoException).code !== 'ENOTEMPTY') {
          pendingCleanupError = error;
        }
      }
    }
    if (pendingCleanupError !== undefined) {
      throw pendingCleanupError;
    }
  });

  it('production sanitized CLI ingest accepts actual-schema fixture; synthetic schema blocked', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ehas2-v3-ok-'));
    const indexDir = path.join(dir, 'index');
    mkdirSync(indexDir, { recursive: true });
    let index: ReturnType<typeof createProductionBuildIndex> | undefined;
    let pendingCleanupError: unknown;
    try {
      const bridgePath = path.join(dir, 'bridge.jsonl');
      const rows = [
        makeSyntheticPinnedV3Row({
          bridge_id: 'ok-1',
          mapped_code: 'A00.0',
          candidate_eh_disease_id: 1,
        }),
        makeSyntheticPinnedV3Row({
          ambiguity: true,
          bridge_id: 'ok-2',
          mapped_code: '100100',
          source_system: 'OMIM',
          candidate_eh_disease_id: '2;5',
          match_confidence: 'MEDIUM',
          recommended_disposition: 'EXACT_MULTIPLE_MATCH',
          technical_disposition: 'EXACT_MULTIPLE_MATCH',
        }),
        makeSyntheticPinnedV3Row({
          ambiguity: true,
          bridge_id: 'ok-3',
          mapped_code: '558',
          source_system: 'ORPHANET',
          candidate_eh_disease_id: '3;6',
          match_confidence: 'MEDIUM',
          polarity_conflict: true,
          recommended_disposition: 'OWNER_REVIEW_REQUIRED',
          technical_disposition: 'EXACT_MULTIPLE_MATCH',
        }),
        makeSyntheticPinnedV3Row({
          bridge_id: 'ok-4',
          mapped_code: 'D000001',
          source_system: 'MESH',
          candidate_eh_disease_id: null,
          match_confidence: 'N/A',
          match_method: 'exact_code_failed',
          recommended_disposition: 'NO_MATCH',
          technical_disposition: 'NO_MATCH',
        }),
      ];
      writeFileSync(bridgePath, `${rows.map((r) => JSON.stringify(r)).join('\n')}\n`, 'utf8');
      index = createProductionBuildIndex(indexDir, {
        mode: 'synthetic-test',
        expectedDbRows: 6,
        expectedMappedRawRows: 4,
        expectedMappedUniqueRows: 4,
        expectedBridgeRows: 4,
      });
      const result = await ingestBridgeToBuildIndex(bridgePath, index, { maxRows: 4 });
      expect(result.rowCount).toBe(4);
      expect(index.counts().bridgeRows).toBe(4);
      const dispositions = {
        EXACT_UNIQUE_MATCH: index.scalarNumber(
          "SELECT COUNT(*) FROM bridge_entry WHERE disposition='EXACT_UNIQUE_MATCH'",
        ),
        EXACT_MULTIPLE_MATCH: index.scalarNumber(
          "SELECT COUNT(*) FROM bridge_entry WHERE disposition='EXACT_MULTIPLE_MATCH'",
        ),
        OWNER_REVIEW_REQUIRED: index.scalarNumber(
          "SELECT COUNT(*) FROM bridge_entry WHERE disposition='OWNER_REVIEW_REQUIRED'",
        ),
        NO_MATCH: index.scalarNumber(
          "SELECT COUNT(*) FROM bridge_entry WHERE disposition='NO_MATCH'",
        ),
      };
      expect(dispositions).toEqual({
        EXACT_UNIQUE_MATCH: 1,
        EXACT_MULTIPLE_MATCH: 1,
        OWNER_REVIEW_REQUIRED: 1,
        NO_MATCH: 1,
      });
      // Controlled index bridge_entry columns are identity-only (no polarity).
      expect(
        index.scalarNumber(
          "SELECT COUNT(*) FROM pragma_table_info('bridge_entry') WHERE name LIKE '%polar%'",
        ),
      ).toBe(0);

      expect(() =>
        parseBridgeRowForSchema(
          BRIDGE_INGEST_SCHEMA_SYNTHETIC,
          {
            mapped_source_label: 'ICD10',
            mapped_code: 'A00.0',
            recommended_disposition: 'EXACT_UNIQUE_MATCH',
            candidate_eh_disease_id: '1',
          },
          1,
        ),
      ).toThrow(/test-only|cannot enter the production path/);

      expect(
        parseBridgeRowForSchema(
          BRIDGE_INGEST_SCHEMA_SYNTHETIC,
          {
            mapped_source_label: 'ICD10',
            mapped_code: 'A00.0',
            recommended_disposition: 'EXACT_UNIQUE_MATCH',
            candidate_eh_disease_id: '1',
          },
          1,
          { allowSyntheticBridgeSchema: true },
        ).disposition,
      ).toBe('EXACT_UNIQUE_MATCH');

      expect(BRIDGE_INGEST_SCHEMA_PINNED_V3).toBe('pinned-bridge-v3-actual');
      expect(PRODUCTION_BRIDGE_DISPOSITION_COUNTS).toEqual({
        EXACT_UNIQUE_MATCH: 33070,
        EXACT_MULTIPLE_MATCH: 17181,
        OWNER_REVIEW_REQUIRED: 257,
        NO_MATCH: 36,
      });
    } finally {
      index?.destroy();
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOTEMPTY') {
          pendingCleanupError = error;
        }
      }
    }
    if (pendingCleanupError !== undefined) {
      throw pendingCleanupError;
    }
  });

  it('rejects duplicate root JSON keys when detectable', () => {
    expect(() =>
      parseJsonObjectRejectDuplicateRootKeys(
        '{"ambiguity":false,"ambiguity":true,"bridge_id":"x"}',
        1,
      ),
    ).toThrow(/Duplicate bridge JSON key/);
  });
});
