/**
 * Corrige la exportación estática de Next 16 en Windows.
 *
 * El navegador pide los datos de precarga de cada página con un nombre plano, por ejemplo
 * `__next.$d$lang.__PAGE__.txt`. En Windows, Next los escribe en subcarpetas
 * (`__next.$d$lang/__PAGE__.txt`) porque usa `\` como separador. Ver
 * `convertSegmentPathToStaticExportFilename` y `collectSegmentPaths` en next/dist/export.
 * El resultado son errores 404 en la consola y precargas que no funcionan.
 *
 * Este paso mueve cada fichero a su nombre plano. En Linux y macOS no hay nada que mover.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const OUT = path.resolve(import.meta.dirname, "..", "out");

async function walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    if (entry.name.startsWith("__next.")) await flatten(full, dir, entry.name);
    else await walk(full);
  }
}

/** Saca los ficheros de `__next.X/a/b.txt` a `__next.X.a.b.txt` y borra la carpeta. */
async function flatten(folder, parent, prefix) {
  async function visit(dir, parts) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await visit(full, [...parts, entry.name]);
      else {
        await fs.rename(full, path.join(parent, [prefix, ...parts, entry.name].join(".")));
      }
    }
  }
  await visit(folder, []);
  await fs.rm(folder, { recursive: true });
}

await walk(OUT);
