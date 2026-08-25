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
import type { ProductionBuildIndex } from './productionBuildIndex.js';

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

/** Fixed production disposition counts — not overridable. */
export const PRODUCTION_BRIDGE_DISPOSITION_COUNTS = {
  EXACT_UNIQUE_MATCH: 33_070,
  EXACT_MULTIPLE_MATCH: 17_181,
  OWNER_REVIEW_REQUIRED: 257,
  NO_MATCH: 36,
} as const;

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

export type ValidateBridgeBatchSyntheticOptions = {
  readonly expectedRowCount: number;
  readonly dbIdSet: ReadonlySet<number>;
  readonly expectedReferencedDbIds: number;
  readonly expectedDbOnlyIds: number;
  readonly expectedDispositionCounts: {
    readonly EXACT_UNIQUE_MATCH: number;
    readonly EXACT_MULTIPLE_MATCH: number;
    readonly OWNER_REVIEW_REQUIRED: number;
    readonly NO_MATCH: number;
  };
};

function tallyBridgeBatch(rows: readonly ParsedBridgeRow[]): {
  dispositionCounts: {
    EXACT_UNIQUE_MATCH: number;
    EXACT_MULTIPLE_MATCH: number;
    OWNER_REVIEW_REQUIRED: number;
    NO_MATCH: number;
  };
  referencedDbIds: Set<number>;
} {
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

  return { dispositionCounts, referencedDbIds };
}

/** Exported for fail-closed production invariant unit tests (not a bypass API). */
export function assertDispositionCounts(
  observed: {
    EXACT_UNIQUE_MATCH: number;
    EXACT_MULTIPLE_MATCH: number;
    OWNER_REVIEW_REQUIRED: number;
    NO_MATCH: number;
  },
  expected: {
    readonly EXACT_UNIQUE_MATCH: number;
    readonly EXACT_MULTIPLE_MATCH: number;
    readonly OWNER_REVIEW_REQUIRED: number;
    readonly NO_MATCH: number;
  },
): void {
  if (observed.EXACT_UNIQUE_MATCH !== expected.EXACT_UNIQUE_MATCH) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Bridge EXACT_UNIQUE count mismatch');
  }
  if (observed.EXACT_MULTIPLE_MATCH !== expected.EXACT_MULTIPLE_MATCH) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Bridge EXACT_MULTIPLE count mismatch');
  }
  if (observed.OWNER_REVIEW_REQUIRED !== expected.OWNER_REVIEW_REQUIRED) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Bridge OWNER_REVIEW count mismatch');
  }
  if (observed.NO_MATCH !== expected.NO_MATCH) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Bridge NO_MATCH count mismatch');
  }
}

/** Production disposition invariant — no caller overrides. */
export function assertProductionDispositionCounts(observed: {
  EXACT_UNIQUE_MATCH: number;
  EXACT_MULTIPLE_MATCH: number;
  OWNER_REVIEW_REQUIRED: number;
  NO_MATCH: number;
}): void {
  assertDispositionCounts(observed, PRODUCTION_BRIDGE_DISPOSITION_COUNTS);
}

/** Exported for fail-closed production invariant unit tests (not a bypass API). */
export function assertDbIdSetCoverage(
  referencedDbIds: ReadonlySet<number>,
  dbIdSet: ReadonlySet<number>,
  expectedReferenced: number,
  expectedDbOnly: number,
): void {
  for (const id of referencedDbIds) {
    if (!dbIdSet.has(id)) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `Bridge candidate id ${id} is not present in the disease DB id set`,
      );
    }
  }

  if (referencedDbIds.size !== expectedReferenced) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Expected ${expectedReferenced} unique referenced DB ids, observed ${referencedDbIds.size}`,
    );
  }

  let dbOnly = 0;
  for (const id of dbIdSet) {
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

/** Production referenced/db-only/total invariants — no caller overrides. */
export function assertProductionDbCoverage(
  referencedDbIds: ReadonlySet<number>,
  dbIdSet: ReadonlySet<number>,
): void {
  assertDbIdSetCoverage(
    referencedDbIds,
    dbIdSet,
    EXPECTED_REFERENCED_UNIQUE_DB_IDS,
    APPROVED_AGGREGATE_COUNTS.dbOnlyRows,
  );
  if (dbIdSet.size !== APPROVED_AGGREGATE_COUNTS.legacyDbRows) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Expected ${APPROVED_AGGREGATE_COUNTS.legacyDbRows} total DB disease rows, observed ${dbIdSet.size}`,
    );
  }
}

/**
 * Production bridge validation — mandatory dbIdSet; fixed full-corpus counts; no overrides.
 */
export function validateBridgeBatchProduction(
  rows: readonly ParsedBridgeRow[],
  dbIdSet: ReadonlySet<number>,
): void {
  if (rows.length !== EXPECTED_BRIDGE_ROW_COUNT) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Expected ${EXPECTED_BRIDGE_ROW_COUNT} bridge rows, observed ${rows.length}`,
    );
  }

  const { dispositionCounts, referencedDbIds } = tallyBridgeBatch(rows);
  assertProductionDispositionCounts(dispositionCounts);

  const unresolved =
    dispositionCounts.EXACT_MULTIPLE_MATCH +
    dispositionCounts.OWNER_REVIEW_REQUIRED +
    dispositionCounts.NO_MATCH;
  if (unresolved !== EXPECTED_UNRESOLVED_QUEUE_COUNT) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Bridge unresolved queue count mismatch');
  }

  assertProductionDbCoverage(referencedDbIds, dbIdSet);
}

/**
 * Production bridge validation using scalar SQL and anti-joins only. No corpus-sized
 * bridge, mapped-key, referenced-ID, or DB-ID JavaScript collection is created.
 */
export function validateBridgeBatchProductionFromIndex(index: ProductionBuildIndex): void {
  const counts = index.counts();
  if (counts.bridgeRows !== EXPECTED_BRIDGE_ROW_COUNT) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Expected ${EXPECTED_BRIDGE_ROW_COUNT} bridge rows, observed ${counts.bridgeRows}`,
    );
  }

  const dispositionCounts = {
    EXACT_UNIQUE_MATCH: index.scalarNumber(
      "SELECT COUNT(*) FROM bridge_entry WHERE disposition='EXACT_UNIQUE_MATCH'",
    ),
    EXACT_MULTIPLE_MATCH: index.scalarNumber(
      "SELECT COUNT(*) FROM bridge_entry WHERE disposition='EXACT_MULTIPLE_MATCH'",
    ),
    OWNER_REVIEW_REQUIRED: index.scalarNumber(
      "SELECT COUNT(*) FROM bridge_entry WHERE disposition='OWNER_REVIEW_REQUIRED'",
    ),
    NO_MATCH: index.scalarNumber("SELECT COUNT(*) FROM bridge_entry WHERE disposition='NO_MATCH'"),
  };
  assertProductionDispositionCounts(dispositionCounts);

  if (
    index.scalarNumber(
      `SELECT COUNT(*) FROM bridge_candidate c
       LEFT JOIN db_disease d ON d.id=c.db_id WHERE d.id IS NULL`,
    ) !== 0
  ) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Bridge candidate id is not present in the disease DB id set',
    );
  }
  const referenced = index.scalarNumber('SELECT COUNT(DISTINCT db_id) FROM bridge_candidate');
  if (referenced !== EXPECTED_REFERENCED_UNIQUE_DB_IDS) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Expected ${EXPECTED_REFERENCED_UNIQUE_DB_IDS} unique referenced DB ids, observed ${referenced}`,
    );
  }
  const dbOnly = index.scalarNumber(
    `SELECT COUNT(*) FROM db_disease d
     WHERE NOT EXISTS (SELECT 1 FROM bridge_candidate c WHERE c.db_id=d.id)`,
  );
  if (dbOnly !== APPROVED_AGGREGATE_COUNTS.dbOnlyRows) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Expected ${APPROVED_AGGREGATE_COUNTS.dbOnlyRows} DB-only ids, observed ${dbOnly}`,
    );
  }
  const missingMapped = index.scalarNumber(
    `SELECT COUNT(*) FROM bridge_entry b
     LEFT JOIN mapped_entry m ON m.dedupe_key=b.dedupe_key WHERE m.dedupe_key IS NULL`,
  );
  const missingBridge = index.scalarNumber(
    `SELECT COUNT(*) FROM mapped_entry m
     LEFT JOIN bridge_entry b ON b.dedupe_key=m.dedupe_key WHERE b.dedupe_key IS NULL`,
  );
  if (missingMapped !== 0 || missingBridge !== 0) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Bridge/mapped key set mismatch');
  }
  const normalizedCollisions = index.scalarNumber(
    `SELECT COUNT(*) FROM (
       SELECT normalized_identity_key FROM bridge_entry
       WHERE normalized_identity_key IS NOT NULL
       GROUP BY normalized_identity_key HAVING COUNT(*) > 1
     )`,
  );
  if (normalizedCollisions !== 0) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Normalized mapped identity key collision across distinct raw keys',
    );
  }
}

/**
 * Synthetic / test-only bridge validation with injectable expected counts.
 * Production CLI must never call this.
 */
export function validateBridgeBatchSynthetic(
  rows: readonly ParsedBridgeRow[],
  options: ValidateBridgeBatchSyntheticOptions,
): void {
  if (rows.length !== options.expectedRowCount) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Expected ${options.expectedRowCount} bridge rows, observed ${rows.length}`,
    );
  }

  const { dispositionCounts, referencedDbIds } = tallyBridgeBatch(rows);
  assertDispositionCounts(dispositionCounts, options.expectedDispositionCounts);
  assertDbIdSetCoverage(
    referencedDbIds,
    options.dbIdSet,
    options.expectedReferencedDbIds,
    options.expectedDbOnlyIds,
  );
}

/**
 * @deprecated Use validateBridgeBatchSynthetic (tests) or validateBridgeBatchProduction (CLI).
 * Delegates to synthetic when options include injectable counts; otherwise production when
 * dbIdSet is provided with full-corpus defaults. Prefer the explicit APIs.
 */
export function validateBridgeBatch(
  rows: readonly ParsedBridgeRow[],
  options?: {
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
  },
): void {
  // If any injectable override is present, require full synthetic options (tests).
  const hasSyntheticOverrides =
    options?.expectedRowCount !== undefined ||
    options?.expectedReferencedDbIds !== undefined ||
    options?.expectedDbOnlyIds !== undefined ||
    options?.expectedDispositionCounts !== undefined;

  if (hasSyntheticOverrides) {
    if (!options?.dbIdSet) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        'validateBridgeBatchSynthetic requires dbIdSet',
      );
    }
    if (
      options.expectedRowCount === undefined ||
      options.expectedReferencedDbIds === undefined ||
      options.expectedDbOnlyIds === undefined ||
      options.expectedDispositionCounts === undefined
    ) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        'Synthetic bridge validation requires all injectable expected counts',
      );
    }
    validateBridgeBatchSynthetic(rows, {
      expectedRowCount: options.expectedRowCount,
      dbIdSet: options.dbIdSet,
      expectedReferencedDbIds: options.expectedReferencedDbIds,
      expectedDbOnlyIds: options.expectedDbOnlyIds,
      expectedDispositionCounts: options.expectedDispositionCounts,
    });
    return;
  }

  if (!options?.dbIdSet) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Production bridge validation requires dbIdSet (mandatory)',
    );
  }
  validateBridgeBatchProduction(rows, options.dbIdSet);
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
