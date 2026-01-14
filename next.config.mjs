/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4002',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'skylith.cloud',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.skylith.cloud',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
