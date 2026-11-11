/**
 * Meteorología real de Open-Meteo: temperatura exterior por hora en la localización de cada
 * invernadero, y lo normal en cada fecha y hora (media de años anteriores).
 *
 * Datos de Open-Meteo.com, con licencia CC BY 4.0. Su uso gratuito es para fines no comerciales:
 * si el proyecto sigue, hay que contratar su plan comercial.
 */
import type { Pool } from "./db.js";

export const TIME_ZONE = "Europe/Madrid";
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;
/** La previsión se vuelve a pedir pasada una hora; lo ya observado no cambia. */
const FORECAST_MAX_AGE_MS = HOUR_MS;
/** La API de previsión cubre los últimos 92 días; antes hay que usar el histórico. */
const FORECAST_PAST_DAYS = 85;
const FORECAST_FUTURE_DAYS = 15;
/** Días a cada lado que se promedian para suavizar lo normal de una fecha. */
const NORMAL_WINDOW_DAYS = 3;
const REQUEST_TIMEOUT_MS = 20_000;

export type WeatherConfig = {
  forecastUrl?: string;
  archiveUrl?: string;
  /** Años completos anteriores que forman lo normal. */
  normalsYears?: number;
  now?: () => number;
  /** Tras un fallo de Open-Meteo, cuánto esperar antes de volver a pedir lo mismo. */
  retryAfterMs?: number;
};

export type WeatherDay = {
  date: string;
  /** Temperatura de cada hora del día en España: 24 valores, o 23 y 25 en los cambios de hora. */
  hourlyTempC: number[];
  /** Lo normal en esa fecha, de 00:00 a 23:00. */
  normalHourlyTempC: number[];
  precipitationMm: number;
  /** observado: ya ocurrió; prevision: aún no; normal: Open-Meteo no llega a esa fecha y se usa lo normal. */
  kind: "observado" | "prevision" | "normal";
};

export type WeatherWeek = {
  days: WeatherDay[];
  normalsYears: number;
  updatedAt: string | null;
  /** Open-Meteo no respondió y se sirve lo último guardado. */
  stale: boolean;
};

export class WeatherUnavailable extends Error {}

// ---- Fechas en hora de España ----

const localParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
});

/** Fecha (AAAA-MM-DD) y hora en España de un instante. */
export function localDateHour(ms: number): { date: string; hour: number } {
  const parts = Object.fromEntries(localParts.formatToParts(new Date(ms)).map((p) => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}

/** Instante en que empieza un día en España (las 00:00 de esa fecha). */
export function localMidnight(isoDate: string): number {
  const utc = Date.parse(`${isoDate}T00:00:00Z`);
  for (const offsetHours of [1, 2, 0]) {
    const candidate = utc - offsetHours * HOUR_MS;
    const { date, hour } = localDateHour(candidate);
    if (date === isoDate && hour === 0) return candidate;
  }
  throw new Error(`No se puede situar ${isoDate} en hora de España`);
}

export const addDays = (isoDate: string, days: number) =>
  new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

/** Coordenadas redondeadas: invernaderos a menos de 1 km comparten datos. */
export function pointOf(latitude: number, longitude: number) {
  const lat = Math.round(latitude * 100) / 100;
  const lon = Math.round(longitude * 100) / 100;
  return { id: `${lat.toFixed(2)},${lon.toFixed(2)}`, lat, lon };
}

// ---- Lo normal ----

type Hourly = { time: number[]; temperature_2m: (number | null)[]; precipitation?: (number | null)[] };

/** 366 fechas MM-DD en orden, para recorrer el año sin depender de si es bisiesto. */
const MONTH_DAYS = Array.from({ length: 366 }, (_, i) => addDays("2024-01-01", i).slice(5));

/**
 * Lo normal en cada fecha y hora: la media de esa hora en todos los años, suavizada con los días
 * de alrededor para que un año raro no pese demasiado.
 */
export function computeNormals(hourly: Hourly): Map<string, number[]> {
  const sums = new Map<string, { sum: number; count: number }[]>();
  for (const md of MONTH_DAYS) sums.set(md, Array.from({ length: 24 }, () => ({ sum: 0, count: 0 })));
  hourly.time.forEach((seconds, i) => {
    const temp = hourly.temperature_2m[i];
    if (temp === null || !Number.isFinite(temp)) return;
    const { date, hour } = localDateHour(seconds * 1000);
    const cell = sums.get(date.slice(5))?.[hour];
    if (!cell) return;
    cell.sum += temp;
    cell.count += 1;
  });
  const normals = new Map<string, number[]>();
  MONTH_DAYS.forEach((md, index) => {
    const hours = Array.from({ length: 24 }, (_, hour) => {
      let sum = 0;
      let count = 0;
      for (let offset = -NORMAL_WINDOW_DAYS; offset <= NORMAL_WINDOW_DAYS; offset++) {
        const cell = sums.get(MONTH_DAYS[(index + offset + 366) % 366])?.[hour];
        if (cell) {
          sum += cell.sum;
          count += cell.count;
        }
      }
      return count > 0 ? Math.round((sum / count) * 10) / 10 : Number.NaN;
    });
    if (hours.every(Number.isFinite)) normals.set(md, hours);
  });
  return normals;
}

// ---- Open-Meteo ----

async function getHourly(url: URL): Promise<Hourly> {
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) throw new WeatherUnavailable(`Open-Meteo respondió ${response.status}`);
  const body = (await response.json()) as { hourly?: Hourly };
  if (!body.hourly || !Array.isArray(body.hourly.time) || !Array.isArray(body.hourly.temperature_2m)) {
    throw new WeatherUnavailable("Respuesta de Open-Meteo no válida");
  }
  return body.hourly;
}

function openMeteoUrl(base: string, lat: number, lon: number, start: string, end: string, precipitation: boolean): URL {
  const url = new URL(base);
  url.search = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: precipitation ? "temperature_2m,precipitation" : "temperature_2m",
    timezone: TIME_ZONE,
    timeformat: "unixtime",
    start_date: start,
    end_date: end,
  }).toString();
  return url;
}

export function createWeatherService(pool: Pool, config: WeatherConfig = {}) {
  const forecastUrl = config.forecastUrl ?? "https://api.open-meteo.com/v1/forecast";
  const archiveUrl = config.archiveUrl ?? "https://archive-api.open-meteo.com/v1/archive";
  const normalsYears = config.normalsYears ?? 10;
  const now = config.now ?? Date.now;
  const retryAfterMs = config.retryAfterMs ?? 10 * 60_000;
  // Evita pedir lo mismo dos veces a la vez si llegan varias peticiones juntas.
  const inFlight = new Map<string, Promise<void>>();
  // Si Open-Meteo falla (caído o sin conexión), cada petición esperaría hasta agotar el tiempo
  // antes de servir lo guardado. Se recuerda el fallo y, durante un rato, se sirve lo guardado al
  // momento sin volver a intentarlo.
  const failedAt = new Map<string, number>();

  const once = (key: string, task: () => Promise<void>) => {
    const failed = failedAt.get(key);
    const since = failed === undefined ? Number.POSITIVE_INFINITY : now() - failed;
    if (since >= 0 && since < retryAfterMs) {
      return Promise.reject(new WeatherUnavailable("Open-Meteo falló hace poco: se sirve lo guardado"));
    }
    const running = inFlight.get(key);
    if (running) return running;
    const promise = task()
      .then(() => {
        failedAt.delete(key);
      })
      .catch((error: unknown) => {
        failedAt.set(key, now());
        throw error;
      })
      .finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
    return promise;
  };

  async function ensureNormals(point: ReturnType<typeof pointOf>): Promise<void> {
    const { rows } = await pool.query("SELECT normals_computed_at FROM weather_points WHERE id = $1", [point.id]);
    if (rows[0]?.normals_computed_at) return;
    await once(`normales:${point.id}`, async () => {
      const lastYear = Number(localDateHour(now()).date.slice(0, 4)) - 1;
      const hourly = await getHourly(openMeteoUrl(
        archiveUrl, point.lat, point.lon, `${lastYear - normalsYears + 1}-01-01`, `${lastYear}-12-31`, false,
      ));
      const normals = computeNormals(hourly);
      if (normals.size < 365) throw new WeatherUnavailable("Histórico de Open-Meteo incompleto");
      const keys = [...normals.keys()];
      await pool.query(
        `INSERT INTO point_normals (point_id, month_day, hour, temp_c)
         SELECT $1, md, h, t FROM unnest($2::text[], $3::smallint[], $4::float8[]) AS x(md, h, t)
         ON CONFLICT (point_id, month_day, hour) DO UPDATE SET temp_c = EXCLUDED.temp_c`,
        [
          point.id,
          keys.flatMap((md) => Array(24).fill(md)),
          keys.flatMap(() => Array.from({ length: 24 }, (_, h) => h)),
          keys.flatMap((md) => normals.get(md) as number[]),
        ],
      );
      await pool.query(
        "UPDATE weather_points SET normals_years = $2, normals_computed_at = now() WHERE id = $1",
        [point.id, normalsYears],
      );
    });
  }

  /** Pide a Open-Meteo las horas de la semana que falten o que aún sean previsión antigua. */
  async function ensureWeek(point: ReturnType<typeof pointOf>, saturday: string): Promise<void> {
    const start = localMidnight(saturday);
    const end = localMidnight(addDays(saturday, 7));
    const current = now();
    const today = localDateHour(current).date;
    const lastAvailable = addDays(today, FORECAST_FUTURE_DAYS);
    const lastDay = addDays(saturday, 6) < lastAvailable ? addDays(saturday, 6) : lastAvailable;
    if (saturday > lastAvailable) return;

    const expected = Math.round((Math.min(end, localMidnight(addDays(lastDay, 1))) - start) / HOUR_MS);
    const { rows } = await pool.query(
      `SELECT count(*)::int AS hours,
         count(*) FILTER (WHERE kind = 'prevision' AND (measured_at < to_timestamp($4 / 1000.0)
           OR fetched_at < to_timestamp($4 / 1000.0) - make_interval(secs => $5 / 1000.0)))::int AS outdated
       FROM point_weather WHERE point_id = $1 AND measured_at >= to_timestamp($2 / 1000.0)
         AND measured_at < to_timestamp($3 / 1000.0)`,
      [point.id, start, end, current, FORECAST_MAX_AGE_MS],
    );
    if (rows[0].hours >= expected && rows[0].outdated === 0) return;

    await once(`semana:${point.id}:${saturday}`, async () => {
      // Lo muy antiguo solo está en el histórico, que va unos días por detrás.
      const base = saturday < addDays(today, -FORECAST_PAST_DAYS) ? archiveUrl : forecastUrl;
      const hourly = await getHourly(openMeteoUrl(base, point.lat, point.lon, saturday, lastDay, true));
      const times: number[] = [];
      const temps: number[] = [];
      const rain: (number | null)[] = [];
      hourly.time.forEach((seconds, i) => {
        const temp = hourly.temperature_2m[i];
        if (temp === null || !Number.isFinite(temp)) return;
        times.push(seconds * 1000);
        temps.push(temp);
        rain.push(hourly.precipitation?.[i] ?? null);
      });
      await pool.query(
        `INSERT INTO point_weather (point_id, measured_at, kind, temp_c, precipitation_mm, fetched_at)
         SELECT $1, to_timestamp(t / 1000.0),
           CASE WHEN t < $5 THEN 'observado' ELSE 'prevision' END, temp, rain, to_timestamp($5 / 1000.0)
         FROM unnest($2::float8[], $3::float8[], $4::float8[]) AS x(t, temp, rain)
         ON CONFLICT (point_id, measured_at) DO UPDATE SET
           kind = EXCLUDED.kind, temp_c = EXCLUDED.temp_c,
           precipitation_mm = EXCLUDED.precipitation_mm, fetched_at = EXCLUDED.fetched_at`,
        [point.id, times, temps, rain, current],
      );
    });
  }

  /** Semana de una recolección: de sábado (día de grabar) a viernes. */
  async function week(latitude: number, longitude: number, monday: string): Promise<WeatherWeek> {
    const point = pointOf(latitude, longitude);
    const saturday = addDays(monday, -2);
    await pool.query(
      "INSERT INTO weather_points (id, latitude, longitude) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
      [point.id, point.lat, point.lon],
    );

    let stale = false;
    try {
      await Promise.all([ensureNormals(point), ensureWeek(point, saturday)]);
    } catch (error) {
      // Sin Open-Meteo se sirve lo guardado, avisando. Solo falla si no hay nada.
      // El fallo se anota una vez; mientras se espera para reintentar no se repite en el registro.
      if (!(error instanceof WeatherUnavailable && error.message.startsWith("Open-Meteo falló hace poco"))) {
        console.error("Open-Meteo no disponible", error);
      }
      stale = true;
    }

    const dates = Array.from({ length: 7 }, (_, i) => addDays(saturday, i));
    const normals = await pool.query(
      `SELECT month_day, hour, temp_c FROM point_normals WHERE point_id = $1 AND month_day = ANY($2)
       ORDER BY month_day, hour`,
      [point.id, dates.map((d) => d.slice(5))],
    );
    const readings = await pool.query(
      `SELECT to_char(measured_at AT TIME ZONE $4, 'YYYY-MM-DD') AS day, kind, temp_c, precipitation_mm, fetched_at
       FROM point_weather WHERE point_id = $1 AND measured_at >= to_timestamp($2 / 1000.0)
         AND measured_at < to_timestamp($3 / 1000.0)
       ORDER BY measured_at`,
      [point.id, localMidnight(saturday), localMidnight(addDays(saturday, 7)), TIME_ZONE],
    );
    const { rows: meta } = await pool.query("SELECT normals_years FROM weather_points WHERE id = $1", [point.id]);
    if (normals.rows.length < dates.length * 24) throw new WeatherUnavailable("Aún no hay datos de Open-Meteo");

    const days = dates.map((date): WeatherDay => {
      const normal = normals.rows.filter((r) => r.month_day === date.slice(5)).map((r) => r.temp_c);
      const hours = readings.rows.filter((r) => r.day === date);
      if (hours.length === 0) {
        return { date, hourlyTempC: normal, normalHourlyTempC: normal, precipitationMm: 0, kind: "normal" };
      }
      const rain = hours.reduce((sum, r) => sum + (r.precipitation_mm ?? 0), 0);
      return {
        date,
        hourlyTempC: hours.map((r) => r.temp_c),
        normalHourlyTempC: normal,
        precipitationMm: Math.round(rain * 10) / 10,
        kind: hours.some((r) => r.kind === "prevision") ? "prevision" : "observado",
      };
    });
    const fetched = readings.rows.map((r) => (r.fetched_at as Date).getTime());
    return {
      days,
      normalsYears: meta[0].normals_years,
      updatedAt: fetched.length ? new Date(Math.max(...fetched)).toISOString() : null,
      stale,
    };
  }

  return { week };
}

export type WeatherService = ReturnType<typeof createWeatherService>;
