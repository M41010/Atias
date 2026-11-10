/**
 * Contenido de /llms.txt: una descripción de Atias para asistentes de IA, según la propuesta
 * llms.txt (https://llmstxt.org): título, resumen en cita y listas de enlaces con una línea cada una.
 * Solo dice lo que dice la web: piloto, previsión experimental, sin cifras de precisión publicadas.
 * Los enlaces son absolutos si hay dominio (NEXT_PUBLIC_SITE_URL) y relativos si no.
 */
import { type Locale, pathFor, type Page } from "../i18n/config";
import { getContent } from "../i18n/content";
import { absoluteUrl } from "./site";

const PAGES: { page: Page; key: keyof ReturnType<typeof getContent>["seo"] }[] = [
  { page: "", key: "home" },
  { page: "producto", key: "product" },
  { page: "empresa", key: "company" },
  { page: "vision", key: "vision" },
  { page: "cultivos", key: "crops" },
  { page: "aforo-de-cosecha", key: "guide" },
  { page: "preguntas-frecuentes", key: "faq" },
  { page: "contacto", key: "contact" },
];

function links(lang: Locale): string {
  const { seo } = getContent(lang);
  return PAGES.map(({ page, key }) => {
    const { title, description } = seo[key];
    const name = title.replace(/\s*\|\s*Atias$/, "");
    return `- [${name}](${absoluteUrl(pathFor(lang, page))}): ${description}`;
  }).join("\n");
}

export function llmsText(): string {
  return `# Atias

> Atias forecasts greenhouse harvests from phone videos. A grower films one video per row; computer vision counts the ripe fruit section by section; the cooperative sees the kilos expected each day from Monday to Friday, with a margin, and how many pickers it will need. Atias is a pilot: the forecast is experimental and no accuracy figures are published yet.

Key facts, as stated on the website:

- Who it is for: cooperatives and produce marketers (what to sell and whom to hire), growers (film with a phone; uploads survive bad connections) and agronomists (a fruit-by-fruit count to compare with their own forecast).
- Crops in the pilot: cherry tomato, pepper and cucumber, in greenhouses in southern Spain.
- Status: the app works end to end and is being tested in one real greenhouse, compared against what is actually harvested. The target is an error of 10 % or less in the week's kilos, measured against the scales; Atias does not claim to reach it until at least 8 weeks have been measured outside calibration.
- Principles: every figure comes with its margin; what is proven is kept apart from what is not; each grower only sees their own data and videos are deleted when no longer needed.
- Roadmap: 0.9 pilot; 1.0 first season (weekly use, cloud, connection to the cooperative's management system); 1.x improvements (indoor sensors, alerts, reports); 2.0 no manual filming (rail-mounted camera, kilos per picker crate); 3.0 plant health (pests and diseases: detect, prevent, recommend); 4.0 plant condition (irrigation, nutrition, growth, greenhouse climate). In every version Atias recommends and the agronomist decides.
- The name: ATIAS stands for Agricultura, Tecnología, Inteligencia Artificial y Soluciones (agriculture, technology, artificial intelligence and solutions).
- The website is available in Spanish (main language), English, French, Dutch, Italian and Portuguese. Contact is through the request-a-demo page.

## Spanish pages

${links("es")}

## English pages

${links("en")}

## Optional

- Other languages: French (/fr/), Dutch (/nl/), Italian (/it/) and Portuguese (/pt/) versions mirror the Spanish pages.
`;
}
