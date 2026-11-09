"use client";

import { useEffect } from "react";
import { DEFAULT_LOCALE, isLocale, pathFor } from "@/i18n/config";

/** Lleva al primer idioma del navegador que tenga la web; si no hay ninguno, al español. */
export function LanguageRedirect() {
  useEffect(() => {
    const preferred = (navigator.languages ?? [navigator.language])
      .map((tag) => tag.slice(0, 2).toLowerCase())
      .find(isLocale);
    window.location.replace(pathFor(preferred ?? DEFAULT_LOCALE));
  }, []);
  return null;
}
