import type { MetadataRoute } from "next";
import { absoluteUrl, HAS_DOMAIN } from "@/seo/site";

export const dynamic = "force-static";

/**
 * Con dominio: todo abierto y el mapa del sitio enlazado. Sin dominio, la web está de pruebas y se
 * pide a los buscadores que no entren, para que no indexen una dirección provisional.
 */
export default function robots(): MetadataRoute.Robots {
  if (!HAS_DOMAIN) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
