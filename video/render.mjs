/**
 * Genera el vídeo de cada idioma en out/atias-<idioma>.mp4.
 *   node render.mjs           → los seis idiomas
 *   node render.mjs es en     → solo esos
 * CHROME apunta a un Chrome instalado; si no se indica, Remotion descarga el suyo.
 */
import { execFileSync } from "node:child_process";

const all = ["es", "en", "fr", "nl", "it", "pt"];
const locales = process.argv.slice(2).length ? process.argv.slice(2) : all;
const chrome = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";

for (const locale of locales) {
  if (!all.includes(locale)) throw new Error(`Idioma desconocido: ${locale}`);
  console.log(`Generando ${locale}…`);
  execFileSync(
    "npx",
    [
      "remotion", "render", "src/index.ts", `Atias-${locale}`, `out/atias-${locale}.mp4`,
      "--gl=angle", "--codec=h264", "--crf=20", "--timeout=120000", `--concurrency=${process.env.CONCURRENCY ?? 2}`,
      ...(chrome ? [`--browser-executable="${chrome}"`] : []),
    ],
    { stdio: "inherit", shell: true },
  );
}
