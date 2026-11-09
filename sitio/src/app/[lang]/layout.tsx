import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { isLocale, LOCALES } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { BRAND, HAS_DOMAIN, SITE_NAME, SITE_URL } from "@/seo/site";
import "../globals.css";

// Archivo variable: la anchura condensada da la voz de las placas impresas; la normal, el texto.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export const viewport: Viewport = { themeColor: BRAND.ink };

/**
 * Valores comunes a todas las páginas. Cada página pone después su título, descripción, URL
 * canónica e idiomas (src/seo/metadata.ts). Sin dominio, nada se indexa.
 */
export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    ...(HAS_DOMAIN ? { metadataBase: new URL(SITE_URL) } : {}),
    applicationName: SITE_NAME,
    title: dict.meta.title,
    description: dict.meta.description,
    robots: HAS_DOMAIN ? { index: true, follow: true } : { index: false, follow: true },
    icons: { icon: "/marca.svg", apple: "/apple-touch-icon.png" },
    manifest: "/manifest.webmanifest",
    formatDetection: { telephone: false },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  return (
    <html lang={lang} className={archivo.variable}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#contenido"
          className="sr-only z-50 bg-ink px-4 py-3 font-bold text-trap focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
        >
          {dict.nav.skip}
        </a>
        <Header locale={lang} nav={dict.nav} />
        <main id="contenido" className="flex-1">
          {children}
        </main>
        <Footer locale={lang} dict={dict} />
      </body>
    </html>
  );
}
