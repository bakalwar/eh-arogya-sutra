import {
  APPROVED_AGGREGATE_COUNTS,
  BRIDGE_DISPOSITIONS,
  MAX_CANDIDATE_IDS,
  MAX_FIELD_LENGTH,
  SOURCE_LABEL_TO_NAMESPACE,
} from './constants.js';
import { nfcNormalize } from './canonicalJson.js';
import { DiseaseIdentityError } from './errors.js';
import { normalizeMappedIdentity } from './normalize.js';
import {
  EXPECTED_BRIDGE_ROW_COUNT,
  EXPECTED_REFERENCED_UNIQUE_DB_IDS,
  EXPECTED_UNRESOLVED_QUEUE_COUNT,
} from './fullCorpusConstants.js';
import { mappedRawKey } from './namespaceResolution.js';
import { assertCandidateLegacyDbIds } from './validationPrimitives.js';
import type { ProductionBuildIndex } from './productionBuildIndex.js';
export {
  parseJsonObjectRejectDuplicateKeys,
  parseJsonObjectRejectDuplicateRootKeys,
} from './bridgeJsonDuplicateKeyParse.js';

/**
 * Synthetic / test-only projected mini-schema keys.
 * Must never be used as a permissive production allowlist.
 */
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

/** Production pinned Bridge V3 actual-schema keys (exact set, all required). */
export const PINNED_BRIDGE_V3_REQUIRED_KEYS = [
  'ambiguity',
  'bridge_id',
  'candidate_eh_disease_id',
  'majority_polarity',
  'mapped_code',
  'mapped_name',
  'match_confidence',
  'match_method',
  'polarity_conflict',
  'polarity_counts',
  'recommended_disposition',
  'source_system',
  'technical_disposition',
] as const;

export const BRIDGE_INGEST_SCHEMA_PINNED_V3 = 'pinned-bridge-v3-actual' as const;
export const BRIDGE_INGEST_SCHEMA_SYNTHETIC = 'synthetic-projected-mini' as const;

export type BridgeIngestSchemaMode =
  typeof BRIDGE_INGEST_SCHEMA_PINNED_V3 | typeof BRIDGE_INGEST_SCHEMA_SYNTHETIC;

const PINNED_BRIDGE_V3_KEY_SET: ReadonlySet<string> = new Set(PINNED_BRIDGE_V3_REQUIRED_KEYS);

/** Locked recommended×technical pairs from pinned V3 aggregate audit. */
export const PINNED_BRIDGE_V3_PERMITTED_DISPOSITION_PAIRS = [
  ['EXACT_UNIQUE_MATCH', 'EXACT_UNIQUE_MATCH'],
  ['EXACT_MULTIPLE_MATCH', 'EXACT_MULTIPLE_MATCH'],
  ['OWNER_REVIEW_REQUIRED', 'EXACT_MULTIPLE_MATCH'],
  ['NO_MATCH', 'NO_MATCH'],
] as const;

const PINNED_V3_PAIR_SET: ReadonlySet<string> = new Set(
  PINNED_BRIDGE_V3_PERMITTED_DISPOSITION_PAIRS.map(([r, t]) => `${r}|${t}`),
);

const PINNED_V3_MATCH_METHODS = new Set([
  'exact_code_multinamespace_icd10_code_col',
  'exact_code_failed',
]);

const PINNED_V3_MATCH_CONFIDENCES = new Set(['HIGH', 'MEDIUM', 'N/A']);
const PINNED_V3_MAJORITY_POLARITIES = new Set(['MIXED', 'POSITIVE', 'NEGATIVE']);
const PINNED_V3_POLARITY_COUNT_KEYS = new Set(['MIXED', 'POSITIVE', 'NEGATIVE']);
const PINNED_V3_BRIDGE_ID_PATTERN = /^[A-Za-z0-9._:-]+$/;

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

export type ParsePinnedBridgeV3Options = {
  /** When provided, enforces corpus-wide bridge_id uniqueness (production ingest). */
  readonly seenBridgeIds?: Set<string>;
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
  return assertCandidateLegacyDbIds(ids, 'candidateLegacyDbIds');
}

function assertBoundedNfcString(
  value: unknown,
  label: string,
  lineNumber: number,
  options: { readonly allowEmpty: boolean },
): string {
  if (typeof value !== 'string') {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Bridge ${label} must be a string at line ${lineNumber}`,
    );
  }
  const normalized = nfcNormalize(value);
  if (!options.allowEmpty && normalized.trim().length === 0) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Bridge ${label} must be non-empty at line ${lineNumber}`,
    );
  }
  if (normalized.length > MAX_FIELD_LENGTH) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Bridge ${label} exceeds ${MAX_FIELD_LENGTH} at line ${lineNumber}`,
    );
  }
  return normalized;
}

/** Re-exported from bridgeJsonDuplicateKeyParse (all-depth duplicate-key firewall). */

function assertPinnedV3ExactKeySet(raw: Record<string, unknown>, lineNumber: number): void {
  const keys = Object.keys(raw);
  if (keys.length !== PINNED_BRIDGE_V3_REQUIRED_KEYS.length) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Pinned Bridge V3 row must have exactly ${PINNED_BRIDGE_V3_REQUIRED_KEYS.length} keys at line ${lineNumber}`,
    );
  }
  for (const key of keys) {
    if (!PINNED_BRIDGE_V3_KEY_SET.has(key)) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `Unknown bridge field ${key} at line ${lineNumber}`,
      );
    }
  }
  for (const required of PINNED_BRIDGE_V3_REQUIRED_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(raw, required)) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `Missing bridge field ${required} at line ${lineNumber}`,
      );
    }
  }
}

function validatePinnedV3PolarityFirewall(raw: Record<string, unknown>, lineNumber: number): void {
  const majority = raw.majority_polarity;
  if (typeof majority !== 'string' || !PINNED_V3_MAJORITY_POLARITIES.has(majority)) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Invalid majority_polarity at line ${lineNumber}`,
    );
  }
  if (typeof raw.polarity_conflict !== 'boolean') {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `polarity_conflict must be boolean at line ${lineNumber}`,
    );
  }
  const counts = raw.polarity_counts;
  if (counts === null || typeof counts !== 'object' || Array.isArray(counts)) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `polarity_counts must be object at line ${lineNumber}`,
    );
  }
  const countKeys = Object.keys(counts as Record<string, unknown>);
  if (countKeys.length === 0) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `polarity_counts must be non-empty at line ${lineNumber}`,
    );
  }
  for (const key of countKeys) {
    if (!PINNED_V3_POLARITY_COUNT_KEYS.has(key)) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `Unknown polarity_counts key at line ${lineNumber}`,
      );
    }
    const value = (counts as Record<string, unknown>)[key];
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `Invalid polarity_counts value at line ${lineNumber}`,
      );
    }
  }
}

function parsePinnedV3Candidates(
  disposition: BridgeDisposition,
  raw: unknown,
  lineNumber: number,
): number[] {
  if (disposition === 'EXACT_UNIQUE_MATCH') {
    if (typeof raw !== 'number' || !Number.isSafeInteger(raw) || raw <= 0) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `EXACT_UNIQUE candidate must be one positive safe integer at line ${lineNumber}`,
      );
    }
    return assertCandidateLegacyDbIds([raw], 'candidateLegacyDbIds');
  }

  if (disposition === 'NO_MATCH') {
    if (raw !== null) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `NO_MATCH candidate must be null at line ${lineNumber}`,
      );
    }
    return [];
  }

  // EXACT_MULTIPLE_MATCH and OWNER_REVIEW_REQUIRED: semicolon-delimited string only.
  if (typeof raw !== 'string') {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Ambiguous bridge candidate must be semicolon string at line ${lineNumber}`,
    );
  }
  if (!raw.includes(';')) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Ambiguous bridge candidate must include ';' at line ${lineNumber}`,
    );
  }
  const parts = raw.split(';');
  const ids: number[] = [];
  for (const part of parts) {
    if (part.trim().length !== part.length || part.length === 0) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `Malformed bridge candidate token at line ${lineNumber}`,
      );
    }
    if (!/^[0-9]+$/.test(part)) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `Invalid bridge candidate token at line ${lineNumber}`,
      );
    }
    const n = Number(part);
    if (!Number.isSafeInteger(n) || n <= 0) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `Unsafe bridge candidate id at line ${lineNumber}`,
      );
    }
    ids.push(n);
  }
  if (ids.length < 2) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Ambiguous bridge row must have multiple candidate ids at line ${lineNumber}`,
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

function assertPinnedV3DispositionInvariants(
  recommended: BridgeDisposition,
  technical: string,
  ambiguity: unknown,
  polarityConflict: unknown,
  matchMethod: unknown,
  matchConfidence: unknown,
  lineNumber: number,
): void {
  if (!PINNED_V3_PAIR_SET.has(`${recommended}|${technical}`)) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Unexpected recommended/technical disposition pair at line ${lineNumber}`,
    );
  }
  if (typeof ambiguity !== 'boolean') {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `ambiguity must be boolean at line ${lineNumber}`,
    );
  }
  if (typeof polarityConflict !== 'boolean') {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `polarity_conflict must be boolean at line ${lineNumber}`,
    );
  }
  if (typeof matchMethod !== 'string' || !PINNED_V3_MATCH_METHODS.has(matchMethod)) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', `Invalid match_method at line ${lineNumber}`);
  }
  if (typeof matchConfidence !== 'string' || !PINNED_V3_MATCH_CONFIDENCES.has(matchConfidence)) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Invalid match_confidence at line ${lineNumber}`,
    );
  }

  const expectAmbiguous =
    recommended === 'EXACT_MULTIPLE_MATCH' || recommended === 'OWNER_REVIEW_REQUIRED';
  if (ambiguity !== expectAmbiguous) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `ambiguity contradicts disposition at line ${lineNumber}`,
    );
  }
  const expectPolarityConflict = recommended === 'OWNER_REVIEW_REQUIRED';
  if (polarityConflict !== expectPolarityConflict) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `polarity_conflict contradicts disposition at line ${lineNumber}`,
    );
  }

  if (recommended === 'NO_MATCH') {
    if (matchMethod !== 'exact_code_failed' || matchConfidence !== 'N/A') {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `NO_MATCH match provenance mismatch at line ${lineNumber}`,
      );
    }
  } else if (matchMethod !== 'exact_code_multinamespace_icd10_code_col') {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `match_method mismatch at line ${lineNumber}`,
    );
  } else if (recommended === 'EXACT_UNIQUE_MATCH' && matchConfidence !== 'HIGH') {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `match_confidence mismatch at line ${lineNumber}`,
    );
  } else if (
    (recommended === 'EXACT_MULTIPLE_MATCH' || recommended === 'OWNER_REVIEW_REQUIRED') &&
    matchConfidence !== 'MEDIUM'
  ) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `match_confidence mismatch at line ${lineNumber}`,
    );
  }
}

/**
 * Production parser for the exact pinned Bridge V3 actual schema.
 * Identity-only: polarity/name/bridge_id/match fields are structurally validated and dropped.
 * `recommended_disposition` is authoritative; `technical_disposition` is cross-check only.
 */
export function parsePinnedBridgeV3JsonlRow(
  raw: Record<string, unknown>,
  lineNumber: number,
  options: ParsePinnedBridgeV3Options = {},
): ParsedBridgeRow {
  assertPinnedV3ExactKeySet(raw, lineNumber);

  // Hybrid actual/projected rows fail closed (projected keys are unknown extras).
  if (
    Object.prototype.hasOwnProperty.call(raw, 'mapped_source_label') ||
    Object.prototype.hasOwnProperty.call(raw, 'mappedSourceLabel') ||
    Object.prototype.hasOwnProperty.call(raw, 'candidateLegacyDbIds')
  ) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Hybrid bridge schema rejected at line ${lineNumber}`,
    );
  }

  const recommendedRaw = raw.recommended_disposition;
  if (
    typeof recommendedRaw !== 'string' ||
    !(BRIDGE_DISPOSITIONS as readonly string[]).includes(recommendedRaw)
  ) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Invalid recommended_disposition at line ${lineNumber}`,
    );
  }
  const recommended = recommendedRaw as BridgeDisposition;
  const technical = raw.technical_disposition;
  if (typeof technical !== 'string') {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `technical_disposition must be string at line ${lineNumber}`,
    );
  }

  assertPinnedV3DispositionInvariants(
    recommended,
    technical,
    raw.ambiguity,
    raw.polarity_conflict,
    raw.match_method,
    raw.match_confidence,
    lineNumber,
  );
  validatePinnedV3PolarityFirewall(raw, lineNumber);

  const bridgeId = assertBoundedNfcString(raw.bridge_id, 'bridge_id', lineNumber, {
    allowEmpty: false,
  });
  if (!PINNED_V3_BRIDGE_ID_PATTERN.test(bridgeId)) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Invalid bridge_id format at line ${lineNumber}`,
    );
  }
  if (options.seenBridgeIds) {
    if (options.seenBridgeIds.has(bridgeId)) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `Duplicate bridge_id at line ${lineNumber}`,
      );
    }
    options.seenBridgeIds.add(bridgeId);
  }

  // Non-authority: structurally validate mapped_name; never propagate.
  assertBoundedNfcString(raw.mapped_name, 'mapped_name', lineNumber, { allowEmpty: false });

  const sourceSystem = raw.source_system;
  if (typeof sourceSystem !== 'string' || sourceSystem.trim() !== sourceSystem) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Invalid source_system at line ${lineNumber}`,
    );
  }
  if (!Object.prototype.hasOwnProperty.call(SOURCE_LABEL_TO_NAMESPACE, sourceSystem)) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Unknown source_system at line ${lineNumber}`,
    );
  }
  const mappedSourceLabel = sourceSystem;
  const mappedCodeRaw = assertBoundedNfcString(raw.mapped_code, 'mapped_code', lineNumber, {
    allowEmpty: false,
  });

  const candidateLegacyDbIds = parsePinnedV3Candidates(
    recommended,
    raw.candidate_eh_disease_id,
    lineNumber,
  );

  const normalized = normalizeMappedIdentity(mappedSourceLabel, mappedCodeRaw);
  const dedupeKey = mappedRawKey(mappedSourceLabel, mappedCodeRaw);

  return {
    mappedSourceLabel,
    mappedCodeRaw,
    disposition: recommended,
    candidateLegacyDbIds,
    dedupeKey,
    normalizedIdentityKey: normalized.ok ? normalized.normalizedIdentityKey : null,
  };
}

/**
 * Synthetic / test-only projected mini-schema parser.
 * Production full-corpus ingest must use parsePinnedBridgeV3JsonlRow.
 */
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

/**
 * Explicit schema selector. Production tooling must pass pinned-v3.
 * Synthetic mini-schema requires allowSyntheticBridgeSchema=true (tests only).
 */
export function parseBridgeRowForSchema(
  schema: BridgeIngestSchemaMode,
  raw: Record<string, unknown>,
  lineNumber: number,
  options: ParsePinnedBridgeV3Options & { readonly allowSyntheticBridgeSchema?: boolean } = {},
): ParsedBridgeRow {
  if (schema === BRIDGE_INGEST_SCHEMA_PINNED_V3) {
    return parsePinnedBridgeV3JsonlRow(raw, lineNumber, options);
  }
  if (schema === BRIDGE_INGEST_SCHEMA_SYNTHETIC) {
    if (options.allowSyntheticBridgeSchema !== true) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        'Synthetic bridge schema is test-only and cannot enter the production path',
      );
    }
    return parseBridgeJsonlRow(raw, lineNumber);
  }
  throw new DiseaseIdentityError('MALFORMED_INPUT', `Unknown bridge schema mode ${String(schema)}`);
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
