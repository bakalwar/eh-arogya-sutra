import { existsSync, lstatSync, realpathSync, rmSync } from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_BACKOFF_MS = 50;
const TRANSIENT_CODES = new Set(['ENOTEMPTY', 'EPERM', 'EBUSY']);

/** Builder-owned controlled-index SQLite basename — fixed contract. */
export const CONTROLLED_INDEX_DB_BASENAME = 'production-build-index.sqlite' as const;

export type BuilderOwnedDirectoryKind = 'controlled-index' | 'staging';

type OwnershipRecord = {
  readonly kind: BuilderOwnedDirectoryKind;
  readonly resolvedDir: string;
  readonly expectedParent: string;
  readonly expectedBasename: string;
  readonly indexDbBasename: string | null;
  readonly creationNonce: string;
  readonly realPathAtCreate: string | null;
};

/**
 * Opaque ownership token. Only objects issued by createBuilderOwnedDirectoryOwnership
 * are accepted; plain/forged objects are rejected via a module-private WeakSet.
 */
export type BuilderOwnedDirectoryOwnership = {
  readonly __builderOwnedDirectoryOwnership: true;
};

const issuedOwnership = new WeakSet<object>();
const ownershipRecords = new WeakMap<object, OwnershipRecord>();

function safeRealpath(target: string): string | null {
  try {
    return path.resolve(realpathSync(target));
  } catch {
    return null;
  }
}

function isReparseOrSymlink(target: string): boolean {
  try {
    const stat = lstatSync(target);
    if (stat.isSymbolicLink()) {
      return true;
    }
    // Windows junctions/mount-points often surface as directories whose realpath differs.
    if (stat.isDirectory()) {
      const resolved = path.resolve(target);
      const real = safeRealpath(target);
      if (real !== null && real !== resolved) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

export function createBuilderOwnedDirectoryOwnership(
  kind: BuilderOwnedDirectoryKind,
  dir: string,
  options?: { indexDbBasename?: string },
): BuilderOwnedDirectoryOwnership {
  const resolvedDir = path.resolve(dir);
  const token: BuilderOwnedDirectoryOwnership = Object.freeze({
    __builderOwnedDirectoryOwnership: true as const,
  });
  const record: OwnershipRecord = {
    kind,
    resolvedDir,
    expectedParent: path.dirname(resolvedDir),
    expectedBasename: path.basename(resolvedDir),
    indexDbBasename:
      kind === 'controlled-index'
        ? (options?.indexDbBasename ?? CONTROLLED_INDEX_DB_BASENAME)
        : null,
    creationNonce: randomBytes(16).toString('hex'),
    realPathAtCreate: existsSync(resolvedDir) ? safeRealpath(resolvedDir) : null,
  };
  issuedOwnership.add(token);
  ownershipRecords.set(token, record);
  return token;
}

/**
 * Validate builder-owned directory ownership before deletion.
 * Returns aggregate redacted reason code or null when ownership matches.
 * Absence of the target is not an ownership failure (idempotent delete).
 */
export function validateBuilderOwnedDirectoryOwnership(
  ownership: BuilderOwnedDirectoryOwnership,
  targetDir: string,
): string | null {
  if (!ownership || typeof ownership !== 'object' || !issuedOwnership.has(ownership)) {
    return 'ownership=missing_or_forged';
  }
  const record = ownershipRecords.get(ownership);
  if (!record) {
    return 'ownership=missing_or_forged';
  }
  const resolved = path.resolve(targetDir);
  if (resolved !== record.resolvedDir) {
    return 'ownership=path_mismatch';
  }
  if (path.dirname(resolved) !== record.expectedParent) {
    return 'ownership=parent_mismatch';
  }
  if (path.basename(resolved) !== record.expectedBasename) {
    return 'ownership=basename_mismatch';
  }
  if (!existsSync(resolved)) {
    return null;
  }
  if (isReparseOrSymlink(resolved)) {
    return 'ownership=symlink_or_reparse_rejected';
  }
  const real = safeRealpath(resolved);
  if (real === null) {
    return 'ownership=realpath_unavailable';
  }
  if (record.realPathAtCreate !== null && real !== record.realPathAtCreate) {
    return 'ownership=realpath_replaced';
  }
  if (record.realPathAtCreate === null && real !== resolved) {
    return 'ownership=realpath_escape';
  }
  if (record.kind === 'controlled-index' && record.indexDbBasename) {
    const dbPath = path.join(resolved, record.indexDbBasename);
    if (existsSync(dbPath)) {
      if (path.resolve(path.dirname(dbPath)) !== resolved) {
        return 'ownership=index_db_parent_mismatch';
      }
      if (isReparseOrSymlink(dbPath)) {
        return 'ownership=index_db_symlink_rejected';
      }
    }
  }
  return null;
}

export function sleepSync(ms: number): void {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    // Bounded synchronous backoff for Windows transient directory deletion and WAL release.
  }
}

export function formatFailClosedCleanupMessage(
  reason: string,
  cleanupFailure: string | null,
): string {
  return cleanupFailure ? `${reason}; secondaryCleanupFailure=${cleanupFailure}` : reason;
}

/**
 * Idempotent removal of a single builder-owned controlled-index or staging directory.
 * Ownership is mandatory and must be an issued token.
 * Validates ownership immediately before every rm attempt.
 */
export function removeBuilderOwnedDirectory(
  dir: string,
  options: {
    ownership: BuilderOwnedDirectoryOwnership;
    maxAttempts?: number;
    backoffMs?: number;
    rmSyncImpl?: typeof rmSync;
  },
): string | null {
  if (!options?.ownership) {
    return 'ownership=missing_or_forged';
  }
  const ownershipFailure = validateBuilderOwnedDirectoryOwnership(options.ownership, dir);
  if (ownershipFailure) {
    return ownershipFailure;
  }
  if (!existsSync(dir)) {
    return null;
  }
  const rm = options.rmSyncImpl ?? rmSync;
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const backoffMs = options.backoffMs ?? DEFAULT_BACKOFF_MS;
  let lastCode = 'UNKNOWN';
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const attemptOwnershipFailure = validateBuilderOwnedDirectoryOwnership(options.ownership, dir);
    if (attemptOwnershipFailure) {
      return attemptOwnershipFailure;
    }
    if (!existsSync(dir)) {
      return null;
    }
    try {
      rm(dir, { recursive: true, force: true });
      if (!existsSync(dir)) {
        return null;
      }
      lastCode = 'EXISTS_AFTER_RM';
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as NodeJS.ErrnoException).code)
          : 'UNKNOWN';
      lastCode = code;
      if (!TRANSIENT_CODES.has(code) || attempt === maxAttempts) {
        return `code=${code};attempts=${attempt}`;
      }
      sleepSync(backoffMs * attempt);
    }
  }
  return `code=${lastCode};attempts=${maxAttempts}`;
}
