import { createHash } from 'node:crypto';
import { assertNoStorageInLocator } from '../../fingerprint.js';
import { presentSourceLocator } from '../../reviewPresentation.js';
import { ownerFrozenEntriesForCueParser } from '../loader.js';
import {
  PRODUCTION_TERMINOLOGY_PACK_PIN,
  TERMINOLOGY_CANONICALIZATION_VERSION,
  type LoadedTerminologyPack,
} from '../types.js';
import { negationAttachmentStatus, scanFrozenAliases } from './match.js';
import { assertTransportEligibleText } from './transport.js';
import {
  CUE_PARSER_AUTHORITY_SCOPE,
  CUE_PARSER_BUDGET_MS,
  CUE_PARSER_REASON_CODES,
  CUE_PARSER_SOURCE_CHANNELS,
  CUE_PARSER_SOURCE_COMBINATIONS,
  CUE_PARSER_SOURCE_FIELDS,
  CUE_PARSER_VERSION,
  CueParserError,
  MAX_MATCH_SPAN_CHARS,
  type CueLimitationCode,
  type CueParserReasonCode,
  type CueParserResult,
  type CueParserSourceChannel,
  type CueParserSourceField,
  type EligibleCueParserInput,
  type TerminologyCueMatchCandidate,
} from './types.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEX64 = /^[0-9a-f]{64}$/;

function fail(reason: CueParserReasonCode): CueParserResult {
  return { ok: false, reason, matches: [] };
}

function sha256Utf8(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function isChannel(value: unknown): value is CueParserSourceChannel {
  return (CUE_PARSER_SOURCE_CHANNELS as readonly string[]).includes(String(value));
}

function isField(value: unknown): value is CueParserSourceField {
  return (CUE_PARSER_SOURCE_FIELDS as readonly string[]).includes(String(value));
}

function assertClosedSourceCombination(
  channel: CueParserSourceChannel,
  field: CueParserSourceField,
): void {
  const ok = (
    CUE_PARSER_SOURCE_COMBINATIONS as readonly {
      sourceChannel: string;
      sourceField: string;
    }[]
  ).some((row) => row.sourceChannel === channel && row.sourceField === field);
  if (!ok) throw new CueParserError('UNTRUSTED_INPUT');
}

function assertIdentity(input: EligibleCueParserInput): void {
  if (!HEX64.test(input.sourceIdentityFingerprint)) {
    throw new CueParserError('UNTRUSTED_INPUT');
  }
  if (!isChannel(input.sourceChannel) || !isField(input.sourceField)) {
    throw new CueParserError('UNTRUSTED_INPUT');
  }
  assertClosedSourceCombination(input.sourceChannel, input.sourceField);
  for (const id of [input.organizationId, input.clinicId, input.patientId, input.consultationId]) {
    if (!UUID_RE.test(id)) throw new CueParserError('UNTRUSTED_INPUT');
  }
  const rec = input as unknown as Record<string, unknown>;
  if (
    'clinicallyUsed' in rec ||
    'clinically_used' in rec ||
    'packJson' in rec ||
    'ownerApprovalToken' in rec ||
    'packPath' in rec ||
    'diseaseId' in rec ||
    'medicineCode' in rec
  ) {
    throw new CueParserError('UNTRUSTED_INPUT');
  }
}

function locatorOrNull(
  input: EligibleCueParserInput,
): TerminologyCueMatchCandidate['sourceLocator'] {
  if (input.sourceLocator == null) return null;
  assertNoStorageInLocator(input.sourceLocator);
  return presentSourceLocator(input.sourceLocator);
}

function parserFingerprint(packChecksum: string): string {
  return sha256Utf8(
    `${CUE_PARSER_VERSION}|${TERMINOLOGY_CANONICALIZATION_VERSION}|${packChecksum}`,
  );
}

function limitationFor(
  entryType: string,
  attachment: TerminologyCueMatchCandidate['attachmentStatus'],
): CueLimitationCode[] {
  const codes: CueLimitationCode[] = [
    'NOT_AUTHORITATIVE',
    'NO_DISEASE_MAPPING',
    'NO_CLINICAL_VERIFICATION',
    'SELECTOR_FORBIDDEN',
    'SOURCE_DECLARED_ONLY',
    'F3C_PARSER_NOT_CONNECTED',
    'CUE_ONLY',
  ];
  if (entryType === 'NEGATION_CUE' && attachment === 'SCOPE_UNRESOLVED') {
    codes.push('SCOPE_UNRESOLVED');
  }
  if (attachment === 'UNRESOLVED_NEGATION') codes.push('UNRESOLVED_NEGATION');
  codes.sort();
  return codes;
}

function pinMatches(loaded: LoadedTerminologyPack): boolean {
  const pin = PRODUCTION_TERMINOLOGY_PACK_PIN;
  return (
    loaded.status === 'OWNER_FROZEN' &&
    loaded.executable === false &&
    loaded.syntheticTestOnly === false &&
    loaded.packId === pin.packId &&
    loaded.packVersion === pin.packVersion &&
    loaded.entryCount === pin.expectedEntryCount &&
    loaded.contentChecksum === pin.expectedContentChecksum &&
    loaded.normalizationParserAvailable === false
  );
}

/** Trusted monotonic clock for the production 50 ms CPU budget. Not Date.now(). */
export function trustedMonotonicNow(): number {
  let value: number;
  try {
    value = performance.now();
  } catch {
    throw new CueParserError('PARSER_TIMEOUT');
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new CueParserError('PARSER_TIMEOUT');
  }
  return value;
}

/**
 * Shared in-memory parse. Callers must pass a validated budget in (0, 50] ms.
 * Not a public package export.
 */
export function executeOwnerFrozenCueParse(
  eligibleInput: EligibleCueParserInput,
  loadedPack: LoadedTerminologyPack,
  budgetMs: number,
  now: () => number,
): CueParserResult {
  try {
    if (!loadedPack || !pinMatches(loadedPack)) {
      return fail('PACK_UNAVAILABLE');
    }
    const lookup = loadedPack.lookupAlias('denies');
    if (lookup.matched !== false || lookup.reason !== 'TERMINOLOGY_LOOKUP_NOT_CONNECTED') {
      return fail('PACK_UNAVAILABLE');
    }
    const entries = ownerFrozenEntriesForCueParser(loadedPack);
    if (!entries || entries.length !== PRODUCTION_TERMINOLOGY_PACK_PIN.expectedEntryCount) {
      return fail('PACK_UNAVAILABLE');
    }
    assertIdentity(eligibleInput);
    const text = assertTransportEligibleText(eligibleInput.eligibleText);
    const locator = locatorOrNull(eligibleInput);
    const scanned = scanFrozenAliases(text, entries, budgetMs, now);
    if (!scanned.ok) {
      return fail(scanned.reason);
    }
    if (scanned.hits.length === 0) {
      return { ok: true, reason: 'NO_MATCHES', matches: [] };
    }
    const fp = parserFingerprint(loadedPack.contentChecksum);
    const matches: TerminologyCueMatchCandidate[] = scanned.hits.map((hit) => {
      const originalSourceSpan = text.slice(hit.startOffset, hit.endOffset);
      if (originalSourceSpan.length < 1 || originalSourceSpan.length > MAX_MATCH_SPAN_CHARS) {
        throw new CueParserError('UNTRUSTED_INPUT');
      }
      const attachmentStatus =
        hit.entry.entryType === 'NEGATION_CUE'
          ? negationAttachmentStatus(text, hit.startOffset, hit.endOffset)
          : 'CUE_ONLY';
      const contentFingerprint = sha256Utf8(
        JSON.stringify({
          v: 1,
          sourceIdentityFingerprint: eligibleInput.sourceIdentityFingerprint,
          packId: loadedPack.packId,
          packVersion: loadedPack.packVersion,
          packContentChecksum: loadedPack.contentChecksum,
          parserVersion: CUE_PARSER_VERSION,
          parserFingerprint: fp,
          entryId: hit.entry.id,
          startOffset: hit.startOffset,
          endOffset: hit.endOffset,
        }),
      );
      return {
        candidateId: contentFingerprint,
        organizationId: eligibleInput.organizationId,
        clinicId: eligibleInput.clinicId,
        patientId: eligibleInput.patientId,
        consultationId: eligibleInput.consultationId,
        sourceIdentityFingerprint: eligibleInput.sourceIdentityFingerprint,
        sourceChannel: eligibleInput.sourceChannel,
        sourceField: eligibleInput.sourceField,
        sourceLocator: locator,
        originalSourceSpan,
        startOffset: hit.startOffset,
        endOffset: hit.endOffset,
        entryId: hit.entry.id,
        entryType: hit.entry.entryType,
        canonicalLabel: hit.entry.canonicalLabel,
        language: hit.entry.language,
        script: hit.entry.script,
        packId: loadedPack.packId,
        packVersion: loadedPack.packVersion,
        packContentChecksum: loadedPack.contentChecksum,
        parserVersion: CUE_PARSER_VERSION,
        parserFingerprint: fp,
        contentFingerprint,
        attachmentStatus,
        limitationCodes: limitationFor(hit.entry.entryType, attachmentStatus),
        authorityScope: CUE_PARSER_AUTHORITY_SCOPE,
        clinicallyUsed: false,
        selectorProhibition: 'SELECTOR_FORBIDDEN',
      };
    });
    return { ok: true, reason: 'MATCHED', matches };
  } catch (err) {
    if (
      err instanceof CueParserError &&
      (CUE_PARSER_REASON_CODES as readonly string[]).includes(err.code)
    ) {
      return fail(err.code);
    }
    const code = (err as { code?: string } | null)?.code;
    if (code === 'SOURCE_LOCATOR_STORAGE_FORBIDDEN' || code === 'SOURCE_LOCATOR_UNKNOWN_FIELD') {
      return fail('SOURCE_LOCATOR_STORAGE_FORBIDDEN');
    }
    return fail('UNTRUSTED_INPUT');
  }
}

export { CUE_PARSER_BUDGET_MS };
