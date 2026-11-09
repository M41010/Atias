/**
 * Dominio público de la web, sin barra final (p. ej. https://atias.es). Aún no existe: mientras
 * NEXT_PUBLIC_SITE_URL esté vacía, la web pide a los buscadores que no la indexen y el mapa del
 * sitio sale vacío, para no publicar direcciones falsas.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");

export const HAS_DOMAIN = /^https?:\/\/[^/]+/.test(SITE_URL);

export const SITE_NAME = "Atias";

/** Dirección absoluta si hay dominio; si no, la ruta tal cual. */
export const absoluteUrl = (path: string): string => (HAS_DOMAIN ? `${SITE_URL}${path}` : path);

/** Colores de la marca que necesitan los navegadores y la imagen para redes. */
export const BRAND = { ink: "#0f2b20", background: "#f1f4ec", sprout: "#8fd14f" } as const;
