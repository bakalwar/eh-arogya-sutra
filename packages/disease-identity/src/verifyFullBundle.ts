import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { DiseaseIdentityError } from './errors.js';
import { assertFileSha256 } from './fileHash.js';
import { validateBundleManifest } from './manifest.js';
import { assertNoProhibitedFields } from './validationPrimitives.js';
import { canonicalJsonString, sha256HexLower } from './canonicalJson.js';
import {
  BUNDLE_ARTIFACT_NAMES,
  EXPECTED_LEGACY_DB_DISEASE_COUNT,
  EXPECTED_MAPPED_UNIQUE_CODE_COUNT,
  EXPECTED_RELATIONSHIP_EDGE_COUNT,
  EXPECTED_UNRESOLVED_QUEUE_COUNT,
  RELATIONSHIP_TYPE_EXACT_UNIQUE,
} from './fullCorpusConstants.js';
import {
  generateDiseaseCanonicalId,
  generateMappedIndexId,
  generateRawMappedReferenceId,
  generateRelationshipId,
  isValidPrefixedDigestId,
} from './canonicalId.js';
import { DISEASE_ID_PREFIX, MAPPED_ID_PREFIX, RAW_MAPPED_REF_PREFIX } from './constants.js';
import {
  buildDiseaseRecordFingerprintInput,
  buildMappedRecordFingerprintInput,
  computeRecordFingerprint,
} from './fingerprint.js';

function splitCanonicalJsonl(content: string): string[] {
  if (!content.endsWith('\n')) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'JSONL must end with a single trailing newline',
    );
  }
  if (content.length === 1) {
    return [];
  }
  const body = content.slice(0, -1);
  if (body.includes('\r')) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'JSONL must use LF line endings only');
  }
  return body.length === 0 ? [] : body.split('\n');
}

function assertCanonicalLine(line: string, parsed: unknown): void {
  if (canonicalJsonString(parsed) !== line) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'JSONL line is not canonical serialization');
  }
}

export async function verifyFullBundle(bundleDir: string): Promise<void> {
  const resolved = path.resolve(bundleDir);
  const manifestRaw = await readFile(path.join(resolved, 'bundle-manifest.json'), 'utf8');
  const manifest = JSON.parse(manifestRaw) as Record<string, unknown>;
  validateBundleManifest(manifest);
  assertNoProhibitedFields(manifest);

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
  const contents = new Map<string, string>();

  for (const artifact of artifacts) {
    const filePath = path.join(resolved, artifact.name);
    const content = await readFile(filePath, 'utf8');
    contents.set(artifact.name, content);
    if (Buffer.byteLength(content, 'utf8') !== artifact.bytes) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', `Byte size mismatch for ${artifact.name}`);
    }
    await assertFileSha256(filePath, artifact.sha256);
    if (sha256HexLower(content) !== artifact.sha256) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `Hash recompute mismatch for ${artifact.name}`,
      );
    }
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

  // --- Disease ledger ---
  const diseaseLines = splitCanonicalJsonl(contents.get('disease-identity-ledger.jsonl')!);
  const diseaseArtifact = artifactByName.get('disease-identity-ledger.jsonl')!;
  if (diseaseLines.length !== diseaseArtifact.rowCount) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Disease ledger row count mismatch');
  }
  const diseaseIds = new Set<string>();
  const legacyIds = new Set<number>();
  let prevDiseaseId = '';
  for (const line of diseaseLines) {
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
  }

  // --- Mapped index ---
  const mappedLines = splitCanonicalJsonl(contents.get('mapped-index.jsonl')!);
  const mappedArtifact = artifactByName.get('mapped-index.jsonl')!;
  if (mappedLines.length !== mappedArtifact.rowCount) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Mapped index row count mismatch');
  }
  const mappedIds = new Set<string>();
  let prevMappedSort = '';
  for (const line of mappedLines) {
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
  }

  // --- Relationships ---
  const relLines = splitCanonicalJsonl(contents.get('relationship-edges.jsonl')!);
  const relArtifact = artifactByName.get('relationship-edges.jsonl')!;
  if (relLines.length !== relArtifact.rowCount) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Relationship row count mismatch');
  }
  const relIds = new Set<string>();
  let prevRel = '';
  const exactUniqueMapped = new Set<string>();
  for (const line of relLines) {
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
    exactUniqueMapped.add(mappedId);
  }

  // --- Unresolved queue ---
  const unresolvedLines = splitCanonicalJsonl(contents.get('unresolved-queue.jsonl')!);
  const unresolvedArtifact = artifactByName.get('unresolved-queue.jsonl')!;
  if (unresolvedLines.length !== unresolvedArtifact.rowCount) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Unresolved queue row count mismatch');
  }
  const queueKeys = new Set<string>();
  const dispositionCounts = {
    EXACT_UNIQUE_MATCH: 0,
    EXACT_MULTIPLE_MATCH: 0,
    OWNER_REVIEW_REQUIRED: 0,
    NO_MATCH: 0,
  };
  let prevQueue = '';
  for (const line of unresolvedLines) {
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
  }

  // Consistency: exact-unique mapped records with disposition should match edge count
  let mappedExactUnique = 0;
  for (const line of mappedLines) {
    const record = JSON.parse(line) as Record<string, unknown>;
    if (record.bridgeDisposition === 'EXACT_UNIQUE_MATCH') {
      mappedExactUnique += 1;
    }
  }
  if (mappedExactUnique !== relLines.length) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'EXACT_UNIQUE mapped records must equal relationship edge count',
    );
  }

  // Full-corpus absolute counts when ledger is full size
  if (diseaseLines.length === EXPECTED_LEGACY_DB_DISEASE_COUNT) {
    if (mappedLines.length !== EXPECTED_MAPPED_UNIQUE_CODE_COUNT) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Full-corpus mapped count mismatch');
    }
    if (relLines.length !== EXPECTED_RELATIONSHIP_EDGE_COUNT) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Full-corpus relationship count mismatch');
    }
    if (unresolvedLines.length !== EXPECTED_UNRESOLVED_QUEUE_COUNT) {
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

  // Build evidence — deterministic, no timestamps/paths
  const evidenceRaw = contents.get('p2c-build-evidence.json')!;
  const evidence = JSON.parse(evidenceRaw) as Record<string, unknown>;
  if (`${canonicalJsonString(evidence)}\n` !== evidenceRaw) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Build evidence is not canonical');
  }
  assertNoProhibitedFields(evidence);
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
}
