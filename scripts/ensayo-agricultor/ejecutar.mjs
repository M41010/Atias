// Ensayo del agricultor: levanta una pila aparte (proyecto atias-ensayo, puertos 3100 y 4100),
// crea una cuenta de la cooperativa, pasa agricultor.spec.ts y borra la pila con sus volúmenes.
// No toca la pila real (proyecto atias, puertos 3000 y 4000).
//
//   npm run ensayo                 todo, y al final borra la pila del ensayo
//   npm run ensayo -- --mantener   la deja en marcha para mirarla en http://localhost:3100
//
// Variables: ENSAYO_VIDEO (ruta de un vídeo grabado con el móvil), ENSAYO_SUBIDA_MBPS (8 por defecto).
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT = "atias-ensayo";
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const webPort = process.env.ENSAYO_WEB_PORT ?? "3100";
const apiPort = process.env.ENSAYO_API_PORT ?? "4100";
const keep = process.argv.includes("--mantener");

if (["3000", "4000"].includes(webPort) || ["3000", "4000"].includes(apiPort)) {
  console.error("Los puertos 3000 y 4000 son de la pila real. Usa otros.");
  process.exit(1);
}

const env = { ...process.env, WEB_PORT: webPort, API_PORT: apiPort };
const compose = (...args) => ["compose", "-p", PROJECT, "-f", "compose.yaml", "-f", "compose.ensayo.yaml", ...args];
const docker = (args, options = {}) => execFileSync("docker", args, { cwd: root, env, encoding: "utf8", ...options });

let code = 1;
try {
  console.log(`Levantando la pila del ensayo (${PROJECT}) en los puertos ${webPort} y ${apiPort}…`);
  // Siempre desde cero: con los vídeos de un ensayo anterior, los botones ya no serían «Grabar».
  docker(compose("down", "-v"), { stdio: "inherit" });
  docker(compose("up", "-d", "--build", "--wait"), { stdio: "inherit" });

  const email = "ensayo@atias.invalid";
  const output = docker(compose("exec", "-T", "api", "node", "dist/usuarios.js", "crear", email, "Ensayo"));
  const password = /Contraseña \(solo se muestra ahora\): (\S+)/.exec(output)?.[1];
  if (!password) throw new Error(`No se ha podido crear la cuenta del ensayo:\n${output}`);

  // Copia del vídeo como la que deja WhatsApp, hecha con el OpenCV de la imagen del análisis.
  const video = resolve(here, process.env.ENSAYO_VIDEO ?? "../../sitio/public/video/atias-es.mp4");
  const results = resolve(here, "resultados");
  mkdirSync(results, { recursive: true });
  console.log("Preparando una copia en baja resolución, como la de WhatsApp…");
  docker([
    "run", "--rm", "--read-only", "--tmpfs", "/tmp",
    "-v", `${dirname(video)}:/entrada:ro`, "-v", `${results}:/salida`,
    "-v", `${resolve(here, "baja_resolucion.py")}:/ensayo/baja_resolucion.py:ro`,
    `${PROJECT}-analisis`, ".venv/bin/python", "/ensayo/baja_resolucion.py",
    `/entrada/${basename(video)}`, "/salida/baja-resolucion.mp4",
  ], { stdio: "inherit" });

  const result = spawnSync("npx", ["playwright", "test"], {
    cwd: here,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...env, ENSAYO_URL: `http://localhost:${webPort}`, ENSAYO_VIDEO: video,
      ENSAYO_VIDEO_BAJA: resolve(results, "baja-resolucion.mp4"), ENSAYO_CORREO: email, ENSAYO_CONTRASENA: password,
    },
  });
  code = result.status ?? 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
} finally {
  if (keep) {
    console.log(`Pila del ensayo en marcha: http://localhost:${webPort}. Para borrarla:`);
    console.log(`  docker compose -p ${PROJECT} -f compose.yaml -f compose.ensayo.yaml down -v`);
  } else {
    if (code !== 0) {
      try {
        console.log("Registro de la API y del análisis (últimas líneas):");
        docker(compose("logs", "--tail", "40", "api", "analisis"), { stdio: "inherit" });
      } catch { /* sin registro */ }
    }
    docker(compose("down", "-v"), { stdio: "inherit" });
  }
}
process.exit(code);
