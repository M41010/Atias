/**
 * Genera el vídeo de cada idioma en out/atias-<idioma>.mp4.
 *   node render.mjs                 → los seis idiomas, horizontal
 *   node render.mjs es en           → solo esos
 *   node render.mjs --vertical es   → vertical 9:16 en out/atias-es-vertical.mp4
 * CHROME apunta a un Chrome instalado; si no se indica, Remotion descarga el suyo.
 * CONCURRENCY limita los fotogramas en paralelo (por defecto 2, el equipo tiene poca memoria).
 */
import { execFileSync } from "node:child_process";

const all = ["es", "en", "fr", "nl", "it", "pt"];
const args = process.argv.slice(2);
const vertical = args.includes("--vertical");
const requested = args.filter((arg) => arg !== "--vertical");
const locales = requested.length ? requested : all;
const chrome = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";

for (const locale of locales) {
  if (!all.includes(locale)) throw new Error(`Idioma desconocido: ${locale}`);
  const id = vertical ? `AtiasVertical-${locale}` : `Atias-${locale}`;
  const out = vertical ? `out/atias-${locale}-vertical.mp4` : `out/atias-${locale}.mp4`;
  console.log(`Generando ${id}…`);
  execFileSync(
    "npx",
    [
      "remotion", "render", "src/index.ts", id, out,
      "--gl=angle", "--codec=h264", "--crf=20", "--timeout=120000", `--concurrency=${process.env.CONCURRENCY ?? 2}`,
      ...(chrome ? [`--browser-executable="${chrome}"`] : []),
    ],
    { stdio: "inherit", shell: true },
  );
}
