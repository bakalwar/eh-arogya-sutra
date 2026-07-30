import { createHash } from 'node:crypto';
import { ValidationError } from './domainErrors.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function assertUuid(value: string, field = 'id'): void {
  if (!UUID_RE.test(value)) {
    throw new ValidationError(`Invalid ${field}`);
  }
}

export function normalizeDisplayName(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (trimmed.length < 1 || trimmed.length > 200) {
    throw new ValidationError('displayName length out of bounds');
  }
  return trimmed;
}

export function assertOptionalDateOfBirth(value: string | null | undefined): string | null {
  if (value == null || value === '') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidationError('Invalid dateOfBirth');
  }
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw new ValidationError('Invalid dateOfBirth');
  const today = new Date();
  if (d.getTime() > Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())) {
    throw new ValidationError('dateOfBirth cannot be in the future');
  }
  return value;
}

export function assertOptionalMaskedContact(
  value: string | null | undefined,
  field: string,
  max = 64,
): string | null {
  if (value == null || value === '') return null;
  const trimmed = value.trim();
  if (trimmed.length > max) throw new ValidationError(`${field} too long`);
  if (/[+]?\d{10,}/.test(trimmed.replace(/\s/g, ''))) {
    throw new ValidationError(`${field} must be masked`);
  }
  return trimmed;
}

export function clampPageLimit(limit: number | undefined, fallback = 50, max = 100): number {
  if (limit == null) return fallback;
  if (!Number.isInteger(limit) || limit < 1) throw new ValidationError('Invalid limit');
  return Math.min(limit, max);
}

export function hashPayload(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export const MAX_FINDING_BATCH = 50;

export function assertBoundedBatch(size: number): void {
  if (!Number.isInteger(size) || size < 1 || size > MAX_FINDING_BATCH) {
    throw new ValidationError(`Batch size must be 1..${MAX_FINDING_BATCH}`);
  }
}
