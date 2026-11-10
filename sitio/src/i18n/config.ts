export const LOCALES = ["es", "en", "fr", "nl", "it", "pt"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "es";

/** Nombre de cada idioma en su propia lengua, para el selector. */
export const LOCALE_NAMES: Record<Locale, string> = {
  es: "Español",
  en: "English",
  fr: "Français",
  nl: "Nederlands",
  it: "Italiano",
  pt: "Português",
};

/** Formato de números de cada idioma (separador de miles y decimales). */
export const NUMBER_LOCALE: Record<Locale, string> = {
  es: "es-ES",
  en: "en-GB",
  fr: "fr-FR",
  nl: "nl-NL",
  it: "it-IT",
  pt: "pt-PT",
};

/** Idioma y país para Open Graph. */
export const OG_LOCALE: Record<Locale, string> = {
  es: "es_ES",
  en: "en_GB",
  fr: "fr_FR",
  nl: "nl_NL",
  it: "it_IT",
  pt: "pt_PT",
};

export const isLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value);

/**
 * Páginas de la web. La clave interna es el nombre en español; la dirección pública se traduce
 * a cada idioma con SLUGS («producto» es /en/product/, /fr/produit/…).
 */
export const PAGES = [
  "",
  "empresa",
  "producto",
  "contacto",
  "aviso-legal",
  "privacidad",
  "aforo-de-cosecha",
  "preguntas-frecuentes",
  "cultivos",
  "vision",
  "como-medimos",
  "inversores",
  "diario",
  "articulos",
  "planificar-temporeros",
  "errores-al-prever",
  "precision-de-la-prevision",
] as const;
export type Page = (typeof PAGES)[number];
export type SubPage = Exclude<Page, "">;

/** Cultivos del piloto: cada uno tiene su página dentro de «cultivos». */
export const CROPS = ["tomate-cherry", "pimiento", "pepino"] as const;
export type Crop = (typeof CROPS)[number];

/** Páginas que no deben aparecer en buscadores. */
export const NOINDEX_PAGES: readonly Page[] = ["aviso-legal", "privacidad"];

export const SLUGS: Record<Locale, Record<SubPage, string>> = {
  es: {
    empresa: "empresa",
    producto: "producto",
    contacto: "contacto",
    "aviso-legal": "aviso-legal",
    privacidad: "privacidad",
    "aforo-de-cosecha": "aforo-de-cosecha",
    "preguntas-frecuentes": "preguntas-frecuentes",
    cultivos: "cultivos",
    vision: "vision",
    "como-medimos": "como-medimos",
    inversores: "inversores",
    diario: "diario",
    "articulos": "articulos",
    "planificar-temporeros": "planificar-temporeros",
    "errores-al-prever": "errores-al-prever-la-cosecha",
    "precision-de-la-prevision": "precision-de-la-prevision",
  },
  en: {
    empresa: "about",
    producto: "product",
    contacto: "contact",
    "aviso-legal": "legal-notice",
    privacidad: "privacy",
    "aforo-de-cosecha": "crop-yield-estimation",
    "preguntas-frecuentes": "faq",
    cultivos: "crops",
    vision: "vision",
    "como-medimos": "how-we-measure",
    inversores: "investors",
    diario: "journal",
    "articulos": "articles",
    "planificar-temporeros": "planning-pickers",
    "errores-al-prever": "harvest-forecast-mistakes",
    "precision-de-la-prevision": "forecast-accuracy",
  },
  fr: {
    empresa: "a-propos",
    producto: "produit",
    contacto: "contact",
    "aviso-legal": "mentions-legales",
    privacidad: "confidentialite",
    "aforo-de-cosecha": "estimation-de-recolte",
    "preguntas-frecuentes": "questions-frequentes",
    cultivos: "cultures",
    vision: "vision",
    "como-medimos": "comment-nous-mesurons",
    inversores: "investisseurs",
    diario: "journal",
    "articulos": "articles",
    "planificar-temporeros": "planifier-saisonniers",
    "errores-al-prever": "erreurs-prevision-recolte",
    "precision-de-la-prevision": "precision-prevision",
  },
  nl: {
    empresa: "over-ons",
    producto: "product",
    contacto: "contact",
    "aviso-legal": "juridische-informatie",
    privacidad: "privacy",
    "aforo-de-cosecha": "oogstraming",
    "preguntas-frecuentes": "veelgestelde-vragen",
    cultivos: "gewassen",
    vision: "visie",
    "como-medimos": "hoe-we-meten",
    inversores: "investeerders",
    diario: "logboek",
    "articulos": "artikelen",
    "planificar-temporeros": "plukkers-plannen",
    "errores-al-prever": "fouten-oogstprognose",
    "precision-de-la-prevision": "nauwkeurigheid-prognose",
  },
  it: {
    empresa: "chi-siamo",
    producto: "prodotto",
    contacto: "contatti",
    "aviso-legal": "note-legali",
    privacidad: "privacy",
    "aforo-de-cosecha": "stima-del-raccolto",
    "preguntas-frecuentes": "domande-frequenti",
    cultivos: "colture",
    vision: "visione",
    "como-medimos": "come-misuriamo",
    inversores: "investitori",
    diario: "diario",
    "articulos": "articoli",
    "planificar-temporeros": "pianificare-braccianti",
    "errores-al-prever": "errori-previsione-raccolto",
    "precision-de-la-prevision": "precisione-previsione",
  },
  pt: {
    empresa: "quem-somos",
    producto: "produto",
    contacto: "contacto",
    "aviso-legal": "aviso-legal",
    privacidad: "privacidade",
    "aforo-de-cosecha": "estimativa-de-colheita",
    "preguntas-frecuentes": "perguntas-frequentes",
    cultivos: "culturas",
    vision: "visao",
    "como-medimos": "como-medimos",
    inversores: "investidores",
    diario: "diario",
    "articulos": "artigos",
    "planificar-temporeros": "planear-trabalhadores",
    "errores-al-prever": "erros-previsao-colheita",
    "precision-de-la-prevision": "precisao-previsao",
  },
};

export const CROP_SLUGS: Record<Locale, Record<Crop, string>> = {
  es: { "tomate-cherry": "tomate-cherry", pimiento: "pimiento", pepino: "pepino" },
  en: { "tomate-cherry": "cherry-tomato", pimiento: "pepper", pepino: "cucumber" },
  fr: { "tomate-cherry": "tomate-cerise", pimiento: "poivron", pepino: "concombre" },
  nl: { "tomate-cherry": "cherrytomaat", pimiento: "paprika", pepino: "komkommer" },
  it: { "tomate-cherry": "pomodoro-ciliegino", pimiento: "peperone", pepino: "cetriolo" },
  pt: { "tomate-cherry": "tomate-cereja", pimiento: "pimento", pepino: "pepino" },
};

/** Dirección pública de una página (y de un cultivo, si se indica) en un idioma. */
export function pathFor(locale: Locale, page: Page = "", crop?: Crop): string {
  if (!page) return `/${locale}/`;
  const base = `/${locale}/${SLUGS[locale][page]}/`;
  return page === "cultivos" && crop ? `${base}${CROP_SLUGS[locale][crop]}/` : base;
}

export const pageFromSlug = (locale: Locale, slug: string): SubPage | undefined =>
  (Object.keys(SLUGS[locale]) as SubPage[]).find((page) => SLUGS[locale][page] === slug);

export const cropFromSlug = (locale: Locale, slug: string): Crop | undefined =>
  CROPS.find((crop) => CROP_SLUGS[locale][crop] === slug);

/** Qué página es una dirección, para llevarla a otro idioma. Devuelve null si no la reconoce. */
export function routeFromPath(pathname: string): { locale: Locale; page: Page; crop?: Crop } | null {
  const [lang, slug, sub] = pathname.split("/").filter(Boolean);
  if (!lang || !isLocale(lang)) return null;
  if (!slug) return { locale: lang, page: "" };
  const page = pageFromSlug(lang, slug);
  if (!page) return null;
  const crop = page === "cultivos" && sub ? cropFromSlug(lang, sub) : undefined;
  return { locale: lang, page, crop };
}

/** La misma página en otro idioma. Si no se reconoce, la portada de ese idioma. */
export function swapLocale(pathname: string, locale: Locale): string {
  const route = routeFromPath(pathname);
  return route ? pathFor(locale, route.page, route.crop) : pathFor(locale);
}
