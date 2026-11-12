/**
 * Genera el vídeo de cada idioma en out/atias-<idioma>.mp4.
 *   node render.mjs                 → los seis idiomas, horizontal
 *   node render.mjs es en           → solo esos
 *   node render.mjs --vertical es   → vertical 9:16 en out/atias-es-vertical.mp4
 *   node render.mjs --duenos        → vídeo para los dueños (solo español): out/atias-duenos.mp4 y
 *                                     out/atias-duenos-vertical.mp4, con música si está public/musica/cancion.mp3
 * CHROME apunta a un Chrome instalado; si no se indica, Remotion descarga el suyo.
 * CONCURRENCY limita los fotogramas en paralelo (por defecto 2, el equipo tiene poca memoria).
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const all = ["es", "en", "fr", "nl", "it", "pt"];
const args = process.argv.slice(2);
const chrome = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const common = [
  "--gl=angle", "--codec=h264", "--crf=20", "--timeout=120000", `--concurrency=${process.env.CONCURRENCY ?? 2}`,
  ...(chrome ? [`--browser-executable="${chrome}"`] : []),
];

if (args.includes("--duenos")) {
  renderDuenos();
} else {
  const vertical = args.includes("--vertical");
  const requested = args.filter((arg) => arg !== "--vertical");
  const locales = requested.length ? requested : all;
  for (const locale of locales) {
    if (!all.includes(locale)) throw new Error(`Idioma desconocido: ${locale}`);
    const id = vertical ? `AtiasVertical-${locale}` : `Atias-${locale}`;
    const out = vertical ? `out/atias-${locale}-vertical.mp4` : `out/atias-${locale}.mp4`;
    console.log(`Generando ${id}…`);
    execFileSync("npx", ["remotion", "render", "src/index.ts", id, out, ...common], { stdio: "inherit", shell: true });
  }
}

/**
 * La música no se descarga sola: quien prepara el vídeo la guarda a mano en public/musica/cancion.mp3.
 * Desde un worktree se busca también en la copia principal del repositorio y, si está, se copia.
 */
function findMusic() {
  const local = path.resolve("public/musica/cancion.mp3");
  if (existsSync(local)) return true;
  try {
    const gitCommon = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { encoding: "utf8" }).trim();
    const main = path.join(path.dirname(gitCommon), "video", "public", "musica", "cancion.mp3");
    if (existsSync(main)) {
      mkdirSync(path.dirname(local), { recursive: true });
      copyFileSync(main, local);
      console.log(`Música copiada desde ${main}`);
      return true;
    }
  } catch {
    // Sin git: solo cuenta la carpeta local.
  }
  return false;
}

function renderDuenos() {
  const musica = findMusic();
  console.log(musica ? "Con música: public/musica/cancion.mp3" : "Sin música: falta public/musica/cancion.mp3, el vídeo sale en silencio.");
  const outputs = [
    ["AtiasDuenos", "out/atias-duenos.mp4"],
    ["AtiasDuenosVertical", "out/atias-duenos-vertical.mp4"],
  ];
  for (const [id, out] of outputs) {
    console.log(`Generando ${id}…`);
    const props = musica ? ["--props=props-musica.json"] : [];
    execFileSync("npx", ["remotion", "render", "src/index.ts", id, out, ...props, ...common], { stdio: "inherit", shell: true });
  }
}
