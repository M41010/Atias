import express, { type Router } from "express";
import type { SessionUser } from "./auth.js";
import type { Pool } from "./db.js";
import { videoDto } from "./dto.js";

/**
 * Datos de campo de una recolección: lo que hace falta para medir cuánto acierta Atias.
 * - Previsiones del agricultor y del técnico, día a día, guardadas aparte.
 * - Kilos recogidos de verdad cada día.
 * - Tramos de control contados a mano, con su posición en metros desde la cabecera.
 * - Una muestra pesada para el peso medio por fruto.
 * Todas las rutas van dentro de las de la cooperativa, que ya exigen sesión.
 */

const HUMAN_SOURCES = new Set(["agricultor", "tecnico"]);
const MAX_KG = 10_000_000;
const DAY_MS = 86_400_000;

type Body = Record<string, unknown>;

const isKg = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= MAX_KG;
const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 1_000_000;
const isMeters = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 2_000;

/** Lunes a viernes de la recolección, como fechas ISO. */
function weekDays(startsOn: Date | string): string[] {
  const monday = typeof startsOn === "string" ? Date.parse(`${startsOn}T00:00:00Z`) : Date.UTC(
    startsOn.getFullYear(), startsOn.getMonth(), startsOn.getDate(),
  );
  return Array.from({ length: 5 }, (_, i) => new Date(monday + i * DAY_MS).toISOString().slice(0, 10));
}

const isoDate = (value: Date | string) =>
  typeof value === "string" ? value.slice(0, 10) : new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate())).toISOString().slice(0, 10);

type Control = {
  greenhouse_id: string;
  label: string;
  hilera: number;
  lado: "A" | "B";
  inicio_m: number;
  fin_m: number;
  visibles: number;
  total: number | null;
  recogidos: number | null;
  peso_g: number | null;
  nota: string | null;
};

type CountJson = { posicionesMaduros?: number[] } | null;

/**
 * Frutos maduros que contó Atias entre las dos cintas. Hace falta la longitud de la hilera y que el
 * análisis haya guardado la posición de cada fruto; si falta algo, se dice por qué en lugar de inventar.
 */
export function detectorInSegment(
  control: Pick<Control, "inicio_m" | "fin_m">,
  video: { count_status: string; count: CountJson } | undefined,
  rowLengthM: number | null,
): { frutos: number | null; motivo: string | null } {
  if (!video) return { frutos: null, motivo: "sin_video" };
  if (video.count_status !== "ok" || !video.count) return { frutos: null, motivo: "sin_contar" };
  if (!(rowLengthM && rowLengthM > 0)) return { frutos: null, motivo: "sin_longitud" };
  const positions = video.count.posicionesMaduros;
  if (!Array.isArray(positions)) return { frutos: null, motivo: "sin_posiciones" };
  if (control.fin_m > rowLengthM * 1.05) return { frutos: null, motivo: "fuera_de_hilera" };
  const from = control.inicio_m / rowLengthM;
  const to = control.fin_m / rowLengthM;
  return { frutos: positions.filter((p) => p >= from && p <= to).length, motivo: null };
}

function controlDto(row: Control, detector: ReturnType<typeof detectorInSegment>) {
  return {
    etiqueta: row.label,
    hilera: row.hilera,
    lado: row.lado,
    inicioM: row.inicio_m,
    finM: row.fin_m,
    visibles: row.visibles,
    total: row.total,
    recogidos: row.recogidos,
    pesoG: row.peso_g,
    nota: row.nota ?? "",
    atias: detector,
  };
}

export function createFieldRouter(pool: Pool): Router {
  const router = express.Router();

  router.get("/familias", async (_req, res) => {
    const { rows } = await pool.query("SELECT id, name, crop FROM families ORDER BY name");
    res.json({ familias: rows.map((f) => ({ id: f.id, nombre: f.name, cultivo: f.crop })) });
  });

  /** Todo lo de una recolección que necesita la app para calcular con datos reales y medir el acierto. */
  router.get("/recolecciones/:id/campo", async (req, res) => {
    const harvest = await pool.query("SELECT id, label, starts_on FROM harvests WHERE id = $1", [req.params.id]);
    if (!harvest.rows[0]) {
      res.status(404).json({ error: "Recolección no encontrada" });
      return;
    }
    const days = weekDays(harvest.rows[0].starts_on);
    const [greenhouses, videos, forecasts, reals, records, controls] = await Promise.all([
      pool.query(
        `SELECT g.id, g.name, g.crop, g.tramos, g.family_id, f.name AS family_name, g.municipality, g.latitude, g.longitude,
           COALESCE(w.hileras, g.default_hileras) AS hileras, w.longitud_m, w.variety, w.muestra_frutos, w.muestra_g,
           gr.name AS grower_name, t.name AS technician_name
         FROM greenhouses g
         LEFT JOIN weekly_data w ON w.greenhouse_id = g.id AND w.harvest_id = $1
         LEFT JOIN families f ON f.id = g.family_id
         LEFT JOIN growers gr ON gr.id = g.grower_id
         LEFT JOIN technicians t ON t.id = gr.technician_id
         ORDER BY g.name`,
        [req.params.id],
      ),
      pool.query("SELECT * FROM videos WHERE harvest_id = $1 AND status = 'recibido' ORDER BY hilera, lado", [req.params.id]),
      pool.query("SELECT greenhouse_id, day, source, kg FROM daily_forecasts WHERE day = ANY($1::date[])", [days]),
      pool.query("SELECT greenhouse_id, day, kg, source FROM daily_harvests WHERE day = ANY($1::date[])", [days]),
      pool.query("SELECT greenhouse_id, scope, kg FROM harvest_records WHERE harvest_id = $1", [req.params.id]),
      pool.query<Control>("SELECT * FROM control_counts WHERE harvest_id = $1 ORDER BY label", [req.params.id]),
    ]);

    const byDay = (rows: { greenhouse_id: string; day: Date | string; kg: number }[], greenhouseId: string) =>
      days.map((day) => rows.find((r) => r.greenhouse_id === greenhouseId && isoDate(r.day) === day)?.kg ?? null);
    const sourceByDay = (greenhouseId: string): ("erp" | "manual" | null)[] =>
      days.map((day) => reals.rows.find((r) => r.greenhouse_id === greenhouseId && isoDate(r.day) === day)?.source ?? null);

    res.json({
      id: harvest.rows[0].id,
      etiqueta: harvest.rows[0].label,
      dias: days,
      invernaderos: greenhouses.rows.map((g) => {
        const own = videos.rows.filter((v) => v.greenhouse_id === g.id);
        const rowLength = g.longitud_m ?? null;
        return {
          id: g.id,
          nombre: g.name,
          cultivo: g.crop,
          familia: g.family_id ? { id: g.family_id, nombre: g.family_name } : null,
          agricultor: g.grower_name ?? null,
          tecnico: g.technician_name ?? null,
          ubicacion: g.latitude === null || g.longitude === null
            ? null
            : { municipio: g.municipality ?? "", latitud: g.latitude, longitud: g.longitude },
          hileras: g.hileras,
          tramos: g.tramos,
          longitudHileraM: rowLength,
          variedad: g.variety ?? "",
          muestra: g.muestra_frutos && g.muestra_g ? { frutos: g.muestra_frutos, gramos: g.muestra_g } : null,
          videos: own.map(videoDto),
          previsiones: {
            agricultor: byDay(forecasts.rows.filter((r) => r.source === "agricultor"), g.id),
            tecnico: byDay(forecasts.rows.filter((r) => r.source === "tecnico"), g.id),
          },
          real: byDay(reals.rows, g.id),
          // De dónde viene cada día del recogido: lo que llegó del ERP no se cambia a mano.
          realOrigen: sourceByDay(g.id),
          cosecha: {
            lunesViernes: records.rows.find((r) => r.greenhouse_id === g.id && r.scope === "lunes_viernes")?.kg ?? null,
            inmediata: records.rows.find((r) => r.greenhouse_id === g.id && r.scope === "cosecha_inmediata")?.kg ?? null,
          },
          controles: controls.rows
            .filter((c) => c.greenhouse_id === g.id)
            .map((c) => controlDto(c, detectorInSegment(c, own.find((v) => v.hilera === c.hilera && v.lado === c.lado), rowLength))),
        };
      }),
    });
  });

  /** Comprueba que existen la recolección y el invernadero, y devuelve los días de la semana. */
  async function context(harvestId: string, greenhouseId: string): Promise<string[] | null> {
    const { rows } = await pool.query(
      "SELECT h.starts_on FROM harvests h, greenhouses g WHERE h.id = $1 AND g.id = $2",
      [harvestId, greenhouseId],
    );
    return rows[0] ? weekDays(rows[0].starts_on) : null;
  }

  /** Cinco valores de lunes a viernes; null deja el día sin dato. */
  function readDays(body: Body): (number | null)[] | null {
    const values = body.dias;
    if (!Array.isArray(values) || values.length !== 5) return null;
    return values.every((v) => v === null || isKg(v)) ? (values as (number | null)[]) : null;
  }

  router.put("/recolecciones/:id/campo/:invernaderoId/previsiones/:fuente", async (req, res) => {
    const { id, invernaderoId, fuente } = req.params;
    if (!HUMAN_SOURCES.has(fuente)) {
      res.status(400).json({ error: "La previsión debe ser del agricultor o del técnico" });
      return;
    }
    const values = readDays((req.body ?? {}) as Body);
    if (!values) {
      res.status(400).json({ error: "Indica los kilos de lunes a viernes, entre 0 y 10.000.000, o déjalos vacíos" });
      return;
    }
    const days = await context(id, invernaderoId);
    if (!days) {
      res.status(404).json({ error: "Recolección o invernadero no encontrados" });
      return;
    }
    await saveDays(days, values, (day, kg) =>
      kg === null
        ? pool.query("DELETE FROM daily_forecasts WHERE greenhouse_id = $1 AND day = $2 AND source = $3", [invernaderoId, day, fuente])
        : pool.query(
          `INSERT INTO daily_forecasts (greenhouse_id, day, source, kg) VALUES ($1, $2, $3, $4)
           ON CONFLICT (greenhouse_id, day, source) DO UPDATE SET kg = EXCLUDED.kg, recorded_at = now()`,
          [invernaderoId, day, fuente, kg],
        ));
    res.status(204).end();
  });

  router.put("/recolecciones/:id/campo/:invernaderoId/real", async (req, res) => {
    const { id, invernaderoId } = req.params;
    const values = readDays((req.body ?? {}) as Body);
    if (!values) {
      res.status(400).json({ error: "Indica los kilos de lunes a viernes, entre 0 y 10.000.000, o déjalos vacíos" });
      return;
    }
    const days = await context(id, invernaderoId);
    if (!days) {
      res.status(404).json({ error: "Recolección o invernadero no encontrados" });
      return;
    }
    // Lo que venga del ERP no se pisa a mano.
    await saveDays(days, values, (day, kg) =>
      kg === null
        ? pool.query("DELETE FROM daily_harvests WHERE greenhouse_id = $1 AND day = $2 AND source = 'manual'", [invernaderoId, day])
        : pool.query(
          `INSERT INTO daily_harvests (greenhouse_id, day, kg, source) VALUES ($1, $2, $3, 'manual')
           ON CONFLICT (greenhouse_id, day) DO UPDATE SET kg = EXCLUDED.kg, recorded_at = now()
           WHERE daily_harvests.source = 'manual'`,
          [invernaderoId, day, kg],
        ));
    res.status(204).end();
  });

  async function saveDays(days: string[], values: (number | null)[], write: (day: string, kg: number | null) => Promise<unknown>) {
    for (const [index, day] of days.entries()) await write(day, values[index]);
  }

  /** Sustituye todos los tramos de control del invernadero en esa recolección. */
  router.put("/recolecciones/:id/campo/:invernaderoId/controles", async (req, res) => {
    const user: SessionUser = res.locals.user;
    const { id, invernaderoId } = req.params;
    const list = ((req.body ?? {}) as Body).controles;
    if (!Array.isArray(list) || list.length > 20) {
      res.status(400).json({ error: "Envía la lista de tramos de control (como mucho 20)" });
      return;
    }
    const parsed: Omit<Control, "greenhouse_id">[] = [];
    for (const [index, raw] of list.entries()) {
      const c = (raw ?? {}) as Body;
      const where = `Tramo ${index + 1}`;
      const label = typeof c.etiqueta === "string" ? c.etiqueta.trim() : "";
      const optional = (value: unknown) => value === null || value === undefined;
      if (!label || label.length > 20) return void res.status(400).json({ error: `${where}: indica un nombre corto, como T1` });
      if (!(typeof c.hilera === "number" && Number.isInteger(c.hilera) && c.hilera > 0 && c.hilera <= 200)) {
        return void res.status(400).json({ error: `${label}: la hilera debe ser un número entero` });
      }
      if (c.lado !== "A" && c.lado !== "B") return void res.status(400).json({ error: `${label}: el lado debe ser A o B` });
      if (!isMeters(c.inicioM) || !isMeters(c.finM) || c.finM <= c.inicioM) {
        return void res.status(400).json({ error: `${label}: indica dónde empieza y acaba, en metros desde la cabecera, y que el final quede después del inicio` });
      }
      if (!isCount(c.visibles)) return void res.status(400).json({ error: `${label}: indica los maduros visibles, un número entero` });
      if (!optional(c.total) && !isCount(c.total)) return void res.status(400).json({ error: `${label}: el total de maduros debe ser un número entero` });
      if (isCount(c.total) && c.total < c.visibles) {
        return void res.status(400).json({ error: `${label}: el total no puede ser menor que los visibles` });
      }
      if (!optional(c.recogidos) && !isCount(c.recogidos)) return void res.status(400).json({ error: `${label}: los recogidos deben ser un número entero` });
      if (!optional(c.pesoG) && !isKg(c.pesoG)) return void res.status(400).json({ error: `${label}: el peso debe ser un número de gramos` });
      const nota = typeof c.nota === "string" ? c.nota.trim().slice(0, 300) : "";
      parsed.push({
        label,
        hilera: c.hilera,
        lado: c.lado,
        inicio_m: c.inicioM,
        fin_m: c.finM,
        visibles: c.visibles,
        total: optional(c.total) ? null : (c.total as number),
        recogidos: optional(c.recogidos) ? null : (c.recogidos as number),
        peso_g: optional(c.pesoG) ? null : (c.pesoG as number),
        nota: nota || null,
      });
    }
    if (new Set(parsed.map((c) => c.label.toLowerCase())).size !== parsed.length) {
      res.status(400).json({ error: "Cada tramo de control necesita un nombre distinto" });
      return;
    }
    if (!(await context(id, invernaderoId))) {
      res.status(404).json({ error: "Recolección o invernadero no encontrados" });
      return;
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM control_counts WHERE greenhouse_id = $1 AND harvest_id = $2", [invernaderoId, id]);
      for (const c of parsed) {
        await client.query(
          `INSERT INTO control_counts (greenhouse_id, harvest_id, label, hilera, lado, inicio_m, fin_m, visibles, total,
             recogidos, peso_g, nota, recorded_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [invernaderoId, id, c.label, c.hilera, c.lado, c.inicio_m, c.fin_m, c.visibles, c.total, c.recogidos, c.peso_g, c.nota, user.id],
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    res.status(204).end();
  });

  /** Ficha del invernadero (familia y ubicación) y, para esta semana, hileras, longitud y muestra de peso. */
  router.put("/recolecciones/:id/campo/:invernaderoId/ficha", async (req, res) => {
    const { id, invernaderoId } = req.params;
    const body = (req.body ?? {}) as Body;
    const { familia, municipio, latitud, longitud, hileras, longitudHileraM, muestra } = body;
    if (familia !== null && typeof familia !== "string") return void res.status(400).json({ error: "Familia no válida" });
    if (typeof familia === "string") {
      const known = await pool.query("SELECT crop FROM families WHERE id = $1", [familia]);
      const greenhouse = await pool.query("SELECT crop FROM greenhouses WHERE id = $1", [invernaderoId]);
      if (!known.rows[0]) return void res.status(400).json({ error: "Familia no válida" });
      if (greenhouse.rows[0] && known.rows[0].crop !== greenhouse.rows[0].crop) {
        return void res.status(400).json({ error: "La familia no es del cultivo de este invernadero" });
      }
    }
    const hasPlace = latitud !== null || longitud !== null;
    if (hasPlace && !(typeof latitud === "number" && latitud >= -90 && latitud <= 90
      && typeof longitud === "number" && longitud >= -180 && longitud <= 180)) {
      return void res.status(400).json({ error: "Indica latitud (−90 a 90) y longitud (−180 a 180), o deja las dos vacías" });
    }
    if (municipio !== null && (typeof municipio !== "string" || municipio.length > 100)) {
      return void res.status(400).json({ error: "El municipio debe tener como mucho 100 caracteres" });
    }
    if (!(typeof hileras === "number" && Number.isInteger(hileras) && hileras >= 1 && hileras <= 200)) {
      return void res.status(400).json({ error: "El número de hileras debe ser un entero entre 1 y 200" });
    }
    if (longitudHileraM !== null && !(isMeters(longitudHileraM) && longitudHileraM > 0)) {
      return void res.status(400).json({ error: "La longitud de la hilera debe ser un número de metros" });
    }
    let sample: { frutos: number; gramos: number } | null = null;
    if (muestra !== null) {
      const m = (muestra ?? {}) as Body;
      if (!(isCount(m.frutos) && m.frutos > 0 && isKg(m.gramos) && m.gramos > 0)) {
        return void res.status(400).json({ error: "La muestra necesita el número de frutos y su peso en gramos" });
      }
      sample = { frutos: m.frutos, gramos: m.gramos };
    }
    if (!(await context(id, invernaderoId))) {
      res.status(404).json({ error: "Recolección o invernadero no encontrados" });
      return;
    }
    await pool.query(
      "UPDATE greenhouses SET family_id = $2, municipality = $3, latitude = $4, longitude = $5 WHERE id = $1",
      [invernaderoId, familia, typeof municipio === "string" ? municipio.trim() || null : null, latitud, longitud],
    );
    await pool.query(
      `INSERT INTO weekly_data (greenhouse_id, harvest_id, hileras, longitud_m, muestra_frutos, muestra_g)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (greenhouse_id, harvest_id) DO UPDATE SET hileras = EXCLUDED.hileras, longitud_m = EXCLUDED.longitud_m,
         muestra_frutos = EXCLUDED.muestra_frutos, muestra_g = EXCLUDED.muestra_g, updated_at = now()`,
      [invernaderoId, id, hileras, longitudHileraM, sample?.frutos ?? null, sample?.gramos ?? null],
    );
    res.status(204).end();
  });

  return router;
}
