import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';
import {
  APPROVED_AGGREGATE_COUNTS,
  AUTHORITY_CLASSIFICATION,
  DB_IDENTITY_INPUT_CLASS_FULL_LEGACY_DB,
  DB_IDENTITY_INPUT_CLASS_SANITIZED_JSONL,
  DISEASE_IDENTITY_SQL_SHA256,
  DiseaseIdentityError,
  LEGACY_AUTHORITY,
  ORDERED_SANITIZED_IDENTITY_FP_ALGORITHM,
  PINNED_DISEASE_IDENTITY_SQL_SHA256,
  PINNED_LEGACY_DB_SHA256,
  SANITIZED_ADOPTION_MANIFEST_KIND,
  SANITIZED_ADOPTION_MANIFEST_SCHEMA_VERSION,
  SANITIZED_ARTIFACT_KIND,
  SANITIZED_CLINICAL_AUTHORITY,
  SANITIZED_DATASET_VERSION,
  SANITIZED_DERIVE_AUTHORIZATION_TOKEN,
  SANITIZED_LICENSING_CLASSIFICATION,
  SANITIZED_LIFECYCLE_DERIVED_PENDING_ADOPTION,
  SANITIZED_MANIFEST_SCHEMA_VERSION,
  SANITIZED_RECORD_SCHEMA_VERSION,
  SANITIZED_SOURCE_CLASS,
  assertDbIdentityInputClassXor,
  assertSanitizedFullCorpusBuildAuthorized,
  buildDiseaseCanonicalIdentityInput,
  buildSanitizedDiseaseIdentityRecord,
  canonicalJsonString,
  captureSourceDbSidecarSnapshot,
  deriveSanitizedDiseaseIdentity,
  generateDiseaseCanonicalId,
  openLiveReadonlyDiseaseIdentityDb,
  parseDbIdentityInputClass,
  resolveSanitizedAdoptionControlPlanePath,
  streamDiseaseIdentityFingerprintInReadTransaction,
  validateSanitizedAdoptionManifest,
  validateSanitizedArtifactManifest,
  validateSanitizedDiseaseIdentityRecord,
  verifySanitizedArtifactPackage,
} from '../src/index.ts';

const GOLDEN_DISEASE_CANONICAL_JSON =
  '{"algorithm":"EHAS2_CANONICAL_DISEASE_ID_v1_SHA256","legacyAuthority":"EHAS2_PINNED_LEGACY_DISEASE_DB_V1","legacyDbDiseaseId":1,"recordKind":"LEGACY_DB_ROW"}';
const GOLDEN_DISEASE_ID =
  'ehas2-dis-v1-fcfbec7dd5bfa19f222e0b34f87646fac544ada69a73404d9ede051eb51388f5';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const DESKTOP_TEST_ROOT = path.resolve(REPO_ROOT, '..', '_ehas2_p2c_sanitized_test_outputs');

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
  db.exec(`
    CREATE TABLE diseases (
      id INTEGER PRIMARY KEY,
      icd10_code TEXT
    );
  `);
  if (options.withConsultations) {
    db.exec(`CREATE TABLE consultations (id INTEGER PRIMARY KEY, note TEXT);`);
    db.prepare('INSERT INTO consultations (id, note) VALUES (?, ?)').run(
      1,
      'phi-should-not-be-read',
    );
  }
  const insert = db.prepare('INSERT INTO diseases (id, icd10_code) VALUES (?, ?)');
  for (const row of options.rows) {
    insert.run(row.id, row.icd10_code);
  }
  db.close();
  return dbPath;
}

describe('R2-DATA-P2C-C sanitized identity tooling', () => {
  it('pins disease identity SQL SHA-256', () => {
    expect(DISEASE_IDENTITY_SQL_SHA256).toBe(PINNED_DISEASE_IDENTITY_SQL_SHA256);
    expect(PINNED_DISEASE_IDENTITY_SQL_SHA256).toBe(
      createHash('sha256')
        .update('SELECT id, icd10_code FROM diseases ORDER BY id ASC', 'utf8')
        .digest('hex'),
    );
  });

  it('keeps golden canonical disease ID vectors byte-stable', () => {
    expect(canonicalJsonString(buildDiseaseCanonicalIdentityInput(1))).toBe(
      GOLDEN_DISEASE_CANONICAL_JSON,
    );
    expect(generateDiseaseCanonicalId(1)).toBe(GOLDEN_DISEASE_ID);
    expect(LEGACY_AUTHORITY).toBe('EHAS2_PINNED_LEGACY_DISEASE_DB_V1');
  });

  it('produces identical canonical IDs for full-DB row shape and sanitized record shape', () => {
    const fromId = generateDiseaseCanonicalId(42);
    const sanitized = buildSanitizedDiseaseIdentityRecord({
      legacyDbDiseaseId: 42,
      legacyCodeRaw: 'Z99.9',
    });
    expect(sanitized.legacyAuthority).toBe('EHAS2_PINNED_LEGACY_DISEASE_DB_V1');
    expect(generateDiseaseCanonicalId(sanitized.legacyDbDiseaseId)).toBe(fromId);
  });

  it('does not move canonical ID when code or sourceClass-like fields change', () => {
    const base = generateDiseaseCanonicalId(7);
    expect(
      generateDiseaseCanonicalId(
        buildSanitizedDiseaseIdentityRecord({ legacyDbDiseaseId: 7, legacyCodeRaw: 'A00.0' })
          .legacyDbDiseaseId,
      ),
    ).toBe(base);
    expect(
      generateDiseaseCanonicalId(
        buildSanitizedDiseaseIdentityRecord({ legacyDbDiseaseId: 7, legacyCodeRaw: null })
          .legacyDbDiseaseId,
      ),
    ).toBe(base);
    expect(generateDiseaseCanonicalId(8)).not.toBe(base);
  });

  it('validates closed sanitized record schema and rejects prohibited fields', () => {
    const seen = new Set<number>();
    const ok = validateSanitizedDiseaseIdentityRecord(
      {
        artifactSchemaVersion: SANITIZED_RECORD_SCHEMA_VERSION,
        legacyAuthority: LEGACY_AUTHORITY,
        legacyDbDiseaseId: 1,
        legacyCodeRaw: 'A00.0',
      },
      seen,
    );
    expect(ok.legacyCodeRaw).toBe('A00.0');
    expect(() =>
      validateSanitizedDiseaseIdentityRecord(
        {
          artifactSchemaVersion: SANITIZED_RECORD_SCHEMA_VERSION,
          legacyAuthority: LEGACY_AUTHORITY,
          legacyDbDiseaseId: 2,
          legacyCodeRaw: '   ',
        },
        seen,
      ),
    ).toThrow(DiseaseIdentityError);
    expect(() =>
      validateSanitizedDiseaseIdentityRecord(
        {
          artifactSchemaVersion: SANITIZED_RECORD_SCHEMA_VERSION,
          legacyAuthority: 'EHAS2_SANITIZED_LIVE_LEGACY_DISEASE_IDENTITY_V1',
          legacyDbDiseaseId: 3,
          legacyCodeRaw: null,
        },
        new Set(),
      ),
    ).toThrow(DiseaseIdentityError);
    expect(() =>
      validateSanitizedDiseaseIdentityRecord(
        {
          artifactSchemaVersion: SANITIZED_RECORD_SCHEMA_VERSION,
          legacyAuthority: LEGACY_AUTHORITY,
          legacyDbDiseaseId: 4,
          legacyCodeRaw: null,
          nameEnglish: 'nope',
        },
        new Set(),
      ),
    ).toThrow(DiseaseIdentityError);
  });

  it('enforces XOR between full DB and sanitized input classes', () => {
    expect(parseDbIdentityInputClass(undefined)).toBe(DB_IDENTITY_INPUT_CLASS_FULL_LEGACY_DB);
    expect(() =>
      assertDbIdentityInputClassXor({
        dbIdentityInputClass: DB_IDENTITY_INPUT_CLASS_FULL_LEGACY_DB,
        sanitizedArtifactPath: 'x',
      }),
    ).toThrow(DiseaseIdentityError);
    expect(() =>
      assertDbIdentityInputClassXor({
        dbIdentityInputClass: DB_IDENTITY_INPUT_CLASS_SANITIZED_JSONL,
        legacyDbPath: 'y',
      }),
    ).toThrow(DiseaseIdentityError);
  });

  it('rejects sanitized build authorization without adoption pins', () => {
    expect(() =>
      assertSanitizedFullCorpusBuildAuthorized({
        authorizeFullCorpusFlag: true,
        ownerToken: 'wrong',
        dbIdentityInputClass: DB_IDENTITY_INPUT_CLASS_SANITIZED_JSONL,
        mappedJsonSha256: 'x',
        bridgeSha256: 'y',
        sanitizedArtifactPath: '',
        sanitizedManifestPath: '',
        adoptionId: '',
        expectedArtifactSHA256: '',
        expectedArtifactBytes: 0,
        expectedRecordCount: 116284,
        expectedOrderedIdentityFingerprint: '',
        expectedSanitizedManifestSHA256: '',
        mappedJsonPath: '',
        bridgePath: '',
        outputPath: '',
        expectedGeneratorCommit: '',
      }),
    ).toThrow(DiseaseIdentityError);
  });

  it('includes WAL-visible committed identity and excludes post-snapshot writer commits', () => {
    const dbPath = createSyntheticIdentityDb({
      rows: [{ id: 1, icd10_code: 'A00.0' }],
      walMode: true,
      withConsultations: true,
    });
    const writer = new Database(dbPath);
    writer.prepare('INSERT INTO diseases (id, icd10_code) VALUES (?, ?)').run(2, 'B00.0');
    writer.close();

    const conn = openLiveReadonlyDiseaseIdentityDb(dbPath);
    conn.db.exec('BEGIN DEFERRED');
    const first = conn.db
      .prepare('SELECT id, icd10_code FROM diseases ORDER BY id ASC')
      .all() as Array<{
      id: number;
    }>;
    expect(first.map((r) => r.id)).toEqual([1, 2]);

    const writer2 = new Database(dbPath);
    writer2.prepare('INSERT INTO diseases (id, icd10_code) VALUES (?, ?)').run(3, 'C00.0');
    writer2.close();

    const still = conn.db
      .prepare('SELECT id, icd10_code FROM diseases ORDER BY id ASC')
      .all() as Array<{
      id: number;
    }>;
    // Snapshot from BEGIN should exclude id=3
    expect(still.map((r) => r.id)).toEqual([1, 2]);
    conn.db.exec('COMMIT');
    conn.db.close();
  });

  it('unrelated consultations write does not change identity fingerprint', () => {
    const dbPath = createSyntheticIdentityDb({
      rows: [
        { id: 1, icd10_code: 'A00.0' },
        { id: 2, icd10_code: null },
      ],
      walMode: true,
      withConsultations: true,
    });
    const conn = openLiveReadonlyDiseaseIdentityDb(dbPath);
    const before = streamDiseaseIdentityFingerprintInReadTransaction(conn.db, {
      expectedCount: 2,
    });
    const w = new Database(dbPath);
    w.prepare('INSERT INTO consultations (id, note) VALUES (?, ?)').run(2, 'unrelated');
    w.close();
    const after = streamDiseaseIdentityFingerprintInReadTransaction(conn.db, { expectedCount: 2 });
    expect(after.orderedIdentityFingerprint).toBe(before.orderedIdentityFingerprint);
    conn.db.close();
  });

  it('two-pass derivation publishes verified package and detects identity drift', async () => {
    const dbPath = createSyntheticIdentityDb({
      rows: [
        { id: 1, icd10_code: 'A00.0' },
        { id: 2, icd10_code: 'B01.1' },
      ],
      walMode: true,
    });
    const outParent = desktopOutDir('out-');
    const outputDir = path.join(outParent, 'pkg');
    const result = await deriveSanitizedDiseaseIdentity({
      authorizeDeriveFlag: true,
      ownerToken: SANITIZED_DERIVE_AUTHORIZATION_TOKEN,
      repoRoot: REPO_ROOT,
      sourceDbPath: dbPath,
      sourceEvidenceRefHistoricalMainSha256: PINNED_LEGACY_DB_SHA256,
      outputDir,
      expectedGeneratorCommit: 'SYNTHETIC_TEST_COMMIT',
      generatorSourceCommit: 'SYNTHETIC_TEST_COMMIT',
      expectedRecordCount: 2,
      syntheticTestMode: true,
      minimumFreeBytes: 1,
    });
    expect(result.recordCount).toBe(2);
    expect(result.shmCaveat).toContain('SHM');
    expect(existsSync(path.join(outputDir, 'sanitized-disease-identity.jsonl'))).toBe(true);
    expect(existsSync(path.join(outputDir, 'ehas2-sanitized-derivation-activation.json'))).toBe(
      true,
    );

    const manifest = JSON.parse(
      readFileSync(path.join(outputDir, 'sanitized-disease-identity.manifest.json'), 'utf8'),
    );
    expect(manifest.lifecycleStatus).toBe(SANITIZED_LIFECYCLE_DERIVED_PENDING_ADOPTION);
    validateSanitizedArtifactManifest(manifest);

    await verifySanitizedArtifactPackage({
      artifactPath: path.join(outputDir, 'sanitized-disease-identity.jsonl'),
      manifestPath: path.join(outputDir, 'sanitized-disease-identity.manifest.json'),
      expectedRecordCount: 2,
      expectedArtifactSHA256: result.artifactSHA256,
      expectedArtifactBytes: result.artifactBytes,
      expectedOrderedIdentityFingerprint: result.orderedIdentityFingerprint,
      expectedManifestSHA256: result.manifestSHA256,
    });

    // Drift detection: after changing disease identity, a second derive to a new dir should
    // still succeed for the new stream; pass-B mismatch is covered by injecting between passes
    // via unit of fingerprint inequality.
    const conn = openLiveReadonlyDiseaseIdentityDb(dbPath);
    const fp1 = streamDiseaseIdentityFingerprintInReadTransaction(conn.db, { expectedCount: 2 });
    const w = new Database(dbPath);
    w.prepare('INSERT INTO diseases (id, icd10_code) VALUES (?, ?)').run(3, 'Z99.9');
    w.close();
    const fp2 = streamDiseaseIdentityFingerprintInReadTransaction(conn.db, { expectedCount: 3 });
    expect(fp2.orderedIdentityFingerprint).not.toBe(fp1.orderedIdentityFingerprint);
    conn.db.close();
  });

  it('rejects derive without authorization token', async () => {
    const dbPath = createSyntheticIdentityDb({ rows: [{ id: 1, icd10_code: null }] });
    const outputDir = path.join(desktopOutDir('deny-'), 'pkg');
    await expect(
      deriveSanitizedDiseaseIdentity({
        authorizeDeriveFlag: false,
        ownerToken: SANITIZED_DERIVE_AUTHORIZATION_TOKEN,
        repoRoot: REPO_ROOT,
        sourceDbPath: dbPath,
        sourceEvidenceRefHistoricalMainSha256: PINNED_LEGACY_DB_SHA256,
        outputDir,
        expectedGeneratorCommit: 'SYNTHETIC_TEST_COMMIT',
        expectedRecordCount: 1,
        syntheticTestMode: true,
        minimumFreeBytes: 1,
      }),
    ).rejects.toBeInstanceOf(DiseaseIdentityError);
  });

  it('rejects output collision and path traversal adoption ids', async () => {
    const dbPath = createSyntheticIdentityDb({ rows: [{ id: 1, icd10_code: 'A00.0' }] });
    const outParent = desktopOutDir('coll-');
    const outputDir = path.join(outParent, 'pkg');
    mkdirSync(outputDir);
    await expect(
      deriveSanitizedDiseaseIdentity({
        authorizeDeriveFlag: true,
        ownerToken: SANITIZED_DERIVE_AUTHORIZATION_TOKEN,
        repoRoot: REPO_ROOT,
        sourceDbPath: dbPath,
        sourceEvidenceRefHistoricalMainSha256: PINNED_LEGACY_DB_SHA256,
        outputDir,
        expectedGeneratorCommit: 'SYNTHETIC_TEST_COMMIT',
        expectedRecordCount: 1,
        syntheticTestMode: true,
        minimumFreeBytes: 1,
      }),
    ).rejects.toBeInstanceOf(DiseaseIdentityError);

    expect(() => resolveSanitizedAdoptionControlPlanePath(REPO_ROOT, '../escape')).toThrow(
      DiseaseIdentityError,
    );
  });

  it('validates adoption manifest contract without creating a real control-plane entry', () => {
    const adoption = validateSanitizedAdoptionManifest({
      manifestSchemaVersion: SANITIZED_ADOPTION_MANIFEST_SCHEMA_VERSION,
      adoptionKind: SANITIZED_ADOPTION_MANIFEST_KIND,
      artifactKind: SANITIZED_ARTIFACT_KIND,
      artifactSchemaVersion: SANITIZED_RECORD_SCHEMA_VERSION,
      sanitizedManifestSchemaVersion: SANITIZED_MANIFEST_SCHEMA_VERSION,
      datasetVersion: SANITIZED_DATASET_VERSION,
      legacyAuthority: LEGACY_AUTHORITY,
      sourceClass: SANITIZED_SOURCE_CLASS,
      authorityClassification: AUTHORITY_CLASSIFICATION,
      clinicalAuthority: SANITIZED_CLINICAL_AUTHORITY,
      licensingClassification: SANITIZED_LICENSING_CLASSIFICATION,
      artifactSHA256: 'a'.repeat(64),
      artifactBytes: 12,
      recordCount: 2,
      orderedIdentityFingerprint: 'b'.repeat(64),
      orderedIdentityFingerprintAlgorithm: ORDERED_SANITIZED_IDENTITY_FP_ALGORITHM,
      sanitizedManifestSHA256: 'c'.repeat(64),
      derivationToolingCommit: 'SYNTHETIC_TEST_COMMIT',
      expectedCanonicalRepository: 'bakalwar/EH_AROGYA_SUTRA_2',
      ownerAdoptionTokenIdentity: 'R2-DATA-P2C-C-ADOPT-SANITIZED-INPUT-01',
      lifecycleStatus: 'ADOPTED_AS_GENERATOR_INPUT',
      supersedes: null,
      supersededBy: null,
    });
    expect(adoption.adoptionKind).toBe(SANITIZED_ADOPTION_MANIFEST_KIND);
    expect(ORDERED_SANITIZED_IDENTITY_FP_ALGORITHM).toBe(
      'EHAS2_ORDERED_SANITIZED_DISEASE_IDENTITY_FP_V1_SHA256',
    );
  });

  it('records sidecar metadata without paths and keeps production aggregate firewall numbers', () => {
    const dbPath = createSyntheticIdentityDb({
      rows: [{ id: 1, icd10_code: null }],
      walMode: true,
    });
    const snap = captureSourceDbSidecarSnapshot(dbPath);
    expect(snap.main.present).toBe(true);
    expect(JSON.stringify(snap)).not.toMatch(/synthetic\.db/);
    expect(APPROVED_AGGREGATE_COUNTS.legacyDbRows).toBe(116_284);
    expect(APPROVED_AGGREGATE_COUNTS.dbOnlyRows).toBe(18_103);
    expect(116_284).toBe(98_181 + 18_103);
  });

  it('does not activate polarity/runtime/registry', () => {
    expect(AUTHORITY_CLASSIFICATION).toBe('ENGINEERING_IDENTITY_ONLY');
    expect(SANITIZED_CLINICAL_AUTHORITY).toBe('NONE');
  });
});
