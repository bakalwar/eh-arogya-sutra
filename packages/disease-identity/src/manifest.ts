import { APPROVED_AGGREGATE_COUNTS } from './constants.js';
import { DiseaseIdentityError, MALFORMED_INPUT } from './errors.js';
import type { BundleManifestTemplate } from './types.js';

export function reconcileManifestCounts(manifest: BundleManifestTemplate): void {
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
  const lines = records.map((record) => JSON.stringify(record));
  return `${lines.join('\n')}\n`;
}
