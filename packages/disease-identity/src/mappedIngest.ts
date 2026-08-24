import { DiseaseIdentityError } from './errors.js';
import {
  EXPECTED_MAPPED_JSON_ROW_COUNT,
  EXPECTED_MAPPED_UNIQUE_CODE_COUNT,
} from './fullCorpusConstants.js';
import { mappedRawKey } from './namespaceResolution.js';
import type { ProvenanceVariant } from './types.js';

export type MappedJsonRow = {
  readonly source: string;
  readonly code: string;
};

export type MappedDedupeEntry = {
  readonly mappedSourceLabel: string;
  readonly mappedCodeRaw: string;
  readonly provenanceVariants: readonly ProvenanceVariant[];
  readonly dedupeKey: string;
};

export function parseMappedJsonRow(
  raw: Record<string, unknown>,
  lineNumber: number,
): MappedJsonRow {
  // Input may contain non-identity fields; only source/code are retained.
  const source = String(raw.source ?? '').trim();
  const code = String(raw.code ?? '').trim();
  if (source.length === 0 || code.length === 0) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', `Invalid mapped.json row ${lineNumber}`);
  }
  if (source.length > 512 || code.length > 512) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', `Mapped field too long at row ${lineNumber}`);
  }
  return { source, code };
}

export function dedupeMappedRows(
  rows: readonly MappedJsonRow[],
  options?: { expectedRawRows?: number; expectedUniqueKeys?: number },
): MappedDedupeEntry[] {
  const expectedRawRows = options?.expectedRawRows ?? EXPECTED_MAPPED_JSON_ROW_COUNT;
  const expectedUniqueKeys = options?.expectedUniqueKeys ?? EXPECTED_MAPPED_UNIQUE_CODE_COUNT;
  if (rows.length !== expectedRawRows) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Expected ${expectedRawRows} mapped.json rows, observed ${rows.length}`,
    );
  }

  const buckets = new Map<string, { label: string; variants: Map<string, ProvenanceVariant> }>();

  for (const row of rows) {
    const key = mappedRawKey(row.source, row.code);
    const bucket = buckets.get(key) ?? { label: row.source, variants: new Map() };
    bucket.variants.set(`${row.source}\u0000${row.code}`, {
      mappedSourceLabel: row.source,
      mappedCodeRaw: row.code,
    });
    buckets.set(key, bucket);
  }

  if (buckets.size !== expectedUniqueKeys) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Expected ${expectedUniqueKeys} unique mapped keys, observed ${buckets.size}`,
    );
  }

  const entries: MappedDedupeEntry[] = [];
  for (const [dedupeKey, bucket] of buckets) {
    const variants = [...bucket.variants.values()].sort((a, b) => {
      const labelCmp = a.mappedSourceLabel.localeCompare(b.mappedSourceLabel);
      return labelCmp !== 0 ? labelCmp : a.mappedCodeRaw.localeCompare(b.mappedCodeRaw);
    });
    const canonical = variants[0]!;
    entries.push({
      mappedSourceLabel: canonical.mappedSourceLabel,
      mappedCodeRaw: canonical.mappedCodeRaw,
      provenanceVariants: variants,
      dedupeKey,
    });
  }

  entries.sort((a, b) => a.dedupeKey.localeCompare(b.dedupeKey));
  return entries;
}
