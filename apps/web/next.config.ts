import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Optional override when `.next` is locked by a local `next dev` process.
  distDir: process.env.EHAS2_NEXT_DIST_DIR || '.next',
  transpilePackages: ['@ehas2/design-system', '@ehas2/shared', '@ehas2/management-contracts'],
};

export default nextConfig;
