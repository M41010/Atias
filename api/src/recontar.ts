/**
 * Vuelve a contar los frutos de los vídeos recibidos, por ejemplo tras instalar un modelo mejor.
 *   todos los vídeos:        node dist/recontar.js
 *   solo un cultivo:         node dist/recontar.js tomate_cherry
 * Los vídeos quedan pendientes y el análisis los cuenta de nuevo, uno a uno.
 */
import { createPool, migrate } from "./db.js";

const crop = process.argv[2];
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Falta la variable DATABASE_URL");
  process.exit(1);
}
if (crop && !["tomate_cherry", "pimiento", "pepino"].includes(crop)) {
  console.error("Cultivo no válido: tomate_cherry, pimiento o pepino");
  process.exit(1);
}

const pool = createPool(databaseUrl);
try {
  await migrate(pool);
  const { rowCount } = await pool.query(
    `UPDATE videos v SET count_status = 'pendiente', count = NULL, count_attempts = 0, counted_at = NULL
     FROM greenhouses g
     WHERE g.id = v.greenhouse_id AND v.status = 'recibido' AND ($1::text IS NULL OR g.crop = $1)`,
    [crop ?? null],
  );
  console.log(`${rowCount} vídeos se volverán a contar.`);
} catch (error) {
  console.error((error as Error).message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
