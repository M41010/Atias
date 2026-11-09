import type { MetadataRoute } from "next";
import { type Crop, CROPS, LOCALES, NOINDEX_PAGES, type Page, PAGES, pathFor } from "@/i18n/config";
import { languageAlternates } from "@/seo/metadata";
import { absoluteUrl, HAS_DOMAIN } from "@/seo/site";

export const dynamic = "force-static";

/** Prioridad orientativa: la portada y el producto primero; la guía y los cultivos después. */
const PRIORITY: Partial<Record<Page, number>> = { "": 1, producto: 0.9, "aforo-de-cosecha": 0.8, cultivos: 0.7 };

/**
 * Mapa del sitio con todas las páginas indexables en los seis idiomas y sus equivalencias.
 * Sin dominio (NEXT_PUBLIC_SITE_URL vacía) sale vacío: no se publican direcciones falsas.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!HAS_DOMAIN) return [];
  const lastModified = new Date();
  const routes: { page: Page; crop?: Crop }[] = [
    ...PAGES.filter((page) => !NOINDEX_PAGES.includes(page)).map((page) => ({ page })),
    ...CROPS.map((crop) => ({ page: "cultivos" as const, crop })),
  ];
  return routes.flatMap(({ page, crop }) =>
    LOCALES.map((locale) => ({
      url: absoluteUrl(pathFor(locale, page, crop)),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: crop ? 0.6 : (PRIORITY[page] ?? 0.5),
      alternates: { languages: languageAlternates(page, crop) },
    })),
  );
}
