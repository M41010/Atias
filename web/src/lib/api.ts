/**
 * Capa de datos de la web. Ahora resuelve sobre datos simulados; cuando exista la API de Express,
 * solo cambia este archivo y las pantallas siguen igual.
 */

import {
  errorPct,
  forecastRange,
  type KgRange,
  observedRange,
  sumRanges,
  workersNeeded,
} from "./calc";
import {
  type AppWarning,
  CROPS,
  type CropId,
  DEFAULT_PARAMS,
  GREENHOUSES,
  type GreenhouseInfo,
  HARVESTS,
  type Hilera,
  LATEST_HARVEST_ID,
  type Params,
  type Video,
} from "./simulated";

const PARAMS_KEY = "atias.params.v1";
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
export type GreenhouseRow = {
  info: GreenhouseInfo;
  cropName: string;
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
  variety: string;
  ripeningPct: number;
};
export type CropRow = {
  crop: CropId;
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
  crops: CropRow[];
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
    crops: { ...DEFAULT_PARAMS.crops, ...saved.crops },
  };
}

function roundRange(range: KgRange): KgRange {
  return { kg: Math.round(range.kg), min: Math.round(range.min), max: Math.round(range.max) };
}

function buildHilera(h: Hilera, ripeningPct: number): HileraRow {
  if (!h.tramos) {
    return { n: h.n, observed: null, forecast: null, matureFruits: null, tramos: [] };
  }
  // Se redondea a kg enteros en el nivel más bajo: así los totales cuadran con lo que se ve
  // y no se sugiere una precisión que estos datos no tienen.
  const tramos = h.tramos.map((t) => ({
    n: t.n,
    observed: roundRange(observedRange(t.observedKg)),
    forecast: roundRange(forecastRange(t.observedKg, t.immatureKg, ripeningPct)),
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

function classesOf(crop: CropId, fruits: number) {
  const classes = CROPS[crop].classes;
  const counted = classes.slice(0, -1).map((c) => ({ name: c.name, fruits: Math.round(fruits * c.share) }));
  const rest = fruits - counted.reduce((sum, c) => sum + c.fruits, 0);
  return [...counted, { name: classes[classes.length - 1].name, fruits: rest }];
}

function buildReport(id: string, params: Params): HarvestReport | null {
  const harvest = HARVESTS.find((h) => h.id === id);
  if (!harvest) return null;
  const isLatest = id === LATEST_HARVEST_ID;
  // Las semanas pasadas se calcularon con los parámetros de entonces: no cambian al ajustar los actuales.
  const used = isLatest ? params : DEFAULT_PARAMS;

  const greenhouses: GreenhouseRow[] = harvest.captures.map((capture) => {
    const info = GREENHOUSES.find((g) => g.id === capture.greenhouseId) as GreenhouseInfo;
    const settings = used.crops[info.crop];
    const hileras = capture.hileras.map((h) => buildHilera(h, settings.ripeningPct));
    const analyzed = hileras.filter((h) => h.observed);
    const observed = sumRanges(analyzed.map((h) => h.observed as KgRange));
    const forecast = sumRanges(analyzed.map((h) => h.forecast as KgRange));
    const matureFruits = analyzed.reduce((sum, h) => sum + (h.matureFruits ?? 0), 0);
    const partial = analyzed.length < hileras.length;
    const status: GreenhouseStatus = partial
      ? "analizando"
      : capture.warnings.length > 0
        ? "con_advertencias"
        : "analizado";
    return {
      info,
      cropName: CROPS[info.crop].name,
      criterion: CROPS[info.crop].criterion,
      capturedAt: capture.capturedAt,
      status,
      isNew: capture.isNew && !readStorage<string[]>(SEEN_KEY, []).includes(`${id}/${info.id}`),
      partial,
      missingHileras: hileras.length - analyzed.length,
      warnedHileras: capture.warnings.filter((w) => w.severity === "alta").map((w) => w.hilera),
      observed,
      forecast,
      matureFruits,
      classes: classesOf(info.crop, matureFruits),
      hileras,
      videos: capture.videos,
      warnings: capture.warnings,
      realKg: capture.realKg,
      errorPct: capture.realKg === null ? null : errorPct(forecast.kg, capture.realKg),
      variety: settings.variety,
      ripeningPct: settings.ripeningPct,
    };
  });

  const crops: CropRow[] = (Object.keys(CROPS) as CropId[]).flatMap((crop) => {
    const rows = greenhouses.filter((g) => g.info.crop === crop);
    if (rows.length === 0) return [];
    const observed = sumRanges(rows.map((g) => g.observed));
    const forecast = sumRanges(rows.map((g) => g.forecast));
    const fruits = rows.reduce((sum, g) => sum + g.matureFruits, 0);
    const kgPerWorkday = used.crops[crop].kgPerWorkday;
    return [
      {
        crop,
        name: CROPS[crop].name,
        criterion: CROPS[crop].criterion,
        observed,
        forecast,
        matureFruits: fruits,
        partial: rows.some((g) => g.partial),
        warned: rows.some((g) => g.warnedHileras.length > 0),
        kgPerWorkday,
        workers: workersNeeded(forecast.kg, kgPerWorkday, used.days),
        workersMin: workersNeeded(forecast.min, kgPerWorkday, used.days),
        workersMax: workersNeeded(forecast.max, kgPerWorkday, used.days),
        classes: classesOf(crop, fruits),
      },
    ];
  });

  const addWorkers = (pick: (c: CropRow) => number | null) => {
    const values = crops.map(pick);
    return values.length === 0 || values.some((v) => v === null)
      ? null
      : (values as number[]).reduce((a, b) => a + b, 0);
  };

  const known = greenhouses.filter((g) => g.realKg !== null);
  const realKg = known.length > 0 && known.length === greenhouses.length
    ? known.reduce((sum, g) => sum + (g.realKg as number), 0)
    : null;
  const forecast = sumRanges(crops.map((c) => c.forecast));

  return {
    id,
    label: harvest.label,
    isoWeek: harvest.isoWeek,
    isLatest,
    empty: greenhouses.length === 0,
    partial: greenhouses.some((g) => g.partial),
    totalHileras: greenhouses.reduce((sum, g) => sum + g.hileras.length, 0),
    missingHileras: greenhouses.reduce((sum, g) => sum + g.missingHileras, 0),
    captureDates: greenhouses.map((g) => g.capturedAt),
    realKg,
    errorPct: realKg === null ? null : errorPct(forecast.kg, realKg),
    days: used.days,
    observed: sumRanges(crops.map((c) => c.observed)),
    forecast,
    matureFruits: crops.reduce((sum, c) => sum + c.matureFruits, 0),
    workers: addWorkers((c) => c.workers),
    workersMin: addWorkers((c) => c.workersMin),
    workersMax: addWorkers((c) => c.workersMax),
    crops,
    greenhouses,
    warnings: greenhouses.flatMap((g) => g.warnings),
  };
}

export function listHarvests(): Promise<HarvestOption[]> {
  return simulateLatency(() =>
    HARVESTS.map((h) => ({ id: h.id, label: h.label, hasData: h.captures.length > 0 })),
  );
}

export function getReport(id: string): Promise<HarvestReport | null> {
  return simulateLatency(() => buildReport(id, currentParams()));
}

export type PastHarvest = { id: string; label: string; forecastKg: number; realKg: number; errorPct: number | null };

/** Recolecciones ya pesadas, siempre con los parámetros que se usaron entonces. */
export function listPastHarvests(): Promise<PastHarvest[]> {
  return simulateLatency(() =>
    HARVESTS.flatMap((h) => {
      const report = buildReport(h.id, DEFAULT_PARAMS);
      if (!report || report.realKg === null) return [];
      return [{ id: h.id, label: h.label, forecastKg: report.forecast.kg, realKg: report.realKg, errorPct: report.errorPct }];
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

export { DEFAULT_PARAMS, LATEST_HARVEST_ID };
export type { AppWarning, CropId, Params };
