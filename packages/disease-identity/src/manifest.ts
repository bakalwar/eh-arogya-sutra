import { canonicalJsonString } from './canonicalJson.js';
import { BUNDLE_KIND_PRODUCTION, BUNDLE_KIND_SYNTHETIC } from './fullCorpusConstants.js';
import {
  APPROVED_AGGREGATE_COUNTS,
  AUTHORITY_CLASSIFICATION,
  BUNDLE_SCHEMA_VERSION,
  DATASET_VERSION,
} from './constants.js';
import { DiseaseIdentityError, MALFORMED_INPUT } from './errors.js';
import {
  APPROVED_LICENSING_CLASSIFICATIONS,
  APPROVED_MANIFEST_ALGORITHMS,
  MANIFEST_ALLOWED_KEYS,
  MANIFEST_ARTIFACT_ALLOWED_KEYS,
  MANIFEST_EVIDENCE_HASH_KEYS,
  MAX_GENERATOR_VERSION_LENGTH,
  MAX_MANIFEST_ALGORITHMS,
  MAX_MANIFEST_ARTIFACTS,
} from './schemaAllowlists.js';
import {
  assertBoundedString,
  assertExactAllowlistedKeys,
  assertNonNegativeSafeInteger,
  assertNoProhibitedFields,
  assertPlainObject,
  assertPositiveSafeInteger,
  assertSafeArtifactFilename,
  assertSha256Hex,
} from './validationPrimitives.js';
import type { BundleManifestTemplate } from './types.js';

function assertExactString(value: unknown, expected: string, label: string): void {
  if (value !== expected) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, `${label} must equal ${expected}`);
  }
}

export function validateBundleManifest(manifest: Record<string, unknown>): void {
  assertPlainObject(manifest, 'manifest');
  assertNoProhibitedFields(manifest);
  assertExactAllowlistedKeys(manifest, MANIFEST_ALLOWED_KEYS, 'manifest');
  if (
    manifest.bundleKind !== BUNDLE_KIND_PRODUCTION &&
    manifest.bundleKind !== BUNDLE_KIND_SYNTHETIC
  ) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'Invalid or unknown bundleKind');
  }

  assertExactString(manifest.bundleSchemaVersion, BUNDLE_SCHEMA_VERSION, 'bundleSchemaVersion');
  assertExactString(manifest.datasetVersion, DATASET_VERSION, 'datasetVersion');
  assertExactString(
    manifest.authorityClassification,
    AUTHORITY_CLASSIFICATION,
    'authorityClassification',
  );

  const licensing = assertBoundedString(
    manifest.licensingClassification,
    'licensingClassification',
  );
  if (!(APPROVED_LICENSING_CLASSIFICATIONS as readonly string[]).includes(licensing)) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'Invalid licensingClassification');
  }

  const generatorVersion = assertBoundedString(manifest.generatorVersion, 'generatorVersion');
  if (generatorVersion.length === 0 || generatorVersion.length > MAX_GENERATOR_VERSION_LENGTH) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'Invalid generatorVersion');
  }

  if (!Array.isArray(manifest.canonicalIdAlgorithms)) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'canonicalIdAlgorithms must be an array');
  }
  if (
    manifest.canonicalIdAlgorithms.length === 0 ||
    manifest.canonicalIdAlgorithms.length > MAX_MANIFEST_ALGORITHMS
  ) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'Invalid canonicalIdAlgorithms length');
  }
  const algorithms = manifest.canonicalIdAlgorithms.map((item, index) =>
    assertBoundedString(item, `canonicalIdAlgorithms[${index}]`),
  );
  const seenAlgorithms = new Set<string>();
  for (const algorithm of algorithms) {
    if (seenAlgorithms.has(algorithm)) {
      throw new DiseaseIdentityError(
        MALFORMED_INPUT,
        `Duplicate canonicalIdAlgorithms entry ${algorithm}`,
      );
    }
    seenAlgorithms.add(algorithm);
    if (!(APPROVED_MANIFEST_ALGORITHMS as readonly string[]).includes(algorithm)) {
      throw new DiseaseIdentityError(
        MALFORMED_INPUT,
        `Unsupported manifest algorithm ${algorithm}`,
      );
    }
  }

  assertSha256Hex(manifest.aggregateFingerprint, 'aggregateFingerprint');

  assertPlainObject(manifest.inputEvidenceHashes, 'inputEvidenceHashes');
  assertNoProhibitedFields(manifest.inputEvidenceHashes, 'inputEvidenceHashes');
  assertExactAllowlistedKeys(
    manifest.inputEvidenceHashes,
    MANIFEST_EVIDENCE_HASH_KEYS,
    'inputEvidenceHashes',
  );
  for (const [key, value] of Object.entries(
    manifest.inputEvidenceHashes as Record<string, unknown>,
  )) {
    if (key === 'note') {
      assertBoundedString(value, 'inputEvidenceHashes.note');
    } else {
      assertSha256Hex(value, `inputEvidenceHashes.${key}`);
    }
  }

  if (!Array.isArray(manifest.artifacts)) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'artifacts must be an array');
  }
  if (manifest.artifacts.length > MAX_MANIFEST_ARTIFACTS) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'artifacts exceeds bounded length');
  }

  const artifactNames = new Set<string>();
  for (let i = 0; i < manifest.artifacts.length; i += 1) {
    const artifact = manifest.artifacts[i];
    assertPlainObject(artifact, `artifacts[${i}]`);
    assertExactAllowlistedKeys(artifact, MANIFEST_ARTIFACT_ALLOWED_KEYS, `artifacts[${i}]`);
    assertNoProhibitedFields(artifact, `artifacts[${i}]`);
    const name = assertSafeArtifactFilename(artifact.name, `artifacts[${i}].name`);
    if (artifactNames.has(name)) {
      throw new DiseaseIdentityError(MALFORMED_INPUT, `Duplicate artifact name ${name}`);
    }
    artifactNames.add(name);
    const rowCount = assertNonNegativeSafeInteger(artifact.rowCount, `artifacts[${i}].rowCount`);
    const bytes = assertNonNegativeSafeInteger(artifact.bytes, `artifacts[${i}].bytes`);
    if (rowCount > 0 && bytes <= 0) {
      throw new DiseaseIdentityError(
        MALFORMED_INPUT,
        `artifacts[${i}].bytes must be positive when rowCount > 0`,
      );
    }
    assertSha256Hex(artifact.sha256, `artifacts[${i}].sha256`);
  }

  assertPlainObject(manifest.reconciliation, 'reconciliation');
  assertNoProhibitedFields(manifest.reconciliation, 'reconciliation');
  const reconciliation = manifest.reconciliation as Record<string, unknown>;
  for (const key of Object.keys(reconciliation)) {
    if (!(key in APPROVED_AGGREGATE_COUNTS)) {
      throw new DiseaseIdentityError(MALFORMED_INPUT, `Unknown reconciliation key ${key}`);
    }
    assertPositiveSafeInteger(reconciliation[key], `reconciliation.${key}`);
  }
  for (const key of Object.keys(APPROVED_AGGREGATE_COUNTS)) {
    if (!(key in reconciliation)) {
      throw new DiseaseIdentityError(MALFORMED_INPUT, `Missing reconciliation key ${key}`);
    }
  }
}

export function reconcileManifestCounts(manifest: BundleManifestTemplate): void {
  validateBundleManifest(manifest as unknown as Record<string, unknown>);
  const r = manifest.reconciliation;
  const expected = APPROVED_AGGREGATE_COUNTS;
  const checks: Array<[keyof typeof expected, string]> = [
    ['legacyDbRows', 'legacyDbRows'],
    ['mappedUniqueCodes', 'mappedUniqueCodes'],
    ['bridgeExactUnique', 'bridgeExactUnique'],
    ['bridgeExactMultiple', 'bridgeExactMultiple'],
    ['bridgeOwnerReview', 'bridgeOwnerReview'],
    ['bridgeNoMatch', 'bridgeNoMatch'],
    ['failClosedAmbiguousMappedCodes', 'failClosedAmbiguousMappedCodes'],
    ['dbOnlyRows', 'dbOnlyRows'],
    ['dbCodesWithoutMappedParent', 'dbCodesWithoutMappedParent'],
  ];
  for (const [key, label] of checks) {
    if (r[label] !== expected[key]) {
      throw new DiseaseIdentityError(
        MALFORMED_INPUT,
        `Manifest reconciliation mismatch for ${label}`,
      );
    }
  }
  if (r.bridgeExactMultiple + r.bridgeOwnerReview !== r.failClosedAmbiguousMappedCodes) {
    throw new DiseaseIdentityError(
      MALFORMED_INPUT,
      'failClosedAmbiguousMappedCodes must equal bridgeExactMultiple + bridgeOwnerReview',
    );
  }
}

export function sortRecordsById<T extends Record<string, unknown>>(
  records: readonly T[],
  idField: keyof T,
): T[] {
  return [...records].sort((a, b) => String(a[idField]).localeCompare(String(b[idField])));
}

export function serializeJsonl(records: readonly Record<string, unknown>[]): string {
  const lines = records.map((record) => canonicalJsonString(record));
  return `${lines.join('\n')}\n`;
}
