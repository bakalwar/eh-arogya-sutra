import { existsSync, lstatSync, rmSync } from 'node:fs';
import path from 'node:path';

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_BACKOFF_MS = 50;
const TRANSIENT_CODES = new Set(['ENOTEMPTY', 'EPERM', 'EBUSY']);

/** Builder-owned controlled-index SQLite basename — fixed contract. */
export const CONTROLLED_INDEX_DB_BASENAME = 'production-build-index.sqlite' as const;

export type BuilderOwnedDirectoryKind = 'controlled-index' | 'staging';

/** Capability issued at construction time; deletion requires an exact match. */
export type BuilderOwnedDirectoryOwnership = {
  readonly kind: BuilderOwnedDirectoryKind;
  readonly resolvedDir: string;
  readonly expectedBasename: string;
  readonly indexDbBasename?: string;
};

export function createBuilderOwnedDirectoryOwnership(
  kind: BuilderOwnedDirectoryKind,
  dir: string,
  options?: { indexDbBasename?: string },
): BuilderOwnedDirectoryOwnership {
  const resolvedDir = path.resolve(dir);
  return {
    kind,
    resolvedDir,
    expectedBasename: path.basename(resolvedDir),
    indexDbBasename:
      kind === 'controlled-index'
        ? (options?.indexDbBasename ?? CONTROLLED_INDEX_DB_BASENAME)
        : undefined,
  };
}

/**
 * Validate builder-owned directory ownership before deletion.
 * Returns aggregate redacted reason code or null when safe to delete.
 */
export function validateBuilderOwnedDirectoryOwnership(
  ownership: BuilderOwnedDirectoryOwnership,
  targetDir: string,
): string | null {
  const resolved = path.resolve(targetDir);
  if (resolved !== ownership.resolvedDir) {
    return 'ownership=path_mismatch';
  }
  if (path.basename(resolved) !== ownership.expectedBasename) {
    return 'ownership=basename_mismatch';
  }
  let stat;
  try {
    stat = lstatSync(resolved);
  } catch {
    return null;
  }
  if (stat.isSymbolicLink()) {
    return 'ownership=symlink_rejected';
  }
  if (ownership.kind === 'controlled-index') {
    const dbBasename = ownership.indexDbBasename ?? CONTROLLED_INDEX_DB_BASENAME;
    const dbPath = path.join(resolved, dbBasename);
    if (existsSync(dbPath)) {
      if (path.resolve(path.dirname(dbPath)) !== resolved) {
        return 'ownership=index_db_parent_mismatch';
      }
      try {
        const dbStat = lstatSync(dbPath);
        if (dbStat.isSymbolicLink()) {
          return 'ownership=index_db_symlink_rejected';
        }
      } catch {
        return 'ownership=index_db_stat_failed';
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

/**
 * Idempotent removal of a single builder-owned controlled-index or staging directory.
 * Returns null when absent or fully removed; otherwise redacted aggregate failure evidence.
 */
export function formatFailClosedCleanupMessage(
  reason: string,
  cleanupFailure: string | null,
): string {
  return cleanupFailure ? `${reason}; secondaryCleanupFailure=${cleanupFailure}` : reason;
}

export function removeBuilderOwnedDirectory(
  dir: string,
  options?: {
    ownership?: BuilderOwnedDirectoryOwnership;
    maxAttempts?: number;
    backoffMs?: number;
    rmSyncImpl?: typeof rmSync;
  },
): string | null {
  if (!existsSync(dir)) {
    return null;
  }
  if (options?.ownership) {
    const ownershipFailure = validateBuilderOwnedDirectoryOwnership(options.ownership, dir);
    if (ownershipFailure) {
      return ownershipFailure;
    }
  }
  const rm = options?.rmSyncImpl ?? rmSync;
  const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const backoffMs = options?.backoffMs ?? DEFAULT_BACKOFF_MS;
  let lastCode = 'UNKNOWN';
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
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
