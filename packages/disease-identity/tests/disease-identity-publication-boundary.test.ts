import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  removeBuilderOwnedDirectory,
  formatFailClosedCleanupMessage,
  createBuilderOwnedDirectoryOwnership,
  validateBuilderOwnedDirectoryOwnership,
} from '../src/controlledIndexCleanup.js';
import {
  assertConsumedByteDigestAndBytes,
  assertProductionGeneratorReady,
  APPROVED_AGGREGATE_COUNTS,
  BUNDLE_ACTIVATION_MARKER_NAME,
  BUNDLE_KIND_PRODUCTION,
  BUNDLE_KIND_SYNTHETIC,
  buildFullCorpusArtifacts,
  buildFullCorpusArtifactsBoundedSyntheticDisk,
  CONTROLLED_INDEX_OUTPUT_BATCH_ROWS,
  createProductionBuildIndex,
  DiseaseIdentityError,
  validateWalCheckpointResult,
  EXPECTED_INVENTORY_ROW_COUNT,
  EXPECTED_LEGACY_DB_DISEASE_COUNT,
  EXPECTED_MAPPED_UNIQUE_CODE_COUNT,
  EXPECTED_RELATIONSHIP_EDGE_COUNT,
  EXPECTED_UNRESOLVED_QUEUE_COUNT,
  MAX_CONTROLLED_INDEX_BYTES,
  PINNED_INVENTORY_SHA256,
  PINNED_MAPPED_JSON_BYTES,
  PINNED_MAPPED_JSON_SHA256,
  parseBridgeJsonlRow,
  verifyFullBundle,
  verifyInventorySameStream,
  writeAtomicBundle,
} from '../src/index.js';

const FAKE_COMMIT = 'a'.repeat(40);

function sha256(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

function seedSyntheticIndex(dir: string, maxControlledIndexBytes?: number) {
  const index = createProductionBuildIndex(dir, {
    mode: 'synthetic-test',
    expectedDbRows: 6,
    expectedMappedRawRows: 4,
    expectedMappedUniqueRows: 4,
    expectedBridgeRows: 4,
    maxControlledIndexBytes,
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
  for (const bridge of [
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
  ]) {
    index.insertBridgeRow(bridge);
  }
  index.flushTransactionBatch();
  index.enforceConfiguredCounts();
  return index;
}

async function buildArtifacts(base: string) {
  const index = seedSyntheticIndex(path.join(base, 'index'));
  const stagingDir = path.join(base, 'staging');
  mkdirSync(stagingDir, { recursive: true });
  const artifacts = await buildFullCorpusArtifactsBoundedSyntheticDisk({
    index,
    stagingDir,
    inputEvidenceHashes: {
      legacyDbSha256: sha256('pub-db'),
      mappedJsonSha256: sha256('pub-mapped'),
      bridgeSha256: sha256('pub-bridge'),
    },
    inventoryVerified: false,
    generatorSourceCommit: FAKE_COMMIT,
    expectedGeneratorCommit: FAKE_COMMIT,
  });
  return { index, artifacts };
}

function initTempGitRepo(dir: string): string {
  execFileSync('git', ['init'], { cwd: dir, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir, stdio: 'ignore' });
  writeFileSync(path.join(dir, 'README'), 'x\n', 'utf8');
  execFileSync('git', ['add', 'README'], { cwd: dir, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', 'init'], { cwd: dir, stdio: 'ignore' });
  execFileSync(
    'git',
    ['remote', 'add', 'ehas2', 'https://github.com/bakalwar/EH_AROGYA_SUTRA_2.git'],
    { cwd: dir, stdio: 'ignore' },
  );
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).trim();
  execFileSync('git', ['update-ref', 'refs/remotes/ehas2/main', head], {
    cwd: dir,
    stdio: 'ignore',
  });
  return head;
}

describe('P2C publication and verification boundaries', () => {
  it('rejects pre-existing non-empty destination without mutation', async () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-nonempty-dest-'));
    const { index, artifacts } = await buildArtifacts(base);
    const destination = path.join(base, 'occupied');
    mkdirSync(destination);
    writeFileSync(path.join(destination, 'foreign.txt'), 'keep-me\n', 'utf8');
    await expect(
      writeAtomicBundle({
        destinationDir: destination,
        stagingDir: artifacts.stagingDir,
        serialized: artifacts.serialized,
        manifest: artifacts.manifest,
      }),
    ).rejects.toThrow(/EEXIST|exists|file already exists/i);
    expect(readFileSync(path.join(destination, 'foreign.txt'), 'utf8')).toBe('keep-me\n');
    expect(readdirSync(destination)).toEqual(['foreign.txt']);
    index.destroy();
    rmSync(base, { recursive: true, force: true });
  });

  it('rejects file and symlink at destination path without replacing them', async () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-file-dest-'));
    const { index, artifacts } = await buildArtifacts(base);
    const fileDest = path.join(base, 'as-file');
    writeFileSync(fileDest, 'payload\n', 'utf8');
    await expect(
      writeAtomicBundle({
        destinationDir: fileDest,
        stagingDir: artifacts.stagingDir,
        serialized: artifacts.serialized,
        manifest: artifacts.manifest,
      }),
    ).rejects.toThrow(/EEXIST|exists|file already exists|ENOTDIR/i);
    expect(readFileSync(fileDest, 'utf8')).toBe('payload\n');

    const linkDest = path.join(base, 'as-link');
    const linkTarget = path.join(base, 'link-target');
    mkdirSync(linkTarget);
    writeFileSync(path.join(linkTarget, 'marker.txt'), 'foreign-link\n', 'utf8');
    try {
      symlinkSync(linkTarget, linkDest, 'dir');
    } catch {
      // Some Windows environments disallow symlink creation without elevation.
      index.destroy();
      rmSync(base, { recursive: true, force: true });
      return;
    }
    await expect(
      writeAtomicBundle({
        destinationDir: linkDest,
        stagingDir: artifacts.stagingDir,
        serialized: artifacts.serialized,
        manifest: artifacts.manifest,
      }),
    ).rejects.toThrow();
    expect(readFileSync(path.join(linkTarget, 'marker.txt'), 'utf8')).toBe('foreign-link\n');
    index.destroy();
    rmSync(base, { recursive: true, force: true });
  });

  it('failure after exclusive ownership before member transfer leaves no activation', async () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-own-fail-'));
    const { index, artifacts } = await buildArtifacts(base);
    const destination = path.join(base, 'dest');
    await expect(
      writeAtomicBundle({
        destinationDir: destination,
        stagingDir: artifacts.stagingDir,
        serialized: artifacts.serialized,
        manifest: artifacts.manifest,
        testOnlyAfterDestinationOwnership: () => {
          throw new Error('inject-after-ownership');
        },
      }),
    ).rejects.toThrow(/inject-after-ownership/);
    expect(existsSync(path.join(destination, BUNDLE_ACTIVATION_MARKER_NAME))).toBe(false);
    index.destroy();
    rmSync(base, { recursive: true, force: true });
  });

  it('failure after member transfer before activation leaves unactivated destination rejected', async () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-pre-act-fail-'));
    const { index, artifacts } = await buildArtifacts(base);
    const destination = path.join(base, 'dest');
    await expect(
      writeAtomicBundle({
        destinationDir: destination,
        stagingDir: artifacts.stagingDir,
        serialized: artifacts.serialized,
        manifest: artifacts.manifest,
        testOnlyBeforeActivationMarker: () => {
          throw new Error('inject-before-activation');
        },
      }),
    ).rejects.toThrow(/inject-before-activation/);
    expect(existsSync(path.join(destination, BUNDLE_ACTIVATION_MARKER_NAME))).toBe(false);
    if (existsSync(destination)) {
      await expect(
        verifyFullBundle(destination, { expectedBundleKind: BUNDLE_KIND_SYNTHETIC }),
      ).rejects.toThrow();
    }
    index.destroy();
    rmSync(base, { recursive: true, force: true });
  });

  it('activation marker exclusive-create failure does not activate', async () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-marker-fail-'));
    const { index, artifacts } = await buildArtifacts(base);
    const destination = path.join(base, 'dest');
    await expect(
      writeAtomicBundle({
        destinationDir: destination,
        stagingDir: artifacts.stagingDir,
        serialized: artifacts.serialized,
        manifest: artifacts.manifest,
        testOnlyBeforeActivationMarker: () => {
          mkdirSync(destination, { recursive: true });
          writeFileSync(path.join(destination, BUNDLE_ACTIVATION_MARKER_NAME), '{}\n', 'utf8');
        },
      }),
    ).rejects.toThrow(/EEXIST|exists|file already exists/i);
    index.destroy();
    rmSync(base, { recursive: true, force: true });
  });

  it('foreign empty destination created immediately before ownership stays empty', async () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-foreign-empty-'));
    const { index, artifacts } = await buildArtifacts(base);
    const destination = path.join(base, 'race-empty');
    await expect(
      writeAtomicBundle({
        destinationDir: destination,
        stagingDir: artifacts.stagingDir,
        serialized: artifacts.serialized,
        manifest: artifacts.manifest,
        testOnlyBeforeOwnershipAcquisition: () => {
          mkdirSync(destination);
        },
      }),
    ).rejects.toThrow(/EEXIST|exists|file already exists/i);
    expect(existsSync(destination)).toBe(true);
    expect(readdirSync(destination)).toEqual([]);
    index.destroy();
    rmSync(base, { recursive: true, force: true });
  });

  it('includes WAL and SHM in continuous controlled-index footprint and cleans up', () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-wal-size-'));
    const indexDir = path.join(base, 'index');
    const index = createProductionBuildIndex(indexDir, {
      mode: 'synthetic-test',
      expectedDbRows: 1_000_000,
      expectedMappedRawRows: 1_000_000,
      expectedMappedUniqueRows: 1_000_000,
      expectedBridgeRows: 1_000_000,
      maxControlledIndexBytes: 8_192,
    });
    let threw = false;
    try {
      for (let i = 1; i <= 50_000; i += 1) {
        index.insertDbRow({ id: i, icd10_code: `X${String(i).padStart(8, '0')}` });
      }
    } catch (error) {
      threw = true;
      expect(String(error)).toMatch(/MAX_CONTROLLED_INDEX_BYTES/);
    }
    expect(threw).toBe(true);
    expect(existsSync(indexDir)).toBe(false);
    rmSync(base, { recursive: true, force: true });
  });

  it('peak observed before checkpoint still fails assertIndexSizeLimit', () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-peak-cp-'));
    const index = seedSyntheticIndex(path.join(base, 'index'), 1024 * 1024);
    index.testOnlyRecordPeakBytes(BigInt(2 * 1024 * 1024));
    expect(() => index.assertIndexSizeLimit()).toThrow(/peak exceeds|MAX_CONTROLLED_INDEX/);
    expect(existsSync(path.join(base, 'index'))).toBe(false);
    rmSync(base, { recursive: true, force: true });
  });

  it('absent inventory stays unverified; wrong digest/count fail closed', async () => {
    const absent = await verifyInventorySameStream({
      inventoryPath: null,
      mappedRawRowCount: EXPECTED_INVENTORY_ROW_COUNT,
    });
    expect(absent).toEqual({
      inventoryVerified: false,
      inventorySha256: null,
      consumedBytes: 0,
      rowCount: 0,
    });

    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-inv-'));
    const badDigest = path.join(base, 'bad-inv.txt');
    writeFileSync(badDigest, 'not-the-pinned-inventory\n', 'utf8');
    await expect(
      verifyInventorySameStream({
        inventoryPath: badDigest,
        mappedRawRowCount: EXPECTED_INVENTORY_ROW_COUNT,
      }),
    ).rejects.toThrow(/SHA-256 mismatch|inventory/i);

    const wrongCount = path.join(base, 'count-inv.txt');
    // Craft bytes whose digest is not pinned and row count != expected.
    writeFileSync(wrongCount, 'row1\nrow2\n', 'utf8');
    await expect(
      verifyInventorySameStream({
        inventoryPath: wrongCount,
        mappedRawRowCount: 2,
      }),
    ).rejects.toThrow();

    expect(PINNED_INVENTORY_SHA256).toMatch(/^[0-9a-f]{64}$/);
    rmSync(base, { recursive: true, force: true });
  });

  it('mandatory expectedBundleKind rejects missing/unknown before deep parse', async () => {
    await expect(
      verifyFullBundle(tmpdir(), {
        // @ts-expect-error intentional runtime rejection coverage
        expectedBundleKind: undefined,
      }),
    ).rejects.toThrow(/expectedBundleKind is mandatory/);
    await expect(
      verifyFullBundle(tmpdir(), {
        // @ts-expect-error intentional runtime rejection coverage
        expectedBundleKind: 'NOT_A_REAL_KIND',
      }),
    ).rejects.toThrow(/expectedBundleKind is mandatory/);
  });

  it('verifier fail-fast bounds reject the first excess disease row', async () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-ff-'));
    const dbRows = Array.from({ length: 101 }, (_, i) => ({
      id: i + 1,
      icd10_code: '',
    }));
    const artifacts = buildFullCorpusArtifacts({
      dbRows,
      mappedEntries: [],
      bridgeRows: [],
      inputEvidenceHashes: {
        legacyDbSha256: sha256('ff-db'),
        mappedJsonSha256: sha256('ff-mapped'),
        bridgeSha256: sha256('ff-bridge'),
      },
      inventoryVerified: false,
      skipManifestReconciliation: true,
      skipBridgeMappedKeyReconciliation: true,
      expectedRelationshipEdges: 0,
    });
    const dest = path.join(base, 'bundle');
    await expect(
      writeAtomicBundle({
        destinationDir: dest,
        serialized: artifacts.serialized,
        manifest: artifacts.manifest,
      }),
    ).rejects.toThrow(/Disease ledger exceeds verifier bound/);
    expect(existsSync(path.join(dest, BUNDLE_ACTIVATION_MARKER_NAME))).toBe(false);
    expect(EXPECTED_UNRESOLVED_QUEUE_COUNT).toBe(17_181 + 257 + 36);
    rmSync(base, { recursive: true, force: true });
  });

  it('array synthetic builder cannot emit production bundleKind', () => {
    const artifacts = buildFullCorpusArtifacts({
      dbRows: [{ id: 1, icd10_code: 'A00.0' }],
      mappedEntries: [
        {
          dedupeKey: 'ICD10\u0000A00.0',
          mappedSourceLabel: 'ICD10',
          mappedCodeRaw: 'A00.0',
          provenanceVariants: [{ mappedCodeRaw: 'A00.0', mappedSourceLabel: 'ICD10' }],
        },
      ],
      bridgeRows: [
        parseBridgeJsonlRow(
          {
            mapped_source_label: 'ICD10',
            mapped_code: 'A00.0',
            recommended_disposition: 'EXACT_UNIQUE_MATCH',
            candidate_eh_disease_id: '1',
          },
          1,
        ),
      ],
      inputEvidenceHashes: {
        legacyDbSha256: sha256('a'),
        mappedJsonSha256: sha256('b'),
        bridgeSha256: sha256('c'),
      },
      inventoryVerified: false,
      skipManifestReconciliation: true,
      skipBridgeMappedKeyReconciliation: true,
    });
    expect(artifacts.manifest.bundleKind).toBe(BUNDLE_KIND_SYNTHETIC);
    expect(artifacts.manifest.bundleKind).not.toBe(BUNDLE_KIND_PRODUCTION);
  });

  it('generator gate requires exact ehas2/main tip reachability', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ehas2-reach-'));
    const mainTip = initTempGitRepo(dir);
    expect(
      assertProductionGeneratorReady({
        repoRoot: dir,
        expectedGeneratorCommit: mainTip,
      }).generatorSourceCommit,
    ).toBe(mainTip);

    writeFileSync(path.join(dir, 'feat.txt'), 'feature\n', 'utf8');
    execFileSync('git', ['checkout', '-b', 'feature'], { cwd: dir, stdio: 'ignore' });
    execFileSync('git', ['add', 'feat.txt'], { cwd: dir, stdio: 'ignore' });
    execFileSync('git', ['commit', '-m', 'feature'], { cwd: dir, stdio: 'ignore' });
    const featureHead = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: dir,
      encoding: 'utf8',
    }).trim();
    expect(() =>
      assertProductionGeneratorReady({
        repoRoot: dir,
        expectedGeneratorCommit: featureHead,
      }),
    ).toThrow(/main tip/);

    execFileSync('git', ['checkout', '--orphan', 'orphan-branch'], { cwd: dir, stdio: 'ignore' });
    writeFileSync(path.join(dir, 'orphan.txt'), 'orphan\n', 'utf8');
    execFileSync('git', ['add', 'orphan.txt'], { cwd: dir, stdio: 'ignore' });
    execFileSync('git', ['commit', '-m', 'orphan'], { cwd: dir, stdio: 'ignore' });
    const orphan = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: dir,
      encoding: 'utf8',
    }).trim();
    expect(() =>
      assertProductionGeneratorReady({
        repoRoot: dir,
        expectedGeneratorCommit: orphan,
      }),
    ).toThrow(/main tip|reachable|does not match/i);
    rmSync(dir, { recursive: true, force: true });
  });

  it('mapped consumed-byte pin is independent of digest-only helper', async () => {
    await expect(
      assertConsumedByteDigestAndBytes(
        PINNED_MAPPED_JSON_SHA256,
        PINNED_MAPPED_JSON_BYTES - 1,
        PINNED_MAPPED_JSON_SHA256,
        PINNED_MAPPED_JSON_BYTES,
        'mapped.json',
      ),
    ).rejects.toThrow(/size mismatch/);
    await expect(
      assertConsumedByteDigestAndBytes(
        PINNED_MAPPED_JSON_SHA256,
        PINNED_MAPPED_JSON_BYTES,
        PINNED_MAPPED_JSON_SHA256,
        PINNED_MAPPED_JSON_BYTES,
        'mapped.json',
      ),
    ).resolves.toBeUndefined();
  });

  it('documents remaining verifier Set maxima honestly', () => {
    // Production retained ID-set maxima before fail-fast rejection.
    const diseaseMax = EXPECTED_LEGACY_DB_DISEASE_COUNT;
    const mappedMax = EXPECTED_MAPPED_UNIQUE_CODE_COUNT;
    const relMax = EXPECTED_RELATIONSHIP_EDGE_COUNT;
    const unresolvedMax = EXPECTED_UNRESOLVED_QUEUE_COUNT;
    const conservativeBytes =
      (diseaseMax + mappedMax + relMax + unresolvedMax) * 96 + 64 * 1024 * 1024;
    expect(conservativeBytes).toBeGreaterThan(0);
    expect(unresolvedMax).toBe(17_181 + 257 + 36);
  });
});

describe('controlled index WAL lifecycle and fail-closed cleanup', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fails closed on busy, incomplete, and unexpected WAL checkpoint results', () => {
    expect(() =>
      validateWalCheckpointResult([{ busy: 1, log: 10, checkpointed: 5 }], 'busy-test'),
    ).toThrow(/checkpoint busy \(active reader\/writer\)/);
    expect(() =>
      validateWalCheckpointResult([{ busy: 0, log: 10, checkpointed: 5 }], 'incomplete-test'),
    ).toThrow(/checkpoint incomplete/);
    expect(() => validateWalCheckpointResult(null, 'unexpected-test')).toThrow(/unexpected result/);
    expect(validateWalCheckpointResult([{ busy: 0, log: 0, checkpointed: 0 }], 'ok-test')).toEqual({
      busy: 0,
      log: 0,
      checkpointed: 0,
    });
  });

  it('rejects checkpoint while a mapped iterator reader is active', () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-cp-busy-'));
    const index = seedSyntheticIndex(path.join(base, 'index'));
    const iterator = index.iterateMappedEntries();
    iterator.next();
    expect(() => index.checkpointControlledIndexAtSafeBoundary('active-reader-test')).toThrow(
      /read scope active|checkpoint busy|active reader/i,
    );
    for (const _unused of iterator) {
      void _unused;
    }
    index.destroy();
    rmSync(base, { recursive: true, force: true });
  });

  it('checkpoints at closed batch boundaries and keeps real WAL footprint bounded during output population', async () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-wal-populate-'));
    const indexDir = path.join(base, 'index');
    const index = createProductionBuildIndex(indexDir, {
      mode: 'synthetic-test',
      expectedDbRows: 2_048,
      expectedMappedRawRows: 2_048,
      expectedMappedUniqueRows: 2_048,
      expectedBridgeRows: 2_048,
    });
    for (let i = 1; i <= 2_048; i += 1) {
      const code = `X${String(i).padStart(8, '0')}`;
      index.insertDbRow({ id: i, icd10_code: code });
      index.insertMappedRow({ source: 'ICD10', code });
      index.insertBridgeRow(
        parseBridgeJsonlRow(
          {
            mapped_source_label: 'ICD10',
            mapped_code: code,
            recommended_disposition: 'EXACT_UNIQUE_MATCH',
            candidate_eh_disease_id: String(i),
          },
          i,
        ),
      );
    }
    index.flushTransactionBatch();
    const peakBeforePopulate = index.peakControlledIndexBytes();
    const footprintBeforePopulate = controlledIndexFootprintParts(index);
    const stagingDir = path.join(base, 'staging');
    mkdirSync(stagingDir);
    const artifacts = await buildFullCorpusArtifactsBoundedSyntheticDisk({
      index,
      stagingDir,
      inputEvidenceHashes: {
        legacyDbSha256: sha256('wal-populate-db'),
        mappedJsonSha256: sha256('wal-populate-mapped'),
        bridgeSha256: sha256('wal-populate-bridge'),
      },
      inventoryVerified: false,
      generatorSourceCommit: FAKE_COMMIT,
      expectedGeneratorCommit: FAKE_COMMIT,
    });
    const footprintAfterPopulate = controlledIndexFootprintParts(index);
    expect(artifacts.instrumentation.mappedRowsStreamed).toBe(2_048);
    expect(index.peakControlledIndexBytes()).toBeGreaterThanOrEqual(peakBeforePopulate);
    expect(footprintAfterPopulate.aggregate).toBeGreaterThanOrEqual(
      footprintBeforePopulate.aggregate,
    );
    expect(Number(index.controlledIndexFootprintBytes())).toBeLessThanOrEqual(
      MAX_CONTROLLED_INDEX_BYTES,
    );
    // Exercises real main+wal+shm+journal files; does not reproduce a full-corpus ~2 GiB over-cap.
    expect(footprintAfterPopulate.wal).toBeLessThan(MAX_CONTROLLED_INDEX_BYTES / 4);
    index.destroy();
    rmSync(base, { recursive: true, force: true });
  });

  it('truncates real WAL sidecars after a closed batch checkpoint boundary', () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-wal-truncate-'));
    const index = seedSyntheticIndex(path.join(base, 'index'));
    index.addOutputRecord('mapped', 'm1', '{"kind":"mapped"}');
    index.addOutputRecord('mapped', 'm2', '{"kind":"mapped"}');
    const walPath = `${index.dbPath}-wal`;
    const walBefore = existsSync(walPath) ? statSize(walPath) : 0;
    index.checkpointControlledIndexAtSafeBoundary('physical-wal-truncate-test');
    const walAfter = existsSync(walPath) ? statSize(walPath) : 0;
    expect(walAfter).toBeLessThanOrEqual(walBefore);
    expect(index.peakControlledIndexBytes()).toBeGreaterThan(0n);
    index.destroy();
    rmSync(base, { recursive: true, force: true });
  });

  it('preserves monotonic peak after checkpoint without resetting historical peak evidence', () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-peak-monotonic-'));
    const index = seedSyntheticIndex(path.join(base, 'index'));
    index.testOnlyRecordPeakBytes(BigInt(MAX_CONTROLLED_INDEX_BYTES - 1024));
    const peakBefore = index.peakControlledIndexBytes();
    index.checkpointControlledIndexAtSafeBoundary('after-mapped-bridge-output');
    expect(index.peakControlledIndexBytes()).toBe(peakBefore);
    index.destroy();
    rmSync(base, { recursive: true, force: true });
  });

  it('peak-accounting unit test: injected +3848 peak rejects assertIndexSizeLimit (not physical WAL reproduction)', () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-peak-reject-'));
    const index = seedSyntheticIndex(path.join(base, 'index'));
    index.testOnlyRecordPeakBytes(BigInt(MAX_CONTROLLED_INDEX_BYTES + 3_848));
    expect(() => index.assertIndexSizeLimit()).toThrow(/peak exceeds|MAX_CONTROLLED_INDEX/);
    expect(existsSync(path.join(base, 'index'))).toBe(false);
    rmSync(base, { recursive: true, force: true });
  });

  it('library entry preserves primary size error when cleanup persistently fails (not CLI subprocess)', () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-lib-primary-cleanup-'));
    const index = createProductionBuildIndex(path.join(base, 'index'), {
      mode: 'synthetic-test',
      expectedDbRows: 6,
      expectedMappedRawRows: 4,
      expectedMappedUniqueRows: 4,
      expectedBridgeRows: 4,
      testCleanupHooks: {
        rmSyncImpl: (() => {
          const error = new Error('EPERM') as NodeJS.ErrnoException;
          error.code = 'EPERM';
          throw error;
        }) as typeof rmSync,
      },
    });
    index.testOnlyRecordPeakBytes(BigInt(MAX_CONTROLLED_INDEX_BYTES + 3_848));
    let caught: unknown;
    try {
      index.assertIndexSizeLimit();
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(DiseaseIdentityError);
    const err = caught as DiseaseIdentityError;
    expect(err.code).toBe('MALFORMED_INPUT');
    expect(err.message).toMatch(/MAX_CONTROLLED_INDEX_BYTES/);
    expect(err.message).toMatch(/secondaryCleanupFailure=code=EPERM/);
    expect(err.message.indexOf('MAX_CONTROLLED_INDEX_BYTES')).toBeLessThan(
      err.message.indexOf('secondaryCleanupFailure'),
    );
    expect(err.message).not.toMatch(/A00\.0|OMIM|patient|phi/i);
    rmSync(base, { recursive: true, force: true });
  });

  it('retries transient ENOTEMPTY cleanup then succeeds with ownership validation', () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-cleanup-retry-'));
    const target = path.join(base, 'owned-index');
    mkdirSync(target);
    writeFileSync(path.join(target, 'marker.txt'), 'x', 'utf8');
    const ownership = createBuilderOwnedDirectoryOwnership('controlled-index', target);
    let attempts = 0;
    const result = removeBuilderOwnedDirectory(target, {
      ownership,
      maxAttempts: 3,
      backoffMs: 1,
      rmSyncImpl: ((...args: Parameters<typeof rmSync>) => {
        attempts += 1;
        if (attempts === 1) {
          const error = new Error('ENOTEMPTY') as NodeJS.ErrnoException;
          error.code = 'ENOTEMPTY';
          throw error;
        }
        return rmSync(...args);
      }) as typeof rmSync,
    });
    expect(result).toBeNull();
    expect(existsSync(target)).toBe(false);
    rmSync(base, { recursive: true, force: true });
  });

  it('fails closed without deletion when ownership descriptor does not match target', () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-ownership-mismatch-'));
    const owned = path.join(base, 'owned-index');
    const other = path.join(base, 'other-index');
    mkdirSync(owned);
    mkdirSync(other);
    writeFileSync(path.join(other, 'keep.txt'), 'x', 'utf8');
    const ownership = createBuilderOwnedDirectoryOwnership('controlled-index', owned);
    expect(validateBuilderOwnedDirectoryOwnership(ownership, other)).toBe(
      'ownership=path_mismatch',
    );
    const result = removeBuilderOwnedDirectory(other, { ownership });
    expect(result).toBe('ownership=path_mismatch');
    expect(existsSync(other)).toBe(true);
    rmSync(base, { recursive: true, force: true });
  });

  it('rejects symlink controlled-index directories without deletion', () => {
    if (process.platform === 'win32') {
      return;
    }
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-ownership-symlink-'));
    const real = path.join(base, 'real-index');
    const link = path.join(base, 'link-index');
    mkdirSync(real);
    symlinkSync(real, link, 'dir');
    const ownership = createBuilderOwnedDirectoryOwnership('controlled-index', link);
    expect(validateBuilderOwnedDirectoryOwnership(ownership, link)).toBe(
      'ownership=symlink_rejected',
    );
    const result = removeBuilderOwnedDirectory(link, { ownership });
    expect(result).toBe('ownership=symlink_rejected');
    expect(existsSync(real)).toBe(true);
    rmSync(base, { recursive: true, force: true });
  });

  it('fails closed on mapped key without bridge counterpart before publication', async () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-mapped-only-'));
    const index = createProductionBuildIndex(path.join(base, 'index'), {
      mode: 'synthetic-test',
      expectedDbRows: 1,
      expectedMappedRawRows: 2,
      expectedMappedUniqueRows: 2,
      expectedBridgeRows: 1,
    });
    index.insertDbRow({ id: 1, icd10_code: 'A00.0' });
    index.insertMappedRow({ source: 'ICD10', code: 'A00.0' });
    index.insertMappedRow({ source: 'ICD10', code: 'B00.0' });
    index.insertBridgeRow(
      parseBridgeJsonlRow(
        {
          mapped_source_label: 'ICD10',
          mapped_code: 'A00.0',
          recommended_disposition: 'EXACT_UNIQUE_MATCH',
          candidate_eh_disease_id: '1',
        },
        1,
      ),
    );
    index.flushTransactionBatch();
    try {
      await expect(
        buildFullCorpusArtifactsBoundedSyntheticDisk({
          index,
          stagingDir: path.join(base, 'staging'),
          inputEvidenceHashes: {
            legacyDbSha256: sha256('m'),
            mappedJsonSha256: sha256('m'),
            bridgeSha256: sha256('b'),
          },
          inventoryVerified: false,
          generatorSourceCommit: FAKE_COMMIT,
          expectedGeneratorCommit: FAKE_COMMIT,
        }),
      ).rejects.toThrow(/join reconciliation failed/);
    } finally {
      index.destroy();
      rmSync(base, { recursive: true, force: true });
    }
  });

  it('fails closed on bridge key without mapped counterpart before publication', async () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-bridge-only-'));
    const index = createProductionBuildIndex(path.join(base, 'index'), {
      mode: 'synthetic-test',
      expectedDbRows: 1,
      expectedMappedRawRows: 1,
      expectedMappedUniqueRows: 1,
      expectedBridgeRows: 2,
    });
    index.insertDbRow({ id: 1, icd10_code: 'A00.0' });
    index.insertMappedRow({ source: 'ICD10', code: 'A00.0' });
    index.insertBridgeRow(
      parseBridgeJsonlRow(
        {
          mapped_source_label: 'ICD10',
          mapped_code: 'A00.0',
          recommended_disposition: 'EXACT_UNIQUE_MATCH',
          candidate_eh_disease_id: '1',
        },
        1,
      ),
    );
    index.insertBridgeRow(
      parseBridgeJsonlRow(
        {
          mapped_source_label: 'ICD10',
          mapped_code: 'C00.0',
          recommended_disposition: 'NO_MATCH',
          candidate_eh_disease_id: '',
        },
        2,
      ),
    );
    index.flushTransactionBatch();
    try {
      await expect(
        buildFullCorpusArtifactsBoundedSyntheticDisk({
          index,
          stagingDir: path.join(base, 'staging'),
          inputEvidenceHashes: {
            legacyDbSha256: sha256('m'),
            mappedJsonSha256: sha256('m'),
            bridgeSha256: sha256('b'),
          },
          inventoryVerified: false,
          generatorSourceCommit: FAKE_COMMIT,
          expectedGeneratorCommit: FAKE_COMMIT,
        }),
      ).rejects.toThrow(/join reconciliation failed/);
    } finally {
      index.destroy();
      rmSync(base, { recursive: true, force: true });
    }
  });

  it('fails closed on compensating mapped/bridge count match with key mismatch', async () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-compensating-mismatch-'));
    const index = createProductionBuildIndex(path.join(base, 'index'), {
      mode: 'synthetic-test',
      expectedDbRows: 2,
      expectedMappedRawRows: 2,
      expectedMappedUniqueRows: 2,
      expectedBridgeRows: 2,
    });
    index.insertDbRow({ id: 1, icd10_code: 'A00.0' });
    index.insertDbRow({ id: 2, icd10_code: 'B00.0' });
    index.insertMappedRow({ source: 'ICD10', code: 'A00.0' });
    index.insertMappedRow({ source: 'ICD10', code: 'B00.0' });
    index.insertBridgeRow(
      parseBridgeJsonlRow(
        {
          mapped_source_label: 'ICD10',
          mapped_code: 'A00.0',
          recommended_disposition: 'EXACT_UNIQUE_MATCH',
          candidate_eh_disease_id: '1',
        },
        1,
      ),
    );
    index.insertBridgeRow(
      parseBridgeJsonlRow(
        {
          mapped_source_label: 'ICD10',
          mapped_code: 'C00.0',
          recommended_disposition: 'NO_MATCH',
          candidate_eh_disease_id: '',
        },
        2,
      ),
    );
    index.flushTransactionBatch();
    try {
      await expect(
        buildFullCorpusArtifactsBoundedSyntheticDisk({
          index,
          stagingDir: path.join(base, 'staging'),
          inputEvidenceHashes: {
            legacyDbSha256: sha256('m'),
            mappedJsonSha256: sha256('m'),
            bridgeSha256: sha256('b'),
          },
          inventoryVerified: false,
          generatorSourceCommit: FAKE_COMMIT,
          expectedGeneratorCommit: FAKE_COMMIT,
        }),
      ).rejects.toThrow(/join reconciliation failed/);
    } finally {
      index.destroy();
      rmSync(base, { recursive: true, force: true });
    }
  });

  it('preserves primary size error when cleanup persistently fails', () => {
    const message = formatFailClosedCleanupMessage(
      'Production build index exceeds MAX_CONTROLLED_INDEX_BYTES (8192)',
      'code=EPERM;attempts=5',
    );
    expect(message).toMatch(/MAX_CONTROLLED_INDEX_BYTES/);
    expect(message).toMatch(/secondaryCleanupFailure=code=EPERM;attempts=5/);
    expect(message.indexOf('MAX_CONTROLLED_INDEX_BYTES')).toBeLessThan(
      message.indexOf('secondaryCleanupFailure'),
    );
  });

  it('destroy is idempotent when the owned directory is already absent', () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ehas2-destroy-idempotent-'));
    const index = seedSyntheticIndex(path.join(base, 'index'));
    index.destroy();
    expect(existsSync(path.join(base, 'index'))).toBe(false);
    index.destroy();
    rmSync(base, { recursive: true, force: true });
  });

  it('uses batched fetch boundaries of CONTROLLED_INDEX_OUTPUT_BATCH_ROWS', () => {
    expect(CONTROLLED_INDEX_OUTPUT_BATCH_ROWS).toBe(256);
    expect(
      APPROVED_AGGREGATE_COUNTS.bridgeExactMultiple +
        APPROVED_AGGREGATE_COUNTS.bridgeOwnerReview +
        APPROVED_AGGREGATE_COUNTS.bridgeNoMatch,
    ).toBe(17_474);
  });
});

function statSize(filePath: string): number {
  return statSync(filePath).size;
}

function controlledIndexFootprintParts(index: { dbPath: string }): {
  main: number;
  wal: number;
  shm: number;
  journal: number;
  aggregate: number;
} {
  const dbPath = index.dbPath;
  const main = existsSync(dbPath) ? statSize(dbPath) : 0;
  const wal = existsSync(`${dbPath}-wal`) ? statSize(`${dbPath}-wal`) : 0;
  const shm = existsSync(`${dbPath}-shm`) ? statSize(`${dbPath}-shm`) : 0;
  const journal = existsSync(`${dbPath}-journal`) ? statSize(`${dbPath}-journal`) : 0;
  return { main, wal, shm, journal, aggregate: main + wal + shm + journal };
}
