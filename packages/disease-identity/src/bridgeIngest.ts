import { BRIDGE_DISPOSITIONS, MAX_CANDIDATE_IDS } from './constants.js';
import { DiseaseIdentityError } from './errors.js';
import { normalizeMappedIdentity } from './normalize.js';
import {
  EXPECTED_BRIDGE_ROW_COUNT,
  EXPECTED_REFERENCED_UNIQUE_DB_IDS,
  EXPECTED_UNRESOLVED_QUEUE_COUNT,
} from './fullCorpusConstants.js';
import { mappedRawKey } from './namespaceResolution.js';
import { APPROVED_AGGREGATE_COUNTS } from './constants.js';
import { assertCandidateLegacyDbIds } from './validationPrimitives.js';

export const BRIDGE_ROW_ALLOWED_KEYS = [
  'mapped_source_label',
  'mappedSourceLabel',
  'mapped_code',
  'mappedCodeRaw',
  'recommended_disposition',
  'technical_disposition',
  'bridge_disposition',
  'candidate_eh_disease_id',
  'candidateLegacyDbIds',
] as const;

export type BridgeDisposition = (typeof BRIDGE_DISPOSITIONS)[number];

export type ParsedBridgeRow = {
  readonly mappedSourceLabel: string;
  readonly mappedCodeRaw: string;
  readonly disposition: BridgeDisposition;
  readonly candidateLegacyDbIds: readonly number[];
  readonly dedupeKey: string;
  readonly normalizedIdentityKey: string | null;
};

function parseCandidateIds(raw: unknown): number[] {
  let ids: number[];
  if (Array.isArray(raw)) {
    ids = raw.map((v, index) => {
      if (typeof v !== 'number' || !Number.isSafeInteger(v) || v <= 0) {
        throw new DiseaseIdentityError(
          'MALFORMED_INPUT',
          `Invalid bridge candidate id at index ${index}`,
        );
      }
      return v;
    });
  } else if (typeof raw === 'string') {
    ids = raw
      .split(';')
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map((part) => {
        const n = Number(part);
        if (!Number.isSafeInteger(n) || n <= 0) {
          throw new DiseaseIdentityError('MALFORMED_INPUT', 'Invalid bridge candidate id');
        }
        return n;
      });
  } else if (raw === null || raw === undefined) {
    return [];
  } else {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Bridge candidate ids must be array or string',
    );
  }

  if (ids.length > MAX_CANDIDATE_IDS) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Bridge candidate array exceeds ${MAX_CANDIDATE_IDS}`,
    );
  }

  ids.sort((a, b) => a - b);
  // Reject duplicates and enforce strictly ascending after sort.
  return assertCandidateLegacyDbIds(ids, 'candidateLegacyDbIds');
}

export function parseBridgeJsonlRow(
  raw: Record<string, unknown>,
  lineNumber: number,
): ParsedBridgeRow {
  for (const key of Object.keys(raw)) {
    if (!(BRIDGE_ROW_ALLOWED_KEYS as readonly string[]).includes(key)) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `Unknown bridge field ${key} at line ${lineNumber}`,
      );
    }
  }

  const mappedSourceLabel = String(raw.mapped_source_label ?? raw.mappedSourceLabel ?? '').trim();
  const mappedCodeRaw = String(raw.mapped_code ?? raw.mappedCodeRaw ?? '').trim();
  const dispositionRaw = String(
    raw.recommended_disposition ?? raw.technical_disposition ?? raw.bridge_disposition ?? '',
  ).trim();

  if (!(BRIDGE_DISPOSITIONS as readonly string[]).includes(dispositionRaw)) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Invalid bridge disposition at line ${lineNumber}`,
    );
  }

  const candidateLegacyDbIds = parseCandidateIds(
    raw.candidate_eh_disease_id ?? raw.candidateLegacyDbIds,
  );

  if (dispositionRaw === 'EXACT_UNIQUE_MATCH' && candidateLegacyDbIds.length !== 1) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'EXACT_UNIQUE bridge row must have exactly one candidate id',
    );
  }

  if (
    (dispositionRaw === 'EXACT_MULTIPLE_MATCH' || dispositionRaw === 'OWNER_REVIEW_REQUIRED') &&
    candidateLegacyDbIds.length < 2
  ) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Ambiguous bridge row must have multiple candidate ids',
    );
  }

  if (dispositionRaw === 'NO_MATCH' && candidateLegacyDbIds.length > 0) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'NO_MATCH bridge row must have zero candidates',
    );
  }

  const normalized = normalizeMappedIdentity(mappedSourceLabel, mappedCodeRaw);
  const dedupeKey = mappedRawKey(mappedSourceLabel, mappedCodeRaw);

  return {
    mappedSourceLabel,
    mappedCodeRaw,
    disposition: dispositionRaw as BridgeDisposition,
    candidateLegacyDbIds,
    dedupeKey,
    normalizedIdentityKey: normalized.ok ? normalized.normalizedIdentityKey : null,
  };
}

export type ValidateBridgeBatchOptions = {
  readonly expectedRowCount?: number;
  readonly dbIdSet?: ReadonlySet<number>;
  readonly expectedReferencedDbIds?: number;
  readonly expectedDbOnlyIds?: number;
  readonly expectedDispositionCounts?: {
    readonly EXACT_UNIQUE_MATCH: number;
    readonly EXACT_MULTIPLE_MATCH: number;
    readonly OWNER_REVIEW_REQUIRED: number;
    readonly NO_MATCH: number;
  };
};

export function validateBridgeBatch(
  rows: readonly ParsedBridgeRow[],
  options?: ValidateBridgeBatchOptions,
): void {
  const expectedRows = options?.expectedRowCount ?? EXPECTED_BRIDGE_ROW_COUNT;
  if (rows.length !== expectedRows) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Expected ${expectedRows} bridge rows, observed ${rows.length}`,
    );
  }

  const dispositionCounts = {
    EXACT_UNIQUE_MATCH: 0,
    EXACT_MULTIPLE_MATCH: 0,
    OWNER_REVIEW_REQUIRED: 0,
    NO_MATCH: 0,
  };

  const seenKeys = new Set<string>();
  const referencedDbIds = new Set<number>();

  for (const row of rows) {
    if (seenKeys.has(row.dedupeKey)) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Duplicate bridge mapped key');
    }
    seenKeys.add(row.dedupeKey);
    dispositionCounts[row.disposition] += 1;
    for (const id of row.candidateLegacyDbIds) {
      referencedDbIds.add(id);
    }
  }

  const expectedDispositions =
    options?.expectedDispositionCounts ??
    (expectedRows === EXPECTED_BRIDGE_ROW_COUNT
      ? {
          EXACT_UNIQUE_MATCH: 33_070,
          EXACT_MULTIPLE_MATCH: 17_181,
          OWNER_REVIEW_REQUIRED: 257,
          NO_MATCH: 36,
        }
      : null);

  if (expectedDispositions) {
    if (dispositionCounts.EXACT_UNIQUE_MATCH !== expectedDispositions.EXACT_UNIQUE_MATCH) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Bridge EXACT_UNIQUE count mismatch');
    }
    if (dispositionCounts.EXACT_MULTIPLE_MATCH !== expectedDispositions.EXACT_MULTIPLE_MATCH) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Bridge EXACT_MULTIPLE count mismatch');
    }
    if (dispositionCounts.OWNER_REVIEW_REQUIRED !== expectedDispositions.OWNER_REVIEW_REQUIRED) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Bridge OWNER_REVIEW count mismatch');
    }
    if (dispositionCounts.NO_MATCH !== expectedDispositions.NO_MATCH) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Bridge NO_MATCH count mismatch');
    }

    const unresolved =
      dispositionCounts.EXACT_MULTIPLE_MATCH +
      dispositionCounts.OWNER_REVIEW_REQUIRED +
      dispositionCounts.NO_MATCH;
    if (
      expectedRows === EXPECTED_BRIDGE_ROW_COUNT &&
      unresolved !== EXPECTED_UNRESOLVED_QUEUE_COUNT
    ) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Bridge unresolved queue count mismatch');
    }
  }

  if (options?.dbIdSet) {
    for (const id of referencedDbIds) {
      if (!options.dbIdSet.has(id)) {
        throw new DiseaseIdentityError(
          'MALFORMED_INPUT',
          `Bridge candidate id ${id} is not present in the disease DB id set`,
        );
      }
    }

    const expectedReferenced =
      options.expectedReferencedDbIds ??
      (expectedRows === EXPECTED_BRIDGE_ROW_COUNT ? EXPECTED_REFERENCED_UNIQUE_DB_IDS : undefined);
    if (expectedReferenced !== undefined && referencedDbIds.size !== expectedReferenced) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `Expected ${expectedReferenced} unique referenced DB ids, observed ${referencedDbIds.size}`,
      );
    }

    const expectedDbOnly =
      options.expectedDbOnlyIds ??
      (expectedRows === EXPECTED_BRIDGE_ROW_COUNT
        ? APPROVED_AGGREGATE_COUNTS.dbOnlyRows
        : undefined);
    if (expectedDbOnly !== undefined) {
      let dbOnly = 0;
      for (const id of options.dbIdSet) {
        if (!referencedDbIds.has(id)) {
          dbOnly += 1;
        }
      }
      if (dbOnly !== expectedDbOnly) {
        throw new DiseaseIdentityError(
          'MALFORMED_INPUT',
          `Expected ${expectedDbOnly} DB-only ids, observed ${dbOnly}`,
        );
      }
    }
  }
}

export function indexBridgeRows(rows: readonly ParsedBridgeRow[]): Map<string, ParsedBridgeRow> {
  const map = new Map<string, ParsedBridgeRow>();
  for (const row of rows) {
    map.set(row.dedupeKey, row);
  }
  return map;
}

/** Bridge key set must exactly equal mapped unique-key set (raw source\\0code policy). */
export function reconcileBridgeMappedKeys(input: {
  readonly bridgeRows: readonly ParsedBridgeRow[];
  readonly mappedDedupeKeys: readonly string[];
}): void {
  const bridgeKeys = new Set(input.bridgeRows.map((row) => row.dedupeKey));
  const mappedKeys = new Set(input.mappedDedupeKeys);

  if (bridgeKeys.size !== mappedKeys.size) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Bridge/mapped key set size mismatch: bridge=${bridgeKeys.size} mapped=${mappedKeys.size}`,
    );
  }

  for (const key of bridgeKeys) {
    if (!mappedKeys.has(key)) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        'Bridge-only key with no mapped counterpart',
      );
    }
  }
  for (const key of mappedKeys) {
    if (!bridgeKeys.has(key)) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        'Mapped-only key with no bridge counterpart',
      );
    }
  }

  // Normalized-key collision hard-fail: distinct raw keys must not collapse to one normalized key
  // when both normalize successfully to the same identity with different raw keys already checked
  // via unique dedupeKey. Additional collision: same normalizedIdentityKey from different raw keys.
  const normalizedToRaw = new Map<string, string>();
  for (const row of input.bridgeRows) {
    if (!row.normalizedIdentityKey) {
      continue;
    }
    const prior = normalizedToRaw.get(row.normalizedIdentityKey);
    if (prior && prior !== row.dedupeKey) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        'Normalized mapped identity key collision across distinct raw keys',
      );
    }
    normalizedToRaw.set(row.normalizedIdentityKey, row.dedupeKey);
  }
}
