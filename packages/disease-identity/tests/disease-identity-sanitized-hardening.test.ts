import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';
import * as publicApi from '../src/index.js';
import {
  APPROVED_AGGREGATE_COUNTS,
  DiseaseIdentityError,
  PINNED_LEGACY_DB_SHA256,
  SANITIZED_DERIVE_AUTHORIZATION_TOKEN,
  assertProductionGeneratorReady,
  assertSanitizedProductionCliFlagsRejected,
  listSanitizedProductionCliRejectedFlags,
  validateSanitizedArtifactManifest,
  validateSanitizedArtifactManifestSynthetic,
  validateSanitizedDiseaseIdentityRecord,
  canonicalJsonString,
} from '../src/index.js';
import * as toolingInternal from '../src/toolingInternal.js';
import {
  deriveSanitizedDiseaseIdentity,
  deriveSanitizedDiseaseIdentitySyntheticHarness,
  loadSanitizedAdoptionManifestFromControlPlane,
  openLiveReadonlyDiseaseIdentityDb,
  streamDiseaseIdentityFingerprintInReadTransaction,
  streamSanitizedIdentityJsonlFile,
  verifySanitizedArtifactPackage,
} from '../src/toolingInternal.js';
import { resolveSanitizedAdoptionControlPlanePath } from '../src/index.js';
import {
  assertSourceMainIdentityUnchanged,
  captureSourceMainIdentityEvidence,
} from '../src/sourceMainIdentity.js';
import { LIVE_READONLY_SQLITE_BUSY_TIMEOUT_MS } from '../src/sanitizedIdentityConstants.js';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const DESKTOP_TEST_ROOT = path.resolve(REPO_ROOT, '..', '_ehas2_p2c_sanitized_test_outputs');
const FAKE_COMMIT = 'a'.repeat(40);

const cleanupDirs: string[] = [];
afterEach(() => {
  while (cleanupDirs.length > 0) {
    const dir = cleanupDirs.pop();
    if (dir && existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

function tempDir(prefix: string): string {
  const dir = mkdtempSync(path.join(tmpdir(), prefix));
  cleanupDirs.push(dir);
  return dir;
}

function desktopOutDir(prefix: string): string {
  mkdirSync(DESKTOP_TEST_ROOT, { recursive: true });
  const dir = mkdtempSync(path.join(DESKTOP_TEST_ROOT, prefix));
  cleanupDirs.push(dir);
  return dir;
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

function createSyntheticIdentityDb(options: {
  readonly rows: Array<{ id: number; icd10_code: string | null }>;
  readonly walMode?: boolean;
  readonly withConsultations?: boolean;
}): string {
  const dir = tempDir('ehas2-sanitized-db-');
  const dbPath = path.join(dir, 'synthetic.db');
  const db = new Database(dbPath);
  if (options.walMode) {
    db.pragma('journal_mode = WAL');
  }
  db.exec(`CREATE TABLE diseases (id INTEGER PRIMARY KEY, icd10_code TEXT);`);
  if (options.withConsultations) {
    db.exec(`CREATE TABLE consultations (id INTEGER PRIMARY KEY, note TEXT);`);
  }
  const insert = db.prepare('INSERT INTO diseases (id, icd10_code) VALUES (?, ?)');
  for (const row of options.rows) {
    insert.run(row.id, row.icd10_code);
  }
  db.close();
  return dbPath;
}

function baseDeriveInput(
  outputDir: string,
  sourceDbPath: string,
  repoRoot: string,
  commit: string,
) {
  return {
    authorizeDeriveFlag: true,
    ownerToken: SANITIZED_DERIVE_AUTHORIZATION_TOKEN,
    repoRoot,
    sourceDbPath,
    sourceEvidenceRefHistoricalMainSha256: PINNED_LEGACY_DB_SHA256,
    outputDir,
    expectedGeneratorCommit: commit,
    minimumFreeBytes: 1,
  };
}

describe('R2-DATA-P2C-C sanitized hardening', () => {
  it('public export firewall hides live-read and internal orchestration', () => {
    expect(publicApi).not.toHaveProperty('openLiveReadonlyDiseaseIdentityDb');
    expect(publicApi).not.toHaveProperty('deriveSanitizedDiseaseIdentity');
    expect(publicApi).not.toHaveProperty('deriveSanitizedDiseaseIdentitySyntheticHarness');
    expect(publicApi).not.toHaveProperty('executeSanitizedDeriveOrchestration');
    expect(publicApi).not.toHaveProperty('streamDiseaseIdentityArtifactInReadTransaction');
    expect(publicApi).not.toHaveProperty('verifySanitizedArtifactPackage');
    expect(publicApi).toHaveProperty('assertSanitizedProductionCliFlagsRejected');
  });

  it('rejects production CLI synthetic/test bypass flags', () => {
    for (const flag of listSanitizedProductionCliRejectedFlags()) {
      expect(() => assertSanitizedProductionCliFlagsRejected(new Set([flag]))).toThrow(
        DiseaseIdentityError,
      );
    }
  });

  it('tooling-internal exposes sanitized stream for generator CLI without public derive/open-live', () => {
    expect(toolingInternal).toHaveProperty('streamSanitizedIdentityJsonlFile');
    expect(typeof streamSanitizedIdentityJsonlFile).toBe('function');
    expect(publicApi).not.toHaveProperty('openLiveReadonlyDiseaseIdentityDb');
    expect(publicApi).not.toHaveProperty('deriveSanitizedDiseaseIdentity');
    expect(publicApi).not.toHaveProperty('executeSanitizedDeriveOrchestration');
  });

  it('generator CLI module loads under Node without opening inputs or creating outputs', () => {
    const cliPath = path.join(REPO_ROOT, 'tools/disease-identity-generator/cli.mjs');
    let result: { status: number | null; stdout: string; stderr: string };
    try {
      execFileSync(process.execPath, [cliPath], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, NODE_OPTIONS: '' },
      });
      result = { status: 0, stdout: '', stderr: '' };
    } catch (error) {
      const err = error as {
        status?: number;
        stdout?: string;
        stderr?: string;
        message?: string;
      };
      result = {
        status: typeof err.status === 'number' ? err.status : null,
        stdout: String(err.stdout ?? ''),
        stderr: String(err.stderr ?? err.message ?? ''),
      };
    }
    expect(result.stderr).not.toMatch(/does not provide an export named/);
    expect(result.stderr).toMatch(/Usage:/);
    expect(result.status).toBe(2);
    expect(existsSync(path.join(REPO_ROOT, 'ehas2-sanitized-derivation-activation.json'))).toBe(
      false,
    );
  });

  it('derive generator gate fails before output creation for malformed commit', async () => {
    const dbPath = createSyntheticIdentityDb({ rows: [{ id: 1, icd10_code: null }] });
    const outputDir = path.join(desktopOutDir('gate-'), 'pkg');
    await expect(
      deriveSanitizedDiseaseIdentity({
        ...baseDeriveInput(outputDir, dbPath, REPO_ROOT, 'short'),
        authorizeDeriveFlag: true,
      }),
    ).rejects.toThrow(/40-hex|commit/i);
    expect(existsSync(outputDir)).toBe(false);
  });

  it('derive generator gate rejects dirty tree before DB open', async () => {
    const gitDir = tempDir('ehas2-derive-gate-');
    const head = initTempGitRepo(gitDir);
    writeFileSync(path.join(gitDir, 'DIRTY'), 'x\n', 'utf8');
    const dbPath = createSyntheticIdentityDb({ rows: [{ id: 1, icd10_code: null }] });
    const outputDir = path.join(desktopOutDir('dirty-'), 'pkg');
    await expect(
      deriveSanitizedDiseaseIdentity(baseDeriveInput(outputDir, dbPath, gitDir, head)),
    ).rejects.toThrow(/clean/i);
    expect(existsSync(outputDir)).toBe(false);
  });

  it('production manifest validator rejects SYNTHETIC_TEST_COMMIT', () => {
    const manifest = {
      manifestSchemaVersion: 'ehas2-sanitized-legacy-disease-identity-manifest-v1',
      artifactSchemaVersion: 'ehas2-sanitized-legacy-disease-identity-record-v1',
      datasetVersion: 'ehas2-sanitized-legacy-disease-identity-v1',
      artifactKind: 'SANITIZED_LEGACY_DISEASE_IDENTITY_JSONL_V1',
      authorityClassification: 'ENGINEERING_IDENTITY_ONLY',
      clinicalAuthority: 'NONE',
      sourceClass: 'LIVE_SQLITE_READONLY_TRANSACTION_V1',
      derivationQueryIdentifier: 'EHAS2_DISEASE_IDENTITY_SQL_V1',
      derivationQuerySHA256: 'dd936ecf5f21ca877fac1b9c78ef2b571167ce05ef2c8d507b13960b483391d7',
      recordCount: 2,
      artifactBytes: 10,
      artifactSHA256: 'a'.repeat(64),
      orderedIdentityFingerprint: 'b'.repeat(64),
      orderedIdentityFingerprintAlgorithm: 'EHAS2_ORDERED_SANITIZED_DISEASE_IDENTITY_FP_V1_SHA256',
      generatorVersion: '0.3.0-p2c-sanitized-identity-tooling',
      generatorSourceCommit: 'SYNTHETIC_TEST_COMMIT',
      expectedCanonicalRepository: 'bakalwar/EH_AROGYA_SUTRA_2',
      sourceLegacyEvidenceReference: {
        label: 'P2A_HISTORICAL_MAIN_FILE_SHA256_REF',
        historicalMainFileSha256: PINNED_LEGACY_DB_SHA256,
      },
      lifecycleStatus: 'DERIVED_PENDING_ADOPTION',
      supersedes: null,
      supersededBy: null,
      licensingClassification: 'PRIVATE_ENGINEERING_IDENTITY_PENDING_LEGAL_CLEARANCE',
      privacyClassification: 'SANITIZED_IDENTITY_NO_PHI',
      exclusions: [
        'consultations',
        'patients',
        'names',
        'prose',
        'medicines',
        'prescriptions',
        'polarity',
        'fts',
        'vector',
        'absolute_paths',
        'credentials',
        'machine_identity',
      ],
    };
    expect(() => validateSanitizedArtifactManifest(manifest)).toThrow(DiseaseIdentityError);
    expect(() => validateSanitizedArtifactManifestSynthetic(manifest)).not.toThrow();
  });

  it('duplicate sanitized record errors omit row identifiers', () => {
    const seen = new Set<number>([1]);
    try {
      validateSanitizedDiseaseIdentityRecord(
        {
          artifactSchemaVersion: 'ehas2-sanitized-legacy-disease-identity-record-v1',
          legacyAuthority: 'EHAS2_PINNED_LEGACY_DISEASE_DB_V1',
          legacyDbDiseaseId: 1,
          legacyCodeRaw: null,
        },
        seen,
      );
      throw new Error('expected throw');
    } catch (error) {
      expect(error).toBeInstanceOf(DiseaseIdentityError);
      const message = (error as DiseaseIdentityError).message;
      expect(message).not.toMatch(/\b1\b/);
      expect(message).toMatch(/Duplicate legacyDbDiseaseId/i);
    }
  });

  it('derive rejects identity drift between passes and removes partial output', async () => {
    const dbPath = createSyntheticIdentityDb({
      rows: [
        { id: 1, icd10_code: 'A00.0' },
        { id: 2, icd10_code: 'B01.1' },
      ],
      walMode: true,
    });
    const outputDir = path.join(desktopOutDir('drift-'), 'pkg');
    await expect(
      deriveSanitizedDiseaseIdentitySyntheticHarness({
        ...baseDeriveInput(outputDir, dbPath, REPO_ROOT, FAKE_COMMIT),
        expectedRecordCount: 2,
        skipGeneratorGate: true,
        betweenPassesHook: () => {
          const w = new Database(dbPath);
          w.prepare('UPDATE diseases SET icd10_code = ? WHERE id = ?').run('Z99.9', 1);
          w.close();
        },
      }),
    ).rejects.toThrow(/Identity stability window mismatch|Ordered fingerprint count mismatch/i);
    expect(existsSync(outputDir)).toBe(false);
  });

  it('unrelated consultations write remains acceptable between passes', async () => {
    const dbPath = createSyntheticIdentityDb({
      rows: [
        { id: 1, icd10_code: 'A00.0' },
        { id: 2, icd10_code: null },
      ],
      walMode: true,
      withConsultations: true,
    });
    const outputDir = path.join(desktopOutDir('consult-'), 'pkg');
    const result = await deriveSanitizedDiseaseIdentitySyntheticHarness({
      ...baseDeriveInput(outputDir, dbPath, REPO_ROOT, FAKE_COMMIT),
      expectedRecordCount: 2,
      skipGeneratorGate: true,
      betweenPassesHook: () => {
        const w = new Database(dbPath);
        w.prepare('INSERT INTO consultations (id, note) VALUES (?, ?)').run(9, 'note');
        w.close();
      },
    });
    expect(result.recordCount).toBe(2);
    expect(existsSync(path.join(outputDir, 'ehas2-sanitized-derivation-activation.json'))).toBe(
      true,
    );
  });

  it('detects source main hash replacement', async () => {
    const dbPath = createSyntheticIdentityDb({ rows: [{ id: 1, icd10_code: 'A00.0' }] });
    const before = await captureSourceMainIdentityEvidence(dbPath);
    const w = new Database(dbPath);
    w.prepare('INSERT INTO diseases (id, icd10_code) VALUES (?, ?)').run(2, 'B00.0');
    w.close();
    const after = await captureSourceMainIdentityEvidence(dbPath);
    expect(before.sha256).not.toBe(after.sha256);
    expect(() => assertSourceMainIdentityUnchanged(before, after)).toThrow(
      /content identity changed/i,
    );
  });

  it('loads adoption only from authorized committed blob', async () => {
    const gitDir = tempDir('ehas2-adopt-');
    const head = initTempGitRepo(gitDir);
    const relDir = path.join(
      'docs',
      'clinical',
      'disease-identity',
      'sanitized-adoption-manifests',
    );
    mkdirSync(path.join(gitDir, relDir), { recursive: true });
    const adoptionPath = path.join(gitDir, relDir, 'test-v1.adoption.json');
    const adoption = {
      manifestSchemaVersion: 'ehas2-sanitized-disease-identity-adoption-manifest-v1',
      adoptionKind: 'EHAS2_SANITIZED_DISEASE_IDENTITY_ADOPTION_MANIFEST_V1',
      artifactKind: 'SANITIZED_LEGACY_DISEASE_IDENTITY_JSONL_V1',
      artifactSchemaVersion: 'ehas2-sanitized-legacy-disease-identity-record-v1',
      sanitizedManifestSchemaVersion: 'ehas2-sanitized-legacy-disease-identity-manifest-v1',
      datasetVersion: 'ehas2-sanitized-legacy-disease-identity-v1',
      legacyAuthority: 'EHAS2_PINNED_LEGACY_DISEASE_DB_V1',
      sourceClass: 'LIVE_SQLITE_READONLY_TRANSACTION_V1',
      authorityClassification: 'ENGINEERING_IDENTITY_ONLY',
      clinicalAuthority: 'NONE',
      licensingClassification: 'PRIVATE_ENGINEERING_IDENTITY_PENDING_LEGAL_CLEARANCE',
      artifactSHA256: 'a'.repeat(64),
      artifactBytes: 12,
      recordCount: 2,
      orderedIdentityFingerprint: 'b'.repeat(64),
      orderedIdentityFingerprintAlgorithm: 'EHAS2_ORDERED_SANITIZED_DISEASE_IDENTITY_FP_V1_SHA256',
      sanitizedManifestSHA256: 'c'.repeat(64),
      derivationToolingCommit: head,
      expectedCanonicalRepository: 'bakalwar/EH_AROGYA_SUTRA_2',
      ownerAdoptionTokenIdentity: 'R2-DATA-P2C-C-ADOPT-SANITIZED-INPUT-01',
      lifecycleStatus: 'ADOPTED_AS_GENERATOR_INPUT',
      supersedes: null,
      supersededBy: null,
    };
    writeFileSync(adoptionPath, `${canonicalJsonString(adoption)}\n`, 'utf8');
    execFileSync('git', ['add', adoptionPath], { cwd: gitDir, stdio: 'ignore' });
    execFileSync('git', ['commit', '-m', 'adoption placeholder'], { cwd: gitDir, stdio: 'ignore' });
    const adoptedHead = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: gitDir,
      encoding: 'utf8',
    }).trim();
    const adoptionAtTip = { ...adoption, derivationToolingCommit: adoptedHead };
    writeFileSync(adoptionPath, `${canonicalJsonString(adoptionAtTip)}\n`, 'utf8');
    execFileSync('git', ['add', adoptionPath], { cwd: gitDir, stdio: 'ignore' });
    execFileSync('git', ['commit', '-m', 'adoption final'], { cwd: gitDir, stdio: 'ignore' });
    const finalHead = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: gitDir,
      encoding: 'utf8',
    }).trim();
    execFileSync('git', ['update-ref', 'refs/remotes/ehas2/main', finalHead], {
      cwd: gitDir,
      stdio: 'ignore',
    });

    const loaded = await loadSanitizedAdoptionManifestFromControlPlane({
      repoRoot: gitDir,
      adoptionId: 'test-v1',
      expectedGeneratorCommit: finalHead,
    });
    expect(loaded.manifest.recordCount).toBe(2);

    writeFileSync(
      adoptionPath,
      `${canonicalJsonString({ ...adoptionAtTip, recordCount: 3 })}\n`,
      'utf8',
    );
    await expect(
      loadSanitizedAdoptionManifestFromControlPlane({
        repoRoot: gitDir,
        adoptionId: 'test-v1',
        expectedGeneratorCommit: finalHead,
      }),
    ).rejects.toThrow(/worktree content differs/i);

    await expect(
      loadSanitizedAdoptionManifestFromControlPlane({
        repoRoot: gitDir,
        adoptionId: 'test-v1',
        expectedGeneratorCommit: head,
      }),
    ).rejects.toThrow(/not present at authorized generator commit/i);

    expect(() => resolveSanitizedAdoptionControlPlanePath(gitDir, '../escape')).toThrow(
      DiseaseIdentityError,
    );
  });

  it('exposes bounded readonly busy timeout constant', () => {
    expect(LIVE_READONLY_SQLITE_BUSY_TIMEOUT_MS).toBeGreaterThan(0);
    expect(LIVE_READONLY_SQLITE_BUSY_TIMEOUT_MS).toBeLessThanOrEqual(30_000);
  });

  it('preserves locked aggregate firewall numbers', () => {
    expect(APPROVED_AGGREGATE_COUNTS.legacyDbRows).toBe(116_284);
    expect(116_284).toBe(98_181 + 18_103);
    expect(APPROVED_AGGREGATE_COUNTS.bridgeExactUnique).toBe(33_070);
  });

  it('synthetic harness publishes package verified by tooling-internal verifier', async () => {
    const dbPath = createSyntheticIdentityDb({
      rows: [
        { id: 1, icd10_code: 'A00.0' },
        { id: 2, icd10_code: 'B01.1' },
      ],
    });
    const outputDir = path.join(desktopOutDir('verify-'), 'pkg');
    const result = await deriveSanitizedDiseaseIdentitySyntheticHarness({
      ...baseDeriveInput(outputDir, dbPath, REPO_ROOT, FAKE_COMMIT),
      expectedRecordCount: 2,
      skipGeneratorGate: true,
    });
    await verifySanitizedArtifactPackage({
      artifactPath: path.join(outputDir, 'sanitized-disease-identity.jsonl'),
      manifestPath: path.join(outputDir, 'sanitized-disease-identity.manifest.json'),
      expectedRecordCount: 2,
      expectedArtifactSHA256: result.artifactSHA256,
      expectedArtifactBytes: result.artifactBytes,
      expectedOrderedIdentityFingerprint: result.orderedIdentityFingerprint,
      expectedManifestSHA256: result.manifestSHA256,
    });
  });

  it('generator gate helper rejects stale main tip', () => {
    const dir = tempDir('ehas2-stale-main-');
    const head = initTempGitRepo(dir);
    writeFileSync(path.join(dir, 'NEXT'), 'n\n', 'utf8');
    execFileSync('git', ['add', 'NEXT'], { cwd: dir, stdio: 'ignore' });
    execFileSync('git', ['commit', '-m', 'next'], { cwd: dir, stdio: 'ignore' });
    const second = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: dir,
      encoding: 'utf8',
    }).trim();
    expect(() =>
      assertProductionGeneratorReady({ repoRoot: dir, expectedGeneratorCommit: second }),
    ).toThrow(/main tip/i);
    expect(head).not.toBe(second);
  });

  it('readonly fingerprint stream does not log row values on duplicate ids', () => {
    const dir = tempDir('ehas2-dup-');
    const dbPath = path.join(dir, 'dup.db');
    const db = new Database(dbPath);
    db.exec('CREATE TABLE diseases (id INTEGER, icd10_code TEXT);');
    db.prepare('INSERT INTO diseases (id, icd10_code) VALUES (?, ?)').run(1, 'A00.0');
    db.prepare('INSERT INTO diseases (id, icd10_code) VALUES (?, ?)').run(1, 'B00.0');
    db.close();
    const conn = openLiveReadonlyDiseaseIdentityDb(dbPath);
    try {
      expect(() =>
        streamDiseaseIdentityFingerprintInReadTransaction(conn.db, { expectedCount: 2 }),
      ).toThrow(/Duplicate disease id/i);
    } finally {
      conn.db.close();
    }
  });

  it('rejects unadopted sanitized build when adoption is missing from authorized commit', async () => {
    const gitDir = tempDir('ehas2-unadopted-');
    const head = initTempGitRepo(gitDir);
    await expect(
      loadSanitizedAdoptionManifestFromControlPlane({
        repoRoot: gitDir,
        adoptionId: 'missing-v1',
        expectedGeneratorCommit: head,
      }),
    ).rejects.toThrow(/not present at authorized generator commit/i);
  });

  it('sanitized bridge reconciliation fails closed on referenced count mismatch', () => {
    const { createProductionBuildIndex, validateBridgeBatchProductionFromIndex } = publicApi;
    const index = createProductionBuildIndex(tempDir('ehas2-bridge-idx-'), {
      mode: 'synthetic-test',
      expectedDbRows: 3,
      expectedMappedRawRows: 2,
      expectedMappedUniqueRows: 2,
      expectedBridgeRows: 2,
    });
    index.insertDbRow({ id: 1, icd10_code: 'A00.0' });
    index.insertDbRow({ id: 2, icd10_code: 'B00.0' });
    index.insertDbRow({ id: 3, icd10_code: 'C00.0' });
    expect(() => validateBridgeBatchProductionFromIndex(index)).toThrow();
    index.destroy();
  });
});
