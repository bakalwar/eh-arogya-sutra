import { BV_ENC_INVALID, inspectByteCharacteristics } from './verifyCore.mjs';

const MAX_INPUT_BYTES = 262144;

const LENGTH_UNITS = new Set(['BYTE', 'UTF8_CODEPOINT', 'UTF16_CODE_UNIT', 'LINE_COUNT', 'ABSENT']);

const UTF8_DECODER = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });

/**
 * @param {unknown} input
 * @returns {Uint8Array}
 */
function copyBytes(input) {
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(input)) {
    return Uint8Array.from(input);
  }
  if (input instanceof Uint8Array) {
    return Uint8Array.from(input);
  }
  throw new TypeError('Expected Buffer or Uint8Array');
}

/**
 * @param {unknown} config
 * @returns {{ lengthUnit: string }}
 */
function validateConfig(config) {
  if (typeof config !== 'object' || config === null || Array.isArray(config)) {
    throw new TypeError('Malformed parser config');
  }
  const proto = Object.getPrototypeOf(config);
  if (proto !== Object.prototype && proto !== null) {
    throw new TypeError('Malformed parser config');
  }
  const ownKeys = Reflect.ownKeys(config);
  if (ownKeys.length !== 1 || ownKeys[0] !== 'lengthUnit') {
    throw new TypeError('Malformed parser config');
  }
  if (!Object.hasOwn(config, 'lengthUnit')) {
    throw new TypeError('Malformed parser config');
  }
  const descriptor = Object.getOwnPropertyDescriptor(config, 'lengthUnit');
  if (
    descriptor === undefined ||
    descriptor.get !== undefined ||
    descriptor.set !== undefined ||
    !Object.prototype.hasOwnProperty.call(descriptor, 'value')
  ) {
    throw new TypeError('Malformed parser config');
  }
  const { value: lengthUnit } = descriptor;
  if (!LENGTH_UNITS.has(lengthUnit)) {
    throw new TypeError('Malformed parser config');
  }
  return { lengthUnit };
}

/**
 * @param {string} decoded
 * @returns {string[]}
 */
function splitLogicalLines(decoded) {
  const lines = [];
  let start = 0;
  let i = 0;
  const n = decoded.length;

  while (i < n) {
    const c = decoded[i];
    if (c === '\r') {
      if (i + 1 < n && decoded[i + 1] === '\n') {
        lines.push(decoded.slice(start, i));
        i += 2;
        start = i;
        continue;
      }
      lines.push(decoded.slice(start, i));
      i += 1;
      start = i;
      continue;
    }
    if (c === '\n') {
      lines.push(decoded.slice(start, i));
      i += 1;
      start = i;
      continue;
    }
    i += 1;
  }

  if (start < n) {
    lines.push(decoded.slice(start));
  } else if (lines.length === 0) {
    lines.push('');
  }

  return lines;
}

/**
 * @param {number} lineIndex1Based
 * @param {string} lineText
 * @returns {string}
 */
function comparisonView(lineIndex1Based, lineText) {
  if (lineIndex1Based === 1 && lineText.length > 0 && lineText.charCodeAt(0) === 0xfeff) {
    return lineText.slice(1);
  }
  return lineText;
}

/**
 * @param {string} view
 * @returns {boolean}
 */
function isDiscoveredHeaderLine(view) {
  return view.startsWith('MED=') && view.length >= 5 && view.length <= 256;
}

/**
 * @param {string} decoded
 * @param {boolean} bomPresent
 * @returns {string}
 */
function decodedForBomAwareMetrics(decoded, bomPresent) {
  if (bomPresent && (decoded.length === 0 || decoded.charCodeAt(0) !== 0xfeff)) {
    return `\uFEFF${decoded}`;
  }
  return decoded;
}

/**
 * @param {string} decoded
 * @param {boolean} bomPresent
 * @returns {number}
 */
function countUtf8CodePoints(decoded, bomPresent) {
  const text = decodedForBomAwareMetrics(decoded, bomPresent);
  return Array.from(text).length;
}

/**
 * @param {Uint8Array} copy
 * @param {string} decoded
 * @param {boolean} bomPresent
 * @param {number} lineCount
 * @param {string} lengthUnit
 */
function resolveLengthFields(copy, decoded, bomPresent, lineCount, lengthUnit) {
  if (lengthUnit === 'ABSENT') {
    return { observedLength: 'ABSENT', observedLengthUnit: 'ABSENT' };
  }
  if (lengthUnit === 'BYTE') {
    return { observedLength: copy.length, observedLengthUnit: 'BYTE' };
  }
  if (lengthUnit === 'UTF8_CODEPOINT') {
    return {
      observedLength: countUtf8CodePoints(decoded, bomPresent),
      observedLengthUnit: 'UTF8_CODEPOINT',
    };
  }
  if (lengthUnit === 'UTF16_CODE_UNIT') {
    const units = decodedForBomAwareMetrics(decoded, bomPresent).length;
    return { observedLength: units, observedLengthUnit: 'UTF16_CODE_UNIT' };
  }
  return { observedLength: lineCount, observedLengthUnit: 'LINE_COUNT' };
}

/**
 * @param {unknown} value
 * @returns {unknown}
 */
function deepCopyValue(value) {
  if (value === 'ABSENT' || typeof value !== 'object' || value === null) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => deepCopyValue(item));
  }
  const out = {};
  for (const key of Object.keys(value)) {
    out[key] = deepCopyValue(value[key]);
  }
  return out;
}

/**
 * @param {unknown} observation
 */
function freezeObservation(observation) {
  if (Array.isArray(observation.occurrences)) {
    for (const occ of observation.occurrences) {
      Object.freeze(occ);
    }
    Object.freeze(observation.occurrences);
  }
  Object.freeze(observation.wrapper);
  Object.freeze(observation.excludedRanges);
  return Object.freeze(observation);
}

/**
 * @returns {ReturnType<typeof buildEncInvalidObservation>}
 */
function buildEncInvalidObservation() {
  return {
    interpretiveEncoding: BV_ENC_INVALID,
    occurrences: [],
    lineAnchorObserved: 'ABSENT',
    jsonlAnchorObserved: 'ABSENT',
    wrapper: {
      openLine: 'ABSENT',
      closeLine: 'ABSENT',
      boundaryEndLine: 1,
    },
    excludedRanges: [],
    observedLength: 'ABSENT',
    observedLengthUnit: 'ABSENT',
  };
}

/**
 * @param {Buffer | Uint8Array} bytes
 * @param {{ lengthUnit: string }} config
 */
export function parseSyntheticStructureFromBytes(bytes, config) {
  const { lengthUnit } = validateConfig(config);
  const copy = copyBytes(bytes);
  if (copy.length > MAX_INPUT_BYTES) {
    throw new RangeError();
  }

  const inspection = inspectByteCharacteristics(copy);
  if (inspection.interpretiveEncoding !== 'PASS') {
    return freezeObservation(deepCopyValue(buildEncInvalidObservation()));
  }

  const decoded = UTF8_DECODER.decode(copy);
  const bomPresent = inspection.bom === 'BOM_UTF8_PRESENT';
  const lines = splitLogicalLines(decoded);
  const totalLogicalLines = lines.length;

  /** @type {{ header: string, role: 'CANDIDATE', assertedPrimary: false, lineNo: number }[]} */
  const discovered = [];
  for (let lineNo = 1; lineNo <= lines.length; lineNo += 1) {
    const view = comparisonView(lineNo, lines[lineNo - 1]);
    if (isDiscoveredHeaderLine(view)) {
      discovered.push({
        header: view,
        role: 'CANDIDATE',
        assertedPrimary: false,
        lineNo,
      });
    }
  }

  const occurrences = discovered.map(({ header, role, assertedPrimary }) => ({
    header,
    role,
    assertedPrimary,
  }));

  let lineAnchorObserved = 'ABSENT';
  if (discovered.length === 1) {
    lineAnchorObserved = discovered[0].lineNo;
  }

  const lengthFields = resolveLengthFields(
    copy,
    decoded,
    bomPresent,
    totalLogicalLines,
    lengthUnit,
  );

  const observation = {
    interpretiveEncoding: 'PASS',
    occurrences,
    lineAnchorObserved,
    jsonlAnchorObserved: 'ABSENT',
    wrapper: {
      openLine: 'ABSENT',
      closeLine: 'ABSENT',
      boundaryEndLine: totalLogicalLines,
    },
    excludedRanges: [],
    ...lengthFields,
  };

  return freezeObservation(deepCopyValue(observation));
}
