import { inspectByteCharacteristics } from './verifyCore.mjs';
import {
  Rule5WrapperSourceAmbiguityError,
  parseSyntheticStructureFromBytes,
} from './parseStructure.mjs';
import {
  isConfinedOpenSupported,
  readSyntheticInput,
  Rule5SyntheticInputError,
} from './readSyntheticInput.mjs';

export const TOOL_VERSION = 'P2-B3-1';

export const RULE5_CLI_USAGE_ERROR = 'RULE5_CLI_USAGE_ERROR';
export const RULE5_CLI_UNSUPPORTED_PLATFORM = 'RULE5_CLI_UNSUPPORTED_PLATFORM';
export const RULE5_CLI_INTERNAL_ERROR = 'RULE5_CLI_INTERNAL_ERROR';

export const HELP_TEXT =
  'verifySyntheticCli — confined synthetic parser-only CLI (P2-B3)\n' +
  'Usage: node tools/provenance/verifySyntheticCli.mjs \\\n' +
  '  --root <synthetic-root> \\\n' +
  '  --input <relative-file> \\\n' +
  '  --length-unit BYTE|UTF8_CODEPOINT|UTF16_CODE_UNIT|LINE_COUNT|ABSENT \\\n' +
  '  [--wrapper-mode FIXED_USER_QUERY_V1]\n';

export const VERSION_TEXT = 'P2-B3-1\n';

const LENGTH_UNITS = new Set(['BYTE', 'UTF8_CODEPOINT', 'UTF16_CODE_UNIT', 'LINE_COUNT', 'ABSENT']);

const ADAPTER_EXIT = {
  RULE5_CLI_ROOT_INVALID: 2,
  RULE5_CLI_MARKER_INVALID: 2,
  RULE5_CLI_PATH_CONFINEMENT_FAILED: 2,
  RULE5_CLI_INPUT_NOT_FOUND: 3,
  RULE5_CLI_UNSAFE_FILE_TYPE: 4,
  RULE5_CLI_HARDLINK_REJECTED: 4,
  RULE5_CLI_INPUT_OVERSIZE: 5,
  RULE5_CLI_READ_FAILED: 6,
};

/**
 * @param {Record<string, unknown>} obj
 */
function writeJsonLine(obj) {
  process.stdout.write(`${JSON.stringify(obj)}\n`);
}

/**
 * @param {string} failureCode
 * @param {number} exitCode
 * @returns {never}
 */
function exitError(failureCode, exitCode) {
  writeJsonLine({
    toolVersion: TOOL_VERSION,
    outcome: 'ERROR',
    failureCode,
  });
  process.exit(exitCode);
}

/**
 * @param {string} relativeInput
 */
function validateRelativeInputSyntax(relativeInput) {
  if (typeof relativeInput !== 'string' || relativeInput.length === 0) {
    return false;
  }
  if (relativeInput === '.') {
    return false;
  }
  if (relativeInput.includes('\\')) {
    return false;
  }
  if (relativeInput.includes('\0')) {
    return false;
  }
  if (relativeInput.includes(':')) {
    return false;
  }
  if (/^[A-Za-z]:/.test(relativeInput)) {
    return false;
  }
  if (relativeInput.startsWith('//') || relativeInput.startsWith('\\\\')) {
    return false;
  }
  if (relativeInput.startsWith('/')) {
    return false;
  }
  for (const segment of relativeInput.split('/')) {
    if (segment === '..') {
      return false;
    }
    if (segment.length > 0 && (segment.endsWith('.') || segment.endsWith(' '))) {
      return false;
    }
  }
  return true;
}

/**
 * @param {string[]} argv
 */
function parseArgv(argv) {
  /** @type {Record<string, string | true>} */
  const seen = {};
  /** @type {Record<string, string>} */
  const values = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--') {
      return { error: RULE5_CLI_USAGE_ERROR };
    }
    if (token.startsWith('@')) {
      return { error: RULE5_CLI_USAGE_ERROR };
    }
    if (!token.startsWith('--')) {
      return { error: RULE5_CLI_USAGE_ERROR };
    }

    if (token === '--help' || token === '--version') {
      if (Object.hasOwn(seen, token)) {
        return { error: RULE5_CLI_USAGE_ERROR };
      }
      seen[token] = true;
      continue;
    }

    const eq = token.indexOf('=');
    let flag;
    let value;
    if (eq !== -1) {
      flag = token.slice(0, eq);
      value = token.slice(eq + 1);
      if (value.length === 0) {
        return { error: RULE5_CLI_USAGE_ERROR };
      }
    } else {
      flag = token;
      if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) {
        return { error: RULE5_CLI_USAGE_ERROR };
      }
      value = argv[i + 1];
      i += 1;
    }

    if (
      flag !== '--root' &&
      flag !== '--input' &&
      flag !== '--length-unit' &&
      flag !== '--wrapper-mode'
    ) {
      return { error: RULE5_CLI_USAGE_ERROR };
    }

    if (Object.hasOwn(seen, flag)) {
      return { error: RULE5_CLI_USAGE_ERROR };
    }
    seen[flag] = true;
    values[flag] = value;
  }

  const help = Object.hasOwn(seen, '--help');
  const version = Object.hasOwn(seen, '--version');
  if (help || version) {
    const operational = ['--root', '--input', '--length-unit', '--wrapper-mode'].some((flag) =>
      Object.hasOwn(seen, flag),
    );
    if (operational || (help && version)) {
      return { error: RULE5_CLI_USAGE_ERROR };
    }
    return { help, version };
  }

  if (!values['--root'] || !values['--input'] || !values['--length-unit']) {
    return { error: RULE5_CLI_USAGE_ERROR };
  }

  if (!LENGTH_UNITS.has(values['--length-unit'])) {
    return { error: RULE5_CLI_USAGE_ERROR };
  }

  if (Object.hasOwn(values, '--wrapper-mode')) {
    if (values['--wrapper-mode'] !== 'FIXED_USER_QUERY_V1') {
      return { error: RULE5_CLI_USAGE_ERROR };
    }
  }

  if (!validateRelativeInputSyntax(values['--input'])) {
    return { error: RULE5_CLI_USAGE_ERROR };
  }

  return {
    root: values['--root'],
    input: values['--input'],
    lengthUnit: values['--length-unit'],
    wrapperMode: values['--wrapper-mode'],
  };
}

/**
 * @param {ReturnType<typeof inspectByteCharacteristics>} inspection
 * @param {ReturnType<typeof parseSyntheticStructureFromBytes>} observation
 * @param {string} lengthUnit
 */
function buildSuccessPayload(inspection, observation, lengthUnit) {
  const candidateHeaderCount = observation.occurrences.length;
  let lineAnchorState = 'ABSENT';
  if (observation.lineAnchorObserved !== 'ABSENT') {
    lineAnchorState = candidateHeaderCount > 1 ? 'MULTIPLE' : 'SINGLE';
  }

  const wrapperState =
    observation.wrapper.openLine === 'ABSENT' && observation.wrapper.closeLine === 'ABSENT'
      ? 'ABSENT'
      : 'PRESENT';

  const outcome = inspection.interpretiveEncoding === 'PASS' ? 'PARSED' : 'ENCODING_INVALID';

  return {
    toolVersion: TOOL_VERSION,
    outcome,
    failureCode: null,
    interpretiveEncoding: inspection.interpretiveEncoding,
    byteLength: inspection.byteLength,
    logicalLineCount: observation.wrapper.boundaryEndLine,
    candidateHeaderCount,
    lineAnchorState,
    wrapperState,
    lengthUnit,
  };
}

/**
 * @param {string[]} argv
 */
export function runVerifySyntheticCli(argv) {
  const parsed = parseArgv(argv);
  if ('error' in parsed) {
    exitError(parsed.error, 1);
  }
  if ('help' in parsed && parsed.help) {
    process.stdout.write(HELP_TEXT);
    process.exit(0);
  }
  if ('version' in parsed && parsed.version) {
    process.stdout.write(VERSION_TEXT);
    process.exit(0);
  }

  if (process.platform !== 'linux') {
    exitError(RULE5_CLI_UNSUPPORTED_PLATFORM, 1);
  }
  if (!isConfinedOpenSupported()) {
    exitError(RULE5_CLI_UNSUPPORTED_PLATFORM, 1);
  }

  /** @type {Uint8Array} */
  let bytes;
  try {
    bytes = readSyntheticInput(parsed.root, parsed.input);
  } catch (err) {
    if (err instanceof Rule5SyntheticInputError) {
      if (err.failureCode === RULE5_CLI_UNSUPPORTED_PLATFORM) {
        exitError(RULE5_CLI_UNSUPPORTED_PLATFORM, 1);
      }
      const exitCode = ADAPTER_EXIT[err.failureCode] ?? 8;
      exitError(err.failureCode, exitCode);
    }
    exitError(RULE5_CLI_INTERNAL_ERROR, 8);
  }

  let inspection;
  try {
    inspection = inspectByteCharacteristics(bytes);
  } catch {
    exitError(RULE5_CLI_INTERNAL_ERROR, 8);
  }

  /** @type {{ lengthUnit: string, wrapperMode?: string }} */
  const config = { lengthUnit: parsed.lengthUnit };
  if (parsed.wrapperMode === 'FIXED_USER_QUERY_V1') {
    config.wrapperMode = 'FIXED_USER_QUERY_V1';
  }

  let observation;
  try {
    observation = parseSyntheticStructureFromBytes(bytes, config);
  } catch (err) {
    if (err instanceof Rule5WrapperSourceAmbiguityError) {
      exitError(err.failureCode, 7);
    }
    exitError(RULE5_CLI_INTERNAL_ERROR, 8);
  }

  writeJsonLine(buildSuccessPayload(inspection, observation, parsed.lengthUnit));
  process.exit(0);
}

if (process.argv[1] && process.argv[1].endsWith('verifySyntheticCli.mjs')) {
  runVerifySyntheticCli(process.argv.slice(2));
}
