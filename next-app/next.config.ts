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
const isLocal =
  process.env.NEXT_PUBLIC_APP_ENV === 'local' ||
  process.env.EH_LOCAL_DEV === '1' ||
  process.env.NODE_ENV === 'development';

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
    if (!isLocal) return [];
    return [
      { source: '/api/v3/:path*', destination: `${LOCAL_PYTHON}/api/v3/:path*` },
      { source: '/api/:path*', destination: `${LOCAL_NODE}/api/:path*` },
      { source: '/health', destination: `${LOCAL_NODE}/health` },
      { source: '/uploads/:path*', destination: `${LOCAL_NODE}/uploads/:path*` },
    ];
  },
  async redirects() {
    return [
      { source: '/register', destination: '/signup', permanent: false },
    ];
  },
};

export default nextConfig;
