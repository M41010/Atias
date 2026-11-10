/**
 * Prepara las capturas de la app para «La app por dentro»: recorta el encuadre de arriba de cada
 * pantalla (la parte que se lee sin bajar), la reduce a 1600 px de ancho y la guarda en WebP.
 *
 * Uso: node scripts/app-captures.mjs <carpeta con los PNG>
 * Los PNG salen de video/public/app (capturas de la app en modo demostración, con la marca).
 * Usa sharp, que ya viene con Next.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const [source] = process.argv.slice(2);
if (!source) {
  console.error("Uso: node scripts/app-captures.mjs <carpeta PNG>");
  process.exit(1);
}

const out = path.resolve(import.meta.dirname, "..", "public", "capturas", "app");
mkdirSync(out, { recursive: true });

/**
 * Zonas que se desenfocan, en píxeles de la captura original: los nombres de familia (variedades)
 * de la cooperativa del piloto, que la web pública no debe mostrar.
 */
const HIDE = {
  resumen: [],
  prevision: [{ left: 430, top: 262, width: 210, height: 574 }],
  invernadero: [{ left: 420, top: 160, width: 645, height: 34 }],
  temporeros: [{ left: 445, top: 600, width: 235, height: 236 }],
  precision: [],
};

for (const name of Object.keys(HIDE)) {
  const file = path.join(source, `${name}.png`);
  const top = await sharp(file).extract({ left: 0, top: 0, width: 1900, height: 836 }).png().toBuffer();
  const patches = await Promise.all(
    HIDE[name].map(async (r) => ({
      input: await sharp(top).extract(r).blur(10).toBuffer(),
      left: r.left,
      top: r.top,
    })),
  );
  // sharp aplica `composite` al final, después de `resize`: se compone primero y se reduce después.
  const covered = await sharp(top).composite(patches).png().toBuffer();
  const info = await sharp(covered)
    .resize({ width: 1600 })
    .webp({ quality: 82 })
    .toFile(path.join(out, `${name}.webp`));
  console.log(name, info.width, info.height, info.size);
}
