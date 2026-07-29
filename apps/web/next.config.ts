import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ehas2/design-system', '@ehas2/shared'],
};

export default nextConfig;
