import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Web estática: se puede publicar en cualquier alojamiento, sin servidor propio.
  output: "export",
  trailingSlash: true,
  poweredByHeader: false,
  images: { unoptimized: true },
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
