import {
  DISEASE_ID_PREFIX,
  MAPPED_ID_PREFIX,
  MAX_CANDIDATE_IDS,
  MAX_FIELD_LENGTH,
  PROHIBITED_RECORD_FIELDS,
  RAW_MAPPED_REF_PREFIX,
} from './constants.js';
import { DISPOSITION_PRIMARY_FIELDS } from './schemaAllowlists.js';
import {
  DiseaseIdentityError,
  MALFORMED_INPUT,
  PROHIBITED_FIELD,
  UNKNOWN_FIELD,
} from './errors.js';
import { isValidPrefixedDigestId } from './canonicalId.js';

const PROHIBITED_KEY_SET = new Set<string>([
  ...(PROHIBITED_RECORD_FIELDS as readonly string[]),
  ...(DISPOSITION_PRIMARY_FIELDS as readonly string[]),
]);

export function assertNonNegativeSafeInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, `${label} must be a non-negative safe integer`);
  }
  return value;
}

export function assertSha256Hex(value: unknown, label: string): string {
  const hex = assertBoundedString(value, label);
  if (!/^[0-9a-f]{64}$/.test(hex)) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, `${label} must be 64 lowercase SHA-256 hex`);
  }
  return hex;
}

export function assertSafeArtifactFilename(value: unknown, label: string): string {
  const name = assertBoundedString(value, label);
  if (name.length === 0 || name.includes('..') || name.includes('/') || name.includes('\\')) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, `${label} must be a safe logical filename`);
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name)) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, `${label} must be a safe logical filename`);
  }
  return name;
}

export function assertPositiveSafeInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, `${label} must be a positive safe integer`);
  }
  return value;
}

export function assertBoundedString(value: unknown, label: string): string {
  if (typeof value !== 'string') {
    throw new DiseaseIdentityError(MALFORMED_INPUT, `${label} must be a string`);
  }
  if (value.length > MAX_FIELD_LENGTH) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, `${label} exceeds ${MAX_FIELD_LENGTH}`);
  }
  return value;
}

export function assertExactAllowlistedKeys(
  record: Record<string, unknown>,
  allowed: readonly string[],
  label: string,
): void {
  const allowedSet = new Set<string>(allowed);
  for (const key of Object.keys(record)) {
    if (!allowedSet.has(key)) {
      throw new DiseaseIdentityError(UNKNOWN_FIELD, `Unknown field ${label}.${key}`);
    }
  }
}

export function assertNoProhibitedFields(
  value: unknown,
  path = '',
  depth = 0,
  nodes = { count: 0 },
  seen: WeakSet<object> = new WeakSet(),
): void {
  if (depth > 32) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'Validation depth exceeded');
  }
  nodes.count += 1;
  if (nodes.count > 4096) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'Validation node limit exceeded');
  }

  if (value === null || typeof value !== 'object') {
    return;
  }

  if (seen.has(value as object)) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'Cyclic structure rejected');
  }
  seen.add(value as object);

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      assertNoProhibitedFields(item, `${path}[${index}]`, depth + 1, nodes, seen);
    });
    return;
  }

  const record = value as Record<string, unknown>;
  for (const [key, child] of Object.entries(record)) {
    const fullPath = path ? `${path}.${key}` : key;
    if (PROHIBITED_KEY_SET.has(key)) {
      throw new DiseaseIdentityError(PROHIBITED_FIELD, `Prohibited field: ${fullPath}`);
    }
    assertNoProhibitedFields(child, fullPath, depth + 1, nodes, seen);
  }
}

export function assertPlainObject(
  value: unknown,
  label: string,
): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, `${label} must be a plain object`);
  }
}

export function assertStringArray(value: unknown, label: string, maxLength: number): string[] {
  if (!Array.isArray(value)) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, `${label} must be an array`);
  }
  if (value.length > maxLength) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, `${label} exceeds max length ${maxLength}`);
  }
  return value.map((item, index) => assertBoundedString(item, `${label}[${index}]`));
}

export function assertSortedUniqueStrings(values: readonly string[], label: string): void {
  const seen = new Set<string>();
  for (let i = 0; i < values.length; i += 1) {
    const current = values[i];
    if (seen.has(current)) {
      throw new DiseaseIdentityError(MALFORMED_INPUT, `${label} contains duplicate ${current}`);
    }
    seen.add(current);
    if (i > 0 && values[i - 1].localeCompare(current) >= 0) {
      throw new DiseaseIdentityError(MALFORMED_INPUT, `${label} must be strictly ascending`);
    }
  }
}

export function assertCandidateLegacyDbIds(value: unknown, label: string): number[] {
  if (!Array.isArray(value)) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, `${label} must be an array`);
  }
  if (value.length > MAX_CANDIDATE_IDS) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, `${label} exceeds ${MAX_CANDIDATE_IDS}`);
  }
  const parsed = value.map((item, index) => assertPositiveSafeInteger(item, `${label}[${index}]`));
  const seen = new Set<number>();
  for (let i = 0; i < parsed.length; i += 1) {
    const current = parsed[i];
    if (seen.has(current)) {
      throw new DiseaseIdentityError(MALFORMED_INPUT, `${label} contains duplicate ${current}`);
    }
    seen.add(current);
    if (i > 0 && current <= parsed[i - 1]) {
      throw new DiseaseIdentityError(MALFORMED_INPUT, `${label} must be strictly ascending`);
    }
  }
  return parsed;
}

export function assertLinkedDiseaseIds(value: unknown): string[] {
  const ids = assertStringArray(value, 'linkedEhas2DiseaseIds', MAX_CANDIDATE_IDS);
  for (const id of ids) {
    if (!isValidPrefixedDigestId(id, DISEASE_ID_PREFIX)) {
      throw new DiseaseIdentityError(MALFORMED_INPUT, `Invalid linkedEhas2DiseaseIds entry ${id}`);
    }
  }
  assertSortedUniqueStrings(ids, 'linkedEhas2DiseaseIds');
  return ids;
}

export function assertMappedIndexRefs(value: unknown): string[] {
  const ids = assertStringArray(value, 'mappedIndexRefs', 64);
  for (const id of ids) {
    if (!isValidPrefixedDigestId(id, MAPPED_ID_PREFIX)) {
      throw new DiseaseIdentityError(MALFORMED_INPUT, `Invalid mappedIndexRefs entry ${id}`);
    }
  }
  assertSortedUniqueStrings(ids, 'mappedIndexRefs');
  return ids;
}

export function assertFingerprintHex(value: unknown): string {
  const fingerprint = assertBoundedString(value, 'recordFingerprint');
  if (!/^[0-9a-f]{64}$/.test(fingerprint)) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'recordFingerprint must be 64 lowercase hex');
  }
  return fingerprint;
}

export function assertQuarantineFlags(value: unknown): string[] {
  const flags = assertStringArray(value, 'quarantineFlags', 32);
  assertSortedUniqueStrings(flags, 'quarantineFlags');
  return flags;
}

export function isValidRawMappedReferenceId(value: string): boolean {
  return isValidPrefixedDigestId(value, RAW_MAPPED_REF_PREFIX);
}

export function hasQuarantineFlag(flags: readonly string[], flag: string): boolean {
  return flags.includes(flag);
}
