import type { NextConfig } from 'next';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { getLanIPv4 } = require('./rules/network-rule.js') as {
  getLanIPv4: () => string | null;
};

const LOCAL_NODE = process.env.NEXT_PUBLIC_NODE_API_URL || 'http://127.0.0.1:5000';
const LOCAL_PYTHON = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://127.0.0.1:8005';
const PROD_NODE_API =
  process.env.NEXT_PUBLIC_NODE_API_URL ||
  process.env.RAILWAY_API_URL ||
  'https://eh-arogya-api-production.up.railway.app';
const isLocal =
  process.env.NEXT_PUBLIC_APP_ENV === 'local' ||
  process.env.EH_LOCAL_DEV === '1' ||
  process.env.NODE_ENV === 'development';

function buildApiRewrites(): { source: string; destination: string }[] {
  const nodeBase = (isLocal ? LOCAL_NODE : PROD_NODE_API).replace(/\/$/, '');
  const pythonBase = (isLocal ? LOCAL_PYTHON : process.env.NEXT_PUBLIC_PYTHON_API_URL || '')
    .replace(/\/$/, '');

  const rules: { source: string; destination: string }[] = [];

  // Local dev: v3 can hit Python directly. Production: /api/* → Railway Node (includes /api/v3 proxy).
  if (isLocal && pythonBase) {
    rules.push({ source: '/api/v3/:path*', destination: `${pythonBase}/api/v3/:path*` });
  }

  rules.push(
    { source: '/health', destination: `${nodeBase}/health` },
    { source: '/api/:path*', destination: `${nodeBase}/api/:path*` },
    { source: '/uploads/:path*', destination: `${nodeBase}/uploads/:path*` },
  );

  return rules;
}

const nextPort = Number(process.env.NEXT_DEV_PORT || process.env.PORT) || 3001;
const lanIp = getLanIPv4();

const devOrigins = isLocal
  ? [
      ...(lanIp ? [`http://${lanIp}:${nextPort}`] : []),
      `http://localhost:${nextPort}`,
      `http://127.0.0.1:${nextPort}`,
    ]
  : [];

const nextConfig: NextConfig = {
  /** Allow phone / LAN browser origin during local dev (webpack / turbopack HMR) */
  allowedDevOrigins: devOrigins.length ? devOrigins : undefined,
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
  async rewrites() {
    return buildApiRewrites();
  },
  async redirects() {
    return [
      { source: '/register', destination: '/signup', permanent: false },
    ];
  },
};

export default nextConfig;
