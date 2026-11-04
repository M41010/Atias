import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 4000);
const analysisUrl = process.env.ANALISIS_URL ?? "http://localhost:8000";

const server = createApp({ analysisUrl }).listen(port, () => {
  console.log(`API escuchando en el puerto ${port}`);
});

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
