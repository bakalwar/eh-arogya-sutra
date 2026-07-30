/** UI-preview auth helpers — NOT real authentication. Never log OTP/phone. */

export const AUTH_PREVIEW_BANNER =
  'OTP provider is not configured. Real authentication cannot complete.' as const;
export const UI_PREVIEW_SESSION_LABEL = 'UI PREVIEW' as const;
export const DEMO_DOCTOR_NAME = 'Demo Doctor' as const;

const PHONE_RE = /^[6-9]\d{9}$/;

export function normalizeIndianMobile(input: string): string {
  return input.replace(/\D/g, '').slice(-10);
}

export function validateIndianMobile(input: string): { ok: boolean; message?: string } {
  const digits = normalizeIndianMobile(input);
  if (!digits) return { ok: false, message: 'Mobile number is required.' };
  if (digits.length !== 10) return { ok: false, message: 'Enter a 10-digit mobile number.' };
  if (!PHONE_RE.test(digits)) return { ok: false, message: 'Enter a valid Indian mobile number.' };
  return { ok: true };
}

export function maskMobile(digits: string): string {
  const d = normalizeIndianMobile(digits);
  if (d.length !== 10) return '••••••••••';
  return `${d.slice(0, 2)}••••••${d.slice(-2)}`;
}

export function isUniversalOtp(code: string): boolean {
  const banned = new Set(['000000', '123456', '111111', '999999']);
  return banned.has(code);
}

/** Parse clipboard text into six OTP digit slots (UI-only). */
export function applyOtpPaste(pasted: string): string[] {
  const digits = pasted.replace(/\D/g, '').slice(0, 6);
  return Array.from({ length: 6 }, (_, i) => digits[i] ?? '');
}

/** Development-only preview continuation — not production auth success. */
export const UI_PREVIEW_CONTINUE_LABEL = 'Continue UI preview (not real authentication)' as const;

export function createLocalSupportId(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SUP-PREV-${stamp}-${rand}`;
}
