/**
 * Capa de datos de la web. Ahora resuelve sobre datos simulados; cuando exista la API de Express,
 * solo cambia este archivo y las pantallas siguen igual.
 */

import {
  errorPct,
  forecastRange,
  harvestDayShares,
  type KgRange,
  observedRange,
  roundKeepingTotal,
  splitByDay,
  sumRanges,
  workersNeeded,
} from "./calc";
import {
  addDays,
  type AppWarning,
  DEFAULT_PARAMS,
  FAMILIES,
  FAMILY_ORDER,
  type FamilyId,
  GREENHOUSES,
  type GreenhouseInfo,
  GROWERS,
  HARVESTS,
  type Hilera,
  LATEST_HARVEST_ID,
  type Params,
  SIMULATED_TODAY,
  simulatedWeather,
  TECHNICIANS,
  type Video,
} from "./simulated";
import { fetchRealWeather, type RealWeather, summarizeWeather, weatherKey, type WeatherSummary } from "./weather";

export type { WeatherDay, WeatherSummary } from "./weather";

// v2: los parámetros pasan de ir por cultivo a ir por familia.
const PARAMS_KEY = "atias.params.v2";
const SEEN_KEY = "atias.vistos.v1";

export type HarvestOption = { id: string; label: string; hasData: boolean };

export type TramoRow = {
  n: number;
  observed: KgRange;
  forecast: KgRange;
  matureFruits: number;
};
export type HileraRow = {
  n: number;
  observed: KgRange | null;
  forecast: KgRange | null;
  matureFruits: number | null;
  tramos: TramoRow[];
};
export type GreenhouseStatus = "analizado" | "con_advertencias" | "analizando";

/** Un día de recolección: real, previsión del técnico y previsión de Atias. */
export type DayRow = {
  date: string;
  /** Kg reales del ERP. Null si ese día aún no se ha recogido. */
  real: number | null;
  technician: number;
  atias: number;
};

export type GreenhouseRow = {
  info: GreenhouseInfo;
  familyName: string;
  growerName: string;
  technicianId: string;
  technicianName: string;
  criterion: string;
  capturedAt: string;
  status: GreenhouseStatus;
  isNew: boolean;
  partial: boolean;
  missingHileras: number;
  warnedHileras: number[];
  observed: KgRange;
  forecast: KgRange;
  matureFruits: number;
  classes: { name: string; fruits: number }[];
  hileras: HileraRow[];
  videos: Video[];
  warnings: AppWarning[];
  realKg: number | null;
  errorPct: number | null;
  technicianKg: number;
  technicianErrorPct: number | null;
  ripeningPct: number;
  weather: WeatherSummary;
  daily: DayRow[];
};
export type FamilyRow = {
  family: FamilyId;
  name: string;
  observed: KgRange;
  forecast: KgRange;
  matureFruits: number;
  partial: boolean;
  warned: boolean;
  kgPerWorkday: number;
  workers: number | null;
  workersMin: number | null;
  workersMax: number | null;
  classes: { name: string; fruits: number }[];
  criterion: string;
};
export type HarvestReport = {
  id: string;
  label: string;
  isoWeek: number;
  year: number;
  /** Fechas de lunes a viernes. */
  dates: string[];
  updatedAt: string;
  isLatest: boolean;
  empty: boolean;
  partial: boolean;
  totalHileras: number;
  missingHileras: number;
  captureDates: string[];
  realKg: number | null;
  errorPct: number | null;
  days: number;
  observed: KgRange;
  forecast: KgRange;
  matureFruits: number;
  workers: number | null;
  workersMin: number | null;
  workersMax: number | null;
  families: FamilyRow[];
  greenhouses: GreenhouseRow[];
  warnings: AppWarning[];
};

function demoMode(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("demo");
}

async function simulateLatency<T>(value: () => T): Promise<T> {
  const demo = demoMode();
  if (demo === "carga") await new Promise(() => {});
  await new Promise((resolve) => setTimeout(resolve, 180));
  if (demo === "error") throw new Error("El servidor no ha respondido.");
  return value();
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sin almacenamiento el cambio dura lo que la sesión: no debe romper la pantalla.
  }
}

function currentParams(): Params {
  const saved = readStorage<Partial<Params>>(PARAMS_KEY, {});
  return {
    days: saved.days ?? DEFAULT_PARAMS.days,
    families: { ...DEFAULT_PARAMS.families, ...saved.families },
  };
}

function roundRange(range: KgRange): KgRange {
  return { kg: Math.round(range.kg), min: Math.round(range.min), max: Math.round(range.max) };
}

function buildHilera(h: Hilera, ripeningPct: number, factor: number): HileraRow {
  if (!h.tramos) {
    return { n: h.n, observed: null, forecast: null, matureFruits: null, tramos: [] };
  }
  // Se redondea a kg enteros en el nivel más bajo: así los totales cuadran con lo que se ve
  // y no se sugiere una precisión que estos datos no tienen.
  const tramos = h.tramos.map((t) => ({
    n: t.n,
    observed: roundRange(observedRange(t.observedKg)),
    forecast: roundRange(forecastRange(t.observedKg, t.immatureKg, ripeningPct, factor)),
    matureFruits: t.matureFruits,
  }));
  return {
    n: h.n,
    observed: sumRanges(tramos.map((t) => t.observed)),
    forecast: sumRanges(tramos.map((t) => t.forecast)),
    matureFruits: tramos.reduce((sum, t) => sum + t.matureFruits, 0),
    tramos,
  };
}

function classesOf(family: FamilyId, fruits: number) {
  const classes = FAMILIES[family].classes;
  const counted = classes.slice(0, -1).map((c) => ({ name: c.name, fruits: Math.round(fruits * c.share) }));
  const rest = fruits - counted.reduce((sum, c) => sum + c.fruits, 0);
  return [...counted, { name: classes[classes.length - 1].name, fruits: rest }];
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

type WeatherMap = Map<string, RealWeather | null>;

/** Meteorología real si la hay; si no, la simulada, marcada como tal. */
function weatherOf(info: GreenhouseInfo, monday: string, real: WeatherMap): WeatherSummary {
  const found = real.get(weatherKey(info.location, monday));
  if (found) return summarizeWeather(found.days, { source: "open-meteo", normalsYears: found.normalsYears, stale: found.stale });
  return summarizeWeather(simulatedWeather(info.location, monday, SIMULATED_TODAY), {
    source: "simulada",
    normalsYears: null,
    stale: false,
  });
}

/** Pide a la API la semana de cada lugar distinto, todas a la vez. */
async function loadWeather(harvestIds: string[]): Promise<WeatherMap> {
  const wanted = new Map<string, { location: GreenhouseInfo["location"]; monday: string }>();
  for (const harvest of HARVESTS.filter((h) => harvestIds.includes(h.id))) {
    for (const capture of harvest.captures) {
      const info = GREENHOUSES.find((g) => g.id === capture.greenhouseId) as GreenhouseInfo;
      wanted.set(weatherKey(info.location, harvest.monday), { location: info.location, monday: harvest.monday });
    }
  }
  if (demoMode() === "sin-meteo") return new Map();
  const entries = await Promise.all(
    [...wanted].map(async ([key, { location, monday }]) => [key, await fetchRealWeather(location, monday)] as const),
  );
  return new Map(entries);
}

function buildReport(id: string, params: Params, real: WeatherMap): HarvestReport | null {
  const harvest = HARVESTS.find((h) => h.id === id);
  if (!harvest) return null;
  const isLatest = id === LATEST_HARVEST_ID;
  // Las semanas pasadas se calcularon con los parámetros de entonces: no cambian al ajustar los actuales.
  const used = isLatest ? params : DEFAULT_PARAMS;
  const dates = Array.from({ length: 5 }, (_, i) => addDays(harvest.monday, i));

  const greenhouses: GreenhouseRow[] = harvest.captures.map((capture) => {
    const info = GREENHOUSES.find((g) => g.id === capture.greenhouseId) as GreenhouseInfo;
    const family = FAMILIES[info.family];
    const grower = GROWERS.find((a) => a.id === info.growerId);
    const technician = TECHNICIANS.find((t) => t.id === grower?.technicianId);
    const settings = used.families[info.family];
    const weather = weatherOf(info, harvest.monday, real);
    const hileras = capture.hileras.map((h) => buildHilera(h, settings.ripeningPct, weather.factor));
    const analyzed = hileras.filter((h) => h.observed);
    const observed = sumRanges(analyzed.map((h) => h.observed as KgRange));
    const forecast = sumRanges(analyzed.map((h) => h.forecast as KgRange));
    const matureFruits = analyzed.reduce((total, h) => total + (h.matureFruits ?? 0), 0);
    const partial = analyzed.length < hileras.length;
    const status: GreenhouseStatus = partial
      ? "analizando"
      : capture.warnings.length > 0
        ? "con_advertencias"
        : "analizado";
    const atiasDays = roundKeepingTotal(
      splitByDay(observed, forecast, harvestDayShares(weather.days.map((d) => d.degreeDays))).map((d) => d.kg),
    );
    const realKg = capture.realDailyKg?.every((kg) => kg !== null) ? sum(capture.realDailyKg as number[]) : null;
    const technicianKg = sum(capture.technicianKg);
    return {
      info,
      familyName: family.name,
      growerName: grower?.name ?? "—",
      technicianId: technician?.id ?? "",
      technicianName: technician?.name ?? "—",
      criterion: family.criterion,
      capturedAt: capture.capturedAt,
      status,
      isNew: capture.isNew && !readStorage<string[]>(SEEN_KEY, []).includes(`${id}/${info.id}`),
      partial,
      missingHileras: hileras.length - analyzed.length,
      warnedHileras: capture.warnings.filter((w) => w.severity === "alta").map((w) => w.hilera),
      observed,
      forecast,
      matureFruits,
      classes: classesOf(info.family, matureFruits),
      hileras,
      videos: capture.videos,
      warnings: capture.warnings,
      realKg,
      errorPct: realKg === null ? null : errorPct(forecast.kg, realKg),
      technicianKg,
      technicianErrorPct: realKg === null ? null : errorPct(technicianKg, realKg),
      ripeningPct: settings.ripeningPct,
      weather,
      daily: dates.map((date, i) => ({
        date,
        real: capture.realDailyKg?.[i] ?? null,
        technician: capture.technicianKg[i],
        atias: atiasDays[i],
      })),
    };
  });

  const families: FamilyRow[] = FAMILY_ORDER.flatMap((family) => {
    const rows = greenhouses.filter((g) => g.info.family === family);
    if (rows.length === 0) return [];
    const observed = sumRanges(rows.map((g) => g.observed));
    const forecast = sumRanges(rows.map((g) => g.forecast));
    const fruits = rows.reduce((total, g) => total + g.matureFruits, 0);
    const kgPerWorkday = used.families[family].kgPerWorkday;
    return [
      {
        family,
        name: FAMILIES[family].name,
        criterion: FAMILIES[family].criterion,
        observed,
        forecast,
        matureFruits: fruits,
        partial: rows.some((g) => g.partial),
        warned: rows.some((g) => g.warnedHileras.length > 0),
        kgPerWorkday,
        workers: workersNeeded(forecast.kg, kgPerWorkday, used.days),
        workersMin: workersNeeded(forecast.min, kgPerWorkday, used.days),
        workersMax: workersNeeded(forecast.max, kgPerWorkday, used.days),
        classes: classesOf(family, fruits),
      },
    ];
  });

  const addWorkers = (pick: (c: FamilyRow) => number | null) => {
    const values = families.map(pick);
    return values.length === 0 || values.some((v) => v === null)
      ? null
      : (values as number[]).reduce((a, b) => a + b, 0);
  };

  const known = greenhouses.filter((g) => g.realKg !== null);
  const realKg = known.length > 0 && known.length === greenhouses.length
    ? known.reduce((total, g) => total + (g.realKg as number), 0)
    : null;
  const forecast = sumRanges(families.map((c) => c.forecast));

  return {
    id,
    label: harvest.label,
    isoWeek: harvest.isoWeek,
    year: harvest.year,
    dates,
    updatedAt: harvest.updatedAt,
    isLatest,
    empty: greenhouses.length === 0,
    partial: greenhouses.some((g) => g.partial),
    totalHileras: greenhouses.reduce((total, g) => total + g.hileras.length, 0),
    missingHileras: greenhouses.reduce((total, g) => total + g.missingHileras, 0),
    captureDates: greenhouses.map((g) => g.capturedAt),
    realKg,
    errorPct: realKg === null ? null : errorPct(forecast.kg, realKg),
    days: used.days,
    observed: sumRanges(families.map((c) => c.observed)),
    forecast,
    matureFruits: families.reduce((total, c) => total + c.matureFruits, 0),
    workers: addWorkers((c) => c.workers),
    workersMin: addWorkers((c) => c.workersMin),
    workersMax: addWorkers((c) => c.workersMax),
    families,
    greenhouses,
    warnings: greenhouses.flatMap((g) => g.warnings),
  };
}

export function listHarvests(): Promise<HarvestOption[]> {
  return simulateLatency(() =>
    HARVESTS.map((h) => ({ id: h.id, label: h.label, hasData: h.captures.length > 0 })),
  );
}

export async function getReport(id: string): Promise<HarvestReport | null> {
  const real = await loadWeather([id]);
  return simulateLatency(() => buildReport(id, currentParams(), real));
}

/** Todas las recolecciones con datos, para comparar previsiones semana a semana. */
export async function listReports(): Promise<HarvestReport[]> {
  const real = await loadWeather(HARVESTS.map((h) => h.id));
  return simulateLatency(() => {
    const params = currentParams();
    return HARVESTS.flatMap((h) => {
      const report = buildReport(h.id, params, real);
      return report && !report.empty ? [report] : [];
    });
  });
}

export type PastHarvest = {
  id: string;
  label: string;
  forecastKg: number;
  technicianKg: number;
  realKg: number;
  errorPct: number | null;
  technicianErrorPct: number | null;
};

/** Recolecciones ya pesadas, siempre con los parámetros que se usaron entonces. */
export async function listPastHarvests(): Promise<PastHarvest[]> {
  const real = await loadWeather(HARVESTS.map((h) => h.id));
  return simulateLatency(() =>
    HARVESTS.flatMap((h) => {
      const report = buildReport(h.id, DEFAULT_PARAMS, real);
      if (!report || report.realKg === null) return [];
      const technicianKg = report.greenhouses.reduce((total, g) => total + g.technicianKg, 0);
      return [{
        id: h.id,
        label: h.label,
        forecastKg: report.forecast.kg,
        technicianKg,
        realKg: report.realKg,
        errorPct: report.errorPct,
        technicianErrorPct: errorPct(technicianKg, report.realKg),
      }];
    }),
  );
}

export function getParams(): Promise<Params> {
  return simulateLatency(currentParams);
}

export function saveParams(params: Params): Promise<Params> {
  return simulateLatency(() => {
    writeStorage(PARAMS_KEY, params);
    return params;
  });
}

export function markSeen(harvestId: string, greenhouseId: string): Promise<void> {
  return simulateLatency(() => {
    const key = `${harvestId}/${greenhouseId}`;
    const seen = readStorage<string[]>(SEEN_KEY, []);
    if (!seen.includes(key)) writeStorage(SEEN_KEY, [...seen, key]);
  });
}

export { DEFAULT_PARAMS, FAMILIES, FAMILY_ORDER, LATEST_HARVEST_ID, TECHNICIANS };
export type { AppWarning, FamilyId, Params };
