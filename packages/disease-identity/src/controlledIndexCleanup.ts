import { existsSync, rmSync } from 'node:fs';

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_BACKOFF_MS = 50;
const TRANSIENT_CODES = new Set(['ENOTEMPTY', 'EPERM', 'EBUSY']);

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
  options?: { maxAttempts?: number; backoffMs?: number; rmSyncImpl?: typeof rmSync },
): string | null {
  if (!existsSync(dir)) {
    return null;
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
