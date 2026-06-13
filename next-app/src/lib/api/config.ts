/**
 * Local development API endpoints — Next.js rewrites proxy to these in dev.
 * Production builds must set NEXT_PUBLIC_* via hosting env (not local URLs).
 */
const LOCAL_NODE = 'http://127.0.0.1:5000';
const LOCAL_PYTHON = 'http://127.0.0.1:8005';

export const appEnv =
  process.env.NEXT_PUBLIC_APP_ENV ||
  (process.env.NODE_ENV === 'production' ? 'production' : 'local');

export function resolveNodeApiBase(): string {
  if (typeof window !== 'undefined') {
    // Browser: same-origin rewrites in next.config.ts
    return '';
  }
  return (process.env.NEXT_PUBLIC_NODE_API_URL || LOCAL_NODE).replace(/\/$/, '');
}

/** Browser → Railway direct (file uploads, bypass Vercel 4.5MB + multipart proxy limits). */
export function resolvePublicNodeApiBase(): string {
  const configured = (process.env.NEXT_PUBLIC_NODE_API_URL || '').replace(/\/$/, '');
  if (configured) return configured;
  if (appEnv === 'local') return LOCAL_NODE;
  return 'https://eh-arogya-api-production.up.railway.app';
}

export function resolvePythonApiBase(): string {
  if (typeof window !== 'undefined') {
    return '';
  }
  return (process.env.NEXT_PUBLIC_PYTHON_API_URL || LOCAL_PYTHON).replace(/\/$/, '');
}

export function resolveHealthUrl(): string {
  return '/health';
}

export const API_ENDPOINTS = {
  node: LOCAL_NODE,
  python: LOCAL_PYTHON,
} as const;
