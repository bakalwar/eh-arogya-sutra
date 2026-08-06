import {
  RULE5_CANONICAL_CLINICAL_REASON_REGISTRY,
  RULE5_CANONICAL_ENTRY_BY_CODE,
  RULE5_CLINICAL_REASON_CODES,
  isKnownRule5ClinicalReasonCode,
  type Rule5ClinicalReasonCode,
  type Rule5ClinicalReasonRegistry,
  type Rule5ClinicalReasonRegistryEntry,
} from './reasonCodes.js';
import {
  RULE5_CLINICAL_NAMESPACE,
  RULE5_REASON_REGISTRY_VERSION,
  RULE5_REASON_REGISTRY_VERSION_V1,
} from './version.js';

export type Rule5UnknownClinicalReasonCodeFailure = 'RULE5_UNKNOWN_CLINICAL_REASON_CODE';

export class Rule5UnknownClinicalReasonCodeError extends Error {
  readonly failureCode: Rule5UnknownClinicalReasonCodeFailure;

  constructor(failureCode: Rule5UnknownClinicalReasonCodeFailure) {
    super(failureCode);
    this.name = 'Rule5UnknownClinicalReasonCodeError';
    this.failureCode = failureCode;
  }
}

/** Fail-closed: reject codes outside the canonical 34-code clinical register. */
export function assertKnownRule5ClinicalReasonCode(
  code: string,
): asserts code is Rule5ClinicalReasonCode {
  if (!isKnownRule5ClinicalReasonCode(code)) {
    throw new Rule5UnknownClinicalReasonCodeError('RULE5_UNKNOWN_CLINICAL_REASON_CODE');
  }
}

export type Rule5RegistryValidationFailureCode =
  | 'RULE5_REGISTRY_INVALID_DOCUMENT'
  | 'RULE5_REGISTRY_INVALID_VERSION'
  | 'RULE5_REGISTRY_MISSING_REGISTRY_VERSION'
  | 'RULE5_REGISTRY_DUPLICATE_CODE'
  | 'RULE5_REGISTRY_WRONG_NAMESPACE'
  | 'RULE5_REGISTRY_MISSING_MANDATORY_FIELD'
  | 'RULE5_REGISTRY_WHITESPACE_ONLY_FIELD'
  | 'RULE5_REGISTRY_EXECUTABLE_NOT_ALLOWED'
  | 'RULE5_REGISTRY_FORBIDDEN_CODE_PREFIX'
  | 'RULE5_REGISTRY_UNEXPECTED_FIELD'
  | 'RULE5_REGISTRY_CODE_NOT_IN_CANONICAL_SET'
  | 'RULE5_REGISTRY_INCOMPLETE_MEMBERSHIP'
  | 'RULE5_REGISTRY_WRONG_OWNER_DECISION_ANCHOR'
  | 'RULE5_REGISTRY_CANONICAL_ENTRY_MISMATCH'
  | 'RULE5_REGISTRY_ENTRY_ORDER_NOT_CANONICAL';

export class Rule5RegistryValidationError extends Error {
  readonly failureCode: Rule5RegistryValidationFailureCode;

  constructor(failureCode: Rule5RegistryValidationFailureCode, detail?: string) {
    super(detail ? `${failureCode}: ${detail}` : failureCode);
    this.name = 'Rule5RegistryValidationError';
    this.failureCode = failureCode;
  }
}

const ROOT_KEYS = new Set(['registryVersion', 'entries']);
const ENTRY_KEYS = new Set([
  'code',
  'namespace',
  'meaning',
  'executable',
  'introducedInVersion',
  'ownerDecisionAnchor',
]);

const MANDATORY_ENTRY_STRING_FIELDS = [
  'code',
  'namespace',
  'meaning',
  'introducedInVersion',
  'ownerDecisionAnchor',
] as const;

const FORBIDDEN_DOCUMENT_CODES = new Set(['R5_ADVERSE_EVENT_REPORTED']);

const ALLOWED_INTRODUCED_VERSIONS = new Set<string>([
  RULE5_REASON_REGISTRY_VERSION_V1,
  RULE5_REASON_REGISTRY_VERSION,
]);

const ALLOWED_OWNER_ANCHORS = new Set(['OD-R5-M0-014', 'OD-R5-M0-015', 'OD-R5-M0-016']);

function assertPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function rejectUnexpectedKeys(
  obj: Record<string, unknown>,
  allowed: Set<string>,
  failure: Rule5RegistryValidationFailureCode,
): void {
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) {
      throw new Rule5RegistryValidationError(failure, key);
    }
  }
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (value === undefined || value === null || value === '') {
    throw new Rule5RegistryValidationError('RULE5_REGISTRY_MISSING_MANDATORY_FIELD', field);
  }
  if (typeof value !== 'string') {
    throw new Rule5RegistryValidationError('RULE5_REGISTRY_INVALID_DOCUMENT', field);
  }
  if (value.trim() === '') {
    throw new Rule5RegistryValidationError('RULE5_REGISTRY_WHITESPACE_ONLY_FIELD', field);
  }
  return value;
}

function assertEntryMatchesCanonical(entry: Rule5ClinicalReasonRegistryEntry): void {
  const canonical = RULE5_CANONICAL_ENTRY_BY_CODE[entry.code as Rule5ClinicalReasonCode];
  if (!canonical) {
    throw new Rule5RegistryValidationError('RULE5_REGISTRY_CODE_NOT_IN_CANONICAL_SET', entry.code);
  }
  if (entry.namespace !== canonical.namespace) {
    throw new Rule5RegistryValidationError('RULE5_REGISTRY_CANONICAL_ENTRY_MISMATCH', 'namespace');
  }
  if (entry.meaning !== canonical.meaning) {
    throw new Rule5RegistryValidationError('RULE5_REGISTRY_CANONICAL_ENTRY_MISMATCH', 'meaning');
  }
  if (entry.executable !== canonical.executable) {
    throw new Rule5RegistryValidationError('RULE5_REGISTRY_CANONICAL_ENTRY_MISMATCH', 'executable');
  }
  if (entry.introducedInVersion !== canonical.introducedInVersion) {
    throw new Rule5RegistryValidationError(
      'RULE5_REGISTRY_CANONICAL_ENTRY_MISMATCH',
      'introducedInVersion',
    );
  }
  if (entry.ownerDecisionAnchor !== canonical.ownerDecisionAnchor) {
    throw new Rule5RegistryValidationError(
      'RULE5_REGISTRY_WRONG_OWNER_DECISION_ANCHOR',
      entry.code,
    );
  }
}

function parseEntry(raw: unknown): Rule5ClinicalReasonRegistryEntry {
  if (!assertPlainObject(raw)) {
    throw new Rule5RegistryValidationError('RULE5_REGISTRY_INVALID_DOCUMENT');
  }
  rejectUnexpectedKeys(raw, ENTRY_KEYS, 'RULE5_REGISTRY_UNEXPECTED_FIELD');

  if (raw.executable === undefined || raw.executable === null) {
    throw new Rule5RegistryValidationError('RULE5_REGISTRY_MISSING_MANDATORY_FIELD', 'executable');
  }

  const code = requireNonEmptyString(raw.code, 'code');
  if (code.startsWith('RULE5_') || code.startsWith('PHASE1_')) {
    throw new Rule5RegistryValidationError('RULE5_REGISTRY_FORBIDDEN_CODE_PREFIX', code);
  }
  if (FORBIDDEN_DOCUMENT_CODES.has(code)) {
    throw new Rule5RegistryValidationError('RULE5_REGISTRY_CODE_NOT_IN_CANONICAL_SET', code);
  }
  if (!isKnownRule5ClinicalReasonCode(code)) {
    throw new Rule5RegistryValidationError('RULE5_REGISTRY_CODE_NOT_IN_CANONICAL_SET', code);
  }

  for (const field of MANDATORY_ENTRY_STRING_FIELDS) {
    if (field === 'code') continue;
    requireNonEmptyString(raw[field], field);
  }

  const namespace = String(raw.namespace);
  if (namespace !== RULE5_CLINICAL_NAMESPACE) {
    throw new Rule5RegistryValidationError('RULE5_REGISTRY_WRONG_NAMESPACE', namespace);
  }

  if (raw.executable !== false) {
    throw new Rule5RegistryValidationError('RULE5_REGISTRY_EXECUTABLE_NOT_ALLOWED', code);
  }

  const introducedInVersion = String(raw.introducedInVersion);
  if (!ALLOWED_INTRODUCED_VERSIONS.has(introducedInVersion)) {
    throw new Rule5RegistryValidationError('RULE5_REGISTRY_INVALID_VERSION', introducedInVersion);
  }

  const ownerDecisionAnchor = String(raw.ownerDecisionAnchor);
  if (!ALLOWED_OWNER_ANCHORS.has(ownerDecisionAnchor)) {
    throw new Rule5RegistryValidationError(
      'RULE5_REGISTRY_MISSING_MANDATORY_FIELD',
      'ownerDecisionAnchor',
    );
  }

  const entry: Rule5ClinicalReasonRegistryEntry = {
    code,
    namespace: 'R5',
    meaning: String(raw.meaning),
    executable: false,
    introducedInVersion:
      introducedInVersion as Rule5ClinicalReasonRegistryEntry['introducedInVersion'],
    ownerDecisionAnchor:
      ownerDecisionAnchor as Rule5ClinicalReasonRegistryEntry['ownerDecisionAnchor'],
  };

  assertEntryMatchesCanonical(entry);
  return entry;
}

/**
 * Fail-closed parse and validate a registry document against canonical TypeScript entries.
 * Only **v2** is accepted as the current canonical registry version.
 */
export function validateRule5ClinicalReasonRegistryDocument(
  raw: unknown,
): Rule5ClinicalReasonRegistry {
  if (raw === null) {
    throw new Rule5RegistryValidationError('RULE5_REGISTRY_INVALID_DOCUMENT');
  }
  if (Array.isArray(raw)) {
    throw new Rule5RegistryValidationError('RULE5_REGISTRY_INVALID_DOCUMENT');
  }
  if (!assertPlainObject(raw)) {
    throw new Rule5RegistryValidationError('RULE5_REGISTRY_INVALID_DOCUMENT');
  }
  rejectUnexpectedKeys(raw, ROOT_KEYS, 'RULE5_REGISTRY_UNEXPECTED_FIELD');

  if (
    raw.registryVersion === undefined ||
    raw.registryVersion === null ||
    raw.registryVersion === ''
  ) {
    throw new Rule5RegistryValidationError('RULE5_REGISTRY_MISSING_REGISTRY_VERSION');
  }
  if (typeof raw.registryVersion === 'string' && raw.registryVersion.trim() === '') {
    throw new Rule5RegistryValidationError(
      'RULE5_REGISTRY_WHITESPACE_ONLY_FIELD',
      'registryVersion',
    );
  }
  if (raw.registryVersion !== RULE5_REASON_REGISTRY_VERSION) {
    throw new Rule5RegistryValidationError(
      'RULE5_REGISTRY_INVALID_VERSION',
      String(raw.registryVersion),
    );
  }

  if (!Array.isArray(raw.entries)) {
    throw new Rule5RegistryValidationError('RULE5_REGISTRY_INVALID_DOCUMENT');
  }

  const seen = new Set<string>();
  const entries: Rule5ClinicalReasonRegistryEntry[] = [];
  for (const item of raw.entries) {
    const entry = parseEntry(item);
    if (seen.has(entry.code)) {
      throw new Rule5RegistryValidationError('RULE5_REGISTRY_DUPLICATE_CODE', entry.code);
    }
    seen.add(entry.code);
    entries.push(entry);
  }

  if (seen.size !== RULE5_CLINICAL_REASON_CODES.length) {
    throw new Rule5RegistryValidationError('RULE5_REGISTRY_INCOMPLETE_MEMBERSHIP');
  }
  for (const code of RULE5_CLINICAL_REASON_CODES) {
    if (!seen.has(code)) {
      throw new Rule5RegistryValidationError('RULE5_REGISTRY_INCOMPLETE_MEMBERSHIP', code);
    }
  }

  const canonicalCodes = RULE5_CANONICAL_CLINICAL_REASON_REGISTRY.entries.map((e) => e.code);
  const documentCodes = entries.map((e) => e.code);
  if (documentCodes.join('\0') !== canonicalCodes.join('\0')) {
    throw new Rule5RegistryValidationError('RULE5_REGISTRY_ENTRY_ORDER_NOT_CANONICAL');
  }

  return RULE5_CANONICAL_CLINICAL_REASON_REGISTRY;
}
