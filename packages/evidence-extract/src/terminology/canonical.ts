import { createHash } from 'node:crypto';
import { TerminologyPackError } from './errors.js';
import { CHECKSUM_EXCLUDED_KEYS, type TerminologyPack } from './types.js';

const EXCLUDED = new Set<string>(CHECKSUM_EXCLUDED_KEYS);

export function nfc(value: string): string {
  return value.normalize('NFC');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function canonicalizeValue(value: unknown): unknown {
  if (typeof value === 'string') return nfc(value);
  if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      throw new TerminologyPackError('TERMINOLOGY_PACK_INVALID');
    }
    return value;
  }
  if (typeof value === 'boolean' || value === null) return value;
  if (Array.isArray(value)) {
    return value.map((item) => canonicalizeValue(item));
  }
  if (isPlainObject(value)) {
    const keys = Object.keys(value).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    const out: Record<string, unknown> = {};
    for (const key of keys) {
      out[key] = canonicalizeValue(value[key]);
    }
    return out;
  }
  throw new TerminologyPackError('TERMINOLOGY_PACK_INVALID');
}

function checksumBody(pack: Record<string, unknown>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const key of Object.keys(pack)) {
    if (EXCLUDED.has(key)) continue;
    body[key] = pack[key];
  }
  if (Array.isArray(body.entries)) {
    const entries = [...body.entries] as Record<string, unknown>[];
    entries.sort((a, b) => {
      const idA = nfc(String(a.id ?? ''));
      const idB = nfc(String(b.id ?? ''));
      return idA < idB ? -1 : idA > idB ? 1 : 0;
    });
    body.entries = entries;
  }
  return canonicalizeValue(body) as Record<string, unknown>;
}

/** Canonical JSON bytes for checksum: sorted keys, NFC strings, entries sorted by id. */
export function canonicalChecksumJson(pack: Record<string, unknown>): string {
  return JSON.stringify(checksumBody(pack));
}

export function sha256Utf8(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function computeContentChecksum(pack: Record<string, unknown>): string {
  return sha256Utf8(canonicalChecksumJson(pack));
}

export function checksumHexOfPack(pack: TerminologyPack): string {
  return computeContentChecksum(pack as unknown as Record<string, unknown>);
}
