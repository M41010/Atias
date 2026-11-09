import { type Crop, type Locale, type Page, pathFor } from "@/i18n/config";
import { absoluteUrl, SITE_NAME } from "./site";

/**
 * Datos estructurados (schema.org) para que los buscadores entiendan quién es Atias, qué ofrece y
 * cómo se ordenan las páginas. Solo describen lo que la web ya dice: ni precios, ni valoraciones,
 * ni cifras de precisión.
 */

const ORG_ID = () => absoluteUrl("/#organizacion");
const SITE_ID = () => absoluteUrl("/#web");

export function organization(description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID(),
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/logo-512.png"),
    description,
  };
}

export function website(locale: Locale, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE_ID(),
    name: SITE_NAME,
    url: absoluteUrl("/"),
    description,
    inLanguage: locale,
    publisher: { "@id": ORG_ID() },
  };
}

export function software(locale: Locale, name: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Agricultura",
    operatingSystem: "Web",
    inLanguage: locale,
    url: absoluteUrl(pathFor(locale, "producto")),
    publisher: { "@id": ORG_ID() },
  };
}

export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqPage(locale: Locale, items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function article(locale: Locale, page: Page, headline: string, description: string, date: string, crop?: Crop) {
  const url = absoluteUrl(pathFor(locale, page, crop));
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    inLanguage: locale,
    datePublished: date,
    dateModified: date,
    mainEntityOfPage: url,
    url,
    image: absoluteUrl(`/og/${locale}.png`),
    author: { "@id": ORG_ID() },
    publisher: { "@id": ORG_ID() },
  };
}
