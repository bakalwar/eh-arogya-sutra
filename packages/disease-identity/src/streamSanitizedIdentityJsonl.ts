import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import readline from 'node:readline';
import { DiseaseIdentityError } from './errors.js';
import { canonicalJsonString } from './canonicalJson.js';
import { EXPECTED_LEGACY_DB_DISEASE_COUNT } from './fullCorpusConstants.js';
import {
  SANITIZED_LIFECYCLE_DERIVED_PENDING_ADOPTION,
  SANITIZED_MAX_ARTIFACT_BYTES,
  SANITIZED_MAX_LINE_BYTES,
} from './sanitizedIdentityConstants.js';
import {
  validateSanitizedDiseaseIdentityRecord,
  type SanitizedDiseaseIdentityRecord,
} from './sanitizedIdentityRecord.js';
import { OrderedSanitizedIdentityFingerprintBuilder } from './orderedSanitizedIdentityFingerprint.js';
import { validateSanitizedArtifactManifest } from './sanitizedArtifactManifest.js';
import { readFile } from 'node:fs/promises';
import { sha256HexLower } from './canonicalJson.js';

export type StreamSanitizedIdentityJsonlResult = {
  readonly recordCount: number;
  readonly artifactBytes: number;
  readonly artifactSHA256: string;
  readonly orderedIdentityFingerprint: string;
};

/**
 * Same-stream SHA-256 + ordered fingerprint over sanitized JSONL.
 * Invokes onRecord without retaining the full corpus.
 */
export async function streamSanitizedIdentityJsonlFile(
  artifactPath: string,
  options: {
    readonly expectedRecordCount?: number;
    readonly expectedArtifactSHA256?: string;
    readonly expectedArtifactBytes?: number;
    readonly expectedOrderedIdentityFingerprint?: string;
    readonly onRecord?: (record: SanitizedDiseaseIdentityRecord) => void;
  } = {},
): Promise<StreamSanitizedIdentityJsonlResult> {
  const expectedCount = options.expectedRecordCount ?? EXPECTED_LEGACY_DB_DISEASE_COUNT;
  const hash = createHash('sha256');
  const fp = new OrderedSanitizedIdentityFingerprintBuilder();
  const seen = new Set<number>();
  let artifactBytes = 0;
  let recordCount = 0;
  let lastId = 0;

  const rl = readline.createInterface({
    input: createReadStream(artifactPath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let sawContent = false;
  for await (const line of rl) {
    sawContent = true;
    if (line.length === 0) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'JSONL contains empty line');
    }
    if (line.includes('\r')) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'JSONL must use LF line endings only');
    }
    const lineBytes = Buffer.byteLength(line, 'utf8');
    if (lineBytes > SANITIZED_MAX_LINE_BYTES) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'JSONL line exceeds max bytes');
    }
    const withLf = `${line}\n`;
    const chunk = Buffer.from(withLf, 'utf8');
    artifactBytes += chunk.length;
    if (artifactBytes > SANITIZED_MAX_ARTIFACT_BYTES) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Artifact exceeds max bytes');
    }
    hash.update(chunk);

    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Invalid JSONL line');
    }
    const record = validateSanitizedDiseaseIdentityRecord(parsed, seen);
    if (canonicalJsonString(record) !== line) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        'JSONL line is not canonical serialization',
      );
    }
    if (record.legacyDbDiseaseId <= lastId) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        'Sanitized rows must be strictly ascending',
      );
    }
    lastId = record.legacyDbDiseaseId;
    fp.appendCanonicalLine(line, record.legacyDbDiseaseId);
    options.onRecord?.(record);
    recordCount += 1;
    if (recordCount > expectedCount) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Sanitized record count exceeded expected');
    }
  }

  if (!sawContent && expectedCount > 0) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Sanitized artifact empty');
  }
  // Require final LF: createReadStream+readline strips the last empty segment; check file ends with \n
  const { openSync, readSync, closeSync, fstatSync } = await import('node:fs');
  const fd = openSync(artifactPath, 'r');
  try {
    const st = fstatSync(fd);
    if (st.size === 0) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Sanitized artifact empty');
    }
    const buf = Buffer.alloc(1);
    readSync(fd, buf, 0, 1, st.size - 1);
    if (buf[0] !== 0x0a) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Sanitized JSONL requires final LF');
    }
  } finally {
    closeSync(fd);
  }

  const finalized = fp.finalize(expectedCount);
  const artifactSHA256 = hash.digest('hex');
  if (options.expectedArtifactSHA256 && artifactSHA256 !== options.expectedArtifactSHA256) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Sanitized artifact SHA-256 mismatch');
  }
  if (
    options.expectedArtifactBytes !== undefined &&
    artifactBytes !== options.expectedArtifactBytes
  ) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Sanitized artifact bytes mismatch');
  }
  if (
    options.expectedOrderedIdentityFingerprint &&
    finalized.orderedIdentityFingerprint !== options.expectedOrderedIdentityFingerprint
  ) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Ordered identity fingerprint mismatch');
  }
  if (recordCount !== expectedCount) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Expected ${expectedCount} sanitized records, observed ${recordCount}`,
    );
  }

  return {
    recordCount,
    artifactBytes,
    artifactSHA256,
    orderedIdentityFingerprint: finalized.orderedIdentityFingerprint,
  };
}

export async function verifySanitizedArtifactPackage(input: {
  readonly artifactPath: string;
  readonly manifestPath: string;
  readonly expectedRecordCount?: number;
  readonly expectedArtifactSHA256: string;
  readonly expectedArtifactBytes: number;
  readonly expectedOrderedIdentityFingerprint: string;
  readonly expectedManifestSHA256: string;
}): Promise<{
  readonly artifact: StreamSanitizedIdentityJsonlResult;
  readonly manifestSHA256: string;
}> {
  const artifact = await streamSanitizedIdentityJsonlFile(input.artifactPath, {
    expectedRecordCount: input.expectedRecordCount,
    expectedArtifactSHA256: input.expectedArtifactSHA256,
    expectedArtifactBytes: input.expectedArtifactBytes,
    expectedOrderedIdentityFingerprint: input.expectedOrderedIdentityFingerprint,
  });
  const manifestText = await readFile(input.manifestPath, 'utf8');
  const manifestSHA256 = sha256HexLower(manifestText);
  if (manifestSHA256 !== input.expectedManifestSHA256) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Sanitized manifest SHA-256 mismatch');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(manifestText.trimEnd());
  } catch {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Sanitized manifest JSON invalid');
  }
  const manifest = validateSanitizedArtifactManifest(parsed);
  if (manifest.lifecycleStatus !== SANITIZED_LIFECYCLE_DERIVED_PENDING_ADOPTION) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Derived manifest lifecycle invalid');
  }
  if (manifest.artifactSHA256 !== artifact.artifactSHA256) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Manifest artifactSHA256 disagrees');
  }
  if (manifest.artifactBytes !== artifact.artifactBytes) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Manifest artifactBytes disagrees');
  }
  if (manifest.recordCount !== artifact.recordCount) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Manifest recordCount disagrees');
  }
  if (manifest.orderedIdentityFingerprint !== artifact.orderedIdentityFingerprint) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Manifest fingerprint disagrees');
  }
  return { artifact, manifestSHA256 };
}
