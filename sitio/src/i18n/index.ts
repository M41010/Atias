import type { Locale } from "./config";
import { en } from "./en";
import { type Dictionary, es } from "./es";
import { fr } from "./fr";
import { it } from "./it";
import { nl } from "./nl";
import { pt } from "./pt";

const DICTIONARIES: Record<Locale, Dictionary> = { es, en, fr, nl, it, pt };

export const getDictionary = (locale: Locale): Dictionary => DICTIONARIES[locale];

/** Datos legales que la empresa aún no ha dado. Se muestran como pendientes, nunca inventados. */
export const LEGAL_DATA = {
  titular: process.env.NEXT_PUBLIC_TITULAR ?? "",
  nif: process.env.NEXT_PUBLIC_NIF ?? "",
  domicilio: process.env.NEXT_PUBLIC_DOMICILIO ?? "",
  correo: process.env.NEXT_PUBLIC_CORREO ?? "",
  proveedor: process.env.NEXT_PUBLIC_PROVEEDOR_FORMULARIO ?? "",
};

export type { Dictionary };
