import { createHash } from 'node:crypto';

export function nfcNormalize(value: string): string {
  return value.normalize('NFC');
}

function sortValue(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sortValue(item));
  }
  const record = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(record).sort()) {
    const raw = record[key];
    sorted[key] = typeof raw === 'string' ? nfcNormalize(raw) : sortValue(raw);
  }
  return sorted;
}

/** CANON_JSON_V1 — sorted keys, no insignificant whitespace, NFC strings. */
export function canonicalJsonString(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

export function sha256HexLower(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

export function assertDigestHex64(hex: string, label: string): void {
  if (!/^[0-9a-f]{64}$/.test(hex)) {
    throw new Error(`${label} must be 64 lowercase hex characters`);
  }
}
