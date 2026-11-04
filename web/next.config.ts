import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Genera una salida autónoma para que la imagen de Docker no necesite todo node_modules.
  output: "standalone",
  // La web y la API comparten origen: el móvil solo necesita llegar al puerto de la web.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_INTERNAL_URL ?? "http://localhost:4000"}/api/:path*`,
      },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
