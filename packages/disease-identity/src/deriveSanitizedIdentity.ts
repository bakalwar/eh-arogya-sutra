import { createHash } from 'node:crypto';
import { closeSync, existsSync, openSync, writeSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DiseaseIdentityError } from './errors.js';
import { canonicalJsonString, sha256HexLower } from './canonicalJson.js';
import {
  EXPECTED_LEGACY_DB_DISEASE_COUNT,
  PINNED_LEGACY_DB_SHA256,
} from './fullCorpusConstants.js';
import {
  assertExternalOutputPathAsync,
  rejectTempAsFinalBundlePath,
  resolveNearestExistingParent,
} from './pathSafety.js';
import { assertMinimumFreeBytes } from './fileHash.js';
import {
  FULL_CORPUS_GENERATOR_VERSION_SANITIZED,
  HISTORICAL_P2A_LEGACY_MAIN_FILE_EVIDENCE_LABEL,
  SANITIZED_ACTIVATION_MARKER_NAME,
  SANITIZED_DERIVE_AUTHORIZATION_TOKEN,
  SANITIZED_MAX_ARTIFACT_BYTES,
  SANITIZED_MAX_SYNTHETIC_ROWS,
  SANITIZED_PACKAGE_MEMBER_NAMES,
} from './sanitizedIdentityConstants.js';
import { buildSanitizedArtifactManifest } from './sanitizedArtifactManifest.js';
import {
  captureSourceDbSidecarSnapshot,
  openLiveReadonlyDiseaseIdentityDb,
  streamDiseaseIdentityArtifactInReadTransaction,
  streamDiseaseIdentityFingerprintInReadTransaction,
  type SourceDbSidecarSnapshot,
} from './liveReadonlyDiseaseIdentityRead.js';

export type DeriveSanitizedIdentityInput = {
  readonly authorizeDeriveFlag: boolean;
  readonly ownerToken: string;
  readonly repoRoot: string;
  readonly sourceDbPath: string;
  readonly sourceEvidenceRefHistoricalMainSha256: string;
  readonly outputDir: string;
  readonly expectedGeneratorCommit: string;
  /** Production default 116284; synthetic tests pass a small bound. */
  readonly expectedRecordCount?: number;
  readonly syntheticTestMode?: boolean;
  readonly generatorSourceCommit?: string;
  readonly minimumFreeBytes?: number;
};

export type DeriveSanitizedIdentityResult = {
  readonly outputDir: string;
  readonly recordCount: number;
  readonly artifactBytes: number;
  readonly artifactSHA256: string;
  readonly orderedIdentityFingerprint: string;
  readonly manifestSHA256: string;
  readonly sidecarBefore: SourceDbSidecarSnapshot;
  readonly sidecarAfter: SourceDbSidecarSnapshot;
  readonly shmCaveat: string;
};

function assertDeriveAuthorized(input: DeriveSanitizedIdentityInput): void {
  if (!input.authorizeDeriveFlag) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Sanitized derivation requires --authorize-derive-sanitized-identity',
    );
  }
  if (input.ownerToken !== SANITIZED_DERIVE_AUTHORIZATION_TOKEN) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Sanitized derivation owner token mismatch');
  }
}

function assertMainIdentityStable(
  before: SourceDbSidecarSnapshot,
  after: SourceDbSidecarSnapshot,
): void {
  if (!before.main.present || !after.main.present) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Source DB main file missing');
  }
  if (before.main.size !== after.main.size) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Unexpected main DB size change during derivation',
    );
  }
}

/**
 * Two-pass identity-stable sanitized derivation.
 * Pass A: DEFERRED txn write artifact + fingerprint.
 * Pass B: new DEFERRED txn fingerprint-only; must match Pass A.
 * Does not print row values. Does not checkpoint/copy WAL/SHM.
 */
export async function deriveSanitizedDiseaseIdentity(
  input: DeriveSanitizedIdentityInput,
): Promise<DeriveSanitizedIdentityResult> {
  assertDeriveAuthorized(input);
  const expectedCount =
    input.expectedRecordCount ??
    (input.syntheticTestMode ? undefined : EXPECTED_LEGACY_DB_DISEASE_COUNT);
  if (
    !input.syntheticTestMode &&
    expectedCount !== undefined &&
    expectedCount !== EXPECTED_LEGACY_DB_DISEASE_COUNT
  ) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Production expected count must be 116284');
  }
  if (
    input.syntheticTestMode &&
    expectedCount !== undefined &&
    expectedCount > SANITIZED_MAX_SYNTHETIC_ROWS
  ) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Synthetic row bound exceeded');
  }
  if (input.sourceEvidenceRefHistoricalMainSha256 !== PINNED_LEGACY_DB_SHA256) {
    // Historical P2A ref must remain the locked main-file evidence label value.
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'source evidence ref must equal historical P2A main-file SHA pin',
    );
  }

  const outputDir = await assertExternalOutputPathAsync(input.repoRoot, input.outputDir);
  rejectTempAsFinalBundlePath(outputDir);
  if (existsSync(outputDir)) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Output destination must not exist');
  }

  const sourceResolved = path.resolve(input.sourceDbPath);
  const outputParent = path.dirname(outputDir);
  if (
    path.resolve(outputParent) === path.dirname(sourceResolved) ||
    outputDir.startsWith(path.dirname(sourceResolved) + path.sep)
  ) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Sanitized output must not be written beside the live DB',
    );
  }

  const minFree = input.minimumFreeBytes ?? 50_000_000;
  await assertMinimumFreeBytes(await resolveNearestExistingParent(outputDir), minFree);

  const sidecarBefore = captureSourceDbSidecarSnapshot(sourceResolved);
  let stagingDir: string | null = await mkdtemp(path.join(tmpdir(), 'ehas2-sanitized-derive-'));
  const artifactStaging = path.join(stagingDir, 'sanitized-disease-identity.jsonl');
  let connection: ReturnType<typeof openLiveReadonlyDiseaseIdentityDb> | null = null;

  try {
    connection = openLiveReadonlyDiseaseIdentityDb(sourceResolved);
    const hash = createHash('sha256');
    let artifactBytes = 0;
    let passA: {
      recordCount: number;
      orderedIdentityFingerprint: string;
      recordByteStreamSha256: string;
    };
    const fd = openSync(artifactStaging, 'wx');
    try {
      const writeLine = (canonicalLineWithLf: string): void => {
        const buf = Buffer.from(canonicalLineWithLf, 'utf8');
        artifactBytes += buf.length;
        if (artifactBytes > SANITIZED_MAX_ARTIFACT_BYTES) {
          throw new DiseaseIdentityError('MALFORMED_INPUT', 'Sanitized artifact exceeds max bytes');
        }
        hash.update(buf);
        writeSync(fd, buf);
      };

      passA = streamDiseaseIdentityArtifactInReadTransaction(connection.db, writeLine, {
        expectedCount,
      });
    } finally {
      closeSync(fd);
    }

    // Pass B: second readonly identity-only verification transaction (no rewrite).
    const passB = streamDiseaseIdentityFingerprintInReadTransaction(connection.db, {
      expectedCount,
    });
    if (
      passA.recordCount !== passB.recordCount ||
      passA.orderedIdentityFingerprint !== passB.orderedIdentityFingerprint
    ) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        'Identity stability window mismatch between derivation passes (aggregate only)',
      );
    }

    const artifactSHA256 = hash.digest('hex');
    const generatorSourceCommit = input.generatorSourceCommit ?? input.expectedGeneratorCommit;
    const manifest = buildSanitizedArtifactManifest({
      recordCount: passA.recordCount,
      artifactBytes,
      artifactSHA256,
      orderedIdentityFingerprint: passA.orderedIdentityFingerprint,
      generatorVersion: FULL_CORPUS_GENERATOR_VERSION_SANITIZED,
      generatorSourceCommit,
      sourceLegacyEvidenceReference: {
        label: HISTORICAL_P2A_LEGACY_MAIN_FILE_EVIDENCE_LABEL,
        historicalMainFileSha256: PINNED_LEGACY_DB_SHA256,
      },
      supersedes: null,
      supersededBy: null,
    });
    const manifestText = `${canonicalJsonString(manifest)}\n`;
    const manifestSHA256 = sha256HexLower(manifestText);
    await writeFile(
      path.join(stagingDir, 'sanitized-disease-identity.manifest.json'),
      manifestText,
      {
        encoding: 'utf8',
        flag: 'wx',
      },
    );

    const evidence = {
      evidenceSchemaVersion: 'ehas2-sanitized-derivation-evidence-v1',
      recordCount: passA.recordCount,
      artifactBytes,
      artifactSHA256,
      orderedIdentityFingerprint: passA.orderedIdentityFingerprint,
      manifestSHA256,
      passBMatched: true,
      shmCaveat: connection.shmCaveat,
      sidecarBefore,
      // after captured below
      authorityClassification: 'ENGINEERING_IDENTITY_ONLY',
      clinicalAuthority: 'NONE',
      note: 'Aggregate-only evidence; no disease row values',
    };

    connection.db.close();
    connection = null;

    const sidecarAfter = captureSourceDbSidecarSnapshot(sourceResolved);
    assertMainIdentityStable(sidecarBefore, sidecarAfter);
    const evidenceFinal = { ...evidence, sidecarAfter };
    await writeFile(
      path.join(stagingDir, 'sanitized-derivation-evidence.json'),
      `${canonicalJsonString(evidenceFinal)}\n`,
      { encoding: 'utf8', flag: 'wx' },
    );

    // Exclusive destination ownership + member publish + activation last.
    await mkdir(outputDir, { recursive: false });
    for (const name of SANITIZED_PACKAGE_MEMBER_NAMES) {
      if (name === SANITIZED_ACTIVATION_MARKER_NAME) {
        continue;
      }
      const src = path.join(stagingDir, name);
      const dest = path.join(outputDir, name);
      const body = await readFile(src);
      await writeFile(dest, body, { flag: 'wx' });
    }

    // Re-verify artifact hash on published member
    const publishedArtifact = await readFile(
      path.join(outputDir, 'sanitized-disease-identity.jsonl'),
    );
    if (sha256HexLower(publishedArtifact) !== artifactSHA256) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Published artifact digest mismatch');
    }
    const publishedManifest = await readFile(
      path.join(outputDir, 'sanitized-disease-identity.manifest.json'),
      'utf8',
    );
    if (sha256HexLower(publishedManifest) !== manifestSHA256) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Published manifest digest mismatch');
    }

    const activation = {
      activationSchemaVersion: 'ehas2-sanitized-derivation-activation-v1',
      artifactSHA256,
      manifestSHA256,
      orderedIdentityFingerprint: passA.orderedIdentityFingerprint,
      recordCount: passA.recordCount,
      lifecycleStatus: 'DERIVED_PENDING_ADOPTION',
    };
    await writeFile(
      path.join(outputDir, SANITIZED_ACTIVATION_MARKER_NAME),
      `${canonicalJsonString(activation)}\n`,
      { encoding: 'utf8', flag: 'wx' },
    );

    await rm(stagingDir, { recursive: true, force: true });
    stagingDir = null;

    return {
      outputDir,
      recordCount: passA.recordCount,
      artifactBytes,
      artifactSHA256,
      orderedIdentityFingerprint: passA.orderedIdentityFingerprint,
      manifestSHA256,
      sidecarBefore,
      sidecarAfter,
      shmCaveat: 'WINDOWS_WAL_READONLY_MAY_TOUCH_SHM_WAL_INDEX_COORDINATION_STATE',
    };
  } catch (error) {
    if (connection) {
      try {
        connection.db.close();
      } catch {
        // preserve
      }
    }
    if (stagingDir) {
      await rm(stagingDir, { recursive: true, force: true });
    }
    if (existsSync(outputDir)) {
      // Only delete if we created it and activation may be incomplete — best-effort owned cleanup
      try {
        await rm(outputDir, { recursive: true, force: true });
      } catch {
        // preserve original
      }
    }
    throw error;
  }
}
