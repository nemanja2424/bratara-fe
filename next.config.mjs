/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'butikirna.com',
        pathname: '/api/proizvodi/slike/**',
      },
    ],
    minimumCacheTTL: 604800,
    formats: ['image/webp'],
  },
};

export default nextConfig;
