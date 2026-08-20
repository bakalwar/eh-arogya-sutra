import {
  MAX_ASSERTED_VALUE_CHARS,
  MAX_ELIGIBLE_TEXT_CHARS,
  MAX_SOURCE_REF_CHARS,
  MAX_UNIT_TEXT_CHARS,
  NORMALIZER_FORBIDDEN_INPUT_KEYS,
  type NormalizerFailureCode,
} from './types.js';

const ALLOWED_CONTROLS = new Set([0x09, 0x0a, 0x0d]);
const ZERO_WIDTH = new Set([
  0xfeff, 0x200b, 0x200c, 0x200d, 0x2060, 0x180e, 0x00ad, 0x2061, 0x2062, 0x2063, 0x2064,
]);

const SHA256_HEX = /^[a-f0-9]{64}$/;

function isHighSurrogate(code: number): boolean {
  return code >= 0xd800 && code <= 0xdbff;
}

function isLowSurrogate(code: number): boolean {
  return code >= 0xdc00 && code <= 0xdfff;
}

export function fail(reason: NormalizerFailureCode): {
  ok: false;
  drafts: readonly [];
  reason: NormalizerFailureCode;
} {
  return { ok: false, drafts: [], reason };
}

/** Refuse malformed Unicode. Does not collapse whitespace. */
export function assertNfcTransportString(
  text: string,
  maxChars: number,
): NormalizerFailureCode | null {
  if (typeof text !== 'string') return 'MALFORMED_UNICODE';
  if (text.normalize('NFC') !== text) return 'MALFORMED_UNICODE';
  if (text.length > maxChars) return 'SOURCE_TOO_LARGE';
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (isHighSurrogate(code)) {
      const next = text.charCodeAt(i + 1);
      if (!isLowSurrogate(next)) return 'MALFORMED_UNICODE';
      i += 1;
      continue;
    }
    if (isLowSurrogate(code)) return 'MALFORMED_UNICODE';
    if (ZERO_WIDTH.has(code)) return 'MALFORMED_UNICODE';
    if (code <= 0x1f || code === 0x7f || (code >= 0x80 && code <= 0x9f)) {
      if (!ALLOWED_CONTROLS.has(code)) return 'MALFORMED_UNICODE';
    }
  }
  return null;
}

export function assertSha256Hex(value: unknown): boolean {
  return typeof value === 'string' && SHA256_HEX.test(value);
}

export function rejectForbiddenKeys(input: Record<string, unknown>): NormalizerFailureCode | null {
  const forbidden = new Set<string>(NORMALIZER_FORBIDDEN_INPUT_KEYS);
  for (const key of Object.keys(input)) {
    if (forbidden.has(key)) return 'INVALID_INPUT';
  }
  return null;
}

export function assertExactKeys(
  input: Record<string, unknown>,
  allowed: readonly string[],
): NormalizerFailureCode | null {
  const allow = new Set(allowed);
  for (const key of Object.keys(input)) {
    if (!allow.has(key)) return 'INVALID_INPUT';
  }
  for (const key of allowed) {
    if (!(key in input) && !key.endsWith('?')) {
      /* required keys listed without optional marker handled by callers */
    }
  }
  return null;
}

export function validateUnitText(value: unknown): NormalizerFailureCode | null {
  if (typeof value !== 'string' || value.length < 1) {
    return 'INVALID_INPUT';
  }
  return assertNfcTransportString(value, MAX_UNIT_TEXT_CHARS);
}

export function validateOptionalAssertedValue(value: unknown): NormalizerFailureCode | null {
  if (value === undefined) return null;
  if (typeof value !== 'string' || value.length < 1) {
    return 'INVALID_INPUT';
  }
  return assertNfcTransportString(value, MAX_ASSERTED_VALUE_CHARS);
}

export function validateSourceRef(value: unknown): NormalizerFailureCode | null {
  if (typeof value !== 'string' || value.length < 1) {
    return 'INVALID_INPUT';
  }
  return assertNfcTransportString(value, MAX_SOURCE_REF_CHARS);
}

export { MAX_ELIGIBLE_TEXT_CHARS };
