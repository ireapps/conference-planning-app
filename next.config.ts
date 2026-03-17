import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow Sessionize profile picture URLs and other common CDN hosts.
    remotePatterns: [
      { protocol: "https", hostname: "sessionize.com" },
      { protocol: "https", hostname: "*.sessionize.com" },
    ],
  },
};

export default nextConfig;
