import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Qué puede cargar y ejecutar la página: solo lo que viene de la propia web. Next.js necesita
 * scripts y estilos en línea; sin nonces no se pueden quitar sin renunciar a las páginas estáticas.
 * Al pasar a HTTPS, añadir upgrade-insecure-requests y Strict-Transport-Security (en docs/DOCKER.md).
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "media-src 'self' blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // Ninguna otra web puede mostrar Atias dentro de la suya para engañar con clics.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // La dirección /subir/… contiene el enlace privado del agricultor: nunca se envía a otra web.
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Genera una salida autónoma para que la imagen de Docker no necesite todo node_modules.
  output: "standalone",
  // No anuncia con qué está hecha la web.
  poweredByHeader: false,
  // La web y la API comparten origen: el móvil solo necesita llegar al puerto de la web.
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Sin esto, el navegador tardaría en recibir las versiones nuevas del service worker.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
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
  experimental: {
    // Next comprueba en desarrollo que cada página navegue al instante, pero nuestras páginas no se
    // dibujan en el servidor: AuthGate espera a la sesión, en el navegador, antes de enseñarlas. Next
    // las da por «descartadas» y avisaba en cada pantalla («Could not validate that a segment in
    // your UI has instant navigation»). Las páginas son componentes de cliente y no pueden exportar
    // `instant = false`; así solo se comprueba la página que lo pida con `export const instant`.
    instantInsights: { validationLevel: "manual-warning" },
  },
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
