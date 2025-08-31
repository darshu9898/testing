/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
// In your next.config.mjs, make sure you have:
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'picsum.photos',
      pathname: '/**',
    },
    {
      protocol: 'http',
      hostname: 'localhost',
      port: '3000',
      pathname: '/**',
    },
  ],
},
};

export default nextConfig;
