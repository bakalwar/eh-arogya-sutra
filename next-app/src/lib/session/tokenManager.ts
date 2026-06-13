import { appEnv } from '@/lib/api/config';

const ACCESS = 'eh_token';
const REFRESH = 'eh_refresh';
const USER = 'eh_user';
const LOCAL_AUTH_FLAG = 'eh_local_auth';

const ACCESS_MAX_AGE = 60 * 60 * 24;
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;

let refreshPromise: Promise<string | null> | null = null;

/** Cookie flags — Secure on HTTPS (Vercel production) */
function cookieSuffix() {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return '; Secure';
  }
  return '';
}

function setSessionCookie(name: string, value: string, maxAgeSec: number) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax; max-age=${maxAgeSec}${cookieSuffix()}`;
}

function getSessionCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

function deleteSessionCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; SameSite=Lax; max-age=0${cookieSuffix()}`;
}

export function isLocalDevMode() {
  return appEnv === 'local' || process.env.NODE_ENV === 'development';
}

export function isLanHost() {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(h) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)
  );
}

export function isLocalLanDev() {
  return isLocalDevMode() && isLanHost();
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* LAN / private mode — cookies remain primary */
  }
}

function removeStorage(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function decodeJwtPayload(token: string) {
  try {
    const parts = String(token).split('.');
    if (parts.length !== 3) return null;
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4;
    if (pad) b64 += '='.repeat(4 - pad);
    return JSON.parse(atob(b64)) as { exp?: number; role?: string };
  } catch {
    return null;
  }
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return getSessionCookie(ACCESS) || readStorage(ACCESS);
}

export function getRefreshToken() {
  if (typeof window === 'undefined') return null;
  return getSessionCookie(REFRESH) || readStorage(REFRESH);
}

export interface SessionUser {
  id: string;
  name: string;
  mobile?: string;
  email?: string;
  role?: string;
  mustChangePassword?: boolean;
}

export function getCurrentUser(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  const raw = getSessionCookie(USER) || readStorage(USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function hasLocalDevAuthGrace(): boolean {
  if (!isLocalLanDev()) return false;
  return (
    getSessionCookie(LOCAL_AUTH_FLAG) === '1' || readStorage(LOCAL_AUTH_FLAG) === '1'
  );
}

export function saveTokens(
  accessToken: string | undefined,
  refreshToken: string | undefined,
  user: SessionUser
) {
  if (typeof window === 'undefined') return;

  if (accessToken) {
    writeStorage(ACCESS, accessToken);
    setSessionCookie(ACCESS, accessToken, ACCESS_MAX_AGE);
  }
  if (refreshToken) {
    writeStorage(REFRESH, refreshToken);
    setSessionCookie(REFRESH, refreshToken, REFRESH_MAX_AGE);
  }
  if (user) {
    const userJson = JSON.stringify(user);
    writeStorage(USER, userJson);
    setSessionCookie(USER, userJson, REFRESH_MAX_AGE);
  }

  if (isLocalLanDev()) {
    writeStorage(LOCAL_AUTH_FLAG, '1');
    setSessionCookie(LOCAL_AUTH_FLAG, '1', REFRESH_MAX_AGE);
  }
}

export function setAccessToken(token: string) {
  writeStorage(ACCESS, token);
  setSessionCookie(ACCESS, token, ACCESS_MAX_AGE);
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  for (const key of [ACCESS, REFRESH, USER, LOCAL_AUTH_FLAG]) {
    removeStorage(key);
    deleteSessionCookie(key);
  }
}

export function isAuthenticated() {
  const user = getCurrentUser();
  const access = getToken();
  const refresh = getRefreshToken();

  if (!access && !refresh && !hasLocalDevAuthGrace()) return false;

  if (access) {
    const p = decodeJwtPayload(access);
    if (p && typeof p.exp === 'number' && Date.now() / 1000 < p.exp) return true;
  }

  if (refresh) return true;

  if (hasLocalDevAuthGrace() && user && access) return true;

  return false;
}

export async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) {
    if (!hasLocalDevAuthGrace()) clearSession();
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ refreshToken: refresh }),
    })
      .then(async (res) => {
        if (!res.ok) {
          if (!hasLocalDevAuthGrace()) clearSession();
          return hasLocalDevAuthGrace() ? getToken() : null;
        }
        const data = await res.json();
        const token = data.accessToken || data.token;
        if (token) {
          setAccessToken(token);
          return token as string;
        }
        if (!hasLocalDevAuthGrace()) clearSession();
        return null;
      })
      .catch(() => {
        if (!hasLocalDevAuthGrace()) clearSession();
        return hasLocalDevAuthGrace() ? getToken() : null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function getValidToken(): Promise<string | null> {
  const access = getToken();
  const refresh = getRefreshToken();

  if (access) {
    const p = decodeJwtPayload(access);
    if (p && typeof p.exp === 'number') {
      const expiresIn = p.exp - Date.now() / 1000;
      if (expiresIn > 120) return access;
    } else if (isLocalLanDev() && refresh) {
      return refreshAccessToken();
    } else if (!p && !isLocalLanDev()) {
      clearSession();
      return null;
    }
  }

  if (refresh) return refreshAccessToken();

  if (hasLocalDevAuthGrace() && access) return access;

  return null;
}

/** AuthGate + middleware — async verify with LAN local-dev grace */
export async function verifySession(): Promise<boolean> {
  if (isAuthenticated()) return true;

  const refresh = getRefreshToken();
  if (refresh) {
    const token = await refreshAccessToken();
    if (token) return true;
  }

  if (hasLocalDevAuthGrace() && getCurrentUser()) {
    const access = getToken();
    if (access || refresh) return true;
  }

  return false;
}

/** Cookie names for middleware (server-readable session marks) */
export const SESSION_COOKIE_NAMES = {
  access: ACCESS,
  refresh: REFRESH,
  user: USER,
  localAuth: LOCAL_AUTH_FLAG,
} as const;
