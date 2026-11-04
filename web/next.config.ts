import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Genera una salida autónoma para que la imagen de Docker no necesite todo node_modules.
  output: "standalone",
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
