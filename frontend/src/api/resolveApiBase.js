/**
 * Production browser: same-origin `/api` + `/health` (Vercel rewrites → Railway).
 * Avoids CORS and direct Railway cold-start failures from the login page.
 */
export function resolveApiBase() {
  const fromEnv = (import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    return '';
  }
  return fromEnv;
}

export function resolveHealthUrl() {
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    return '/health';
  }
  const base = resolveApiBase();
  return base ? `${base}/health` : '/health';
}
