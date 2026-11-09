import type { FileStore } from "@tus/file-store";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { createAuthRouter, LoginLimiter } from "./auth.js";
import { createCooperativeRouter } from "./cooperativa.js";
import type { Pool } from "./db.js";
import { videoDto, weeklyColumns, weeklyData } from "./dto.js";
import { type Link, LINK_HEADER, resolveLink } from "./links.js";
import { createUploadServer, type UploadLimits, UPLOADS_PATH } from "./uploads.js";
import { createWeatherService, type WeatherConfig } from "./weather.js";

const ANALYSIS_TIMEOUT_MS = 2000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type NumberRule = { min: number; max: number; integer?: boolean };
const WEEKLY_NUMBERS: Record<string, NumberRule> = {
  hileras: { min: 1, max: 200, integer: true },
  longitudM: { min: 1, max: 1000 },
  temperaturaC: { min: -10, max: 60 },
  humedadPct: { min: 0, max: 100 },
  kilosSemanaPasada: { min: 0, max: 10_000_000 },
};

function validNumber(value: unknown, rule: NumberRule): boolean {
  return value === null || (typeof value === "number" && Number.isFinite(value) && value >= rule.min
    && value <= rule.max && (!rule.integer || Number.isInteger(value)));
}

export function createApp({
  analysisUrl,
  pool,
  store,
  secureCookies = false,
  limiter = new LoginLimiter(),
  weather,
  uploadLimits,
  trustedProxy = false,
}: {
  analysisUrl: string;
  pool: Pool;
  store: FileStore;
  secureCookies?: boolean;
  limiter?: LoginLimiter;
  /** Dónde pedir la meteorología. Las pruebas usan un Open-Meteo falso. */
  weather?: WeatherConfig;
  uploadLimits?: UploadLimits;
  /**
   * La web reenvía X-Forwarded-For tal como llega, así que el cliente podría inventarse su
   * dirección. Solo se cree si delante hay un proxy (HTTPS en la nube) que la escribe él mismo.
   */
  trustedProxy?: boolean;
}): Express {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", trustedProxy ? 1 : false);
  const uploads = createUploadServer(pool, store, uploadLimits);

  // Las peticiones que cambian algo solo se aceptan desde la propia web, no desde otra página
  // abierta en el mismo navegador. Se suma a la cookie SameSite como segunda barrera.
  app.use((req, res, next) => {
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
      next();
      return;
    }
    const site = req.get("sec-fetch-site");
    const origin = req.get("origin");
    const host = req.get("x-forwarded-host") ?? req.get("host");
    let sameOrigin = true;
    if (origin) {
      try {
        sameOrigin = new URL(origin).host === host;
      } catch {
        sameOrigin = false;
      }
    }
    if ((site && site !== "same-origin" && site !== "none") || !sameOrigin) {
      res.status(403).json({ error: "Petición no permitida" });
      return;
    }
    next();
  });

  // Vivo: el proceso responde. No depende de otros servicios.
  app.get("/salud", (_req, res) => {
    res.json({ estado: "ok", servicio: "api" });
  });

  // Listo: además puede hablar con el análisis y con la base de datos.
  app.get("/listo", async (_req, res) => {
    const analysis = await fetch(`${analysisUrl}/salud`, { signal: AbortSignal.timeout(ANALYSIS_TIMEOUT_MS) })
      .then((r) => r.ok)
      .catch(() => false);
    const database = await pool.query("SELECT 1").then(() => true).catch(() => false);
    res.status(analysis && database ? 200 : 503).json({
      estado: analysis && database ? "listo" : "no_listo",
      analisis: analysis ? "ok" : "no_disponible",
      baseDeDatos: database ? "ok" : "no_disponible",
    });
  });

  // Va antes del lector de JSON: el cuerpo de estas peticiones es el propio vídeo.
  app.all([UPLOADS_PATH, `${UPLOADS_PATH}/*resto`], (req, res, next) => {
    uploads.handle(req, res).catch(next);
  });

  app.use(express.json({ limit: "16kb" }));

  // ---- Enlace personal del agricultor ----
  const linkRoutes = express.Router();

  linkRoutes.use(async (req, res, next) => {
    const link = await resolveLink(pool, req.get(LINK_HEADER));
    if (!link) {
      res.status(404).json({ error: "Enlace no válido" });
      return;
    }
    res.locals.link = link;
    next();
  });

  linkRoutes.get("/", async (_req, res) => {
    const link: Link = res.locals.link;
    const { rows } = await pool.query(
      `SELECT g.id, g.name, g.crop, h.label, ${weeklyColumns}
       FROM greenhouses g
       JOIN harvests h ON h.id = $2
       LEFT JOIN weekly_data w ON w.greenhouse_id = g.id AND w.harvest_id = h.id
       WHERE g.id = $1`,
      [link.greenhouseId, link.harvestId],
    );
    const videos = await pool.query(
      `SELECT * FROM videos WHERE greenhouse_id = $1 AND harvest_id = $2 AND status IN ('recibido', 'subiendo')
       ORDER BY hilera, lado, created_at`,
      [link.greenhouseId, link.harvestId],
    );
    res.json({
      invernadero: { id: rows[0].id, nombre: rows[0].name, cultivo: rows[0].crop },
      recoleccion: { id: link.harvestId, etiqueta: rows[0].label },
      datos: weeklyData(rows[0]),
      videos: videos.rows.map(videoDto),
    });
  });

  linkRoutes.put("/datos", async (req, res) => {
    const link: Link = res.locals.link;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const invalid = Object.entries(WEEKLY_NUMBERS).find(([key, rule]) => !validNumber(body[key], rule));
    if (invalid || typeof body.variety !== "string" || body.variety.length > 200 || body.hileras === null) {
      res.status(400).json({ error: invalid ? `Valor no válido: ${invalid[0]}` : "Datos no válidos" });
      return;
    }
    const { rows } = await pool.query(
      `SELECT COALESCE(MAX(hilera), 0) AS highest FROM videos
       WHERE greenhouse_id = $1 AND harvest_id = $2 AND status IN ('recibido', 'subiendo')`,
      [link.greenhouseId, link.harvestId],
    );
    if ((body.hileras as number) < rows[0].highest) {
      res.status(409).json({ error: `Ya hay vídeos en la hilera ${rows[0].highest}` });
      return;
    }
    await pool.query(
      `INSERT INTO weekly_data (greenhouse_id, harvest_id, variety, hileras, longitud_m, temperatura_c, humedad_pct, kilos_semana_pasada)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (greenhouse_id, harvest_id) DO UPDATE SET
         variety = EXCLUDED.variety, hileras = EXCLUDED.hileras, longitud_m = EXCLUDED.longitud_m,
         temperatura_c = EXCLUDED.temperatura_c, humedad_pct = EXCLUDED.humedad_pct,
         kilos_semana_pasada = EXCLUDED.kilos_semana_pasada, updated_at = now()`,
      [link.greenhouseId, link.harvestId, body.variety.trim() || null, body.hileras, body.longitudM,
        body.temperaturaC, body.humedadPct, body.kilosSemanaPasada],
    );
    res.status(204).end();
  });

  // Quitar: un vídeo recibido se oculta durante 7 días; una subida sin terminar se descarta ya.
  linkRoutes.delete("/videos/:id", async (req, res) => {
    const link: Link = res.locals.link;
    if (!UUID.test(req.params.id)) {
      res.status(404).json({ error: "Vídeo no encontrado" });
      return;
    }
    const { rowCount } = await pool.query(
      `UPDATE videos SET
         delete_after = CASE WHEN status = 'recibido' THEN now() + interval '7 days' ELSE now() END,
         status = CASE WHEN status = 'recibido' THEN 'quitado' ELSE 'sustituido' END
       WHERE id = $1 AND greenhouse_id = $2 AND harvest_id = $3 AND status IN ('recibido', 'subiendo')`,
      [req.params.id, link.greenhouseId, link.harvestId],
    );
    res.status(rowCount ? 204 : 404).end();
  });

  linkRoutes.post("/videos/:id/restaurar", async (req, res) => {
    const link: Link = res.locals.link;
    if (!UUID.test(req.params.id)) {
      res.status(404).json({ error: "Vídeo no encontrado" });
      return;
    }
    try {
      const { rows } = await pool.query(
        `UPDATE videos SET status = 'recibido', delete_after = NULL
         WHERE id = $1 AND greenhouse_id = $2 AND harvest_id = $3 AND status = 'quitado' RETURNING *`,
        [req.params.id, link.greenhouseId, link.harvestId],
      );
      if (rows[0]) res.json(videoDto(rows[0]));
      else res.status(404).json({ error: "Vídeo no encontrado" });
    } catch (error) {
      // Índice único: mientras tanto ha llegado otro vídeo para este lado.
      if ((error as { code?: string }).code === "23505") {
        res.status(409).json({ error: "Ya hay otro vídeo en este lado" });
        return;
      }
      throw error;
    }
  });

  app.use("/api/enlace", linkRoutes);

  app.use("/api/auth", createAuthRouter(pool, limiter, secureCookies, trustedProxy));
  app.use("/api/cooperativa", createCooperativeRouter(pool, store.directory, createWeatherService(pool, weather)));

  app.use((_req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
  });

  // Respuesta genérica: los detalles internos solo van al registro.
  app.use((error: Error & { type?: string }, _req: Request, res: Response, _next: NextFunction) => {
    if (error.type === "entity.parse.failed" || error.type === "entity.too.large") {
      res.status(400).json({ error: "Petición no válida" });
      return;
    }
    console.error(error);
    res.status(500).json({ error: "Error interno" });
  });

  return app;
}
