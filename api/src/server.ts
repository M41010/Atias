import { createApp } from "./app.js";
import { purgeExpiredSessions } from "./auth.js";
import { createPool, migrate, seedDemo } from "./db.js";
import { createVideoStore, purgeExpired } from "./uploads.js";

const PURGE_INTERVAL_MS = 60 * 60 * 1000;

const port = Number(process.env.PORT ?? 4000);
const analysisUrl = process.env.ANALISIS_URL ?? "http://localhost:8000";
const videoDir = process.env.VIDEO_DIR ?? "./videos";
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Falta la variable DATABASE_URL");

const pool = createPool(databaseUrl);
await migrate(pool);
if (process.env.ATIAS_DATOS_DEMO === "1") await seedDemo(pool);

const store = createVideoStore(videoDir);
const purge = () =>
  Promise.all([purgeExpired(pool, store), purgeExpiredSessions(pool)])
    .catch((error) => console.error("Fallo en la limpieza periódica", error));
void purge();
const purgeTimer = setInterval(purge, PURGE_INTERVAL_MS);

const server = createApp({
  analysisUrl,
  pool,
  store,
  // En la nube, con HTTPS, debe activarse: la cookie de sesión solo viajará cifrada.
  secureCookies: process.env.ATIAS_COOKIE_SEGURA === "1",
}).listen(port, () => {
  console.log(`API escuchando en el puerto ${port}`);
});

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    clearInterval(purgeTimer);
    server.close(() => {
      void pool.end().finally(() => process.exit(0));
    });
  });
}
