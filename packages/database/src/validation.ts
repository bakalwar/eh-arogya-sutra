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

/** Reject HTML/script injection vectors in free-text profile fields (fail closed). */
export function rejectUnsafeMarkup(value: string, field: string): void {
  if (/[<>]|javascript:|data:text\/html|on\w+\s*=/i.test(value)) {
    throw new ValidationError(`${field} contains disallowed markup`);
  }
}

function normalizeBoundedText(raw: string, field: string, min: number, max: number): string {
  const normalized = raw.normalize('NFC').trim().replace(/\s+/g, ' ');
  if (normalized.length < min || normalized.length > max) {
    throw new ValidationError(`${field} length out of bounds`);
  }
  rejectUnsafeMarkup(normalized, field);
  return normalized;
}

export function assertOptionalBoundedText(
  value: string | null | undefined,
  field: string,
  max: number,
): string | null {
  if (value == null || value === '') return null;
  return normalizeBoundedText(value, field, 1, max);
}

export function assertRequiredBoundedText(value: string, field: string, max: number): string {
  return normalizeBoundedText(value, field, 1, max);
}

export function assertOptionalEmail(value: string | null | undefined): string | null {
  if (value == null || value === '') return null;
  const email = value.normalize('NFC').trim().toLowerCase();
  if (email.length > 254) throw new ValidationError('email too long');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationError('Invalid email');
  return email;
}

/** Digits and optional leading + only; does not invent a country code. */
export function assertOptionalPhone(
  value: string | null | undefined,
  field: string,
): string | null {
  if (value == null || value === '') return null;
  const trimmed = value.normalize('NFC').trim();
  if (trimmed.length > 20) throw new ValidationError(`${field} too long`);
  if (!/^\+?[0-9][0-9\s-]{6,18}[0-9]$/.test(trimmed)) {
    throw new ValidationError(`Invalid ${field}`);
  }
  return trimmed.replace(/\s+/g, ' ');
}

export function assertLanguageCode(value: string): string {
  const code = value.trim().toLowerCase();
  if (!/^[a-z]{2}(-[a-z]{2})?$/.test(code)) throw new ValidationError('Invalid language code');
  return code;
}

export function assertTimezone(value: string): string {
  const tz = value.trim();
  if (tz.length < 3 || tz.length > 64) throw new ValidationError('Invalid timezone');
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
  } catch {
    throw new ValidationError('Invalid timezone');
  }
  return tz;
}

export function assertOptionalYear(
  value: number | null | undefined,
  field: string,
  min: number,
  max: number,
): number | null {
  if (value == null) return null;
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new ValidationError(`Invalid ${field}`);
  }
  return value;
}

export function assertOptionalIsoDate(
  value: string | null | undefined,
  field: string,
): string | null {
  if (value == null || value === '') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ValidationError(`Invalid ${field}`);
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw new ValidationError(`Invalid ${field}`);
  return value;
}

export function assertRegistrationDates(issuedOn: string | null, expiresOn: string | null): void {
  if (issuedOn && expiresOn && expiresOn < issuedOn) {
    throw new ValidationError('expiresOn cannot be before issuedOn');
  }
}

export function assertDisplayOrder(value: number | undefined): number {
  if (value == null) return 0;
  if (!Number.isInteger(value) || value < 0 || value > 10_000) {
    throw new ValidationError('Invalid displayOrder');
  }
  return value;
}

export function assertDayOfWeek(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 6) {
    throw new ValidationError('Invalid dayOfWeek');
  }
  return value;
}

export function assertOptionalTime(value: string | null | undefined, field: string): string | null {
  if (value == null || value === '') return null;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new ValidationError(`Invalid ${field}`);
  return value;
}

export function assertCountryCode(value: string): string {
  const code = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) throw new ValidationError('Invalid country');
  return code;
}

export function assertPostalCode(value: string | null | undefined): string | null {
  if (value == null || value === '') return null;
  const code = value.normalize('NFC').trim();
  if (code.length > 16 || !/^[A-Za-z0-9\s-]+$/.test(code)) {
    throw new ValidationError('Invalid postalCode');
  }
  return code;
}
