/**
 * F3D-2B in-memory cue parser contracts.
 *
 * Offsets: startOffset inclusive, endOffset exclusive; JavaScript UTF-16
 * code units on the single NFC-normalized eligible source string. Not UTF-8
 * bytes and not grapheme clusters. Matching never uses a separately
 * whitespace-collapsed string.
 *
 * F3C/report connection is not authorized. F3C ACTIVE eligibility must be
 * re-read after the F3D identity advisory lock before any later F3C-backed
 * parser connection (recorded F3D-1 limitation). This module does not
 * connect OCR, HTTP, workers, facts, or Rules 1–9.
 */

import type { SourceLocator } from '../../types.js';
import type {
  PackLanguage,
  PackScript,
  SelectorProhibition,
  TerminologyEntryType,
} from '../types.js';

export const CUE_PARSER_FOUNDATION = true as const;
export const CUE_PARSER_CONNECTED = false as const;
export const CUE_PARSER_PRODUCTION_ENABLED = false as const;

export const CUE_PARSER_VERSION = 'f3d2b-cue-parser-v1' as const;
export const CUE_PARSER_AUTHORITY_SCOPE = 'TERMINOLOGY_CUE_MATCH_ONLY' as const;

export const MAX_ELIGIBLE_TEXT_CHARS = 2000;
export const MAX_CUE_MATCHES = 32;
export const MAX_MATCH_SPAN_CHARS = 80;
export const CUE_PARSER_BUDGET_MS = 50;

export const CUE_PARSER_SOURCE_CHANNELS = ['DOCTOR_DECLARED'] as const;
export type CueParserSourceChannel = (typeof CUE_PARSER_SOURCE_CHANNELS)[number];

export const CUE_PARSER_SOURCE_FIELDS = [
  'CHIEF_COMPLAINT',
  'SYMPTOM_ROW',
  'DOCTOR_OBSERVATIONS',
  'HISTORY_NOTES',
] as const;
export type CueParserSourceField = (typeof CUE_PARSER_SOURCE_FIELDS)[number];

export const CUE_ATTACHMENT_STATUSES = [
  'CUE_ONLY',
  'SCOPE_UNRESOLVED',
  'UNRESOLVED_NEGATION',
] as const;
export type CueAttachmentStatus = (typeof CUE_ATTACHMENT_STATUSES)[number];

export const CUE_PARSER_REASON_CODES = [
  'MATCHED',
  'NO_MATCHES',
  'PACK_UNAVAILABLE',
  'UNTRUSTED_INPUT',
  'MALFORMED_UNICODE',
  'INPUT_TOO_LARGE',
  'TOO_MANY_MATCHES',
  'PARSER_TIMEOUT',
  'AMBIGUOUS_OVERLAP',
  'SOURCE_LOCATOR_STORAGE_FORBIDDEN',
] as const;
export type CueParserReasonCode = (typeof CUE_PARSER_REASON_CODES)[number];

export const CUE_LIMITATION_CODES = [
  'NOT_AUTHORITATIVE',
  'NO_DISEASE_MAPPING',
  'NO_CLINICAL_VERIFICATION',
  'SELECTOR_FORBIDDEN',
  'SOURCE_DECLARED_ONLY',
  'F3C_PARSER_NOT_CONNECTED',
  'CUE_ONLY',
  'SCOPE_UNRESOLVED',
  'UNRESOLVED_NEGATION',
] as const;
export type CueLimitationCode = (typeof CUE_LIMITATION_CODES)[number];

export const CUE_PARSER_SELECTOR_FORBIDDEN_KEYS = [
  'diseaseId',
  'disease_id',
  'selectedDisease',
  'medicineCode',
  'medicine_code',
  'formula',
  'potency',
  'dose',
  'negated',
  'analyzeComplete',
  'clinically_used',
  'clinicallyUsed',
] as const;

/** Server-resolved eligible input. Tests only in this slice. Not a public API body. */
export type EligibleCueParserInput = {
  readonly sourceIdentityFingerprint: string;
  readonly sourceChannel: CueParserSourceChannel;
  readonly sourceField: CueParserSourceField;
  readonly eligibleText: string;
  readonly sourceLocator?: SourceLocator | null;
  readonly organizationId: string;
  readonly clinicId: string;
  readonly patientId: string;
  readonly consultationId: string;
};

export type TerminologyCueMatchCandidate = {
  readonly candidateId: string;
  readonly organizationId: string;
  readonly clinicId: string;
  readonly patientId: string;
  readonly consultationId: string;
  readonly sourceIdentityFingerprint: string;
  readonly sourceChannel: CueParserSourceChannel;
  readonly sourceField: CueParserSourceField;
  readonly sourceLocator: SourceLocator | null;
  /** Exact matched slice on the NFC eligible string. Max 80 UTF-16 code units. */
  readonly originalSourceSpan: string;
  /** Inclusive UTF-16 offset on the NFC eligible string. */
  readonly startOffset: number;
  /** Exclusive UTF-16 offset on the NFC eligible string. */
  readonly endOffset: number;
  readonly entryId: string;
  readonly entryType: TerminologyEntryType;
  readonly canonicalLabel: string;
  readonly language: PackLanguage;
  readonly script: PackScript;
  readonly packId: string;
  readonly packVersion: string;
  readonly packContentChecksum: string;
  readonly parserVersion: typeof CUE_PARSER_VERSION;
  readonly parserFingerprint: string;
  readonly contentFingerprint: string;
  readonly attachmentStatus: CueAttachmentStatus;
  readonly limitationCodes: readonly CueLimitationCode[];
  readonly authorityScope: typeof CUE_PARSER_AUTHORITY_SCOPE;
  readonly clinicallyUsed: false;
  readonly selectorProhibition: SelectorProhibition;
};

export type CueParserSuccess = {
  readonly ok: true;
  readonly reason: 'MATCHED' | 'NO_MATCHES';
  readonly matches: readonly TerminologyCueMatchCandidate[];
};

export type CueParserFailure = {
  readonly ok: false;
  readonly reason: CueParserReasonCode;
  readonly matches: readonly [];
};

export type CueParserResult = CueParserSuccess | CueParserFailure;

export class CueParserError extends Error {
  readonly code: CueParserReasonCode;

  constructor(code: CueParserReasonCode) {
    super(code);
    this.name = 'CueParserError';
    this.code = code;
  }

  toJSON(): { code: CueParserReasonCode } {
    return { code: this.code };
  }
}
