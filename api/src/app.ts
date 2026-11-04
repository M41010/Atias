import express, { type Express } from "express";

const ANALYSIS_TIMEOUT_MS = 2000;

/** API de Atias. De momento solo informa de su estado y del servicio de análisis. */
export function createApp({ analysisUrl }: { analysisUrl: string }): Express {
  const app = express();
  app.disable("x-powered-by");

  // Vivo: el proceso responde. No depende de otros servicios.
  app.get("/salud", (_req, res) => {
    res.json({ estado: "ok", servicio: "api" });
  });

  // Listo: además puede hablar con el análisis.
  app.get("/listo", async (_req, res) => {
    try {
      const response = await fetch(`${analysisUrl}/salud`, {
        signal: AbortSignal.timeout(ANALYSIS_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`Respuesta ${response.status}`);
      res.json({ estado: "listo", analisis: "ok" });
    } catch {
      res.status(503).json({ estado: "no_listo", analisis: "no_disponible" });
    }
  });

  app.use((_req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
  });

  return app;
}
