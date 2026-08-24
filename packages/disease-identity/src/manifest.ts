import { canonicalJsonString } from './canonicalJson.js';
import { APPROVED_AGGREGATE_COUNTS } from './constants.js';
import { DiseaseIdentityError, MALFORMED_INPUT } from './errors.js';
import { MANIFEST_ALLOWED_KEYS, MANIFEST_ARTIFACT_ALLOWED_KEYS } from './schemaAllowlists.js';
import {
  assertExactAllowlistedKeys,
  assertNoProhibitedFields,
  assertPlainObject,
  assertPositiveSafeInteger,
} from './validationPrimitives.js';
import type { BundleManifestTemplate } from './types.js';

export function validateBundleManifest(manifest: Record<string, unknown>): void {
  assertPlainObject(manifest, 'manifest');
  assertNoProhibitedFields(manifest);
  assertExactAllowlistedKeys(manifest, MANIFEST_ALLOWED_KEYS, 'manifest');

  if (!Array.isArray(manifest.canonicalIdAlgorithms)) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'canonicalIdAlgorithms must be an array');
  }
  if (!Array.isArray(manifest.artifacts)) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'artifacts must be an array');
  }
  assertPlainObject(manifest.reconciliation, 'reconciliation');
  assertPlainObject(manifest.inputEvidenceHashes, 'inputEvidenceHashes');
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

  for (let i = 0; i < manifest.artifacts.length; i += 1) {
    const artifact = manifest.artifacts[i];
    assertPlainObject(artifact, `artifacts[${i}]`);
    assertExactAllowlistedKeys(artifact, MANIFEST_ARTIFACT_ALLOWED_KEYS, `artifacts[${i}]`);
    assertPositiveSafeInteger(artifact.rowCount, `artifacts[${i}].rowCount`);
    assertPositiveSafeInteger(artifact.bytes, `artifacts[${i}].bytes`);
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
