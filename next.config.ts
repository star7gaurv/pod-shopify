import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // self-hosted deployment
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  // Allow Shopify embedded app iframe (Content-Security-Policy set in middleware)
  async headers() {
    return [
      {
        source: "/shopify/:path*",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
        ],
      },
    ];
  },
};

export default nextConfig;
