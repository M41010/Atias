import type { Locale } from "../config";
import { contentEn } from "./en";
import { type Content, contentEs } from "./es";
import { contentFr } from "./fr";
import { contentIt } from "./it";
import { contentNl } from "./nl";
import { contentPt } from "./pt";

const CONTENT: Record<Locale, Content> = {
  es: contentEs,
  en: contentEn,
  fr: contentFr,
  nl: contentNl,
  it: contentIt,
  pt: contentPt,
};

/** Textos para buscadores, guía, preguntas frecuentes y cultivos de cada idioma. */
export const getContent = (locale: Locale): Content => CONTENT[locale];

export type { Content };
