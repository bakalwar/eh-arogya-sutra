import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import {
  assertFullCorpusBuildAuthorized,
  assertProductionGeneratorReady,
  BUNDLE_KIND_PRODUCTION,
  BUNDLE_KIND_SYNTHETIC,
  buildFullCorpusArtifactsBoundedSyntheticDisk,
  createBoundedBuildInstrumentation,
  createProductionBuildIndex,
  FULL_CORPUS_BUILD_AUTHORIZATION_TOKEN,
  parseBridgeJsonlRow,
  PINNED_BRIDGE_V3_SHA256,
  PINNED_LEGACY_DB_SHA256,
  PINNED_MAPPED_JSON_SHA256,
  streamDedupeMappedJsonFileWithConsumedDigest,
  verifyFullBundle,
  writeAtomicBundle,
} from '../src/index.js';
import {
  openPinnedDb,
  streamLegacyDiseaseRowsToJsonl,
} from '../../../tools/disease-identity-generator/lib/readLegacyDb.mjs';

const FAKE_COMMIT = 'a'.repeat(40);

function sha256(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

function makeSyntheticDb(dir: string): string {
  const dbPath = path.join(dir, 'synthetic.db');
  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE diseases (
      id INTEGER PRIMARY KEY,
      icd10_code TEXT,
      name_english TEXT
    );
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

function seedSyntheticIndex(dir: string) {
  const index = createProductionBuildIndex(dir, {
    mode: 'synthetic-test',
    expectedDbRows: 6,
    expectedMappedRawRows: 4,
    expectedMappedUniqueRows: 4,
    expectedBridgeRows: 4,
  });
  for (const row of [
    { id: 1, icd10_code: 'A00.0' },
    { id: 2, icd10_code: 'OMIM:100100' },
    { id: 3, icd10_code: 'ORPHA:558' },
    { id: 4, icd10_code: 'MESH:D000001' },
    { id: 5, icd10_code: '' },
    { id: 6, icd10_code: 'ZZZ_UNKNOWN' },
  ]) {
    index.insertDbRow(row);
  }
  for (const row of [
    { source: 'ICD10', code: 'A00.0' },
    { source: 'OMIM', code: '100100' },
    { source: 'ORPHANET', code: '558' },
    { source: 'MESH', code: 'D000001' },
  ]) {
    index.insertMappedRow(row);
  }
  const bridges = [
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
  for (const bridge of bridges) {
    index.insertBridgeRow(bridge);
  }
  index.enforceConfiguredCounts();
  return index;
}

function initTempGitRepo(dir: string, commitMessage = 'init'): string {
  execFileSync('git', ['init'], { cwd: dir, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir, stdio: 'ignore' });
  writeFileSync(path.join(dir, 'README'), 'x\n', 'utf8');
  execFileSync('git', ['add', 'README'], { cwd: dir, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', commitMessage], { cwd: dir, stdio: 'ignore' });
  execFileSync(
    'git',
    ['remote', 'add', 'ehas2', 'https://github.com/bakalwar/EH_AROGYA_SUTRA_2.git'],
    { cwd: dir, stdio: 'ignore' },
  );
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).trim();
}

describe('R2-DATA-P2C-A bounded production architecture', () => {
  it('same-stream mapped digest matches one-byte chunking and rejects mutation', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ehas2-mapped-digest-'));
    const file = path.join(dir, 'mapped.json');
    const payload = JSON.stringify([
      { source: 'ICD10', code: 'A00.0' },
      { source: 'OMIM', code: '100100' },
    ]);
    writeFileSync(file, payload, 'utf8');
    const expected = sha256(payload);
    const result = await streamDedupeMappedJsonFileWithConsumedDigest(file, {
      expectedRawRows: 2,
      expectedUniqueKeys: 2,
    });
    expect(result.consumedSha256).toBe(expected);
    expect(result.consumedBytes).toBe(Buffer.byteLength(payload));
    expect(result.rawRowCount).toBe(2);

    writeFileSync(file, payload.slice(0, Math.floor(payload.length / 2)), 'utf8');
    await expect(
      streamDedupeMappedJsonFileWithConsumedDigest(file, {
        expectedRawRows: 2,
        expectedUniqueKeys: 2,
      }),
    ).rejects.toThrow();

    rmSync(dir, { recursive: true, force: true });
  });

  it('production CLI source no longer reconstructs dbRows[] or bridgeIndex.rows()', async () => {
    const cliPath = path.resolve(
      process.cwd(),
      'tools/disease-identity-generator/lib/fullCorpusCommands.mjs',
    );
    const source = readFileSync(cliPath, 'utf8');
    expect(source).not.toMatch(/const dbRows = \[\]/);
    expect(source).not.toMatch(/bridgeIndex\.rows\(\)/);
    expect(source).not.toMatch(/hashingReadStream\(args\['mapped-json'\]\)/);
    expect(source).toMatch(/streamDedupeMappedJsonFileWithConsumedDigest/);
    expect(source).toMatch(/buildFullCorpusArtifactsBoundedProduction/);
    expect(source).toMatch(/assertProductionGeneratorReady/);
    expect(source).toMatch(/expectedBundleKind: BUNDLE_KIND_PRODUCTION/);
  });

  it('disk-backed synthetic orchestration streams without full collection flags', async () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-disk-build-'));
    const index = seedSyntheticIndex(path.join(base, 'index'));
    const instrumentation = createBoundedBuildInstrumentation();
    const stagingDir = path.join(base, 'staging');
    mkdirSync(stagingDir);
    const result = await buildFullCorpusArtifactsBoundedSyntheticDisk({
      index,
      stagingDir,
      inputEvidenceHashes: {
        legacyDbSha256: sha256('d'),
        mappedJsonSha256: sha256('m'),
        bridgeSha256: sha256('b'),
        note: 'disk-synthetic',
      },
      inventoryVerified: false,
      generatorSourceCommit: FAKE_COMMIT,
      expectedGeneratorCommit: FAKE_COMMIT,
      instrumentation,
    });
    expect(result.manifest.bundleKind).toBe(BUNDLE_KIND_SYNTHETIC);
    expect(instrumentation.dbRowsArrayCreated).toBe(false);
    expect(instrumentation.bridgeArrayCreated).toBe(false);
    expect(instrumentation.diseaseArrayCreated).toBe(false);
    expect(instrumentation.dbRowsStreamed).toBe(6);
    expect(instrumentation.mappedRowsStreamed).toBe(4);
    expect(instrumentation.relationshipRowsStreamed).toBe(1);
    expect(instrumentation.unresolvedRowsStreamed).toBe(3);

    const dest = path.join(base, 'bundle');
    await writeAtomicBundle({
      destinationDir: dest,
      stagingDir: result.stagingDir,
      serialized: result.serialized,
      manifest: result.manifest,
    });
    await verifyFullBundle(dest, { expectedBundleKind: BUNDLE_KIND_SYNTHETIC });
    await expect(
      verifyFullBundle(dest, { expectedBundleKind: BUNDLE_KIND_PRODUCTION }),
    ).rejects.toThrow(/Bundle kind/);
    index.destroy();
    rmSync(base, { recursive: true, force: true });
  });

  it('unauthorized full build authorization fails before ingestion', () => {
    expect(() =>
      assertFullCorpusBuildAuthorized({
        authorizeFullCorpusFlag: false,
        ownerToken: FULL_CORPUS_BUILD_AUTHORIZATION_TOKEN,
        legacyDbSha256: PINNED_LEGACY_DB_SHA256,
        mappedJsonSha256: PINNED_MAPPED_JSON_SHA256,
        bridgeSha256: PINNED_BRIDGE_V3_SHA256,
        legacyDbPath: 'x',
        mappedJsonPath: 'y',
        bridgePath: 'z',
        outputPath: 'o',
      }),
    ).toThrow(/authorize|AUTHORIZATION|token|authorized/i);
  });

  it('generator gate rejects dirty tree, wrong commit, and wrong remote', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ehas2-git-gate-'));
    const head = initTempGitRepo(dir);
    expect(() =>
      assertProductionGeneratorReady({
        repoRoot: dir,
        expectedGeneratorCommit: 'b'.repeat(40),
      }),
    ).toThrow(/does not match/);

    writeFileSync(path.join(dir, 'README'), 'dirty\n', 'utf8');
    expect(() =>
      assertProductionGeneratorReady({
        repoRoot: dir,
        expectedGeneratorCommit: head,
      }),
    ).toThrow(/clean/);

    execFileSync('git', ['checkout', '--', 'README'], { cwd: dir, stdio: 'ignore' });
    execFileSync('git', ['remote', 'set-url', 'ehas2', 'https://github.com/other/repo.git'], {
      cwd: dir,
      stdio: 'ignore',
    });
    expect(() =>
      assertProductionGeneratorReady({
        repoRoot: dir,
        expectedGeneratorCommit: head,
      }),
    ).toThrow(/EH_AROGYA_SUTRA_2/);

    rmSync(dir, { recursive: true, force: true });
  });

  it('foreign destination created after pre-check survives publication failure', async () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-foreign-dest-'));
    const index = seedSyntheticIndex(path.join(base, 'index'));
    const stagingDir = path.join(base, 'staging');
    mkdirSync(stagingDir);
    const artifacts = await buildFullCorpusArtifactsBoundedSyntheticDisk({
      index,
      stagingDir,
      inputEvidenceHashes: {
        legacyDbSha256: sha256('fd1'),
        mappedJsonSha256: sha256('fd2'),
        bridgeSha256: sha256('fd3'),
      },
      inventoryVerified: false,
      generatorSourceCommit: FAKE_COMMIT,
      expectedGeneratorCommit: FAKE_COMMIT,
    });
    const dest = path.join(base, 'foreign-bundle');
    const sentinel = path.join(dest, 'FOREIGN_SENTINEL.txt');
    await expect(
      writeAtomicBundle({
        destinationDir: dest,
        stagingDir: artifacts.stagingDir,
        serialized: artifacts.serialized,
        manifest: artifacts.manifest,
        testOnlyBeforeRename: async () => {
          mkdirSync(dest);
          await writeFile(sentinel, 'do-not-delete\n', 'utf8');
        },
      }),
    ).rejects.toThrow();
    expect(existsSync(dest)).toBe(true);
    expect(readFileSync(sentinel, 'utf8')).toBe('do-not-delete\n');
    index.destroy();
    rmSync(base, { recursive: true, force: true });
  });

  it('unactivated staging without marker is rejected by verifier', async () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-unactivated-'));
    const index = seedSyntheticIndex(path.join(base, 'index'));
    const stagingDir = path.join(base, 'staging');
    mkdirSync(stagingDir);
    const artifacts = await buildFullCorpusArtifactsBoundedSyntheticDisk({
      index,
      stagingDir,
      inputEvidenceHashes: {
        legacyDbSha256: sha256('u1'),
        mappedJsonSha256: sha256('u2'),
        bridgeSha256: sha256('u3'),
      },
      inventoryVerified: false,
      generatorSourceCommit: FAKE_COMMIT,
      expectedGeneratorCommit: FAKE_COMMIT,
    });
    await expect(
      verifyFullBundle(artifacts.stagingDir, {
        expectedBundleKind: BUNDLE_KIND_SYNTHETIC,
        requireActivationMarker: true,
      }),
    ).rejects.toThrow();
    index.destroy();
    rmSync(base, { recursive: true, force: true });
  });

  it('array synthetic bundle cannot satisfy production expectedBundleKind', async () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-kind-'));
    const db = new Database(path.join(base, 'db.sqlite'));
    db.exec(`
      CREATE TABLE diseases (id INTEGER PRIMARY KEY, icd10_code TEXT);
      INSERT INTO diseases VALUES (1,'A00.0'),(2,'OMIM:100100'),(3,'ORPHA:558'),
        (4,'MESH:D000001'),(5,''),(6,'ZZZ');
    `);
    db.close();
    // Reuse tooling test helpers via bounded seed path instead.
    const index = seedSyntheticIndex(path.join(base, 'index'));
    const stagingDir = path.join(base, 'staging');
    mkdirSync(stagingDir);
    const artifacts = await buildFullCorpusArtifactsBoundedSyntheticDisk({
      index,
      stagingDir,
      inputEvidenceHashes: {
        legacyDbSha256: sha256('k1'),
        mappedJsonSha256: sha256('k2'),
        bridgeSha256: sha256('k3'),
      },
      inventoryVerified: false,
      generatorSourceCommit: FAKE_COMMIT,
      expectedGeneratorCommit: FAKE_COMMIT,
    });
    const dest = path.join(base, 'out');
    await writeAtomicBundle({
      destinationDir: dest,
      stagingDir: artifacts.stagingDir,
      serialized: artifacts.serialized,
      manifest: artifacts.manifest,
    });
    await expect(
      verifyFullBundle(dest, { expectedBundleKind: BUNDLE_KIND_PRODUCTION }),
    ).rejects.toThrow(/Bundle kind|Full-corpus/);
    index.destroy();
    rmSync(base, { recursive: true, force: true });
  });

  it('mid-iteration SQLite JSONL failure closes stream and rejects partial spool', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ehas2-sqlite-fail-'));
    const dbPath = makeSyntheticDb(dir);
    const outPath = path.join(dir, 'partial.jsonl');
    await expect(
      streamLegacyDiseaseRowsToJsonl(dbPath, outPath, {
        expectedCount: 6,
        testOnlyFailAfterRows: 2,
      }),
    ).rejects.toThrow(/test-only mid-iteration/);
    expect(existsSync(outPath)).toBe(false);
    rmSync(dir, { recursive: true, force: true });
  });

  it('URI-open failure falls back to readonly when WAL/SHM absent', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ehas2-uri-fallback-'));
    const dbPath = makeSyntheticDb(dir);
    const { db, usedImmutableUri } = openPinnedDb(dbPath, { testOnlyForceUriFailure: true });
    expect(usedImmutableUri).toBe(false);
    const rows = db.prepare('SELECT id, icd10_code FROM diseases ORDER BY id ASC').all();
    expect(rows).toHaveLength(6);
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('semantic verification failure never activates destination', async () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-semfail-'));
    const index = seedSyntheticIndex(path.join(base, 'index'));
    const stagingDir = path.join(base, 'staging');
    mkdirSync(stagingDir);
    const artifacts = await buildFullCorpusArtifactsBoundedSyntheticDisk({
      index,
      stagingDir,
      inputEvidenceHashes: {
        legacyDbSha256: sha256('s1'),
        mappedJsonSha256: sha256('s2'),
        bridgeSha256: sha256('s3'),
      },
      inventoryVerified: false,
      generatorSourceCommit: FAKE_COMMIT,
      expectedGeneratorCommit: FAKE_COMMIT,
    });
    // Corrupt a staged member before publication.
    writeFileSync(
      path.join(artifacts.stagingDir, 'relationship-edges.jsonl'),
      '{"bogus":true}\n',
      'utf8',
    );
    const dest = path.join(base, 'should-not-exist');
    await expect(
      writeAtomicBundle({
        destinationDir: dest,
        stagingDir: artifacts.stagingDir,
        serialized: artifacts.serialized,
        manifest: artifacts.manifest,
      }),
    ).rejects.toThrow();
    expect(existsSync(dest)).toBe(false);
    index.destroy();
    rmSync(base, { recursive: true, force: true });
  });
});
