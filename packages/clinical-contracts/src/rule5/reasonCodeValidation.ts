import {
  RULE5_CLINICAL_REASON_CODES,
  RULE5_KNOWN_CLINICAL_REASON_CODE_SET,
  type Rule5ClinicalReasonCode,
  type Rule5ClinicalReasonRegistry,
  type Rule5ClinicalReasonRegistryEntry,
} from './reasonCodes.js';
import { RULE5_CLINICAL_NAMESPACE, RULE5_REASON_REGISTRY_VERSION } from './version.js';

export type Rule5UnknownClinicalReasonCodeFailure = 'RULE5_UNKNOWN_CLINICAL_REASON_CODE';

export class Rule5UnknownClinicalReasonCodeError extends Error {
  readonly failureCode: Rule5UnknownClinicalReasonCodeFailure;

  constructor(failureCode: Rule5UnknownClinicalReasonCodeFailure) {
    super(failureCode);
    this.name = 'Rule5UnknownClinicalReasonCodeError';
    this.failureCode = failureCode;
  }
}

/** Fail-closed: reject codes outside the canonical 21-code clinical register. */
export function assertKnownRule5ClinicalReasonCode(
  code: string,
): asserts code is Rule5ClinicalReasonCode {
  if (!RULE5_KNOWN_CLINICAL_REASON_CODE_SET.has(code)) {
    throw new Rule5UnknownClinicalReasonCodeError('RULE5_UNKNOWN_CLINICAL_REASON_CODE');
  }
}

export type Rule5RegistryValidationFailureCode =
  | 'RULE5_REGISTRY_INVALID_DOCUMENT'
  | 'RULE5_REGISTRY_INVALID_VERSION'
  | 'RULE5_REGISTRY_DUPLICATE_CODE'
  | 'RULE5_REGISTRY_WRONG_NAMESPACE'
  | 'RULE5_REGISTRY_MISSING_MANDATORY_FIELD'
  | 'RULE5_REGISTRY_EXECUTABLE_NOT_ALLOWED'
  | 'RULE5_REGISTRY_FORBIDDEN_CODE_PREFIX'
  | 'RULE5_REGISTRY_UNEXPECTED_FIELD'
  | 'RULE5_REGISTRY_CODE_NOT_IN_CANONICAL_SET'
  | 'RULE5_REGISTRY_INCOMPLETE_MEMBERSHIP';

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

const MANDATORY_ENTRY_FIELDS = [
  'code',
  'namespace',
  'meaning',
  'executable',
  'introducedInVersion',
  'ownerDecisionAnchor',
] as const;

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

function parseEntry(raw: unknown): Rule5ClinicalReasonRegistryEntry {
  if (!assertPlainObject(raw)) {
    throw new Rule5RegistryValidationError('RULE5_REGISTRY_INVALID_DOCUMENT');
  }
  rejectUnexpectedKeys(raw, ENTRY_KEYS, 'RULE5_REGISTRY_UNEXPECTED_FIELD');

  for (const field of MANDATORY_ENTRY_FIELDS) {
    if (raw[field] === undefined || raw[field] === null || raw[field] === '') {
      throw new Rule5RegistryValidationError('RULE5_REGISTRY_MISSING_MANDATORY_FIELD', field);
    }
  }

  const code = String(raw.code);
  if (code.startsWith('RULE5_') || code.startsWith('PHASE1_')) {
    throw new Rule5RegistryValidationError('RULE5_REGISTRY_FORBIDDEN_CODE_PREFIX', code);
  }
  if (!RULE5_KNOWN_CLINICAL_REASON_CODE_SET.has(code)) {
    throw new Rule5RegistryValidationError('RULE5_REGISTRY_CODE_NOT_IN_CANONICAL_SET', code);
  }

  if (raw.namespace !== RULE5_CLINICAL_NAMESPACE) {
    throw new Rule5RegistryValidationError('RULE5_REGISTRY_WRONG_NAMESPACE', String(raw.namespace));
  }

  if (raw.executable !== false) {
    throw new Rule5RegistryValidationError('RULE5_REGISTRY_EXECUTABLE_NOT_ALLOWED', code);
  }

  if (raw.introducedInVersion !== RULE5_REASON_REGISTRY_VERSION) {
    throw new Rule5RegistryValidationError(
      'RULE5_REGISTRY_INVALID_VERSION',
      String(raw.introducedInVersion),
    );
  }

  const anchor = String(raw.ownerDecisionAnchor);
  if (anchor !== 'OD-R5-M0-014' && anchor !== 'OD-R5-M0-015') {
    throw new Rule5RegistryValidationError(
      'RULE5_REGISTRY_MISSING_MANDATORY_FIELD',
      'ownerDecisionAnchor',
    );
  }

  return {
    code: code as Rule5ClinicalReasonCode,
    namespace: 'R5',
    meaning: String(raw.meaning),
    executable: false,
    introducedInVersion: RULE5_REASON_REGISTRY_VERSION,
    ownerDecisionAnchor: anchor,
  };
}

/** Fail-closed parse and validate a registry document (fixture or in-memory). */
export function validateRule5ClinicalReasonRegistryDocument(
  raw: unknown,
): Rule5ClinicalReasonRegistry {
  if (!assertPlainObject(raw)) {
    throw new Rule5RegistryValidationError('RULE5_REGISTRY_INVALID_DOCUMENT');
  }
  rejectUnexpectedKeys(raw, ROOT_KEYS, 'RULE5_REGISTRY_UNEXPECTED_FIELD');

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

  entries.sort((a, b) => a.code.localeCompare(b.code));

  return {
    registryVersion: RULE5_REASON_REGISTRY_VERSION,
    entries,
  };
}
