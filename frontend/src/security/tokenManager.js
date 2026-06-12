const ACCESS = 'eh_token';
const REFRESH = 'eh_refresh';
const USER = 'eh_user';

function authApiUrl(path) {
  if (import.meta.env.PROD && typeof window !== 'undefined') return path;
  const base = (import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  return base ? `${base}${path}` : path;
}

let refreshPromise = null;

function decodeJwtPayload(token) {
  try {
    const parts = String(token).split('.');
    if (parts.length !== 3) return null;
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4;
    if (pad) b64 += '='.repeat(4 - pad);
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

export function getToken() {
  return localStorage.getItem(ACCESS);
}

export function getAccessToken() {
  return getToken();
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH);
}

/** Save session after successful OTP verify. */
export function setSession(accessToken, user, refreshToken) {
  saveTokens(accessToken, refreshToken, user);
}

export function saveTokens(accessToken, refreshToken, user) {
  if (accessToken) localStorage.setItem(ACCESS, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH, refreshToken);
  if (user) localStorage.setItem(USER, JSON.stringify(user));
}

export function setAccessToken(token) {
  if (token) localStorage.setItem(ACCESS, token);
}

export function getUser() {
  return getCurrentUser();
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  clearTokens();
}

export function clearTokens() {
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
  localStorage.removeItem(USER);
}

/** Logged in if access valid OR refresh token present (7-day session). */
export function isSuperAdmin() {
  const user = getCurrentUser();
  return user?.role === 'super_admin' && isAuthenticated();
}

export function isAdminRole() {
  const role = getCurrentUser()?.role;
  return role === 'admin' || role === 'super_admin';
}

export function isAuthenticated() {
  const access = getToken();
  const refresh = getRefreshToken();
  if (!access && !refresh) return false;

  if (access) {
    const p = decodeJwtPayload(access);
    if (p && typeof p.exp === 'number' && Date.now() / 1000 < p.exp) return true;
  }
  return !!refresh;
}

/** Returns a valid access token, refreshing silently when < 2 min left. */
export async function getValidToken() {
  const access = getToken();
  const refresh = getRefreshToken();

  if (!access) {
    if (refresh) return refreshAccessToken();
    return null;
  }

  const p = decodeJwtPayload(access);
  if (!p || typeof p.exp !== 'number') {
    clearSession();
    return null;
  }

  const expiresIn = p.exp - Date.now() / 1000;
  if (expiresIn > 120) return access;

  if (refresh) return refreshAccessToken();

  clearSession();
  return null;
}

export async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) {
    clearSession();
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = fetch(authApiUrl('/api/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh })
    })
      .then(async (res) => {
        if (!res.ok) {
          clearSession();
          return null;
        }
        const data = await res.json();
        const token = data.accessToken || data.token;
        if (token) {
          setAccessToken(token);
          return token;
        }
        clearSession();
        return null;
      })
      .catch(() => {
        clearSession();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}
