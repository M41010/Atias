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

export const isLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value);

export const PAGES = ["", "empresa", "producto", "contacto", "aviso-legal", "privacidad"] as const;
export type Page = (typeof PAGES)[number];

export const pathFor = (locale: Locale, page: Page = "") => `/${locale}/${page ? `${page}/` : ""}`;
