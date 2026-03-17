import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 15+ changed the router-cache TTL for dynamic routes from 30s to 0.
  // Restore it so navigating between tabs that were already loaded stays instant.
  experimental: {
    staleTimes: {
      dynamic: 300,
    },
    useCache: true,
  },
  images: {
    // Allow Sessionize profile picture URLs and other common CDN hosts.
    remotePatterns: [
      { protocol: "https", hostname: "sessionize.com" },
      { protocol: "https", hostname: "*.sessionize.com" },
    ],
  },
};

export default nextConfig;
