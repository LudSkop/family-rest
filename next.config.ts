import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  reactCompiler: true,
  images: {
    // Фото страв з бекенда (Oracle Object Storage)
    remotePatterns: [
      new URL(
        "https://objectstorage.eu-frankfurt-1.oraclecloud.com/n/fr76arfm8eim/b/backend-showcase-media-dev/o/**",
      ),
    ],
  },
  async rewrites() {
    return {
      // Усе /api/v1/*, для чого немає нашого Route Handler, йде на бекенд як є.
      // Потрібно для Google-входу: браузер має сам отримати 302 і cookie від API
      fallback: [
        {
          source: "/api/v1/:path*",
          destination: `${process.env.API_URL}/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
