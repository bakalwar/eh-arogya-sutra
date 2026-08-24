import { BRIDGE_DISPOSITIONS } from './constants.js';
import { DiseaseIdentityError } from './errors.js';
import { normalizeMappedIdentity } from './normalize.js';
import {
  EXPECTED_BRIDGE_ROW_COUNT,
  EXPECTED_UNRESOLVED_QUEUE_COUNT,
} from './fullCorpusConstants.js';
import { mappedRawKey } from './namespaceResolution.js';

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
  if (Array.isArray(raw)) {
    return [...raw]
      .map((v) => {
        if (typeof v !== 'number' || !Number.isSafeInteger(v) || v <= 0) {
          throw new DiseaseIdentityError('MALFORMED_INPUT', 'Invalid bridge candidate id');
        }
        return v;
      })
      .sort((a, b) => a - b);
  }
  if (typeof raw === 'string') {
    const ids = raw
      .split(';')
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map((part) => {
        const n = Number(part);
        if (!Number.isSafeInteger(n) || n <= 0) {
          throw new DiseaseIdentityError('MALFORMED_INPUT', 'Invalid bridge candidate id');
        }
        return n;
      })
      .sort((a, b) => a - b);
    const seen = new Set<number>();
    for (const id of ids) {
      if (seen.has(id)) {
        throw new DiseaseIdentityError('MALFORMED_INPUT', `Duplicate bridge candidate id ${id}`);
      }
      seen.add(id);
    }
    return ids;
  }
  if (raw === null || raw === undefined) {
    return [];
  }
  throw new DiseaseIdentityError('MALFORMED_INPUT', 'Bridge candidate ids must be array or string');
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

export function validateBridgeBatch(
  rows: readonly ParsedBridgeRow[],
  options?: { expectedRowCount?: number },
): void {
  const expectedRows = options?.expectedRowCount ?? EXPECTED_BRIDGE_ROW_COUNT;
  if (rows.length !== expectedRows) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Expected ${expectedRows} bridge rows, observed ${rows.length}`,
    );
  }

  if (expectedRows !== EXPECTED_BRIDGE_ROW_COUNT) {
    return;
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

  if (dispositionCounts.EXACT_UNIQUE_MATCH !== 33_070) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Bridge EXACT_UNIQUE count mismatch');
  }
  if (dispositionCounts.EXACT_MULTIPLE_MATCH !== 17_181) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Bridge EXACT_MULTIPLE count mismatch');
  }
  if (dispositionCounts.OWNER_REVIEW_REQUIRED !== 257) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Bridge OWNER_REVIEW count mismatch');
  }
  if (dispositionCounts.NO_MATCH !== 36) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Bridge NO_MATCH count mismatch');
  }

  const unresolved =
    dispositionCounts.EXACT_MULTIPLE_MATCH +
    dispositionCounts.OWNER_REVIEW_REQUIRED +
    dispositionCounts.NO_MATCH;
  if (unresolved !== EXPECTED_UNRESOLVED_QUEUE_COUNT) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Bridge unresolved queue count mismatch');
  }
}

export function indexBridgeRows(rows: readonly ParsedBridgeRow[]): Map<string, ParsedBridgeRow> {
  const map = new Map<string, ParsedBridgeRow>();
  for (const row of rows) {
    map.set(row.dedupeKey, row);
  }
  return map;
}
