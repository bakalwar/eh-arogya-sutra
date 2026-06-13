/**
 * Browser API base URL.
 * - Prod (Next/Vercel): Railway Node for /api/search/* and /api/v3/* via VITE_NODE_API_URL.
 * - Dev: Vite proxy → Node :5000
 */
const RAILWAY_FALLBACK = 'https://eh-arogya-api-production.up.railway.app';

export function resolveApiBase() {
  const nodeUrl = (
    import.meta.env.VITE_NODE_API_URL ||
    import.meta.env.VITE_API_BASE ||
    import.meta.env.VITE_API_URL ||
    ''
  ).replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    if (import.meta.env.PROD) {
      return nodeUrl || RAILWAY_FALLBACK;
    }
    if (!nodeUrl || /:8005\b/.test(nodeUrl)) return '';
  }
  return nodeUrl;
}

export function resolveHealthUrl() {
  const base = resolveApiBase();
  return base ? `${base}/health` : '/health';
}
