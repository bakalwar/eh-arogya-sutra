import { createHash } from 'node:crypto';

/** @typedef {'UTF8_VALID' | 'UTF8_INVALID'} Utf8Status */
/** @typedef {'BOM_NONE' | 'BOM_UTF8_PRESENT'} BomStatus */
/** @typedef {'EOL_LF_ONLY' | 'EOL_CRLF_ONLY' | 'EOL_MIXED' | 'EOL_NONE'} EolClass */
/** @typedef {'PRESENT' | 'ABSENT'} TerminalNewlineStatus */
/** @typedef {'PASS' | 'BV-ENC-INVALID'} InterpretiveEncoding */

export const SHA256_V1_PREFIX = 'sha256:';
export const NORMALIZATION_POLICY_V1 = 'NO_IMPLICIT_TRANSFORMATION_V1';

export const BV_ENC_INVALID = 'BV-ENC-INVALID';
export const BV_RAW_HASH_MISMATCH = 'BV-RAW-HASH-MISMATCH';
export const BV_NORM_HASH_MISMATCH = 'BV-NORM-HASH-MISMATCH';
export const BV_NORM_POLICY_MISMATCH = 'BV-NORM-POLICY-MISMATCH';

const EXPECTED_DIGEST_RE = /^sha256:[0-9a-f]{64}$/;
const UTF8_BOM = [0xef, 0xbb, 0xbf];

/**
 * @param {unknown} input
 * @returns {Uint8Array}
 */
function toByteCopy(input) {
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(input)) {
    return Uint8Array.from(input);
  }
  if (input instanceof Uint8Array) {
    return Uint8Array.from(input);
  }
  throw new TypeError('Expected Buffer or Uint8Array');
}

/**
 * @param {unknown} expectedDigest
 * @returns {string}
 */
function assertExpectedDigest(expectedDigest) {
  if (typeof expectedDigest !== 'string') {
    throw new TypeError('Expected digest must be a string');
  }
  if (!EXPECTED_DIGEST_RE.test(expectedDigest)) {
    throw new TypeError('Malformed expected digest');
  }
  return expectedDigest;
}

/**
 * @param {Uint8Array} bytes
 * @returns {Utf8Status}
 */
function validateUtf8(bytes) {
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return 'UTF8_VALID';
  } catch {
    return 'UTF8_INVALID';
  }
}

/**
 * @param {Uint8Array} bytes
 * @returns {BomStatus}
 */
function detectBom(bytes) {
  if (
    bytes.length >= 3 &&
    bytes[0] === UTF8_BOM[0] &&
    bytes[1] === UTF8_BOM[1] &&
    bytes[2] === UTF8_BOM[2]
  ) {
    return 'BOM_UTF8_PRESENT';
  }
  return 'BOM_NONE';
}

/**
 * @param {Uint8Array} bytes
 * @returns {{
 *   hasCrlf: boolean;
 *   hasLfOnly: boolean;
 *   loneCrObserved: boolean;
 *   terminalNewline: TerminalNewlineStatus;
 * }}
 */
function scanEol(bytes) {
  let hasCrlf = false;
  let hasLfOnly = false;
  let loneCrObserved = false;
  let i = 0;
  while (i < bytes.length) {
    if (bytes[i] === 0x0d) {
      if (i + 1 < bytes.length && bytes[i + 1] === 0x0a) {
        hasCrlf = true;
        i += 2;
        continue;
      }
      loneCrObserved = true;
      i += 1;
      continue;
    }
    if (bytes[i] === 0x0a) {
      hasLfOnly = true;
      i += 1;
      continue;
    }
    i += 1;
  }

  let terminalNewline = 'ABSENT';
  if (bytes.length > 0) {
    const last = bytes[bytes.length - 1];
    if (last === 0x0a) {
      terminalNewline = 'PRESENT';
    } else if (last === 0x0d) {
      terminalNewline = 'PRESENT';
    }
  }

  return { hasCrlf, hasLfOnly, loneCrObserved, terminalNewline };
}

/**
 * @param {{ hasCrlf: boolean; hasLfOnly: boolean; loneCrObserved: boolean }} scan
 * @returns {EolClass}
 */
function classifyEol(scan) {
  const styles = Number(scan.hasCrlf) + Number(scan.hasLfOnly) + Number(scan.loneCrObserved);
  if (styles === 0) {
    return 'EOL_NONE';
  }
  if (styles > 1) {
    return 'EOL_MIXED';
  }
  if (scan.hasCrlf) {
    return 'EOL_CRLF_ONLY';
  }
  if (scan.hasLfOnly) {
    return 'EOL_LF_ONLY';
  }
  return 'EOL_NONE';
}

/**
 * @param {unknown} bytes
 * @returns {string}
 */
export function computeSha256V1(bytes) {
  const copy = toByteCopy(bytes);
  const hex = createHash('sha256').update(copy).digest('hex');
  return `${SHA256_V1_PREFIX}${hex}`;
}

/**
 * @param {unknown} bytes
 * @returns {{
 *   byteLength: number;
 *   utf8: Utf8Status;
 *   bom: BomStatus;
 *   eol: EolClass;
 *   loneCrObserved: boolean;
 *   terminalNewline: TerminalNewlineStatus;
 *   interpretiveEncoding: InterpretiveEncoding;
 * }}
 */
export function inspectByteCharacteristics(bytes) {
  const copy = toByteCopy(bytes);
  const utf8 = validateUtf8(copy);
  const bom = detectBom(copy);
  const eolScan = scanEol(copy);
  const eol = classifyEol(eolScan);
  const interpretiveEncoding = utf8 === 'UTF8_VALID' ? 'PASS' : BV_ENC_INVALID;

  return {
    byteLength: copy.length,
    utf8,
    bom,
    eol,
    loneCrObserved: eolScan.loneCrObserved,
    terminalNewline: eolScan.terminalNewline,
    interpretiveEncoding,
  };
}

/**
 * @param {unknown} bytes
 * @param {unknown} expectedDigest
 * @returns {{
 *   outcome: 'PASS';
 *   sha256V1: string;
 *   inspection: ReturnType<typeof inspectByteCharacteristics>;
 * } | {
 *   outcome: 'FAIL';
 *   bvCode: typeof BV_RAW_HASH_MISMATCH;
 *   sha256V1: string;
 *   expectedDigest: string;
 *   inspection: ReturnType<typeof inspectByteCharacteristics>;
 * }}
 */
export function compareExpectedRawHash(bytes, expectedDigest) {
  const expected = assertExpectedDigest(expectedDigest);
  const copy = toByteCopy(bytes);
  const sha256V1 = computeSha256V1(copy);
  const inspection = inspectByteCharacteristics(copy);
  if (sha256V1 === expected) {
    return { outcome: 'PASS', sha256V1, inspection };
  }
  return {
    outcome: 'FAIL',
    bvCode: BV_RAW_HASH_MISMATCH,
    sha256V1,
    expectedDigest: expected,
    inspection,
  };
}

/**
 * @param {unknown} bytes
 * @param {unknown} expectedDigest
 * @returns {{
 *   outcome: 'PASS';
 *   sha256V1: string;
 *   inspection: ReturnType<typeof inspectByteCharacteristics>;
 * } | {
 *   outcome: 'FAIL';
 *   bvCode: typeof BV_NORM_HASH_MISMATCH;
 *   sha256V1: string;
 *   expectedDigest: string;
 *   inspection: ReturnType<typeof inspectByteCharacteristics>;
 * }}
 */
export function compareExpectedNormalizedHash(bytes, expectedDigest) {
  const expected = assertExpectedDigest(expectedDigest);
  const copy = toByteCopy(bytes);
  const sha256V1 = computeSha256V1(copy);
  const inspection = inspectByteCharacteristics(copy);
  if (sha256V1 === expected) {
    return { outcome: 'PASS', sha256V1, inspection };
  }
  return {
    outcome: 'FAIL',
    bvCode: BV_NORM_HASH_MISMATCH,
    sha256V1,
    expectedDigest: expected,
    inspection,
  };
}

/**
 * @param {unknown} actual
 * @param {unknown} expected
 * @returns {{ outcome: 'PASS' } | { outcome: 'FAIL'; bvCode: typeof BV_NORM_POLICY_MISMATCH }}
 */
export function verifyNormalizationPolicyVersion(actual, expected) {
  if (typeof actual !== 'string' || typeof expected !== 'string') {
    throw new TypeError('Policy version arguments must be strings');
  }
  if (actual === NORMALIZATION_POLICY_V1 && expected === NORMALIZATION_POLICY_V1) {
    return { outcome: 'PASS' };
  }
  return { outcome: 'FAIL', bvCode: BV_NORM_POLICY_MISMATCH };
}
