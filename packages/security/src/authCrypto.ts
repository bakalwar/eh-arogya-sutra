import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/** Auth crypto helpers — never log inputs that may contain OTP or tokens. */

export function requireAuthPepper(env: Record<string, string | undefined> = process.env): string {
  const pepper = env.EHAS2_AUTH_PEPPER?.trim();
  if (pepper && pepper.length >= 32) return pepper;
  const nodeEnv = (env.EHAS2_NODE_ENV ?? env.NODE_ENV ?? '').toLowerCase();
  if (nodeEnv === 'test') {
    return 'EHAS2_TEST_AUTH_PEPPER_SYNTHETIC_ONLY_DO_NOT_USE_IN_PROD_32';
  }
  throw new Error('EHAS2_AUTH_PEPPER is required outside test');
}

export function normalizeIndianMobile(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  const last10 = digits.slice(-10);
  if (!/^[6-9]\d{9}$/.test(last10)) return null;
  return `+91${last10}`;
}

export function hashContact(normalizedE164: string, pepper: string): string {
  return createHmac('sha256', pepper).update(`contact:${normalizedE164}`).digest('hex');
}

export function contactLast4(normalizedE164: string): string {
  return normalizedE164.replace(/\D/g, '').slice(-4);
}

export function hashIp(ip: string | null | undefined, pepper: string): string | null {
  if (!ip?.trim()) return null;
  return createHmac('sha256', pepper).update(`ip:${ip.trim()}`).digest('hex');
}

export function hashUserAgent(ua: string | null | undefined, pepper: string): string | null {
  if (!ua?.trim()) return null;
  return createHmac('sha256', pepper).update(`ua:${ua.trim()}`).digest('hex');
}

export function generateOtpCode(): string {
  // Cryptographic 6-digit OTP; never log or return from APIs.
  const n = randomBytes(4).readUInt32BE(0) % 1_000_000;
  return String(n).padStart(6, '0');
}

export function hashOtp(code: string, salt: string, pepper: string): string {
  const derived = scryptSync(`${pepper}:${code}`, salt, 32);
  return derived.toString('hex');
}

export function verifyOtp(
  code: string,
  salt: string,
  pepper: string,
  expectedHex: string,
): boolean {
  const actual = Buffer.from(hashOtp(code, salt, pepper), 'hex');
  const expected = Buffer.from(expectedHex, 'hex');
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function generateOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string, pepper: string): string {
  return createHmac('sha256', pepper).update(`token:${token}`).digest('hex');
}

export function generateCsrfToken(): string {
  return randomBytes(24).toString('base64url');
}

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function newSalt(): string {
  return randomBytes(16).toString('hex');
}
