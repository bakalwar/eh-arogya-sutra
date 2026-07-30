/**
 * Cookie + CSRF policy helpers for Phase 4A opaque sessions.
 */

export const SESSION_COOKIE_NAME = 'ehas2_sid';
export const CSRF_COOKIE_NAME = 'ehas2_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';

export type CookieAttrs = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Lax' | 'Strict' | 'None';
  path: string;
  maxAgeSec: number;
};

export function sessionCookieAttrs(isProd: boolean, maxAgeSec: number): CookieAttrs {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'Lax',
    path: '/',
    maxAgeSec,
  };
}

export function csrfCookieAttrs(isProd: boolean, maxAgeSec: number): CookieAttrs {
  return {
    httpOnly: false,
    secure: isProd,
    sameSite: 'Lax',
    path: '/',
    maxAgeSec,
  };
}

export function serializeCookie(name: string, value: string, attrs: CookieAttrs): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${attrs.path}`,
    `Max-Age=${attrs.maxAgeSec}`,
    `SameSite=${attrs.sameSite}`,
  ];
  if (attrs.httpOnly) parts.push('HttpOnly');
  if (attrs.secure) parts.push('Secure');
  return parts.join('; ');
}

export function clearCookie(name: string, attrs: Omit<CookieAttrs, 'maxAgeSec'>): string {
  return serializeCookie(name, '', { ...attrs, maxAgeSec: 0 });
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    try {
      out[k] = decodeURIComponent(v);
    } catch {
      out[k] = v;
    }
  }
  return out;
}

/** Origin validation for cookie-authenticated mutations. */
export function originAllowed(
  origin: string | undefined,
  host: string | undefined,
  allowedOrigins: string[],
): boolean {
  if (!origin?.trim()) return false;
  if (allowedOrigins.includes(origin)) return true;
  if (host && (origin === `http://${host}` || origin === `https://${host}`)) return true;
  return false;
}
