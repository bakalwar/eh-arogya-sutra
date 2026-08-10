import { BV_ENC_INVALID } from './verifyCore.mjs';

export const BV_HDR_MISSING = 'BV-HDR-MISSING';
export const BV_HDR_DUPLICATE = 'BV-HDR-DUPLICATE';
export const BV_HDR_CODE_MISMATCH = 'BV-HDR-CODE-MISMATCH';
export const BV_MED_NONE_ATTRIBUTION = 'BV-MED-NONE-ATTRIBUTION';
export const BV_LINE_ANCHOR_MISMATCH = 'BV-LINE-ANCHOR-MISMATCH';
export const BV_JSONL_ANCHOR_MISMATCH = 'BV-JSONL-ANCHOR-MISMATCH';
export const BV_WRAPPER_MISMATCH = 'BV-WRAPPER-MISMATCH';
export const BV_EXCL_REGION_MISMATCH = 'BV-EXCL-REGION-MISMATCH';
export const BV_LEN_UNIT_UNRESOLVED = 'BV-LEN-UNIT-UNRESOLVED';
export const BV_LEN_MISMATCH = 'BV-LEN-MISMATCH';
export const BV_OCC_QUARANTINED = 'BV-OCC-QUARANTINED';

const EXPECTED_HEADER_RE = /^MED=(?:None|[A-Z0-9]+)$/;
const MAX_OBSERVED_HEADER_LENGTH = 256;

const ASSESSMENT_MODES = new Set(['COMPARE', 'NOT_APPLICABLE']);
const ROLES = new Set(['CANDIDATE', 'QUARANTINED']);
const LENGTH_UNITS = new Set([
  'BYTE',
  'UTF8_CODEPOINT',
  'UTF16_CODE_UNIT',
  'LINE_COUNT',
  'UNRESOLVED',
  'ABSENT',
]);
const PRECEDENCE = [
  BV_ENC_INVALID,
  BV_OCC_QUARANTINED,
  BV_HDR_MISSING,
  BV_HDR_DUPLICATE,
  BV_MED_NONE_ATTRIBUTION,
  BV_HDR_CODE_MISMATCH,
  BV_WRAPPER_MISMATCH,
  BV_EXCL_REGION_MISMATCH,
  BV_LINE_ANCHOR_MISMATCH,
  BV_JSONL_ANCHOR_MISMATCH,
  BV_LEN_UNIT_UNRESOLVED,
  BV_LEN_MISMATCH,
];

const EXPECTATION_KEYS_NA = new Set(['assessmentMode']);
const EXPECTATION_KEYS_COMPARE = new Set([
  'assessmentMode',
  'expectedPhysicalHeader',
  'lineAnchorExpected',
  'jsonlAnchorExpected',
  'wrapper',
  'excludedRanges',
  'declaredLength',
  'lengthUnit',
]);

const OBSERVATION_KEYS = new Set([
  'interpretiveEncoding',
  'occurrences',
  'lineAnchorObserved',
  'jsonlAnchorObserved',
  'wrapper',
  'excludedRanges',
  'observedLength',
  'observedLengthUnit',
]);

const OCCURRENCE_KEYS = new Set(['header', 'role', 'assertedPrimary']);
const WRAPPER_KEYS = new Set(['openLine', 'closeLine', 'boundaryEndLine']);
const RANGE_KEYS = new Set(['startLine', 'endLine']);

/**
 * @param {unknown} obj
 * @param {Set<string>} allowed
 */
function assertExactKeys(obj, allowed) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    throw new TypeError('Expected plain object');
  }
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) {
      throw new TypeError('Unexpected key');
    }
  }
}

/**
 * @param {unknown} value
 * @returns {value is number}
 */
function isPositiveInt(value) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1;
}

/**
 * @param {unknown} value
 * @returns {value is number}
 */
function isNonNegativeInt(value) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

/**
 * @param {unknown} value
 * @returns {value is 'ABSENT'}
 */
function isAbsent(value) {
  return value === 'ABSENT';
}

/**
 * @param {unknown} anchor
 * @param {'line' | 'jsonl'} kind
 */
function validateAnchor(anchor, kind) {
  if (isAbsent(anchor)) {
    return;
  }
  if (kind === 'line' && isPositiveInt(anchor)) {
    return;
  }
  if (kind === 'jsonl' && isNonNegativeInt(anchor)) {
    return;
  }
  throw new TypeError('Malformed anchor');
}

/**
 * @param {unknown} wrapper
 */
function validateWrapper(wrapper) {
  assertExactKeys(wrapper, WRAPPER_KEYS);
  const { openLine, closeLine, boundaryEndLine } = wrapper;
  if (!isPositiveInt(boundaryEndLine)) {
    throw new TypeError('Malformed wrapper');
  }
  if (!isAbsent(openLine) && !isPositiveInt(openLine)) {
    throw new TypeError('Malformed wrapper');
  }
  if (!isAbsent(closeLine) && !isPositiveInt(closeLine)) {
    throw new TypeError('Malformed wrapper');
  }
  if (isPositiveInt(openLine) && isPositiveInt(closeLine)) {
    if (openLine > closeLine || closeLine > boundaryEndLine) {
      throw new TypeError('Malformed wrapper');
    }
  }
  if (isPositiveInt(openLine) && isAbsent(closeLine)) {
    if (openLine > boundaryEndLine) {
      throw new TypeError('Malformed wrapper');
    }
  }
}

/**
 * @param {unknown} ranges
 * @returns {{ startLine: number, endLine: number }[]}
 */
function validateAndSortRanges(ranges) {
  if (!Array.isArray(ranges)) {
    throw new TypeError('Malformed excluded ranges');
  }
  const copy = [];
  for (const range of ranges) {
    assertExactKeys(range, RANGE_KEYS);
    const { startLine, endLine } = range;
    if (!isPositiveInt(startLine) || !isPositiveInt(endLine) || startLine > endLine) {
      throw new TypeError('Malformed excluded ranges');
    }
    copy.push({ startLine, endLine });
  }
  copy.sort((a, b) => a.startLine - b.startLine || a.endLine - b.endLine);
  for (let i = 1; i < copy.length; i += 1) {
    const prev = copy[i - 1];
    const cur = copy[i];
    if (cur.startLine <= prev.endLine) {
      throw new TypeError('Overlapping excluded ranges');
    }
  }
  return copy;
}

/**
 * @param {unknown} length
 * @param {unknown} unit
 * @param {'expectation' | 'observation'} side
 */
function validateLengthUnitPair(length, unit, _side) {
  if (!LENGTH_UNITS.has(unit)) {
    throw new TypeError('Malformed length unit');
  }
  if (isAbsent(length)) {
    if (unit !== 'ABSENT') {
      throw new TypeError('Invalid length unit pairing');
    }
    return;
  }
  if (!isNonNegativeInt(length)) {
    throw new TypeError('Malformed length');
  }
  if (unit === 'ABSENT') {
    throw new TypeError('Invalid length unit pairing');
  }
}

/**
 * @param {unknown} expectation
 */
function validateExpectation(expectation) {
  if (expectation === null || typeof expectation !== 'object' || Array.isArray(expectation)) {
    throw new TypeError('Malformed expectation');
  }
  const mode = expectation.assessmentMode;
  if (!ASSESSMENT_MODES.has(mode)) {
    throw new TypeError('Malformed expectation');
  }
  if (mode === 'NOT_APPLICABLE') {
    assertExactKeys(expectation, EXPECTATION_KEYS_NA);
    return;
  }
  assertExactKeys(expectation, EXPECTATION_KEYS_COMPARE);
  if (!EXPECTED_HEADER_RE.test(expectation.expectedPhysicalHeader)) {
    throw new TypeError('Malformed expected physical header');
  }
  validateAnchor(expectation.lineAnchorExpected, 'line');
  validateAnchor(expectation.jsonlAnchorExpected, 'jsonl');
  validateWrapper(expectation.wrapper);
  validateAndSortRanges(expectation.excludedRanges);
  validateLengthUnitPair(expectation.declaredLength, expectation.lengthUnit, 'expectation');
}

/**
 * @param {unknown} observation
 */
function validateObservation(observation) {
  if (observation === null || typeof observation !== 'object' || Array.isArray(observation)) {
    throw new TypeError('Malformed observation');
  }
  assertExactKeys(observation, OBSERVATION_KEYS);
  if (
    observation.interpretiveEncoding !== 'PASS' &&
    observation.interpretiveEncoding !== BV_ENC_INVALID
  ) {
    throw new TypeError('Malformed interpretiveEncoding');
  }
  if (!Array.isArray(observation.occurrences)) {
    throw new TypeError('Malformed occurrences');
  }
  for (const occ of observation.occurrences) {
    assertExactKeys(occ, OCCURRENCE_KEYS);
    if (
      typeof occ.header !== 'string' ||
      occ.header.length === 0 ||
      occ.header.length > MAX_OBSERVED_HEADER_LENGTH
    ) {
      throw new TypeError('Malformed observed header');
    }
    if (!ROLES.has(occ.role)) {
      throw new TypeError('Malformed occurrence role');
    }
    if (typeof occ.assertedPrimary !== 'boolean') {
      throw new TypeError('Malformed assertedPrimary');
    }
  }
  validateAnchor(observation.lineAnchorObserved, 'line');
  validateAnchor(observation.jsonlAnchorObserved, 'jsonl');
  validateWrapper(observation.wrapper);
  validateAndSortRanges(observation.excludedRanges);
  validateLengthUnitPair(observation.observedLength, observation.observedLengthUnit, 'observation');
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
 * @param {string[]} codes
 * @returns {string[]}
 */
function sortUniqueBvCodes(codes) {
  const unique = [...new Set(codes)];
  unique.sort((a, b) => PRECEDENCE.indexOf(a) - PRECEDENCE.indexOf(b));
  return unique;
}

/**
 * @param {{ openLine: unknown, closeLine: unknown, boundaryEndLine: unknown }} expected
 * @param {{ openLine: unknown, closeLine: unknown, boundaryEndLine: unknown }} observed
 */
function wrapperMatches(expected, observed) {
  if (
    expected.openLine !== observed.openLine ||
    expected.closeLine !== observed.closeLine ||
    expected.boundaryEndLine !== observed.boundaryEndLine
  ) {
    return false;
  }
  const pairs = [
    [expected.openLine, expected.closeLine],
    [observed.openLine, observed.closeLine],
  ];
  for (const [openLine, closeLine] of pairs) {
    if (isPositiveInt(openLine) && isPositiveInt(closeLine)) {
      if (openLine > closeLine || closeLine > expected.boundaryEndLine) {
        return false;
      }
    }
    if (isPositiveInt(openLine) && isAbsent(closeLine)) {
      if (openLine > expected.boundaryEndLine) {
        return false;
      }
    }
  }
  return true;
}

/**
 * @param {unknown} expected
 * @param {unknown} observed
 */
function anchorsMismatch(expected, observed, _kind) {
  if (isAbsent(expected) && isAbsent(observed)) {
    return false;
  }
  return expected !== observed;
}

/**
 * @param {unknown} expectation
 * @param {unknown} observation
 * @returns {string[]}
 */
function collectLengthFailures(expectation, observation) {
  const decl = expectation.declaredLength;
  const declUnit = expectation.lengthUnit;
  const obs = observation.observedLength;
  const obsUnit = observation.observedLengthUnit;

  const declAbsent = isAbsent(decl);
  const obsAbsent = isAbsent(obs);

  if (declAbsent && obsAbsent) {
    return [];
  }
  if (declAbsent !== obsAbsent) {
    return [BV_LEN_MISMATCH];
  }

  const eitherUnresolved =
    declUnit === 'UNRESOLVED' ||
    declUnit === 'ABSENT' ||
    obsUnit === 'UNRESOLVED' ||
    obsUnit === 'ABSENT';
  if (eitherUnresolved) {
    return [BV_LEN_UNIT_UNRESOLVED];
  }

  if (declUnit !== obsUnit) {
    return [BV_LEN_UNIT_UNRESOLVED];
  }

  if (decl !== obs) {
    return [BV_LEN_MISMATCH];
  }
  return [];
}

/**
 * @param {unknown} expectation
 * @param {unknown} observation
 * @returns {string[]}
 */
function collectStructuralFailures(expectation, observation) {
  const failures = [];

  for (const occ of observation.occurrences) {
    if (occ.role === 'QUARANTINED' && occ.assertedPrimary === true) {
      failures.push(BV_OCC_QUARANTINED);
    }
  }

  const candidates = observation.occurrences.filter((o) => o.role === 'CANDIDATE');
  if (candidates.length === 0) {
    failures.push(BV_HDR_MISSING);
  } else if (candidates.length >= 2) {
    failures.push(BV_HDR_DUPLICATE);
  } else {
    const candidate = candidates[0];
    if (candidate.header === 'MED=None' && expectation.expectedPhysicalHeader !== 'MED=None') {
      failures.push(BV_MED_NONE_ATTRIBUTION);
    } else if (candidate.header !== expectation.expectedPhysicalHeader) {
      failures.push(BV_HDR_CODE_MISMATCH);
    }
  }

  if (!wrapperMatches(expectation.wrapper, observation.wrapper)) {
    failures.push(BV_WRAPPER_MISMATCH);
  }

  const expRanges = validateAndSortRanges(expectation.excludedRanges);
  const obsRanges = validateAndSortRanges(observation.excludedRanges);
  if (JSON.stringify(expRanges) !== JSON.stringify(obsRanges)) {
    failures.push(BV_EXCL_REGION_MISMATCH);
  }

  if (anchorsMismatch(expectation.lineAnchorExpected, observation.lineAnchorObserved, 'line')) {
    failures.push(BV_LINE_ANCHOR_MISMATCH);
  }
  if (anchorsMismatch(expectation.jsonlAnchorExpected, observation.jsonlAnchorObserved, 'jsonl')) {
    failures.push(BV_JSONL_ANCHOR_MISMATCH);
  }

  failures.push(...collectLengthFailures(expectation, observation));
  return failures;
}

/**
 * @param {unknown} result
 */
function freezeResult(result) {
  if (result.bvCodes) {
    Object.freeze(result.bvCodes);
  }
  return Object.freeze(result);
}

/**
 * @param {unknown} expectation
 * @param {unknown} observation
 * @returns {{
 *   outcome: 'PASS';
 *   primaryBvCode: null;
 *   bvCodes: [];
 * } | {
 *   outcome: 'FAIL';
 *   primaryBvCode: string;
 *   bvCodes: string[];
 * } | {
 *   outcome: 'NOT_APPLICABLE';
 *   reason: 'AUDIT_EXPECTATION_NOT_APPLICABLE';
 * }}
 */
export function compareSyntheticStructure(expectation, observation) {
  validateExpectation(expectation);

  if (expectation.assessmentMode === 'NOT_APPLICABLE') {
    return freezeResult({
      outcome: 'NOT_APPLICABLE',
      reason: 'AUDIT_EXPECTATION_NOT_APPLICABLE',
    });
  }

  if (observation === null || observation === undefined) {
    throw new TypeError('Observation required for COMPARE');
  }

  validateObservation(observation);

  const expCopy = deepCopyValue(expectation);
  const obsCopy = deepCopyValue(observation);

  if (obsCopy.interpretiveEncoding === BV_ENC_INVALID) {
    return freezeResult({
      outcome: 'FAIL',
      primaryBvCode: BV_ENC_INVALID,
      bvCodes: Object.freeze([BV_ENC_INVALID]),
    });
  }

  const rawFailures = collectStructuralFailures(expCopy, obsCopy);
  const bvCodes = sortUniqueBvCodes(rawFailures);

  if (bvCodes.length === 0) {
    return freezeResult({
      outcome: 'PASS',
      primaryBvCode: null,
      bvCodes: Object.freeze([]),
    });
  }

  return freezeResult({
    outcome: 'FAIL',
    primaryBvCode: bvCodes[0],
    bvCodes: Object.freeze(bvCodes),
  });
}
