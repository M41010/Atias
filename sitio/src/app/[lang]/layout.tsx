import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { isLocale, LOCALES } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import "../globals.css";

// Archivo variable: la anchura condensada da la voz de las placas impresas; la normal, el texto.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      languages: Object.fromEntries(LOCALES.map((code) => [code, `/${code}/`])),
    },
    openGraph: { title: dict.meta.title, description: dict.meta.description, locale: lang, type: "website" },
    icons: { icon: "/marca.svg" },
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
