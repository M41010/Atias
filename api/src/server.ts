import { createApp } from "./app.js";
import { purgeExpiredSessions } from "./auth.js";
import { createPool, migrate, removeDemoLinks, seedDemo } from "./db.js";
import { createQualityRunner } from "./quality.js";
import { createVideoStore, purgeExpired } from "./uploads.js";

const PURGE_INTERVAL_MS = 60 * 60 * 1000;
const QUALITY_INTERVAL_MS = 5000;

const port = Number(process.env.PORT ?? 4000);
const analysisUrl = process.env.ANALISIS_URL ?? "http://localhost:8000";
const videoDir = process.env.VIDEO_DIR ?? "./videos";
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Falta la variable DATABASE_URL");

// Espacio que debe quedar siempre libre en el disco de los vídeos. Por defecto, 10 GB.
const minFreeGb = Number(process.env.ATIAS_ESPACIO_LIBRE_GB ?? 10);
if (!Number.isFinite(minFreeGb) || minFreeGb < 0) throw new Error("ATIAS_ESPACIO_LIBRE_GB no es válido");

const pool = createPool(databaseUrl);
await migrate(pool);
if (process.env.ATIAS_DATOS_DEMO === "1") {
  await seedDemo(pool);
  console.warn("Enlaces de prueba activos: cualquiera que los conozca puede subir vídeos.");
} else if (await removeDemoLinks(pool)) {
  console.log("Enlaces de prueba retirados.");
}

const store = createVideoStore(videoDir);
const purge = () =>
  Promise.all([purgeExpired(pool, store), purgeExpiredSessions(pool)])
    .catch((error) => console.error("Fallo en la limpieza periódica", error));
void purge();
const purgeTimer = setInterval(purge, PURGE_INTERVAL_MS);
const qualityTimer = setInterval(createQualityRunner(pool, analysisUrl), QUALITY_INTERVAL_MS);

const server = createApp({
  analysisUrl,
  pool,
  store,
  // En la nube, con HTTPS, debe activarse: la cookie de sesión solo viajará cifrada.
  secureCookies: process.env.ATIAS_COOKIE_SEGURA === "1",
  uploadLimits: { minFreeBytes: minFreeGb * 1024 ** 3 },
  // Solo con un proxy delante (HTTPS en la nube) que escriba él mismo X-Forwarded-For.
  trustedProxy: process.env.ATIAS_PROXY_DE_CONFIANZA === "1",
}).listen(port, () => {
  console.log(`API escuchando en el puerto ${port}`);
});

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    clearInterval(purgeTimer);
    clearInterval(qualityTimer);
    server.close(() => {
      void pool.end().finally(() => process.exit(0));
    });
  });
}
