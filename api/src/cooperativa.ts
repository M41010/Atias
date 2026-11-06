import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import express, { type Router } from "express";
import { requireSession, type SessionUser } from "./auth.js";
import { hashToken, type Pool } from "./db.js";
import { harvestWeek, upcomingHarvests } from "./harvests.js";
import { videoDto, weeklyColumns, weeklyData } from "./dto.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CROPS = new Set(["tomate_cherry", "pimiento", "pepino"]);

/** Rutas de la cooperativa. Todas exigen haber iniciado sesión. */
export function createCooperativeRouter(pool: Pool, videoDir: string): Router {
  const router = express.Router();
  router.use(requireSession(pool));

  router.get("/recolecciones", async (_req, res) => {
    const { rows } = await pool.query("SELECT id, label FROM harvests ORDER BY starts_on DESC");
    res.json({ recolecciones: rows.map((r) => ({ id: r.id, etiqueta: r.label })) });
  });

  router.get("/recolecciones/:id", async (req, res) => {
    const harvest = await pool.query("SELECT id, label FROM harvests WHERE id = $1", [req.params.id]);
    if (!harvest.rows[0]) {
      res.status(404).json({ error: "Recolección no encontrada" });
      return;
    }
    const greenhouses = await pool.query(
      `SELECT g.id, g.name, g.crop, ${weeklyColumns}
       FROM greenhouses g
       LEFT JOIN weekly_data w ON w.greenhouse_id = g.id AND w.harvest_id = $1
       ORDER BY g.name`,
      [req.params.id],
    );
    const videos = await pool.query(
      "SELECT * FROM videos WHERE harvest_id = $1 AND status = 'recibido' ORDER BY hilera, lado",
      [req.params.id],
    );
    res.json({
      id: harvest.rows[0].id,
      etiqueta: harvest.rows[0].label,
      invernaderos: greenhouses.rows.map((g) => ({
        id: g.id,
        nombre: g.name,
        cultivo: g.crop,
        datos: weeklyData(g),
        videos: videos.rows.filter((v) => v.greenhouse_id === g.id).map(videoDto),
      })),
    });
  });

  // ---- Cosecha real ----
  router.get("/recolecciones/:id/cosecha", async (req, res) => {
    const harvest = await pool.query("SELECT id, label FROM harvests WHERE id = $1", [req.params.id]);
    if (!harvest.rows[0]) {
      res.status(404).json({ error: "Recolección no encontrada" });
      return;
    }
    const greenhouses = await pool.query("SELECT id, name, crop FROM greenhouses ORDER BY name");
    const records = await pool.query(
      `SELECT r.greenhouse_id, r.scope, r.kg, r.recorded_at, u.name AS recorded_by
       FROM harvest_records r JOIN users u ON u.id = r.recorded_by
       WHERE r.harvest_id = $1`,
      [req.params.id],
    );
    const record = (greenhouseId: string, scope: string) => {
      const row = records.rows.find((r) => r.greenhouse_id === greenhouseId && r.scope === scope);
      return row ? { kg: row.kg, registradoPor: row.recorded_by, registradoEn: row.recorded_at } : null;
    };
    res.json({
      id: harvest.rows[0].id,
      etiqueta: harvest.rows[0].label,
      invernaderos: greenhouses.rows.map((g) => ({
        id: g.id,
        nombre: g.name,
        cultivo: g.crop,
        registros: {
          lunes_viernes: record(g.id, "lunes_viernes"),
          cosecha_inmediata: record(g.id, "cosecha_inmediata"),
        },
      })),
    });
  });

  // kg nulo borra el dato.
  router.put("/recolecciones/:id/cosecha/:invernaderoId/:alcance", async (req, res) => {
    const user: SessionUser = res.locals.user;
    const { id, invernaderoId, alcance } = req.params;
    const kg = (req.body as Record<string, unknown> | undefined)?.kg;
    if (alcance !== "lunes_viernes" && alcance !== "cosecha_inmediata") {
      res.status(400).json({ error: "Tipo de cosecha no válido" });
      return;
    }
    if (kg !== null && (typeof kg !== "number" || !Number.isFinite(kg) || kg < 0 || kg > 10_000_000)) {
      res.status(400).json({ error: "Los kilos deben ser un número entre 0 y 10.000.000" });
      return;
    }
    const known = await pool.query(
      "SELECT 1 FROM harvests h, greenhouses g WHERE h.id = $1 AND g.id = $2",
      [id, invernaderoId],
    );
    if (!known.rowCount) {
      res.status(404).json({ error: "Recolección o invernadero no encontrados" });
      return;
    }
    if (kg === null) {
      await pool.query(
        "DELETE FROM harvest_records WHERE harvest_id = $1 AND greenhouse_id = $2 AND scope = $3",
        [id, invernaderoId, alcance],
      );
    } else {
      await pool.query(
        `INSERT INTO harvest_records (greenhouse_id, harvest_id, scope, kg, recorded_by)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (greenhouse_id, harvest_id, scope) DO UPDATE SET
           kg = EXCLUDED.kg, recorded_by = EXCLUDED.recorded_by, recorded_at = now()`,
        [invernaderoId, id, alcance, kg, user.id],
      );
    }
    res.status(204).end();
  });

  // ---- Vídeos ----
  // Admite peticiones parciales: el navegador las usa para avanzar en el vídeo sin descargarlo entero.
  router.get("/videos/:id/contenido", async (req, res, next) => {
    if (!UUID.test(req.params.id)) {
      res.status(404).json({ error: "Vídeo no encontrado" });
      return;
    }
    const { rows } = await pool.query(
      "SELECT mime_type FROM videos WHERE id = $1 AND status = 'recibido'",
      [req.params.id],
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Vídeo no encontrado" });
      return;
    }
    res.setHeader("Content-Type", rows[0].mime_type);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");
    res.sendFile(req.params.id, { root: resolve(videoDir) }, (error?: Error & { status?: number }) => {
      if (!error) return;
      if (res.headersSent) {
        res.destroy();
        return;
      }
      if (error.status === 404) res.status(404).json({ error: "Archivo no encontrado" });
      else next(error);
    });
  });

  // ---- Invernaderos ----
  router.get("/invernaderos", async (_req, res) => {
    const { rows } = await pool.query("SELECT id, name, crop, default_hileras FROM greenhouses ORDER BY name");
    res.json({
      invernaderos: rows.map((g) => ({ id: g.id, nombre: g.name, cultivo: g.crop, hileras: g.default_hileras })),
    });
  });

  router.post("/invernaderos", async (req, res) => {
    const { nombre, cultivo, hileras } = (req.body ?? {}) as Record<string, unknown>;
    const name = typeof nombre === "string" ? nombre.trim() : "";
    if (!name || name.length > 100) {
      res.status(400).json({ error: "Indica un nombre de hasta 100 caracteres" });
      return;
    }
    if (typeof cultivo !== "string" || !CROPS.has(cultivo)) {
      res.status(400).json({ error: "Cultivo no válido" });
      return;
    }
    if (typeof hileras !== "number" || !Number.isInteger(hileras) || hileras < 1 || hileras > 200) {
      res.status(400).json({ error: "El número de hileras debe ser un entero entre 1 y 200" });
      return;
    }
    try {
      const { rows } = await pool.query(
        `INSERT INTO greenhouses (id, name, crop, default_hileras) VALUES ($1, $2, $3, $4) RETURNING id`,
        [`inv-${randomBytes(6).toString("hex")}`, name, cultivo, hileras],
      );
      res.status(201).json({ id: rows[0].id, nombre: name, cultivo, hileras });
    } catch (error) {
      if ((error as { code?: string }).code === "23505") {
        res.status(409).json({ error: "Ya hay un invernadero con ese nombre" });
        return;
      }
      throw error;
    }
  });

  // ---- Enlaces del agricultor ----
  router.get("/proximas-recolecciones", (_req, res) => {
    res.json({ recolecciones: upcomingHarvests() });
  });

  router.get("/enlaces", async (req, res) => {
    const week = upcomingHarvests().find((h) => h.inicio === req.query.inicio);
    if (!week) {
      res.status(400).json({ error: "Elige una de las próximas recolecciones" });
      return;
    }
    const { rows } = await pool.query(
      `SELECT g.id, g.name, g.crop, l.id AS link_id, l.created_at, l.expires_at
       FROM greenhouses g
       LEFT JOIN upload_links l ON l.greenhouse_id = g.id AND l.harvest_id = $1 AND l.revoked_at IS NULL
         AND (l.expires_at IS NULL OR l.expires_at > now())
       ORDER BY g.name`,
      [week.id],
    );
    res.json({
      recoleccion: week,
      invernaderos: rows.map((r) => ({
        id: r.id,
        nombre: r.name,
        cultivo: r.crop,
        enlace: r.link_id ? { id: r.link_id, creadoEn: r.created_at, caducaEn: r.expires_at } : null,
      })),
    });
  });

  // Crear sustituye al enlace vigente. El enlace solo se devuelve aquí: se guarda únicamente su hash.
  router.post("/enlaces", async (req, res) => {
    const user: SessionUser = res.locals.user;
    const { invernaderoId, inicio } = (req.body ?? {}) as Record<string, unknown>;
    const candidate = upcomingHarvests().find((h) => h.inicio === inicio);
    if (!candidate) {
      res.status(400).json({ error: "Elige una de las próximas recolecciones" });
      return;
    }
    const week = harvestWeek(candidate.inicio);
    if (typeof invernaderoId !== "string") {
      res.status(400).json({ error: "Invernadero no válido" });
      return;
    }
    const greenhouse = await pool.query("SELECT 1 FROM greenhouses WHERE id = $1", [invernaderoId]);
    if (!greenhouse.rowCount) {
      res.status(404).json({ error: "Invernadero no encontrado" });
      return;
    }
    const token = randomBytes(24).toString("base64url");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO harvests (id, label, starts_on) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
        [week.id, week.etiqueta, week.inicio],
      );
      await client.query(
        `UPDATE upload_links SET revoked_at = now()
         WHERE greenhouse_id = $1 AND harvest_id = $2 AND revoked_at IS NULL`,
        [invernaderoId, week.id],
      );
      // Caduca al empezar la recolección, a las 00:00 del lunes en España.
      const { rows } = await client.query(
        `INSERT INTO upload_links (token_sha256, greenhouse_id, harvest_id, expires_at, created_by)
         VALUES ($1, $2, $3, ($4::date)::timestamp AT TIME ZONE 'Europe/Madrid', $5)
         RETURNING id, expires_at`,
        [hashToken(token), invernaderoId, week.id, week.inicio, user.id],
      );
      await client.query("COMMIT");
      res.status(201).json({ id: rows[0].id, token, caducaEn: rows[0].expires_at });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  });

  router.post("/enlaces/:id/revocar", async (req, res) => {
    if (!UUID.test(req.params.id)) {
      res.status(404).json({ error: "Enlace no encontrado" });
      return;
    }
    const { rowCount } = await pool.query(
      "UPDATE upload_links SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL",
      [req.params.id],
    );
    res.status(rowCount ? 204 : 404).end();
  });

  return router;
}
