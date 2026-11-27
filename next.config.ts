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
      // Усе /api/v1/* йде на бекенд як є: статус, тіло, cookie і заголовки без змін.
      // Саме fallback, а не звичайний rewrite: він спрацьовує після динамічних
      // маршрутів, тож потокові Route Handlers асистента лишаються першими
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
