import { createReadStream, openSync, readSync, closeSync, statSync } from 'node:fs';
import { readdir, stat, readFile } from 'node:fs/promises';
import readline from 'node:readline';
import path from 'node:path';
import { DiseaseIdentityError } from './errors.js';
import { assertFileSha256, sha256FileHex } from './fileHash.js';
import { validateBundleManifest } from './manifest.js';
import { assertNoProhibitedFields } from './validationPrimitives.js';
import { canonicalJsonString, sha256HexLower } from './canonicalJson.js';
import {
  BUNDLE_ARTIFACT_NAMES,
  BUNDLE_ACTIVATION_MARKER_NAME,
  BUNDLE_KIND_PRODUCTION,
  BUNDLE_KIND_SYNTHETIC,
  EXPECTED_LEGACY_DB_DISEASE_COUNT,
  EXPECTED_MAPPED_UNIQUE_CODE_COUNT,
  EXPECTED_RELATIONSHIP_EDGE_COUNT,
  EXPECTED_UNRESOLVED_QUEUE_COUNT,
  MAX_STAGING_MEMBER_BYTES,
  RELATIONSHIP_TYPE_EXACT_UNIQUE,
} from './fullCorpusConstants.js';
import {
  generateDiseaseCanonicalId,
  generateMappedIndexId,
  generateRawMappedReferenceId,
  generateRelationshipId,
  isValidPrefixedDigestId,
} from './canonicalId.js';
import {
  BUNDLE_SCHEMA_VERSION,
  DISEASE_ID_PREFIX,
  MAPPED_ID_PREFIX,
  RAW_MAPPED_REF_PREFIX,
} from './constants.js';
import {
  buildDiseaseRecordFingerprintInput,
  buildMappedRecordFingerprintInput,
  computeRecordFingerprint,
} from './fingerprint.js';

function assertJsonlTrailingNewline(filePath: string): void {
  const st = statSync(filePath);
  if (st.size === 0) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'JSONL must end with a single trailing newline',
    );
  }
  const fd = openSync(filePath, 'r');
  try {
    const buf = Buffer.alloc(1);
    readSync(fd, buf, 0, 1, st.size - 1);
    if (buf[0] !== 0x0a) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        'JSONL must end with a single trailing newline',
      );
    }
  } finally {
    closeSync(fd);
  }
}

async function* iterateJsonlLines(filePath: string): AsyncGenerator<string> {
  assertJsonlTrailingNewline(filePath);
  const st = statSync(filePath);
  // Empty JSONL is exactly one trailing newline (zero records).
  if (st.size === 1) {
    return;
  }
  const rl = readline.createInterface({
    input: createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    if (line.includes('\r')) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'JSONL must use LF line endings only');
    }
    if (line.length === 0) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'JSONL contains empty line');
    }
    yield line;
  }
}

function assertCanonicalLine(line: string, parsed: unknown): void {
  if (canonicalJsonString(parsed) !== line) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'JSONL line is not canonical serialization');
  }
}

async function assertMemberHashAndSize(
  filePath: string,
  artifact: { name: string; sha256: string; bytes: number },
): Promise<void> {
  const st = await stat(filePath);
  if (st.size > MAX_STAGING_MEMBER_BYTES) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Bundle member ${artifact.name} exceeds MAX_STAGING_MEMBER_BYTES`,
    );
  }
  if (st.size !== artifact.bytes) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', `Byte size mismatch for ${artifact.name}`);
  }
  await assertFileSha256(filePath, artifact.sha256);
  const recomputed = await sha256FileHex(filePath);
  if (recomputed !== artifact.sha256) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Hash recompute mismatch for ${artifact.name}`,
    );
  }
}

export async function verifyFullBundle(
  bundleDir: string,
  options: {
    expectedBundleKind: typeof BUNDLE_KIND_PRODUCTION | typeof BUNDLE_KIND_SYNTHETIC;
    /** Internal pre-publication verification seam used before activation marker creation. */
    requireActivationMarker?: boolean;
  },
): Promise<void> {
  // Fail before deep artifact parsing when the caller omits or mistypes expected kind.
  if (
    options.expectedBundleKind !== BUNDLE_KIND_PRODUCTION &&
    options.expectedBundleKind !== BUNDLE_KIND_SYNTHETIC
  ) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'expectedBundleKind is mandatory and must be production or synthetic',
    );
  }
  const expectedBundleKind = options.expectedBundleKind;
  const resolved = path.resolve(bundleDir);
  const manifestPath = path.join(resolved, 'bundle-manifest.json');
  const manifestRaw = await readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestRaw) as Record<string, unknown>;
  validateBundleManifest(manifest);
  assertNoProhibitedFields(manifest);
  const manifestBundleKind = manifest.bundleKind;
  if (
    manifestBundleKind !== BUNDLE_KIND_PRODUCTION &&
    manifestBundleKind !== BUNDLE_KIND_SYNTHETIC
  ) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Unknown manifest bundleKind');
  }
  if (manifestBundleKind !== expectedBundleKind) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Bundle kind does not match expectedBundleKind',
    );
  }
  const maxima =
    expectedBundleKind === BUNDLE_KIND_PRODUCTION
      ? {
          disease: EXPECTED_LEGACY_DB_DISEASE_COUNT,
          mapped: EXPECTED_MAPPED_UNIQUE_CODE_COUNT,
          relationship: EXPECTED_RELATIONSHIP_EDGE_COUNT,
          unresolved: EXPECTED_UNRESOLVED_QUEUE_COUNT,
        }
      : { disease: 100, mapped: 100, relationship: 100, unresolved: 100 };

  if (manifest.authorityClassification !== 'ENGINEERING_IDENTITY_ONLY') {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Invalid authority classification');
  }

  const artifacts = manifest.artifacts as Array<{
    name: string;
    sha256: string;
    bytes: number;
    rowCount: number;
  }>;

  const artifactByName = new Map(artifacts.map((a) => [a.name, a]));
  const requiredPinnedMembers = [
    'disease-identity-ledger.jsonl',
    'mapped-index.jsonl',
    'relationship-edges.jsonl',
    'unresolved-queue.jsonl',
    'p2c-build-evidence.json',
  ] as const;
  for (const name of requiredPinnedMembers) {
    if (!artifactByName.has(name)) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `Manifest missing hash-pinned member ${name}`,
      );
    }
  }

  const recomputedParts: string[] = [];
  for (const artifact of artifacts) {
    const filePath = path.join(resolved, artifact.name);
    await assertMemberHashAndSize(filePath, artifact);
    recomputedParts.push(`${artifact.name}:${artifact.sha256}`);
  }

  const aggregate = sha256HexLower(recomputedParts.join('|'));
  if (aggregate !== manifest.aggregateFingerprint) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Aggregate fingerprint mismatch');
  }

  const entries = await readdir(resolved);
  const allowed = new Set<string>(BUNDLE_ARTIFACT_NAMES);
  for (const entry of entries) {
    if (!allowed.has(entry as (typeof BUNDLE_ARTIFACT_NAMES)[number])) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', `Unexpected bundle file ${entry}`);
    }
  }

  const diseaseArtifact = artifactByName.get('disease-identity-ledger.jsonl')!;
  const diseaseIds = new Set<string>();
  const legacyIds = new Set<number>();
  let prevDiseaseId = '';
  let diseaseCount = 0;
  for await (const line of iterateJsonlLines(
    path.join(resolved, 'disease-identity-ledger.jsonl'),
  )) {
    if (diseaseCount >= maxima.disease) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Disease ledger exceeds verifier bound');
    }
    const record = JSON.parse(line) as Record<string, unknown>;
    assertCanonicalLine(line, record);
    assertNoProhibitedFields(record);
    const id = String(record.ehas2DiseaseId);
    const legacyId = Number(record.legacyDbDiseaseId);
    if (!isValidPrefixedDigestId(id, DISEASE_ID_PREFIX)) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Invalid disease canonical id');
    }
    if (generateDiseaseCanonicalId(legacyId) !== id) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Disease id does not recompute');
    }
    if (diseaseIds.has(id) || legacyIds.has(legacyId)) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Duplicate disease identity');
    }
    diseaseIds.add(id);
    legacyIds.add(legacyId);
    if (prevDiseaseId && prevDiseaseId.localeCompare(id) >= 0) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Disease ledger out of order');
    }
    prevDiseaseId = id;
    const expectedFp = computeRecordFingerprint(
      buildDiseaseRecordFingerprintInput({ ...record, recordFingerprint: '' }),
    );
    if (record.recordFingerprint !== expectedFp) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Disease fingerprint mismatch');
    }
    diseaseCount += 1;
  }
  if (diseaseCount !== diseaseArtifact.rowCount) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Disease ledger row count mismatch');
  }

  const mappedArtifact = artifactByName.get('mapped-index.jsonl')!;
  const mappedIds = new Set<string>();
  let prevMappedSort = '';
  let mappedCount = 0;
  let mappedExactUnique = 0;
  for await (const line of iterateJsonlLines(path.join(resolved, 'mapped-index.jsonl'))) {
    if (mappedCount >= maxima.mapped) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Mapped index exceeds verifier bound');
    }
    const record = JSON.parse(line) as Record<string, unknown>;
    assertCanonicalLine(line, record);
    assertNoProhibitedFields(record);
    const mappedId = record.ehas2MappedIndexId as string | null;
    const rawId = record.rawMappedReferenceId as string | null;
    const sortKey = String(mappedId ?? rawId ?? '');
    if (prevMappedSort && prevMappedSort.localeCompare(sortKey) >= 0) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Mapped index out of order');
    }
    prevMappedSort = sortKey;
    if (mappedId) {
      if (!isValidPrefixedDigestId(mappedId, MAPPED_ID_PREFIX)) {
        throw new DiseaseIdentityError('MALFORMED_INPUT', 'Invalid mapped index id');
      }
      if (mappedIds.has(mappedId)) {
        throw new DiseaseIdentityError('MALFORMED_INPUT', 'Duplicate mapped index id');
      }
      mappedIds.add(mappedId);
      const ns = String(record.sourceNamespace);
      const code = String(record.sourceCode);
      if (generateMappedIndexId(ns as never, code) !== mappedId) {
        throw new DiseaseIdentityError('MALFORMED_INPUT', 'Mapped index id does not recompute');
      }
    } else if (rawId) {
      if (!isValidPrefixedDigestId(rawId, RAW_MAPPED_REF_PREFIX)) {
        throw new DiseaseIdentityError('MALFORMED_INPUT', 'Invalid raw mapped reference id');
      }
      const expected = generateRawMappedReferenceId(
        String(record.mappedCodeRaw),
        String(record.mappedSourceLabel),
      );
      if (expected !== rawId) {
        throw new DiseaseIdentityError(
          'MALFORMED_INPUT',
          'Raw mapped reference id does not recompute',
        );
      }
    } else {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Mapped record missing identity id');
    }
    const expectedFp = computeRecordFingerprint(
      buildMappedRecordFingerprintInput({ ...record, recordFingerprint: '' }),
    );
    if (record.recordFingerprint !== expectedFp) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Mapped fingerprint mismatch');
    }
    if (record.bridgeDisposition === 'EXACT_UNIQUE_MATCH') {
      mappedExactUnique += 1;
    }
    mappedCount += 1;
  }
  if (mappedCount !== mappedArtifact.rowCount) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Mapped index row count mismatch');
  }

  const relArtifact = artifactByName.get('relationship-edges.jsonl')!;
  const relIds = new Set<string>();
  let prevRel = '';
  let relCount = 0;
  for await (const line of iterateJsonlLines(path.join(resolved, 'relationship-edges.jsonl'))) {
    if (relCount >= maxima.relationship) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Relationship edges exceed verifier bound');
    }
    const record = JSON.parse(line) as Record<string, unknown>;
    assertCanonicalLine(line, record);
    assertNoProhibitedFields(record);
    if (record.relationshipType !== RELATIONSHIP_TYPE_EXACT_UNIQUE) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Non EXACT_UNIQUE relationship edge');
    }
    if (record.bridgeDisposition !== 'EXACT_UNIQUE_MATCH') {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        'Relationship disposition must be EXACT_UNIQUE',
      );
    }
    const mappedId = String(record.ehas2MappedIndexId);
    const diseaseId = String(record.ehas2DiseaseId);
    if (!mappedIds.has(mappedId) || !diseaseIds.has(diseaseId)) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Relationship endpoint missing');
    }
    const expectedRel = generateRelationshipId(mappedId, diseaseId, RELATIONSHIP_TYPE_EXACT_UNIQUE);
    if (record.relationshipId !== expectedRel) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Relationship id does not recompute');
    }
    if (relIds.has(String(record.relationshipId))) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Duplicate relationship id');
    }
    relIds.add(String(record.relationshipId));
    if (prevRel && prevRel.localeCompare(String(record.relationshipId)) >= 0) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Relationships out of order');
    }
    prevRel = String(record.relationshipId);
    relCount += 1;
  }
  if (relCount !== relArtifact.rowCount) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Relationship row count mismatch');
  }

  if (mappedExactUnique !== relCount) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'EXACT_UNIQUE mapped records must equal relationship edge count',
    );
  }

  const unresolvedArtifact = artifactByName.get('unresolved-queue.jsonl')!;
  const queueKeys = new Set<string>();
  const dispositionCounts = {
    EXACT_UNIQUE_MATCH: 0,
    EXACT_MULTIPLE_MATCH: 0,
    OWNER_REVIEW_REQUIRED: 0,
    NO_MATCH: 0,
  };
  let prevQueue = '';
  let unresolvedCount = 0;
  for await (const line of iterateJsonlLines(path.join(resolved, 'unresolved-queue.jsonl'))) {
    if (unresolvedCount >= maxima.unresolved) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Unresolved queue exceeds verifier bound');
    }
    const record = JSON.parse(line) as Record<string, unknown>;
    assertCanonicalLine(line, record);
    assertNoProhibitedFields(record);
    const key = String(record.queueKey);
    if (queueKeys.has(key)) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Duplicate unresolved queue key');
    }
    queueKeys.add(key);
    if (prevQueue && prevQueue.localeCompare(key) >= 0) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Unresolved queue out of order');
    }
    prevQueue = key;
    const disp = String(record.bridgeDisposition);
    if (disp === 'EXACT_UNIQUE_MATCH') {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        'EXACT_UNIQUE must not appear in unresolved queue',
      );
    }
    if (!(disp in dispositionCounts)) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Invalid unresolved disposition');
    }
    dispositionCounts[disp as keyof typeof dispositionCounts] += 1;
    unresolvedCount += 1;
  }
  if (unresolvedCount !== unresolvedArtifact.rowCount) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Unresolved queue row count mismatch');
  }

  const expectedUnresolvedFromMapped = mappedCount - mappedExactUnique;
  if (unresolvedCount !== expectedUnresolvedFromMapped) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Unresolved queue incomplete relative to mapped dispositions',
    );
  }

  if (expectedBundleKind === BUNDLE_KIND_PRODUCTION) {
    if (diseaseCount !== EXPECTED_LEGACY_DB_DISEASE_COUNT) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Full-corpus disease count mismatch');
    }
    if (mappedCount !== EXPECTED_MAPPED_UNIQUE_CODE_COUNT) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Full-corpus mapped count mismatch');
    }
    if (relCount !== EXPECTED_RELATIONSHIP_EDGE_COUNT) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Full-corpus relationship count mismatch');
    }
    if (unresolvedCount !== EXPECTED_UNRESOLVED_QUEUE_COUNT) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Full-corpus unresolved count mismatch');
    }
    if (dispositionCounts.EXACT_MULTIPLE_MATCH !== 17_181) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Full-corpus EXACT_MULTIPLE mismatch');
    }
    if (dispositionCounts.OWNER_REVIEW_REQUIRED !== 257) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Full-corpus OWNER_REVIEW mismatch');
    }
    if (dispositionCounts.NO_MATCH !== 36) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Full-corpus NO_MATCH mismatch');
    }
  }

  const evidenceRaw = await readFile(path.join(resolved, 'p2c-build-evidence.json'), 'utf8');
  const evidence = JSON.parse(evidenceRaw) as Record<string, unknown>;
  if (`${canonicalJsonString(evidence)}\n` !== evidenceRaw) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Build evidence is not canonical');
  }
  assertNoProhibitedFields(evidence);
  if (evidence.bundleKind !== manifestBundleKind) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Manifest/evidence bundleKind mismatch');
  }
  const evidenceText = evidenceRaw.toLowerCase();
  if (
    evidenceText.includes('c:\\users') ||
    evidenceText.includes('/users/') ||
    evidenceText.includes('appdata') ||
    /"timestamp"/.test(evidenceRaw) ||
    /"username"/.test(evidenceRaw)
  ) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Build evidence contains prohibited metadata',
    );
  }

  if (options.requireActivationMarker !== false) {
    const markerPath = path.join(resolved, BUNDLE_ACTIVATION_MARKER_NAME);
    const markerRaw = await readFile(markerPath, 'utf8');
    const marker = JSON.parse(markerRaw) as Record<string, unknown>;
    if (`${canonicalJsonString(marker)}\n` !== markerRaw) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Activation marker is not canonical');
    }
    const markerKeys = Object.keys(marker).sort();
    if (
      markerKeys.join(',') !==
      ['aggregateFingerprint', 'bundleKind', 'schemaVersion'].sort().join(',')
    ) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Activation marker shape mismatch');
    }
    if (
      marker.bundleKind !== manifestBundleKind ||
      marker.aggregateFingerprint !== manifest.aggregateFingerprint ||
      marker.schemaVersion !== BUNDLE_SCHEMA_VERSION
    ) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Activation marker binding mismatch');
    }
  }
}
