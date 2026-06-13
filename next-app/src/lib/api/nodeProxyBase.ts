/**
 * Backend Node API base for Next.js route handlers (server-side proxy).
 */
export function resolveNodeProxyBase(): string {
  const isLocal =
    process.env.NEXT_PUBLIC_APP_ENV === 'local' ||
    process.env.EH_LOCAL_DEV === '1' ||
    process.env.NODE_ENV === 'development';

  const configured = (process.env.NEXT_PUBLIC_NODE_API_URL || '').replace(/\/$/, '');
  if (configured) return configured;

  if (isLocal) return 'http://127.0.0.1:5000';

  return 'https://eh-arogya-api-production.up.railway.app';
}
