import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import type { ReactNode } from "react";
import { languageAlternates } from "@/seo/metadata";
import { absoluteUrl, BRAND, HAS_DOMAIN, SITE_URL } from "@/seo/site";
import "../globals.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });

export const viewport: Viewport = { themeColor: BRAND.ink };

/** La raíz elige idioma: es la página «x-default» de la portada en todos los idiomas. */
export const metadata: Metadata = {
  ...(HAS_DOMAIN ? { metadataBase: new URL(SITE_URL) } : {}),
  title: "Atias · Previsión de cosecha en invernadero",
  description:
    "Atias cuenta la fruta madura con un vídeo por hilera y prevé los kilos de cada día y los temporeros. Harvest forecasting for greenhouses from video.",
  alternates: { canonical: absoluteUrl("/"), languages: languageAlternates("") },
  robots: HAS_DOMAIN ? { index: true, follow: true } : { index: false, follow: true },
  icons: { icon: "/marca.svg", apple: "/apple-touch-icon.png" },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={archivo.variable}>
      <body>{children}</body>
    </html>
  );
}
