import {
  FACT_NORMALIZATION_AUTHORITY_SCOPE,
  FACT_NORMALIZATION_KINDS,
  FACT_NORMALIZATION_NEGATION_SCOPE,
  type FactNormalizationKind,
  type FactNormalizationLimitationCode,
} from '../../factNormalizationTypes.js';
import { ownerFrozenActiveEntryById, ownerFrozenExactActiveUnitAlias } from '../loader.js';
import {
  CUE_PARSER_AUTHORITY_SCOPE,
  CUE_PARSER_VERSION,
  MAX_MATCH_SPAN_CHARS,
  type CueParserReasonCode,
  type CueParserResult,
  type TerminologyCueMatchCandidate,
} from '../parser/types.js';
import { TERMINOLOGY_CANONICALIZATION_VERSION, type LoadedTerminologyPack } from '../types.js';
import { sha256Utf8 } from '../canonical.js';
import {
  computeNormalizationIdentityFingerprint,
  computeNormalizerFingerprint,
} from './canonical.js';
import {
  assertSha256Hex,
  fail,
  rejectForbiddenKeys,
  validateOptionalAssertedValue,
  validateSourceRef,
  validateUnitText,
} from './transport.js';
import {
  FACT_NORMALIZER_METHOD,
  FACT_NORMALIZER_VERSION,
  MAX_DRAFT_CUE_ENTRY_IDS,
  MAX_NORMALIZER_DRAFTS,
  NORMALIZER_CUE_SOURCE_COMBINATIONS,
  NORMALIZER_STRUCTURED_VITAL_FIELDS,
  NORMALIZER_UNIT_POSTURES,
  type FactNormalizationDraft,
  type NormalizeSourceLinkedFactInput,
  type NormalizeSourceLinkedFactResult,
  type NormalizerFailureCode,
} from './types.js';

const KIND_RANK: Record<FactNormalizationKind, number> = {
  UNIT_ALIAS: 0,
  DURATION_PHRASE: 1,
  NEGATION_CUE: 2,
};

const BASE_LIMITATIONS: readonly FactNormalizationLimitationCode[] = [
  'NOT_AUTHORITATIVE',
  'NO_CLINICAL_VERIFICATION',
  'NO_DISEASE_MAPPING',
  'SOURCE_LINKED_NORMALIZATION_ONLY',
  'NO_UNIT_CONVERSION',
  'RECOMPUTE_CUES_FROM_SOURCE',
];

function expectedParserFingerprint(packChecksum: string): string {
  return sha256Utf8(
    `${CUE_PARSER_VERSION}|${TERMINOLOGY_CANONICALIZATION_VERSION}|${packChecksum}`,
  );
}

function mapParserFailure(reason: CueParserReasonCode): NormalizerFailureCode {
  switch (reason) {
    case 'PARSER_TIMEOUT':
      return 'PARSER_TIMEOUT';
    case 'TOO_MANY_MATCHES':
      return 'TOO_MANY_MATCHES';
    case 'AMBIGUOUS_OVERLAP':
      return 'AMBIGUOUS_OVERLAP';
    case 'MALFORMED_UNICODE':
      return 'MALFORMED_UNICODE';
    case 'INPUT_TOO_LARGE':
      return 'SOURCE_TOO_LARGE';
    case 'PACK_UNAVAILABLE':
      return 'PACK_INVALID';
    default:
      return 'PARSER_FAILED';
  }
}

function isCueCombo(channel: string, field: string): boolean {
  return NORMALIZER_CUE_SOURCE_COMBINATIONS.some(
    (c) => c.sourceChannel === channel && c.sourceField === field,
  );
}

function isVitalField(field: string): field is (typeof NORMALIZER_STRUCTURED_VITAL_FIELDS)[number] {
  return (NORMALIZER_STRUCTURED_VITAL_FIELDS as readonly string[]).includes(field);
}

function assertLoadedPack(loadedPack: LoadedTerminologyPack): NormalizerFailureCode | null {
  if (
    loadedPack.syntheticTestOnly ||
    loadedPack.status !== 'OWNER_FROZEN' ||
    typeof loadedPack.packId !== 'string' ||
    typeof loadedPack.packVersion !== 'string' ||
    typeof loadedPack.contentChecksum !== 'string' ||
    !assertSha256Hex(loadedPack.contentChecksum)
  ) {
    return 'PACK_INVALID';
  }
  return null;
}

function limitationsForKind(kind: FactNormalizationKind): FactNormalizationLimitationCode[] {
  const codes = [...BASE_LIMITATIONS];
  if (kind === 'NEGATION_CUE') codes.push('SCOPE_UNRESOLVED');
  return [...new Set(codes)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function buildDraft(args: {
  sourceRef: string;
  sourceIdentityFingerprint: string;
  kind: FactNormalizationKind;
  canonicalLabel: string;
  negationScope: typeof FACT_NORMALIZATION_NEGATION_SCOPE | null;
  cueEntryIds: readonly string[];
  pack: LoadedTerminologyPack;
  parserVersion: string;
  parserFingerprint: string;
}): FactNormalizationDraft | NormalizerFailureCode {
  const cueEntryIds = [...new Set(args.cueEntryIds)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  if (cueEntryIds.length < 1 || cueEntryIds.length > MAX_DRAFT_CUE_ENTRY_IDS) {
    return 'DRAFT_CAP_OVERFLOW';
  }
  for (const id of cueEntryIds) {
    if (typeof id !== 'string' || id.length < 1 || id.length > 64) return 'INVALID_INPUT';
  }
  const limitationCodes = limitationsForKind(args.kind);
  const normalizerFingerprint = computeNormalizerFingerprint();
  const normalizationIdentityFingerprint = computeNormalizationIdentityFingerprint({
    sourceIdentityFingerprint: args.sourceIdentityFingerprint,
    normalizationKind: args.kind,
    canonicalLabel: args.canonicalLabel,
    negationScope: args.negationScope,
    cueEntryIds,
    packId: args.pack.packId,
    packVersion: args.pack.packVersion,
    packContentChecksum: args.pack.contentChecksum,
    parserVersion: args.parserVersion,
    parserFingerprint: args.parserFingerprint,
    normalizerMethod: FACT_NORMALIZER_METHOD,
    normalizerVersion: FACT_NORMALIZER_VERSION,
    normalizerFingerprint,
    limitationCodes,
  });
  return {
    sourceRef: args.sourceRef,
    sourceIdentityFingerprint: args.sourceIdentityFingerprint,
    normalizationKind: args.kind,
    canonicalLabel: args.canonicalLabel,
    negationScope: args.negationScope,
    cueEntryIds,
    normalizationIdentityFingerprint,
    packId: args.pack.packId,
    packVersion: args.pack.packVersion,
    packContentChecksum: args.pack.contentChecksum,
    parserVersion: args.parserVersion,
    parserFingerprint: args.parserFingerprint,
    normalizerMethod: FACT_NORMALIZER_METHOD,
    normalizerVersion: FACT_NORMALIZER_VERSION,
    normalizerFingerprint,
    limitationCodes,
    authorityScope: FACT_NORMALIZATION_AUTHORITY_SCOPE,
    clinicallyUsed: false,
    selectorProhibition: 'SELECTOR_FORBIDDEN',
  };
}

function sortAndDedupDrafts(
  drafts: FactNormalizationDraft[],
): FactNormalizationDraft[] | NormalizerFailureCode {
  const byIdentity = new Map<string, FactNormalizationDraft>();
  for (const d of drafts) {
    byIdentity.set(d.normalizationIdentityFingerprint, d);
  }
  const unique = [...byIdentity.values()];
  if (unique.length > MAX_NORMALIZER_DRAFTS) return 'DRAFT_CAP_OVERFLOW';
  unique.sort((a, b) => {
    const kr = KIND_RANK[a.normalizationKind] - KIND_RANK[b.normalizationKind];
    if (kr !== 0) return kr;
    if (a.canonicalLabel !== b.canonicalLabel) {
      return a.canonicalLabel < b.canonicalLabel ? -1 : 1;
    }
    const a0 = a.cueEntryIds[0] ?? '';
    const b0 = b.cueEntryIds[0] ?? '';
    return a0 < b0 ? -1 : a0 > b0 ? 1 : 0;
  });
  return unique;
}

function validateMatch(
  match: TerminologyCueMatchCandidate,
  input: {
    sourceChannel: string;
    sourceField: string;
    sourceIdentityFingerprint: string;
  },
  pack: LoadedTerminologyPack,
  expectedFp: string,
): FactNormalizationKind | NormalizerFailureCode {
  if (match.clinicallyUsed !== false) return 'INVALID_INPUT';
  if (match.authorityScope !== CUE_PARSER_AUTHORITY_SCOPE) return 'INVALID_INPUT';
  if (match.selectorProhibition !== 'SELECTOR_FORBIDDEN') return 'INVALID_INPUT';
  if (match.sourceChannel !== input.sourceChannel) return 'INVALID_INPUT';
  if (match.sourceField !== input.sourceField) return 'INVALID_INPUT';
  if (match.sourceIdentityFingerprint !== input.sourceIdentityFingerprint) return 'INVALID_INPUT';
  if (match.packId !== pack.packId) return 'PACK_CHECKSUM_MISMATCH';
  if (match.packVersion !== pack.packVersion) return 'PACK_CHECKSUM_MISMATCH';
  if (match.packContentChecksum !== pack.contentChecksum) return 'PACK_CHECKSUM_MISMATCH';
  if (match.parserVersion !== CUE_PARSER_VERSION) return 'PARSER_FAILED';
  if (match.parserFingerprint !== expectedFp) return 'PARSER_FAILED';
  if (
    typeof match.startOffset !== 'number' ||
    typeof match.endOffset !== 'number' ||
    match.startOffset < 0 ||
    match.endOffset <= match.startOffset ||
    match.endOffset - match.startOffset > MAX_MATCH_SPAN_CHARS
  ) {
    return 'INVALID_INPUT';
  }
  if (
    typeof match.originalSourceSpan === 'string' &&
    match.originalSourceSpan.length > MAX_MATCH_SPAN_CHARS
  ) {
    return 'INVALID_INPUT';
  }
  const entry = ownerFrozenActiveEntryById(pack, match.entryId);
  if (!entry) return 'INVALID_INPUT';
  if (entry.entryType !== match.entryType) return 'INVALID_INPUT';
  if (entry.canonicalLabel !== match.canonicalLabel) return 'INVALID_INPUT';
  if (!(FACT_NORMALIZATION_KINDS as readonly string[]).includes(match.entryType)) {
    return 'INVALID_INPUT';
  }
  return match.entryType as FactNormalizationKind;
}

function normalizeCueResult(
  input: Extract<NormalizeSourceLinkedFactInput, { mode: 'CUE_RESULT' }>,
  loadedPack: LoadedTerminologyPack,
): NormalizeSourceLinkedFactResult {
  const packErr = assertLoadedPack(loadedPack);
  if (packErr) return fail(packErr);
  const refErr = validateSourceRef(input.sourceRef);
  if (refErr) return fail(refErr);
  if (!assertSha256Hex(input.sourceIdentityFingerprint)) return fail('INVALID_INPUT');
  if (!isCueCombo(input.sourceChannel, input.sourceField)) {
    return fail('UNSUPPORTED_SOURCE_COMBINATION');
  }

  const result = input.parserResult as CueParserResult;
  if (!result || typeof result !== 'object' || typeof result.ok !== 'boolean') {
    return fail('INVALID_INPUT');
  }
  if (!Array.isArray(result.matches)) return fail('INVALID_INPUT');

  if (!result.ok) {
    return fail(mapParserFailure(result.reason));
  }
  if (result.reason !== 'MATCHED' && result.reason !== 'NO_MATCHES') {
    return fail('PARSER_FAILED');
  }
  if (result.reason === 'NO_MATCHES') {
    if (result.matches.length !== 0) return fail('INVALID_INPUT');
    return { ok: true, drafts: [], reason: 'NO_MATCHES' };
  }
  if (result.matches.length < 1) return fail('INVALID_INPUT');
  if (result.matches.length > MAX_NORMALIZER_DRAFTS) return fail('TOO_MANY_MATCHES');

  const expectedFp = expectedParserFingerprint(loadedPack.contentChecksum);
  const drafts: FactNormalizationDraft[] = [];
  for (const match of result.matches) {
    const kindOrErr = validateMatch(
      match,
      {
        sourceChannel: input.sourceChannel,
        sourceField: input.sourceField,
        sourceIdentityFingerprint: input.sourceIdentityFingerprint,
      },
      loadedPack,
      expectedFp,
    );
    if (
      typeof kindOrErr === 'string' &&
      !(FACT_NORMALIZATION_KINDS as readonly string[]).includes(kindOrErr)
    ) {
      return fail(kindOrErr as NormalizerFailureCode);
    }
    const kind = kindOrErr as FactNormalizationKind;
    const negationScope = kind === 'NEGATION_CUE' ? FACT_NORMALIZATION_NEGATION_SCOPE : null;
    if (kind === 'NEGATION_CUE') {
      if (
        match.attachmentStatus !== 'SCOPE_UNRESOLVED' &&
        match.attachmentStatus !== 'UNRESOLVED_NEGATION'
      ) {
        return fail('INVALID_INPUT');
      }
    } else if (match.attachmentStatus !== 'CUE_ONLY') {
      return fail('INVALID_INPUT');
    }
    const draft = buildDraft({
      sourceRef: input.sourceRef,
      sourceIdentityFingerprint: input.sourceIdentityFingerprint,
      kind,
      canonicalLabel: match.canonicalLabel,
      negationScope,
      cueEntryIds: [match.entryId],
      pack: loadedPack,
      parserVersion: CUE_PARSER_VERSION,
      parserFingerprint: expectedFp,
    });
    if (typeof draft === 'string') return fail(draft);
    drafts.push(draft);
  }

  const ordered = sortAndDedupDrafts(drafts);
  if (typeof ordered === 'string') return fail(ordered);
  return {
    ok: true,
    drafts: ordered,
    reason: ordered.length === 0 ? 'NO_MATCHES' : 'NORMALIZED',
  };
}

function normalizeStructuredUnit(
  input: Extract<NormalizeSourceLinkedFactInput, { mode: 'STRUCTURED_UNIT' }>,
  loadedPack: LoadedTerminologyPack,
): NormalizeSourceLinkedFactResult {
  const packErr = assertLoadedPack(loadedPack);
  if (packErr) return fail(packErr);
  const refErr = validateSourceRef(input.sourceRef);
  if (refErr) return fail(refErr);
  if (!assertSha256Hex(input.sourceIdentityFingerprint)) return fail('INVALID_INPUT');
  if (input.sourceChannel !== 'STRUCTURED_INTAKE') return fail('UNSUPPORTED_SOURCE_COMBINATION');
  if (!isVitalField(input.sourceField)) return fail('UNSUPPORTED_SOURCE_COMBINATION');
  if (!(NORMALIZER_UNIT_POSTURES as readonly string[]).includes(input.unitPosture)) {
    return fail('INVALID_INPUT');
  }
  const assertedErr = validateOptionalAssertedValue(input.assertedValueText);
  if (assertedErr) return fail(assertedErr);
  const unitErr = validateUnitText(input.unitText);
  if (unitErr) return fail(unitErr);

  if (input.unitPosture !== 'EXACT_AS_SOURCE') {
    return { ok: true, drafts: [], reason: 'NO_MATCHES' };
  }

  const hit = ownerFrozenExactActiveUnitAlias(loadedPack, input.unitText);
  if (!hit) {
    return { ok: true, drafts: [], reason: 'NO_MATCHES' };
  }

  const parserVersion = 'none';
  const parserFingerprint = sha256Utf8(
    `STRUCTURED_UNIT_NO_PARSER|${FACT_NORMALIZER_VERSION}|${loadedPack.contentChecksum}`,
  );
  const draft = buildDraft({
    sourceRef: input.sourceRef,
    sourceIdentityFingerprint: input.sourceIdentityFingerprint,
    kind: 'UNIT_ALIAS',
    canonicalLabel: hit.canonicalLabel,
    negationScope: null,
    cueEntryIds: [hit.entryId],
    pack: loadedPack,
    parserVersion,
    parserFingerprint,
  });
  if (typeof draft === 'string') return fail(draft);
  return { ok: true, drafts: [draft], reason: 'NORMALIZED' };
}

/**
 * Pure deterministic source-preserving normalizer (F3D-2D2).
 * Consumes verified precomputed cue results only; never invokes the cue parser.
 * Does not open DB transactions or write rows.
 */
export function normalizeSourceLinkedFact(
  input: NormalizeSourceLinkedFactInput,
  loadedPack: LoadedTerminologyPack,
): NormalizeSourceLinkedFactResult {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return fail('INVALID_INPUT');
  }
  if (loadedPack === null || typeof loadedPack !== 'object') {
    return fail('PACK_INVALID');
  }
  const rec = input as unknown as Record<string, unknown>;
  const forbidden = rejectForbiddenKeys(rec);
  if (forbidden) return fail(forbidden);

  if (rec.mode === 'CUE_RESULT') {
    const allowed = [
      'mode',
      'sourceRef',
      'sourceChannel',
      'sourceField',
      'sourceIdentityFingerprint',
      'parserResult',
    ];
    for (const key of Object.keys(rec)) {
      if (!allowed.includes(key)) return fail('INVALID_INPUT');
    }
    for (const key of allowed) {
      if (!(key in rec)) return fail('INVALID_INPUT');
    }
    return normalizeCueResult(
      input as Extract<NormalizeSourceLinkedFactInput, { mode: 'CUE_RESULT' }>,
      loadedPack,
    );
  }

  if (rec.mode === 'STRUCTURED_UNIT') {
    const allowed = [
      'mode',
      'sourceRef',
      'sourceChannel',
      'sourceField',
      'sourceIdentityFingerprint',
      'assertedValueText',
      'unitText',
      'unitPosture',
    ];
    for (const key of Object.keys(rec)) {
      if (!allowed.includes(key)) return fail('INVALID_INPUT');
    }
    for (const key of [
      'mode',
      'sourceRef',
      'sourceChannel',
      'sourceField',
      'sourceIdentityFingerprint',
      'unitText',
      'unitPosture',
    ]) {
      if (!(key in rec)) return fail('INVALID_INPUT');
    }
    return normalizeStructuredUnit(
      input as Extract<NormalizeSourceLinkedFactInput, { mode: 'STRUCTURED_UNIT' }>,
      loadedPack,
    );
  }

  return fail('INVALID_INPUT');
}
