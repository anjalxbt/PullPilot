/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: true,
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
