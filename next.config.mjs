/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produces a self-contained .next/standalone server — used by Docker runner stage
  output: 'standalone',
  experimental: {
  },
  // Ensure proper DNS resolution for GitHub API
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || [])];
    }
    return config;
  },
};

export default nextConfig;
