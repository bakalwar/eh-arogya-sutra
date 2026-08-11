import fs from 'node:fs';
import path from 'node:path';

export const RULE5_CLI_ROOT_INVALID = 'RULE5_CLI_ROOT_INVALID';
export const RULE5_CLI_MARKER_INVALID = 'RULE5_CLI_MARKER_INVALID';
export const RULE5_CLI_PATH_CONFINEMENT_FAILED = 'RULE5_CLI_PATH_CONFINEMENT_FAILED';
export const RULE5_CLI_INPUT_NOT_FOUND = 'RULE5_CLI_INPUT_NOT_FOUND';
export const RULE5_CLI_UNSAFE_FILE_TYPE = 'RULE5_CLI_UNSAFE_FILE_TYPE';
export const RULE5_CLI_HARDLINK_REJECTED = 'RULE5_CLI_HARDLINK_REJECTED';
export const RULE5_CLI_INPUT_OVERSIZE = 'RULE5_CLI_INPUT_OVERSIZE';
export const RULE5_CLI_READ_FAILED = 'RULE5_CLI_READ_FAILED';

export const MARKER_FILENAME = '.ehas2-provenance-synthetic-root';
export const MARKER_EXACT_BYTES = Buffer.from('EHAS2_SYNTHETIC_ROOT_V1\n', 'utf8');
export const MARKER_EXACT_BYTE_LENGTH = 24;
export const MARKER_MAX_SIZE = 64;
export const MARKER_MAX_READ = 65;
export const INPUT_MAX_BYTES = 262144;
export const INPUT_MAX_READ = 262145;

export class Rule5SyntheticInputError extends Error {
  /** @param {string} failureCode */
  constructor(failureCode) {
    super('Synthetic input adapter failure');
    this.name = 'Rule5SyntheticInputError';
    this.failureCode = failureCode;
  }
}

/** @type {null | { fstat?: (fd: number) => fs.Stats }} */
let adapterTestSeam = null;

/** @param {null | { fstat?: (fd: number) => fs.Stats }} seam */
export function __setAdapterTestSeam(seam) {
  adapterTestSeam = seam;
}

/**
 * @param {string} failureCode
 * @returns {never}
 */
function fail(failureCode) {
  throw new Rule5SyntheticInputError(failureCode);
}

export const RULE5_CLI_UNSUPPORTED_PLATFORM = 'RULE5_CLI_UNSUPPORTED_PLATFORM';

/**
 * @returns {boolean}
 */
export function isConfinedOpenSupported() {
  return fs.constants.O_NOFOLLOW !== undefined;
}

/**
 * @returns {number}
 */
function requireOpenFlags() {
  const nofollow = fs.constants.O_NOFOLLOW;
  if (nofollow === undefined) {
    fail(RULE5_CLI_UNSUPPORTED_PLATFORM);
  }
  return fs.constants.O_RDONLY | nofollow;
}

/**
 * @param {fs.Stats} before
 * @param {fs.Stats} after
 */
function requireSameIdentity(before, after) {
  if (before.dev !== after.dev || before.ino !== after.ino) {
    fail(RULE5_CLI_PATH_CONFINEMENT_FAILED);
  }
}

/**
 * @param {string} absolutePath
 * @param {string} symlinkFailureCode
 */
function lstatExistingComponents(absolutePath, symlinkFailureCode) {
  const resolved = path.resolve(absolutePath);
  const parsed = path.parse(resolved);
  const segments = resolved.slice(parsed.root.length).split(path.sep).filter(Boolean);
  let current = parsed.root;
  for (const segment of segments) {
    current = path.join(current, segment);
    let stats;
    try {
      stats = fs.lstatSync(current);
    } catch (err) {
      if (/** @type {NodeJS.ErrnoException} */ (err).code === 'ENOENT') {
        return;
      }
      fail(RULE5_CLI_READ_FAILED);
    }
    if (stats.isSymbolicLink()) {
      fail(symlinkFailureCode);
    }
  }
}

/**
 * @param {string} markerPath
 * @param {number} openFlags
 */
function validateMarker(markerPath, openFlags) {
  let preOpenStats;
  try {
    preOpenStats = fs.lstatSync(markerPath);
  } catch (err) {
    if (/** @type {NodeJS.ErrnoException} */ (err).code === 'ENOENT') {
      fail(RULE5_CLI_MARKER_INVALID);
    }
    fail(RULE5_CLI_READ_FAILED);
  }

  if (preOpenStats.isSymbolicLink() || !preOpenStats.isFile()) {
    fail(RULE5_CLI_MARKER_INVALID);
  }
  if (preOpenStats.nlink !== 1) {
    fail(RULE5_CLI_MARKER_INVALID);
  }

  let fd;
  try {
    fd = fs.openSync(markerPath, openFlags);
  } catch {
    fail(RULE5_CLI_MARKER_INVALID);
  }

  try {
    const postOpenStats = adapterTestSeam?.fstat ? adapterTestSeam.fstat(fd) : fs.fstatSync(fd);
    if (!postOpenStats.isFile()) {
      fail(RULE5_CLI_MARKER_INVALID);
    }
    if (postOpenStats.nlink !== 1) {
      fail(RULE5_CLI_MARKER_INVALID);
    }
    if (postOpenStats.size > MARKER_MAX_SIZE) {
      fail(RULE5_CLI_MARKER_INVALID);
    }
    requireSameIdentity(preOpenStats, postOpenStats);

    const buffer = Buffer.alloc(MARKER_MAX_READ);
    let totalRead = 0;
    while (totalRead < MARKER_MAX_READ) {
      const chunk = fs.readSync(fd, buffer, totalRead, MARKER_MAX_READ - totalRead, null);
      if (chunk === 0) {
        break;
      }
      totalRead += chunk;
    }

    if (totalRead !== MARKER_EXACT_BYTE_LENGTH) {
      fail(RULE5_CLI_MARKER_INVALID);
    }
    if (!buffer.subarray(0, MARKER_EXACT_BYTE_LENGTH).equals(MARKER_EXACT_BYTES)) {
      fail(RULE5_CLI_MARKER_INVALID);
    }
  } finally {
    fs.closeSync(fd);
  }
}

/**
 * @param {string} candidatePath
 * @param {number} openFlags
 * @returns {Uint8Array}
 */
function readBoundedInput(candidatePath, openFlags) {
  let preOpenStats;
  try {
    preOpenStats = fs.lstatSync(candidatePath);
  } catch (err) {
    if (/** @type {NodeJS.ErrnoException} */ (err).code === 'ENOENT') {
      fail(RULE5_CLI_INPUT_NOT_FOUND);
    }
    fail(RULE5_CLI_READ_FAILED);
  }

  if (preOpenStats.isSymbolicLink()) {
    fail(RULE5_CLI_UNSAFE_FILE_TYPE);
  }
  if (!preOpenStats.isFile()) {
    fail(RULE5_CLI_UNSAFE_FILE_TYPE);
  }

  let fd;
  try {
    fd = fs.openSync(candidatePath, openFlags);
  } catch {
    fail(RULE5_CLI_UNSAFE_FILE_TYPE);
  }

  try {
    const postOpenStats = adapterTestSeam?.fstat ? adapterTestSeam.fstat(fd) : fs.fstatSync(fd);
    if (!postOpenStats.isFile()) {
      fail(RULE5_CLI_UNSAFE_FILE_TYPE);
    }
    if (postOpenStats.nlink !== 1) {
      fail(RULE5_CLI_HARDLINK_REJECTED);
    }
    if (postOpenStats.size > INPUT_MAX_BYTES) {
      fail(RULE5_CLI_INPUT_OVERSIZE);
    }
    requireSameIdentity(preOpenStats, postOpenStats);

    const buffer = Buffer.alloc(INPUT_MAX_READ);
    let totalRead = 0;
    while (totalRead < INPUT_MAX_READ) {
      const chunk = fs.readSync(fd, buffer, totalRead, INPUT_MAX_READ - totalRead, null);
      if (chunk === 0) {
        break;
      }
      totalRead += chunk;
    }

    if (totalRead > INPUT_MAX_BYTES) {
      fail(RULE5_CLI_INPUT_OVERSIZE);
    }

    return Uint8Array.from(buffer.subarray(0, totalRead));
  } catch (err) {
    if (err instanceof Rule5SyntheticInputError) {
      throw err;
    }
    fail(RULE5_CLI_READ_FAILED);
  } finally {
    fs.closeSync(fd);
  }
}

/**
 * @param {string} rootPath
 * @param {string} relativeInput
 * @returns {Uint8Array}
 */
export function readSyntheticInput(rootPath, relativeInput) {
  const openFlags = requireOpenFlags();
  const canonicalRoot = path.resolve(rootPath);

  lstatExistingComponents(canonicalRoot, RULE5_CLI_ROOT_INVALID);

  let rootStats;
  try {
    rootStats = fs.lstatSync(canonicalRoot);
  } catch {
    fail(RULE5_CLI_ROOT_INVALID);
  }
  if (rootStats.isSymbolicLink() || !rootStats.isDirectory()) {
    fail(RULE5_CLI_ROOT_INVALID);
  }

  const markerPath = path.join(canonicalRoot, MARKER_FILENAME);
  lstatExistingComponents(markerPath, RULE5_CLI_MARKER_INVALID);
  validateMarker(markerPath, openFlags);

  const candidatePath = path.resolve(canonicalRoot, relativeInput);
  const relativeContainment = path.relative(canonicalRoot, candidatePath);
  if (
    relativeContainment === '..' ||
    relativeContainment.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeContainment)
  ) {
    fail(RULE5_CLI_PATH_CONFINEMENT_FAILED);
  }

  lstatExistingComponents(candidatePath, RULE5_CLI_UNSAFE_FILE_TYPE);
  return readBoundedInput(candidatePath, openFlags);
}
