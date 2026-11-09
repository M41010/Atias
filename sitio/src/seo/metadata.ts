import type { Metadata } from "next";
import {
  type Crop,
  DEFAULT_LOCALE,
  LOCALES,
  type Locale,
  NOINDEX_PAGES,
  OG_LOCALE,
  type Page,
  pathFor,
} from "@/i18n/config";
import { absoluteUrl, HAS_DOMAIN, SITE_NAME } from "./site";

type PageMeta = {
  locale: Locale;
  page: Page;
  crop?: Crop;
  title: string;
  description: string;
  type?: "website" | "article";
};

/**
 * Enlaces de una página a sus versiones en los demás idiomas. «x-default» manda a la página de
 * elegir idioma en la portada y a la versión española en el resto.
 */
export function languageAlternates(page: Page, crop?: Crop): Record<string, string> {
  const languages: Record<string, string> = Object.fromEntries(
    LOCALES.map((code) => [code, absoluteUrl(pathFor(code, page, crop))]),
  );
  languages["x-default"] = absoluteUrl(page ? pathFor(DEFAULT_LOCALE, page, crop) : "/");
  return languages;
}

/** Metadatos de cada página: título, descripción, URL canónica, idiomas, redes y si se indexa. */
export function pageMetadata({ locale, page, crop, title, description, type = "website" }: PageMeta): Metadata {
  const url = absoluteUrl(pathFor(locale, page, crop));
  const indexable = HAS_DOMAIN && !NOINDEX_PAGES.includes(page);
  const image = { url: absoluteUrl(`/og/${locale}.png`), width: 1200, height: 630, alt: title };
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url, languages: languageAlternates(page, crop) },
    openGraph: {
      type,
      url,
      siteName: SITE_NAME,
      title,
      description,
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((code) => code !== locale).map((code) => OG_LOCALE[code]),
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
  };
}
