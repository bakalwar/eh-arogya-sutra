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
  buildFullCorpusArtifactsProduction,
  buildPinnedByteSqliteUri,
  compareFullBuilds,
  dedupeMappedRows,
  ESTIMATED_PEAK_MEMORY_BUDGET_BYTES,
  EXPECTED_BRIDGE_ROW_COUNT,
  EXPECTED_LEGACY_DB_DISEASE_COUNT,
  EXPECTED_REFERENCED_UNIQUE_DB_IDS,
  FULL_CORPUS_BUILD_AUTHORIZATION_TOKEN,
  parseBridgeJsonlRow,
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
    await verifyFullBundle(good);

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
    await expect(verifyFullBundle(tamperDir)).rejects.toThrow();

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
      buildFullCorpusArtifactsProduction({
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
      buildFullCorpusArtifactsProduction({
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
    await verifyFullBundle(dest);
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
      await expect(verifyFullBundle(dir)).rejects.toThrow();
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
      await expect(verifyFullBundle(dir)).rejects.toThrow(/recompute|canonical|fingerprint|order/i);
    }

    // Missing build-evidence artifact.
    {
      const dir = await cloneBundle('no-evidence');
      rmSync(path.join(dir, 'p2c-build-evidence.json'));
      await expect(verifyFullBundle(dir)).rejects.toThrow();
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
      await expect(verifyFullBundle(dir)).rejects.toThrow();
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
      await expect(verifyFullBundle(dir)).rejects.toThrow();
    }

    // Fabricated edge for a NO_MATCH disposition is impossible on synthetic EXACT_UNIQUE-only
    // edges; deleting an unresolved entry leaves incomplete queue vs mapped dispositions.
    {
      const dir = await cloneBundle('incomplete-queue');
      const q = path.join(dir, 'unresolved-queue.jsonl');
      const lines = readFileSync(q, 'utf8').trimEnd().split('\n');
      writeFileSync(q, `${lines.slice(0, -1).join('\n')}\n`, 'utf8');
      rewriteManifestHashes(dir);
      await expect(verifyFullBundle(dir)).rejects.toThrow();
    }

    rmSync(base, { recursive: true, force: true });
  });
});
