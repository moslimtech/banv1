import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure static files are served correctly
  async headers() {
    return [
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
