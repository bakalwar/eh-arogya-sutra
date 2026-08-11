import { inspectByteCharacteristics } from './verifyCore.mjs';
import {
  RULE5_WRAPPER_SOURCE_AMBIGUOUS,
  Rule5WrapperSourceAmbiguityError,
  parseSyntheticStructureFromBytes,
} from './parseStructure.mjs';
import { compareSyntheticStructure } from './verifyStructure.mjs';

export const ORCHESTRATION_VERSION = 'P2-C3B-1';
export const MAX_SYNTHETIC_ORCHESTRATION_BYTES = 262144;

export const RULE5_SYNTHETIC_ORCHESTRATION_INVALID_INPUT =
  'RULE5_SYNTHETIC_ORCHESTRATION_INVALID_INPUT';
export const RULE5_SYNTHETIC_ORCHESTRATION_INVALID_CONFIG =
  'RULE5_SYNTHETIC_ORCHESTRATION_INVALID_CONFIG';
export const RULE5_SYNTHETIC_ORCHESTRATION_INPUT_OVERSIZE =
  'RULE5_SYNTHETIC_ORCHESTRATION_INPUT_OVERSIZE';
export const RULE5_SYNTHETIC_ORCHESTRATION_INTERNAL = 'RULE5_SYNTHETIC_ORCHESTRATION_INTERNAL';

export { RULE5_WRAPPER_SOURCE_AMBIGUOUS };

const LENGTH_UNITS = new Set(['BYTE', 'UTF8_CODEPOINT', 'UTF16_CODE_UNIT', 'LINE_COUNT', 'ABSENT']);
const COMPARE_LENGTH_UNITS = new Set([
  'BYTE',
  'UTF8_CODEPOINT',
  'UTF16_CODE_UNIT',
  'LINE_COUNT',
  'UNRESOLVED',
  'ABSENT',
]);
const WRAPPER_MODE_FIXED = 'FIXED_USER_QUERY_V1';
const EXPECTED_HEADER_RE = /^MED=(?:None|[A-Z0-9]+)$/;

const PARSER_CONFIG_KEY_SETS = [new Set(['lengthUnit']), new Set(['lengthUnit', 'wrapperMode'])];

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

const WRAPPER_KEYS = new Set(['openLine', 'closeLine', 'boundaryEndLine']);
const RANGE_KEYS = new Set(['startLine', 'endLine']);

export class Rule5SyntheticOrchestrationError extends Error {
  /** @param {string} failureCode */
  constructor(failureCode) {
    super(failureCode);
    this.name = 'Rule5SyntheticOrchestrationError';
    this.failureCode = failureCode;
  }
}

/** @returns {never} */
function throwInvalidInput() {
  throw new Rule5SyntheticOrchestrationError(RULE5_SYNTHETIC_ORCHESTRATION_INVALID_INPUT);
}

/** @returns {never} */
function throwInvalidConfig() {
  throw new Rule5SyntheticOrchestrationError(RULE5_SYNTHETIC_ORCHESTRATION_INVALID_CONFIG);
}

/** @returns {never} */
function throwOversize() {
  throw new Rule5SyntheticOrchestrationError(RULE5_SYNTHETIC_ORCHESTRATION_INPUT_OVERSIZE);
}

/** @returns {never} */
function throwInternal() {
  throw new Rule5SyntheticOrchestrationError(RULE5_SYNTHETIC_ORCHESTRATION_INTERNAL);
}

/**
 * @param {unknown} err
 */
function rethrowIfOrchestrationError(err) {
  if (err instanceof Rule5SyntheticOrchestrationError) {
    throw err;
  }
}

/**
 * @param {unknown} err
 * @returns {never}
 */
function mapIntrospectionToInvalidConfig(err) {
  rethrowIfOrchestrationError(err);
  throwInvalidConfig();
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isAcceptedByteRoot(value) {
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
    return true;
  }
  return value instanceof Uint8Array;
}

/**
 * @param {unknown} bytes
 * @returns {Uint8Array}
 */
function validateAndSnapshotBytes(bytes) {
  if (!isAcceptedByteRoot(bytes)) {
    throwInvalidInput();
  }

  let length;
  try {
    length = /** @type {{ length: number }} */ (bytes).length;
  } catch (err) {
    rethrowIfOrchestrationError(err);
    throwInvalidInput();
  }

  if (typeof length !== 'number' || !Number.isInteger(length) || length < 0) {
    throwInvalidInput();
  }

  if (length > MAX_SYNTHETIC_ORCHESTRATION_BYTES) {
    throwOversize();
  }

  try {
    return Uint8Array.from(/** @type {Buffer | Uint8Array} */ (bytes));
  } catch (err) {
    rethrowIfOrchestrationError(err);
    throwInvalidInput();
  }
}

/**
 * @param {unknown} value
 */
function assertPlainObjectRoot(value) {
  if (typeof value !== 'object' || value === null) {
    throwInvalidConfig();
  }

  let isArray;
  try {
    isArray = Array.isArray(value);
  } catch (err) {
    mapIntrospectionToInvalidConfig(err);
  }
  if (isArray) {
    throwInvalidConfig();
  }

  /** @type {object} */
  const obj = /** @type {object} */ (value);

  let proto;
  try {
    proto = Object.getPrototypeOf(obj);
  } catch (err) {
    mapIntrospectionToInvalidConfig(err);
  }

  if (proto !== Object.prototype) {
    throwInvalidConfig();
  }

  return obj;
}

/**
 * @param {object} obj
 * @param {string} key
 * @returns {PropertyDescriptor}
 */
function readOwnDataDescriptor(obj, key) {
  let descriptor;
  try {
    descriptor = Object.getOwnPropertyDescriptor(obj, key);
  } catch (err) {
    mapIntrospectionToInvalidConfig(err);
  }

  if (
    descriptor === undefined ||
    descriptor.get !== undefined ||
    descriptor.set !== undefined ||
    !Object.prototype.hasOwnProperty.call(descriptor, 'value')
  ) {
    throwInvalidConfig();
  }

  return descriptor;
}

/**
 * @param {object} obj
 * @param {string} key
 * @returns {unknown}
 */
function readOwnDataValue(obj, key) {
  return readOwnDataDescriptor(obj, key).value;
}

/**
 * @param {object} obj
 * @param {Set<string>} allowedKeys
 */
function assertExactOwnStringKeys(obj, allowedKeys) {
  let ownKeys;
  try {
    ownKeys = Reflect.ownKeys(obj);
  } catch (err) {
    mapIntrospectionToInvalidConfig(err);
  }

  for (const key of ownKeys) {
    if (typeof key !== 'string') {
      throwInvalidConfig();
    }
  }

  const ownKeySet = new Set(ownKeys);
  if (ownKeySet.size !== allowedKeys.size) {
    throwInvalidConfig();
  }

  for (const allowedKey of allowedKeys) {
    if (!ownKeySet.has(allowedKey)) {
      throwInvalidConfig();
    }
  }

  for (const key of ownKeySet) {
    if (!allowedKeys.has(key)) {
      throwInvalidConfig();
    }
  }
}

/**
 * @param {unknown} value
 * @returns {value is 'ABSENT'}
 */
function isAbsent(value) {
  return value === 'ABSENT';
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
 * @param {unknown} anchor
 * @param {'line' | 'jsonl'} kind
 */
function validateAnchorValue(anchor, kind) {
  if (isAbsent(anchor)) {
    return;
  }
  if (kind === 'line' && isPositiveInt(anchor)) {
    return;
  }
  if (kind === 'jsonl' && isNonNegativeInt(anchor)) {
    return;
  }
  throwInvalidConfig();
}

/**
 * @param {unknown} wrapperValue
 */
function validateAndCanonicalizeWrapper(wrapperValue) {
  const wrapperObj = assertPlainObjectRoot(wrapperValue);
  assertExactOwnStringKeys(wrapperObj, WRAPPER_KEYS);

  const openLine = readOwnDataValue(wrapperObj, 'openLine');
  const closeLine = readOwnDataValue(wrapperObj, 'closeLine');
  const boundaryEndLine = readOwnDataValue(wrapperObj, 'boundaryEndLine');

  if (!isPositiveInt(boundaryEndLine)) {
    throwInvalidConfig();
  }

  const openAbsent = isAbsent(openLine);
  const closeAbsent = isAbsent(closeLine);
  if (openAbsent !== closeAbsent) {
    throwInvalidConfig();
  }
  if (!openAbsent) {
    if (!isPositiveInt(openLine) || !isPositiveInt(closeLine)) {
      throwInvalidConfig();
    }
    if (openLine > closeLine || closeLine > boundaryEndLine || openLine > boundaryEndLine) {
      throwInvalidConfig();
    }
  }

  return {
    openLine,
    closeLine,
    boundaryEndLine,
  };
}

/**
 * @param {{ startLine: number, endLine: number }[]} canonical
 */
function validateNonOverlappingExcludedRanges(canonical) {
  if (canonical.length <= 1) {
    return;
  }

  const sorted = canonical
    .slice()
    .sort((a, b) => a.startLine - b.startLine || a.endLine - b.endLine);

  for (let i = 1; i < sorted.length; i += 1) {
    const previous = sorted[i - 1];
    const current = sorted[i];
    if (current.startLine <= previous.endLine) {
      throwInvalidConfig();
    }
  }
}

/**
 * @param {unknown} rangesValue
 * @returns {{ startLine: number, endLine: number }[]}
 */
function validateAndCanonicalizeExcludedRanges(rangesValue) {
  let isArrayValue;
  try {
    isArrayValue = Array.isArray(rangesValue);
  } catch (err) {
    mapIntrospectionToInvalidConfig(err);
  }
  if (!isArrayValue) {
    throwInvalidConfig();
  }

  /** @type {unknown[]} */
  const arr = /** @type {unknown[]} */ (rangesValue);

  let ownKeys;
  try {
    ownKeys = Reflect.ownKeys(arr);
  } catch (err) {
    mapIntrospectionToInvalidConfig(err);
  }

  for (const key of ownKeys) {
    if (typeof key !== 'string') {
      throwInvalidConfig();
    }
  }

  readOwnDataDescriptor(arr, 'length');
  const length = arr.length;
  if (typeof length !== 'number' || !Number.isInteger(length) || length < 0) {
    throwInvalidConfig();
  }

  const keySet = new Set(ownKeys);
  const allowedKeys = new Set(['length']);
  for (let i = 0; i < length; i += 1) {
    allowedKeys.add(String(i));
  }

  if (keySet.size !== allowedKeys.size) {
    throwInvalidConfig();
  }

  for (const key of keySet) {
    if (!allowedKeys.has(key)) {
      throwInvalidConfig();
    }
  }

  for (const key of keySet) {
    if (key === 'length') {
      continue;
    }
    if (!/^\d+$/.test(key)) {
      throwInvalidConfig();
    }
    const index = Number(key);
    if (String(index) !== key || index < 0 || index >= length) {
      throwInvalidConfig();
    }
  }

  /** @type {{ startLine: number, endLine: number }[]} */
  const canonical = [];
  for (let i = 0; i < length; i += 1) {
    const entryValue = readOwnDataValue(arr, String(i));
    const entryObj = assertPlainObjectRoot(entryValue);
    assertExactOwnStringKeys(entryObj, RANGE_KEYS);
    const startLine = readOwnDataValue(entryObj, 'startLine');
    const endLine = readOwnDataValue(entryObj, 'endLine');
    if (!isPositiveInt(startLine) || !isPositiveInt(endLine) || startLine > endLine) {
      throwInvalidConfig();
    }
    canonical.push({ startLine, endLine });
  }

  validateNonOverlappingExcludedRanges(canonical);

  return canonical;
}

/**
 * @param {unknown} length
 * @param {unknown} unit
 * @param {Set<string>} allowedUnits
 */
function validateLengthUnitPair(length, unit, allowedUnits) {
  if (typeof unit !== 'string' || !allowedUnits.has(unit)) {
    throwInvalidConfig();
  }
  if (isAbsent(length)) {
    if (unit !== 'ABSENT') {
      throwInvalidConfig();
    }
    return;
  }
  if (!isNonNegativeInt(length)) {
    throwInvalidConfig();
  }
  if (unit === 'ABSENT') {
    throwInvalidConfig();
  }
}

/**
 * @param {unknown} parserConfig
 */
function validateAndCanonicalizeParserConfig(parserConfig) {
  const obj = assertPlainObjectRoot(parserConfig);

  let ownKeys;
  try {
    ownKeys = Reflect.ownKeys(obj);
  } catch (err) {
    mapIntrospectionToInvalidConfig(err);
  }

  for (const key of ownKeys) {
    if (typeof key !== 'string') {
      throwInvalidConfig();
    }
  }

  const ownKeySet = new Set(ownKeys);
  const keySetValid = PARSER_CONFIG_KEY_SETS.some(
    (allowed) =>
      allowed.size === ownKeySet.size &&
      [...allowed].every((allowedKey) => ownKeySet.has(allowedKey)),
  );
  if (!keySetValid) {
    throwInvalidConfig();
  }

  const lengthUnit = readOwnDataValue(obj, 'lengthUnit');
  if (typeof lengthUnit !== 'string' || !LENGTH_UNITS.has(lengthUnit)) {
    throwInvalidConfig();
  }

  if (!ownKeySet.has('wrapperMode')) {
    return { lengthUnit };
  }

  const wrapperMode = readOwnDataValue(obj, 'wrapperMode');
  if (wrapperMode !== WRAPPER_MODE_FIXED) {
    throwInvalidConfig();
  }

  return { lengthUnit, wrapperMode: WRAPPER_MODE_FIXED };
}

/**
 * @param {unknown} expectation
 */
function validateAndCanonicalizeExpectation(expectation) {
  if (expectation === undefined) {
    throwInvalidConfig();
  }

  const obj = assertPlainObjectRoot(expectation);
  const assessmentMode = readOwnDataValue(obj, 'assessmentMode');

  if (assessmentMode === 'NOT_APPLICABLE') {
    assertExactOwnStringKeys(obj, EXPECTATION_KEYS_NA);
    return { assessmentMode: 'NOT_APPLICABLE' };
  }

  if (assessmentMode !== 'COMPARE') {
    throwInvalidConfig();
  }

  assertExactOwnStringKeys(obj, EXPECTATION_KEYS_COMPARE);

  const expectedPhysicalHeader = readOwnDataValue(obj, 'expectedPhysicalHeader');
  if (
    typeof expectedPhysicalHeader !== 'string' ||
    !EXPECTED_HEADER_RE.test(expectedPhysicalHeader)
  ) {
    throwInvalidConfig();
  }

  const lineAnchorExpected = readOwnDataValue(obj, 'lineAnchorExpected');
  const jsonlAnchorExpected = readOwnDataValue(obj, 'jsonlAnchorExpected');
  validateAnchorValue(lineAnchorExpected, 'line');
  validateAnchorValue(jsonlAnchorExpected, 'jsonl');

  const wrapper = validateAndCanonicalizeWrapper(readOwnDataValue(obj, 'wrapper'));
  const excludedRanges = validateAndCanonicalizeExcludedRanges(
    readOwnDataValue(obj, 'excludedRanges'),
  );

  const declaredLength = readOwnDataValue(obj, 'declaredLength');
  const lengthUnit = readOwnDataValue(obj, 'lengthUnit');
  validateLengthUnitPair(declaredLength, lengthUnit, COMPARE_LENGTH_UNITS);

  return {
    assessmentMode: 'COMPARE',
    expectedPhysicalHeader,
    lineAnchorExpected,
    jsonlAnchorExpected,
    wrapper,
    excludedRanges,
    declaredLength,
    lengthUnit,
  };
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
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const key of Object.keys(value)) {
    out[key] = deepCopyValue(/** @type {Record<string, unknown>} */ (value)[key]);
  }
  return out;
}

/**
 * @param {unknown} value
 * @returns {unknown}
 */
function deepFreezeValue(value) {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      deepFreezeValue(item);
    }
    return Object.freeze(value);
  }
  for (const key of Object.keys(value)) {
    deepFreezeValue(/** @type {Record<string, unknown>} */ (value)[key]);
  }
  return Object.freeze(value);
}

/**
 * @param {ReturnType<typeof inspectByteCharacteristics>} inspection
 */
function copyInspection(inspection) {
  return deepFreezeValue({
    byteLength: inspection.byteLength,
    utf8: inspection.utf8,
    bom: inspection.bom,
    eol: inspection.eol,
    loneCrObserved: inspection.loneCrObserved,
    terminalNewline: inspection.terminalNewline,
    interpretiveEncoding: inspection.interpretiveEncoding,
  });
}

/**
 * @returns {Readonly<{ orchestrationVersion: string, outcome: 'WRAPPER_AMBIGUOUS', failureCode: string }>}
 */
function buildWrapperAmbiguousEnvelope() {
  return deepFreezeValue({
    orchestrationVersion: ORCHESTRATION_VERSION,
    outcome: 'WRAPPER_AMBIGUOUS',
    failureCode: RULE5_WRAPPER_SOURCE_AMBIGUOUS,
  });
}

/**
 * @param {ReturnType<typeof inspectByteCharacteristics>} inspection
 * @param {unknown} comparison
 * @returns {string}
 */
function selectOutcome(inspection, comparison) {
  if (inspection.interpretiveEncoding !== 'PASS') {
    return 'ENCODING_INVALID';
  }

  if (comparison === undefined) {
    return 'PARSED';
  }

  if (comparison.outcome === 'NOT_APPLICABLE') {
    return 'STRUCTURE_NOT_APPLICABLE';
  }
  if (comparison.outcome === 'FAIL') {
    return 'STRUCTURE_COMPARED_FAIL';
  }
  return 'STRUCTURE_COMPARED_PASS';
}

/**
 * @param {string} outcome
 * @param {ReturnType<typeof inspectByteCharacteristics>} inspection
 * @param {unknown} observation
 * @param {unknown} comparison
 */
function buildFullEnvelope(outcome, inspection, observation, comparison) {
  /** @type {Record<string, unknown>} */
  const envelope = {
    orchestrationVersion: ORCHESTRATION_VERSION,
    outcome,
    inspection: copyInspection(inspection),
    observation: deepFreezeValue(deepCopyValue(observation)),
  };

  if (comparison !== undefined) {
    envelope.comparison = deepFreezeValue(deepCopyValue(comparison));
  }

  return deepFreezeValue(envelope);
}

/**
 * @param {unknown} bytes
 * @param {unknown} parserConfig
 * @param {unknown} [expectation]
 */
export function evaluateSyntheticProvenanceOrchestration(bytes, parserConfig, expectation) {
  const snapshot = validateAndSnapshotBytes(bytes);

  let parserConfigCanonical;
  try {
    parserConfigCanonical = validateAndCanonicalizeParserConfig(parserConfig);
  } catch (err) {
    rethrowIfOrchestrationError(err);
    throwInternal();
  }

  let expectationCanonical;
  const expectationSupplied = arguments.length >= 3;
  if (expectationSupplied) {
    try {
      expectationCanonical = validateAndCanonicalizeExpectation(expectation);
    } catch (err) {
      rethrowIfOrchestrationError(err);
      throwInternal();
    }
  }

  let inspectionRaw;
  try {
    inspectionRaw = inspectByteCharacteristics(snapshot);
  } catch (err) {
    rethrowIfOrchestrationError(err);
    throwInternal();
  }

  let observationRaw;
  try {
    observationRaw = parseSyntheticStructureFromBytes(snapshot, parserConfigCanonical);
  } catch (err) {
    if (err instanceof Rule5WrapperSourceAmbiguityError) {
      return buildWrapperAmbiguousEnvelope();
    }
    rethrowIfOrchestrationError(err);
    throwInternal();
  }

  let comparisonRaw;
  if (expectationSupplied) {
    try {
      comparisonRaw = compareSyntheticStructure(expectationCanonical, observationRaw);
    } catch (err) {
      rethrowIfOrchestrationError(err);
      throwInternal();
    }
  }

  const outcome = selectOutcome(inspectionRaw, comparisonRaw);
  return buildFullEnvelope(outcome, inspectionRaw, observationRaw, comparisonRaw);
}
