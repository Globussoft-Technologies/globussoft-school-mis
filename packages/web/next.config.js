/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@mis-ilsms/shared'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4002/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
