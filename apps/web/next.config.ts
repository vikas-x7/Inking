import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    const target = process.env.API_PROXY_TARGET || 'http://localhost:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${target}/:path*`,
      },
    ];
  },
};

export default nextConfig;
