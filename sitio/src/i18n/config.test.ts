import { describe, expect, it } from "vitest";
import { CROP_SLUGS, CROPS, LOCALES, PAGES, pathFor, routeFromPath, SLUGS, swapLocale } from "./config";
import { getContent } from "./content";

describe("direcciones traducidas", () => {
  it("cada idioma tiene direcciones distintas para cada página y cada cultivo", () => {
    for (const locale of LOCALES) {
      const slugs = Object.values(SLUGS[locale]);
      expect(new Set(slugs).size).toBe(slugs.length);
      const crops = Object.values(CROP_SLUGS[locale]);
      expect(new Set(crops).size).toBe(crops.length);
      for (const slug of [...slugs, ...crops]) expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("traduce la dirección de cada página", () => {
    expect(pathFor("es")).toBe("/es/");
    expect(pathFor("en", "producto")).toBe("/en/product/");
    expect(pathFor("fr", "cultivos", "pimiento")).toBe("/fr/cultures/poivron/");
    expect(pathFor("es", "producto", "pepino")).toBe("/es/producto/");
  });

  it("reconoce cualquier dirección y la lleva a otro idioma sin perder la página", () => {
    for (const locale of LOCALES) {
      for (const page of PAGES) {
        const path = pathFor(locale, page);
        expect(routeFromPath(path)).toMatchObject({ locale, page });
        for (const target of LOCALES) expect(swapLocale(path, target)).toBe(pathFor(target, page));
      }
      for (const crop of CROPS) {
        const path = pathFor(locale, "cultivos", crop);
        for (const target of LOCALES) expect(swapLocale(path, target)).toBe(pathFor(target, "cultivos", crop));
      }
    }
  });

  it("si no reconoce la dirección, manda a la portada del idioma", () => {
    expect(swapLocale("/es/no-existe/", "en")).toBe("/en/");
    expect(swapLocale("/", "fr")).toBe("/fr/");
  });
});

describe("contenido en los seis idiomas", () => {
  const es = getContent("es");

  it("todos tienen las mismas preguntas, secciones de la guía y de cada cultivo", () => {
    for (const locale of LOCALES) {
      const content = getContent(locale);
      expect(content.faq.items).toHaveLength(es.faq.items.length);
      expect(content.guide.sections.map((s) => s.paragraphs.length)).toEqual(es.guide.sections.map((s) => s.paragraphs.length));
      for (const crop of CROPS) expect(content.crops[crop].sections).toHaveLength(es.crops[crop].sections.length);
    }
  });

  it("los títulos para buscadores caben en el resultado de búsqueda", () => {
    for (const locale of LOCALES) {
      const content = getContent(locale);
      const titles = [...Object.values(content.seo).map((s) => s.title), ...CROPS.map((c) => content.crops[c].seoTitle)];
      for (const title of titles) expect(title.length, `${locale}: ${title}`).toBeLessThanOrEqual(65);
    }
  });
});
