import { createHash } from 'node:crypto';

/** SHA-256 of empty UTF-8 string — pinned empty-set snapshot fingerprint. */
export const EMPTY_FACT_VERIFICATION_SNAPSHOT_FINGERPRINT =
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

/**
 * Canonical F3D-2D5 normalization snapshot fingerprint (must match SQL
 * ehas2_fact_verification_snapshot_fingerprint):
 * - unique lines `lower(uuid) + ':' + lower(64-hex identity)`
 * - sorted by line (byte/code-point order of that closed format)
 * - joined with LF (`\n`)
 * - SHA-256 over UTF-8 bytes → lowercase hex
 * - empty set → SHA-256('')
 */
export function buildNormalizationSnapshotFingerprint(
  norms: readonly { id: string; normalizationIdentityFingerprint: string }[],
): string {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const n of norms) {
    const id = String(n.id).trim().toLowerCase();
    const fp = String(n.normalizationIdentityFingerprint).trim().toLowerCase();
    const line = `${id}:${fp}`;
    if (seen.has(line)) continue;
    seen.add(line);
    lines.push(line);
  }
  lines.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const canonical = lines.join('\n');
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}
