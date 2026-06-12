/**
 * Browser API base URL.
 * - Prod: same-origin `/api` (Vercel → Railway Node backend).
 * - Dev: Vite proxy → Node :5000 (NOT eh_api.py :8005 — Python has no /api/summary/* routes).
 */
export function resolveApiBase() {
  const fromEnv = (import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  if (typeof window !== 'undefined') {
    if (import.meta.env.PROD) return '';
    // Python EH API (8005) only has /api/v3/* — summary lives on Node /api/summary/eh-api
    if (!fromEnv || /:8005\b/.test(fromEnv)) return '';
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
