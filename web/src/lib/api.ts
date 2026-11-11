/**
 * Capa de datos de la web. Con datos reales, se calcula a partir de lo que guarda la API (vídeos
 * contados, previsiones del agricultor y del técnico, cosecha pesada). En el modo demostración, a
 * partir de los datos simulados. Las pantallas reciben siempre la misma forma.
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
import { countMessages } from "./count";
import { getDataMode } from "./mode";
import { captureDates, recordingWarnings } from "./recording";
import { type ControlWithAtias, fetchFieldData, fetchHarvestList, type FieldData, type FieldGreenhouse } from "./serverApi";
import {
  addDays,
  type AppWarning,
  CROPS,
  DEFAULT_PARAMS,
  FAMILIES,
  FAMILY_ORDER,
  type FamilyId,
  GREENHOUSES,
  type GreenhouseInfo,
  GROWERS,
  HARVESTS,
  type Hilera,
  LATEST_HARVEST_ID as DEMO_LATEST_ID,
  type Location,
  type Params,
  SIMULATED_TODAY,
  simulatedWeather,
  TECHNICIANS,
  type Tramo,
  type Video,
} from "./simulated";
import { fetchRealWeather, type RealWeather, summarizeWeather, weatherKey, type WeatherSummary } from "./weather";

export type { WeatherDay, WeatherSummary } from "./weather";

// v2: los parámetros pasan de ir por cultivo a ir por familia.
const PARAMS_KEY = "atias.params.v2";
const SEEN_KEY = "atias.vistos.v1";

/** Recolección «la última»: cada modo la resuelve a la suya. */
export const LATEST_HARVEST_ID = "ultima";

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

/** Un día de recolección: real, previsiones humanas y previsión de Atias. */
export type DayRow = {
  date: string;
  /** Kg reales. Null si ese día aún no se ha recogido o no se ha apuntado. */
  real: number | null;
  technician: number | null;
  farmer: number | null;
  atias: number;
};

/** De dónde sale el peso medio por fruto con el que se pasan frutos a kilos. */
export type GramsSource = "muestra" | "control" | "provisional" | "simulado";

export type GreenhouseRow = {
  info: GreenhouseInfo;
  familyName: string;
  growerName: string;
  technicianId: string;
  technicianName: string;
  criterion: string;
  /** Primera captura del invernadero: cuándo se grabó o, si no se sabe, cuándo llegó. */
  capturedAt: string;
  /** Todas las fechas de captura del invernadero, para dar el intervalo. */
  captureDates: string[];
  /** false si no se sabe cuándo se grabó ningún vídeo y las fechas son las de recepción. */
  captureFromRecording: boolean;
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
  /** Kg recogidos de lunes a viernes. */
  realKg: number | null;
  errorPct: number | null;
  technicianKg: number | null;
  technicianErrorPct: number | null;
  farmerKg: number | null;
  farmerErrorPct: number | null;
  /** Kg recogidos justo después de grabar: se comparan con lo observado, no con la previsión. */
  immediateKg: number | null;
  gramsPerFruit: number;
  gramsSource: GramsSource;
  controls: ControlWithAtias[];
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
  /** Datos simulados (modo demostración): ninguna cifra indica la precisión real. */
  simulated: boolean;
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

function demoQuery(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("demo");
}

async function simulateLatency<T>(value: () => T): Promise<T> {
  const demo = demoQuery();
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
  // Una décima: con datos reales un tramo puede tener pocos kilos y redondear a enteros los borraría.
  // Para enseñarlos, wholeTramos los reparte luego en enteros a partir de la hilera.
  const r = (v: number) => Math.round(v * 10) / 10;
  return { kg: r(range.kg), min: r(range.min), max: r(range.max) };
}

function buildHilera(h: Hilera, ripeningPct: number, factor: number): HileraRow {
  if (!h.tramos) {
    return { n: h.n, observed: null, forecast: null, matureFruits: null, tramos: [] };
  }
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

/** Reparte los kilos enteros de la hilera entre sus tramos: al abrirla, los tramos suman lo que dice la hilera. */
function wholeTramos(tramos: TramoRow[], observed: KgRange, forecast: KgRange): TramoRow[] {
  const split = (pick: (t: TramoRow) => KgRange, total: KgRange) => ({
    kg: roundKeepingTotal(tramos.map((t) => pick(t).kg), total.kg),
    min: roundKeepingTotal(tramos.map((t) => pick(t).min), total.min),
    max: roundKeepingTotal(tramos.map((t) => pick(t).max), total.max),
  });
  const o = split((t) => t.observed, observed);
  const f = split((t) => t.forecast, forecast);
  return tramos.map((t, i) => ({
    ...t,
    observed: { kg: o.kg[i], min: o.min[i], max: o.max[i] },
    forecast: { kg: f.kg[i], min: f.min[i], max: f.max[i] },
  }));
}

/**
 * Kilos del invernadero en enteros, que es como se muestran. Cada hilera se redondea sin que cambie
 * la suma: así las hileras suman el invernadero, los invernaderos la familia y el total, y los días
 * la semana. Si no, se verían sumas que no cuadran por un kilo (11.974 arriba, 11.975 en la tabla).
 */
function wholeKg(hileras: HileraRow[]): { hileras: HileraRow[]; observed: KgRange; forecast: KgRange } {
  const analyzed = hileras.filter((h) => h.observed && h.forecast);
  const round = (pick: (h: HileraRow) => KgRange, field: keyof KgRange) =>
    roundKeepingTotal(analyzed.map((h) => pick(h)[field]));
  const observedOf = (h: HileraRow) => h.observed as KgRange;
  const forecastOf = (h: HileraRow) => h.forecast as KgRange;
  const rounded = {
    observed: { kg: round(observedOf, "kg"), min: round(observedOf, "min"), max: round(observedOf, "max") },
    forecast: { kg: round(forecastOf, "kg"), min: round(forecastOf, "min"), max: round(forecastOf, "max") },
  };
  const at = (r: { kg: number[]; min: number[]; max: number[] }, i: number): KgRange => ({ kg: r.kg[i], min: r.min[i], max: r.max[i] });
  const out = hileras.map((h) => {
    const i = analyzed.indexOf(h);
    if (i < 0) return h;
    const observed = at(rounded.observed, i);
    const forecast = at(rounded.forecast, i);
    return { ...h, observed, forecast, tramos: wholeTramos(h.tramos, observed, forecast) };
  });
  const done = out.filter((h) => h.observed && h.forecast);
  return {
    hileras: out,
    observed: sumRanges(done.map((h) => h.observed as KgRange)),
    forecast: sumRanges(done.map((h) => h.forecast as KgRange)),
  };
}

function classesOf(family: FamilyId, fruits: number) {
  const classes = FAMILIES[family].classes;
  const counted = classes.slice(0, -1).map((c) => ({ name: c.name, fruits: Math.round(fruits * c.share) }));
  const rest = fruits - counted.reduce((sum, c) => sum + c.fruits, 0);
  return [...counted, { name: classes[classes.length - 1].name, fruits: rest }];
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
/** Suma de una semana solo si están los cinco días. */
const fullWeek = (values: (number | null)[]) => (values.every((v) => v !== null) ? sum(values as number[]) : null);

type WeatherMap = Map<string, RealWeather | null>;

/** Sin ubicación o sin respuesta no se inventa el tiempo: factor 1 y reparto por igual. */
const NO_WEATHER: WeatherSummary = {
  days: [],
  weeklyDegreeDays: 0,
  normalWeeklyDegreeDays: 0,
  factor: 1,
  source: "sin_datos",
  normalsYears: null,
  stale: false,
};

function dayShares(weather: WeatherSummary): number[] {
  return weather.days.length === 7 ? harvestDayShares(weather.days.map((d) => d.degreeDays)) : [0.2, 0.2, 0.2, 0.2, 0.2];
}

/** Meteorología real si la hay; si no, la simulada (solo en demostración), marcada como tal. */
function demoWeatherOf(info: GreenhouseInfo, monday: string, real: WeatherMap): WeatherSummary {
  const found = real.get(weatherKey(info.location, monday));
  if (found) return summarizeWeather(found.days, { source: "open-meteo", normalsYears: found.normalsYears, stale: found.stale });
  return summarizeWeather(simulatedWeather(info.location, monday, SIMULATED_TODAY), {
    source: "simulada",
    normalsYears: null,
    stale: false,
  });
}

async function loadWeather(wanted: Map<string, { location: Location; monday: string }>): Promise<WeatherMap> {
  if (demoQuery() === "sin-meteo") return new Map();
  const entries = await Promise.all(
    [...wanted].map(async ([key, { location, monday }]) => [key, await fetchRealWeather(location, monday)] as const),
  );
  return new Map(entries);
}

/** Pide a la API la semana de cada lugar distinto de los datos simulados, todas a la vez. */
function loadDemoWeather(harvestIds: string[]): Promise<WeatherMap> {
  const wanted = new Map<string, { location: Location; monday: string }>();
  for (const harvest of HARVESTS.filter((h) => harvestIds.includes(h.id))) {
    for (const capture of harvest.captures) {
      const info = GREENHOUSES.find((g) => g.id === capture.greenhouseId) as GreenhouseInfo;
      wanted.set(weatherKey(info.location, harvest.monday), { location: info.location, monday: harvest.monday });
    }
  }
  return loadWeather(wanted);
}

type ReportMeta = Pick<HarvestReport, "id" | "label" | "isoWeek" | "year" | "dates" | "updatedAt" | "isLatest" | "simulated">;

/** Agrupa por familia y suma: igual con datos reales que simulados. */
function assemble(meta: ReportMeta, greenhouses: GreenhouseRow[], used: Params): HarvestReport {
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
    ...meta,
    empty: greenhouses.length === 0,
    partial: greenhouses.some((g) => g.partial),
    totalHileras: greenhouses.reduce((total, g) => total + g.hileras.length, 0),
    missingHileras: greenhouses.reduce((total, g) => total + g.missingHileras, 0),
    captureDates: greenhouses.flatMap((g) => g.captureDates),
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

// ---- Modo demostración: datos simulados ----

export function buildDemoReport(id: string, params: Params, real: WeatherMap): HarvestReport | null {
  const harvest = HARVESTS.find((h) => h.id === id);
  if (!harvest) return null;
  const isLatest = id === DEMO_LATEST_ID;
  // Las semanas pasadas se calcularon con los parámetros de entonces: no cambian al ajustar los actuales.
  const used = isLatest ? params : DEFAULT_PARAMS;
  const dates = Array.from({ length: 5 }, (_, i) => addDays(harvest.monday, i));

  const greenhouses: GreenhouseRow[] = harvest.captures.map((capture) => {
    const info = GREENHOUSES.find((g) => g.id === capture.greenhouseId) as GreenhouseInfo;
    const family = FAMILIES[info.family];
    const grower = GROWERS.find((a) => a.id === info.growerId);
    const technician = TECHNICIANS.find((t) => t.id === grower?.technicianId);
    const settings = used.families[info.family];
    const weather = demoWeatherOf(info, harvest.monday, real);
    const { hileras, observed, forecast } = wholeKg(
      capture.hileras.map((h) => buildHilera(h, settings.ripeningPct, weather.factor)),
    );
    const analyzed = hileras.filter((h) => h.observed);
    const matureFruits = analyzed.reduce((total, h) => total + (h.matureFruits ?? 0), 0);
    const partial = analyzed.length < hileras.length;
    const atiasDays = roundKeepingTotal(splitByDay(observed, forecast, dayShares(weather)).map((d) => d.kg));
    const realKg = capture.realDailyKg ? fullWeek(capture.realDailyKg) : null;
    const technicianKg = sum(capture.technicianKg);
    const farmerKg = sum(capture.farmerKg);
    return {
      info,
      familyName: family.name,
      growerName: grower?.name ?? "—",
      technicianId: technician?.id ?? "",
      technicianName: technician?.name ?? "—",
      criterion: family.criterion,
      capturedAt: capture.capturedAt,
      captureDates: [capture.capturedAt],
      captureFromRecording: true,
      status: partial ? "analizando" : capture.warnings.length > 0 ? "con_advertencias" : "analizado",
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
      farmerKg,
      farmerErrorPct: realKg === null ? null : errorPct(farmerKg, realKg),
      immediateKg: null,
      gramsPerFruit: family.grams,
      gramsSource: "simulado",
      controls: [],
      ripeningPct: settings.ripeningPct,
      weather,
      daily: dates.map((date, i) => ({
        date,
        real: capture.realDailyKg?.[i] ?? null,
        technician: capture.technicianKg[i],
        farmer: capture.farmerKg[i],
        atias: atiasDays[i],
      })),
    };
  });

  return assemble(
    {
      id,
      label: harvest.label,
      isoWeek: harvest.isoWeek,
      year: harvest.year,
      dates,
      updatedAt: harvest.updatedAt,
      isLatest,
      simulated: true,
    },
    greenhouses,
    used,
  );
}

// ---- Datos reales ----

/** Semana ISO de una recolección: los identificadores son del tipo 2026-W47. */
function isoWeekOf(id: string, monday: string): { week: number; year: number } {
  const match = /^(\d{4})-W(\d{1,2})$/.exec(id);
  return match ? { year: Number(match[1]), week: Number(match[2]) } : { year: Number(monday.slice(0, 4)), week: 0 };
}

const placeOf = (g: FieldGreenhouse): Location | null =>
  g.ubicacion ? { municipality: g.ubicacion.municipio, latitude: g.ubicacion.latitud, longitude: g.ubicacion.longitud, offsetC: 0 } : null;

/** Sin familia indicada se usa la primera de su cultivo, y se avisa. */
const familyOf = (g: FieldGreenhouse): FamilyId =>
  (g.familia && g.familia.id in FAMILIES ? g.familia.id : FAMILY_ORDER.find((f) => FAMILIES[f].crop === g.cultivo)) as FamilyId;

/**
 * Peso medio por fruto: primero la muestra pesada; si no, lo recogido y pesado en los tramos de
 * control; si no, el valor de partida de la familia, que es provisional.
 */
export function gramsPerFruit(g: FieldGreenhouse, family: FamilyId): { grams: number; source: GramsSource } {
  if (g.muestra) return { grams: g.muestra.gramos / g.muestra.frutos, source: "muestra" };
  const picked = g.controles.filter((c) => c.recogidos && c.pesoG);
  const fruits = sum(picked.map((c) => c.recogidos as number));
  if (fruits > 0) return { grams: sum(picked.map((c) => c.pesoG as number)) / fruits, source: "control" };
  return { grams: FAMILIES[family].grams, source: "provisional" };
}

type SideCount = { mature: number[]; immature: number[] };

function sideCount(video: FieldGreenhouse["videos"][number] | undefined, tramos: number): SideCount | null {
  const result = video?.conteo?.estado === "ok" ? video.conteo.resultado : null;
  if (!result) return null;
  const mature = Array.from({ length: tramos }, (_, i) => result.tramos.find((t) => t.n === i + 1)?.maduros ?? 0);
  const immature = Array.from({ length: tramos }, (_, i) => {
    const tramo = result.tramos.find((t) => t.n === i + 1);
    return tramo ? Math.max(0, sum(Object.values(tramo.clases)) - tramo.maduros) : 0;
  });
  return { mature, immature };
}

/**
 * Hileras a partir de los vídeos contados. Los dos lados de una hilera ven en parte la misma fruta:
 * mientras no se mida cuánta comparten, se toma el lado que más ve (docs/DISENO.md, riesgo R2b).
 */
export function realHileras(g: FieldGreenhouse, grams: number): { hileras: Hilera[]; videos: Video[]; warnings: AppWarning[] } {
  const hileras: Hilera[] = [];
  const videos: Video[] = [];
  const warnings: AppWarning[] = [];
  for (let n = 1; n <= g.hileras; n += 1) {
    const sides = (["A", "B"] as const).map((lado) => ({ lado, video: g.videos.find((v) => v.hilera === n && v.lado === lado) }));
    if (sides.every((s) => !s.video)) {
      warnings.push({
        severity: "media",
        message: "Faltan los vídeos de los dos lados: esta hilera no tiene kilos.",
        scope: `${g.nombre} · Hilera ${n}`,
        greenhouseId: g.id,
        hilera: n,
        action: "Pide al agricultor que grabe esta hilera.",
      });
    }
    for (const { lado, video } of sides) {
      const scope = `${g.nombre} · Hilera ${n} · Lado ${lado}`;
      if (!video && sides.some((s) => s.video)) {
        warnings.push({
          severity: "media",
          message: "Falta el vídeo de este lado. Los kg de la hilera salen solo del otro lado.",
          scope,
          greenhouseId: g.id,
          hilera: n,
          action: "Pide al agricultor que grabe este lado.",
        });
        continue;
      }
      if (!video) continue;
      const trial = video.dePrueba ? { dePrueba: true } : {};
      const state = video.conteo?.estado ?? "pendiente";
      if (state === "ok") {
        videos.push({ hilera: n, lado, status: "analizado", ...trial });
        for (const message of countMessages(video.conteo)) {
          warnings.push({ severity: "media", message, scope, greenhouseId: g.id, hilera: n, action: "Revisa el vídeo y, si hace falta, pide repetirlo." });
        }
      } else if (state === "error") {
        videos.push({ hilera: n, lado, status: "problema", note: "No se han podido contar los frutos", ...trial });
        warnings.push({
          severity: "alta",
          message: "No se han podido contar los frutos de este vídeo.",
          scope,
          greenhouseId: g.id,
          hilera: n,
          action: "Pide al agricultor que repita la grabación de este lado.",
        });
      } else {
        videos.push({ hilera: n, lado, status: "analizando", ...trial });
      }
    }
    const counted = sides.map(({ video }) => sideCount(video, g.tramos)).filter((c): c is SideCount => c !== null);
    if (counted.length === 0) {
      hileras.push({ n, tramos: null });
      continue;
    }
    const tramos: Tramo[] = Array.from({ length: g.tramos }, (_, i) => {
      const mature = Math.max(...counted.map((c) => c.mature[i]));
      const immature = Math.max(...counted.map((c) => c.immature[i]));
      return { n: i + 1, matureFruits: mature, observedKg: (mature * grams) / 1000, immatureKg: (immature * grams) / 1000 };
    });
    hileras.push({ n, tramos });
  }
  return { hileras, videos, warnings };
}

export function buildRealReport(
  field: FieldData,
  params: Params,
  weather: WeatherMap,
  isLatest: boolean,
): HarvestReport {
  const monday = field.dias[0];
  const greenhouses: GreenhouseRow[] = field.invernaderos.map((g) => {
    const familyId = familyOf(g);
    const family = FAMILIES[familyId];
    const settings = params.families[familyId];
    const { grams, source } = gramsPerFruit(g, familyId);
    const place = placeOf(g);
    const found = place ? weather.get(weatherKey(place, monday)) : null;
    const summary = found
      ? summarizeWeather(found.days, { source: "open-meteo", normalsYears: found.normalsYears, stale: found.stale })
      : NO_WEATHER;
    const built = realHileras(g, grams);
    const { hileras, observed, forecast } = wholeKg(
      built.hileras.map((h) => buildHilera(h, settings.ripeningPct, summary.factor)),
    );
    const analyzed = hileras.filter((h) => h.observed);
    const matureFruits = analyzed.reduce((total, h) => total + (h.matureFruits ?? 0), 0);
    const partial = analyzed.length < hileras.length;

    const warnings = [...built.warnings, ...recordingWarnings(g, monday)];
    const sheet = (message: string, action: string, severity: AppWarning["severity"] = "media") =>
      warnings.unshift({ severity, message, scope: g.nombre, greenhouseId: g.id, hilera: 0, action });
    if (!g.familia) sheet(`Falta indicar la familia: se calcula como ${family.name}.`, "Complétalo en Datos de campo.", "alta");
    if (source === "provisional") sheet("Peso por fruto provisional: falta pesar una muestra.", "Pesa 50 frutos maduros y apúntalo en Datos de campo.");
    if (!place) sheet("Sin ubicación: la previsión no tiene en cuenta el tiempo.", "Añade la ubicación en Datos de campo.");

    const realKg = g.cosecha.lunesViernes ?? fullWeek(g.real);
    const technicianKg = fullWeek(g.previsiones.tecnico);
    const farmerKg = fullWeek(g.previsiones.agricultor);
    const atiasDays = roundKeepingTotal(splitByDay(observed, forecast, dayShares(summary)).map((d) => d.kg));
    const capture = captureDates(g.videos);
    return {
      info: {
        id: g.id,
        name: g.nombre,
        growerId: "",
        family: familyId,
        crop: g.cultivo,
        location: place ?? { municipality: "", latitude: 0, longitude: 0, offsetC: 0 },
        hileras: g.hileras,
        tramosPorHilera: g.tramos,
        interiorSensor: false,
      },
      familyName: g.familia?.nombre ?? `${CROPS[g.cultivo].name} (sin familia)`,
      growerName: g.agricultor ?? "—",
      technicianId: g.tecnico ?? "",
      technicianName: g.tecnico ?? "—",
      criterion: family.criterion,
      capturedAt: capture.dates[0] ?? `${addDays(monday, -2)}T12:00:00+01:00`,
      captureDates: capture.dates,
      captureFromRecording: capture.fromRecording,
      status: partial ? "analizando" : warnings.some((w) => w.severity === "alta") ? "con_advertencias" : "analizado",
      isNew: false,
      partial,
      missingHileras: hileras.length - analyzed.length,
      warnedHileras: warnings.filter((w) => w.severity === "alta" && w.hilera > 0).map((w) => w.hilera),
      observed,
      forecast,
      matureFruits,
      classes: classesOf(familyId, matureFruits),
      hileras,
      videos: built.videos,
      warnings,
      realKg,
      errorPct: realKg === null ? null : errorPct(forecast.kg, realKg),
      technicianKg,
      technicianErrorPct: realKg === null || technicianKg === null ? null : errorPct(technicianKg, realKg),
      farmerKg,
      farmerErrorPct: realKg === null || farmerKg === null ? null : errorPct(farmerKg, realKg),
      immediateKg: g.cosecha.inmediata,
      gramsPerFruit: grams,
      gramsSource: source,
      controls: g.controles,
      ripeningPct: settings.ripeningPct,
      weather: summary,
      daily: field.dias.map((date, i) => ({
        date,
        real: g.real[i],
        technician: g.previsiones.tecnico[i],
        farmer: g.previsiones.agricultor[i],
        atias: atiasDays[i],
      })),
    };
  });
  const { week, year } = isoWeekOf(field.id, monday);
  return assemble(
    {
      id: field.id,
      label: field.etiqueta,
      isoWeek: week,
      year,
      dates: field.dias,
      updatedAt: new Date().toISOString(),
      isLatest,
      simulated: false,
    },
    greenhouses,
    params,
  );
}

async function loadRealReport(id: string, isLatest: boolean, params: Params): Promise<HarvestReport> {
  const field = await fetchFieldData(id);
  const wanted = new Map<string, { location: Location; monday: string }>();
  for (const g of field.invernaderos) {
    const place = placeOf(g);
    if (place) wanted.set(weatherKey(place, field.dias[0]), { location: place, monday: field.dias[0] });
  }
  return buildRealReport(field, params, await loadWeather(wanted), isLatest);
}

// ---- Lo que usan las pantallas ----

export async function listHarvests(): Promise<HarvestOption[]> {
  if (getDataMode() === "demo") {
    return simulateLatency(() => HARVESTS.map((h) => ({ id: h.id, label: h.label, hasData: h.captures.length > 0 })));
  }
  return (await fetchHarvestList()).map((h) => ({ id: h.id, label: h.etiqueta, hasData: true }));
}

export async function getReport(id: string): Promise<HarvestReport | null> {
  if (getDataMode() === "demo") {
    const resolved = id === LATEST_HARVEST_ID ? DEMO_LATEST_ID : id;
    const real = await loadDemoWeather([resolved]);
    return simulateLatency(() => buildDemoReport(resolved, currentParams(), real));
  }
  const list = await fetchHarvestList();
  const latest = list[0]?.id;
  const resolved = id === LATEST_HARVEST_ID ? latest : id;
  if (!resolved || !list.some((h) => h.id === resolved)) return null;
  // Las semanas pasadas se recalculan con los parámetros de partida, como en la demostración.
  return loadRealReport(resolved, resolved === latest, resolved === latest ? currentParams() : DEFAULT_PARAMS);
}

/** Todas las recolecciones con datos, para comparar previsiones semana a semana. */
export async function listReports(): Promise<HarvestReport[]> {
  if (getDataMode() === "demo") {
    const real = await loadDemoWeather(HARVESTS.map((h) => h.id));
    return simulateLatency(() => {
      const params = currentParams();
      return HARVESTS.flatMap((h) => {
        const report = buildDemoReport(h.id, params, real);
        return report && !report.empty ? [report] : [];
      });
    });
  }
  const list = await fetchHarvestList();
  const reports = await Promise.all(
    list.map((h, i) => loadRealReport(h.id, i === 0, i === 0 ? currentParams() : DEFAULT_PARAMS)),
  );
  return reports.filter((r) => !r.empty);
}

export type PastHarvest = {
  id: string;
  label: string;
  forecastKg: number;
  technicianKg: number | null;
  realKg: number;
  errorPct: number | null;
  technicianErrorPct: number | null;
};

/** Recolecciones ya pesadas, siempre con los parámetros de partida. */
export async function listPastHarvests(): Promise<PastHarvest[]> {
  const reports = await listReports();
  return reports.flatMap((report) => {
    if (report.realKg === null) return [];
    const technician = report.greenhouses.map((g) => g.technicianKg);
    const technicianKg = technician.every((v) => v !== null) ? sum(technician as number[]) : null;
    return [{
      id: report.id,
      label: report.label,
      forecastKg: report.forecast.kg,
      technicianKg,
      realKg: report.realKg,
      errorPct: report.errorPct,
      technicianErrorPct: technicianKg === null ? null : errorPct(technicianKg, report.realKg),
    }];
  });
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

export { DEFAULT_PARAMS, FAMILIES, FAMILY_ORDER, TECHNICIANS };
export type { AppWarning, FamilyId, Params };
