import { createHash } from 'node:crypto';
import { closeSync, existsSync, openSync, writeSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DiseaseIdentityError } from './errors.js';
import { canonicalJsonString, sha256HexLower } from './canonicalJson.js';
import { PINNED_LEGACY_DB_SHA256 } from './fullCorpusConstants.js';
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
  SANITIZED_MAX_ARTIFACT_BYTES,
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
import {
  captureSourceMainIdentityEvidence,
  type SourceMainIdentityEvidence,
} from './sourceMainIdentity.js';

export type SanitizedDeriveOrchestrationInput = {
  readonly repoRoot: string;
  readonly sourceDbPath: string;
  readonly outputDir: string;
  readonly expectedRecordCount: number;
  readonly generatorSourceCommit: string;
  readonly minimumFreeBytes?: number;
  /** Internal test hook only — runs after Pass A connection closes, before Pass B opens. */
  readonly betweenPassesHook?: () => void | Promise<void>;
};

export type SanitizedDeriveOrchestrationResult = {
  readonly outputDir: string;
  readonly recordCount: number;
  readonly artifactBytes: number;
  readonly artifactSHA256: string;
  readonly orderedIdentityFingerprint: string;
  readonly manifestSHA256: string;
  readonly sidecarBefore: SourceDbSidecarSnapshot;
  readonly sidecarAfter: SourceDbSidecarSnapshot;
  readonly mainIdentityBefore: SourceMainIdentityEvidence;
  readonly mainIdentityAfter: SourceMainIdentityEvidence;
  readonly shmCaveat: string;
};

/**
 * Two-pass identity-stable sanitized derivation orchestration.
 * Pass A: connection A → DEFERRED txn → artifact + fingerprint.
 * Pass B: close A → new connection B → DEFERRED txn → fingerprint-only.
 */
export async function executeSanitizedDeriveOrchestration(
  input: SanitizedDeriveOrchestrationInput,
): Promise<SanitizedDeriveOrchestrationResult> {
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
  const mainIdentityBefore = await captureSourceMainIdentityEvidence(sourceResolved);

  let stagingDir: string | null = await mkdtemp(path.join(tmpdir(), 'ehas2-sanitized-derive-'));
  const artifactStaging = path.join(stagingDir, 'sanitized-disease-identity.jsonl');

  try {
    const connectionA = openLiveReadonlyDiseaseIdentityDb(sourceResolved);
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
      passA = streamDiseaseIdentityArtifactInReadTransaction(connectionA.db, writeLine, {
        expectedCount: input.expectedRecordCount,
      });
    } finally {
      closeSync(fd);
    }
    connectionA.db.close();

    if (input.betweenPassesHook) {
      await input.betweenPassesHook();
    }

    const connectionB = openLiveReadonlyDiseaseIdentityDb(sourceResolved);
    let passB: {
      recordCount: number;
      orderedIdentityFingerprint: string;
      recordByteStreamSha256: string;
    };
    try {
      passB = streamDiseaseIdentityFingerprintInReadTransaction(connectionB.db, {
        expectedCount: input.expectedRecordCount,
      });
    } finally {
      connectionB.db.close();
    }

    if (
      passA.recordCount !== passB.recordCount ||
      passA.orderedIdentityFingerprint !== passB.orderedIdentityFingerprint
    ) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        'Identity stability window mismatch between derivation passes (aggregate only)',
      );
    }

    const mainIdentityMid = await captureSourceMainIdentityEvidence(sourceResolved);
    void mainIdentityMid;

    const artifactSHA256 = hash.digest('hex');
    const manifest = buildSanitizedArtifactManifest({
      recordCount: passA.recordCount,
      artifactBytes,
      artifactSHA256,
      orderedIdentityFingerprint: passA.orderedIdentityFingerprint,
      generatorVersion: FULL_CORPUS_GENERATOR_VERSION_SANITIZED,
      generatorSourceCommit: input.generatorSourceCommit,
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
      { encoding: 'utf8', flag: 'wx' },
    );

    const sidecarAfter = captureSourceDbSidecarSnapshot(sourceResolved);
    const mainIdentityAfter = await captureSourceMainIdentityEvidence(sourceResolved);
    if (
      mainIdentityBefore.deviceIdentity !== null &&
      mainIdentityAfter.deviceIdentity !== null &&
      mainIdentityBefore.deviceIdentity !== mainIdentityAfter.deviceIdentity
    ) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        'Source main DB file identity replaced during derivation',
      );
    }

    const evidence = {
      evidenceSchemaVersion: 'ehas2-sanitized-derivation-evidence-v1',
      recordCount: passA.recordCount,
      artifactBytes,
      artifactSHA256,
      orderedIdentityFingerprint: passA.orderedIdentityFingerprint,
      manifestSHA256,
      passBMatched: true,
      shmCaveat: 'WINDOWS_WAL_READONLY_MAY_TOUCH_SHM_WAL_INDEX_COORDINATION_STATE',
      sidecarBefore,
      sidecarAfter,
      mainIdentityBefore: {
        size: mainIdentityBefore.size,
        mtimeMs: mainIdentityBefore.mtimeMs,
        sha256: mainIdentityBefore.sha256,
        deviceIdentity: mainIdentityBefore.deviceIdentity,
      },
      mainIdentityAfter: {
        size: mainIdentityAfter.size,
        mtimeMs: mainIdentityAfter.mtimeMs,
        sha256: mainIdentityAfter.sha256,
        deviceIdentity: mainIdentityAfter.deviceIdentity,
      },
      authorityClassification: 'ENGINEERING_IDENTITY_ONLY',
      clinicalAuthority: 'NONE',
      note: 'Aggregate-only evidence; no disease row values',
    };
    await writeFile(
      path.join(stagingDir, 'sanitized-derivation-evidence.json'),
      `${canonicalJsonString(evidence)}\n`,
      { encoding: 'utf8', flag: 'wx' },
    );

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
      mainIdentityBefore,
      mainIdentityAfter,
      shmCaveat: 'WINDOWS_WAL_READONLY_MAY_TOUCH_SHM_WAL_INDEX_COORDINATION_STATE',
    };
  } catch (error) {
    if (stagingDir) {
      await rm(stagingDir, { recursive: true, force: true });
    }
    if (existsSync(outputDir)) {
      try {
        await rm(outputDir, { recursive: true, force: true });
      } catch {
        // preserve original
      }
    }
    throw error;
  }
}
