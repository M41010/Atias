/**
 * Preparación de datos de los gráficos de la ficha del invernadero. Funciones puras: reciben lo que
 * ya calcula la capa de datos (GreenhouseRow, HarvestReport) y devuelven lo que se dibuja, sin
 * inventar ceros donde falta un dato.
 */

import type { GreenhouseRow, HarvestReport, WeatherSummary } from "../../lib/api";
import { harvestDayShares, type KgRange, splitByDay } from "../../lib/calc";

/**
 * Colores de serie. Los mismos en todos los gráficos de la ficha: Atias en ámbar (lo experimental,
 * como en la banda de la previsión), lo observado en verde (como su banda), lo real en tinta y las
 * previsiones humanas en azul y magenta. Comprobados con el validador de paleta (separación con
 * daltonismo y visión normal); ámbar y magenta quedan por debajo de 3:1 sobre blanco, así que
 * siempre van con leyenda, forma distinta y la tabla de datos debajo.
 */
export const SERIES_COLOR = {
  real: "var(--color-ink)",
  atias: "#c98a0c",
  technician: "#2a78d6",
  farmer: "#e87ba4",
  observed: "#17803d",
} as const;

/** Escala secuencial de un solo tono (verde), de poco a mucho. Luminosidad monótona comprobada. */
export const SEQUENTIAL_GREEN = ["#d9ecd0", "#b5dba5", "#8cc57c", "#62a957", "#3d8a3d", "#1f6b2f", "#0f4f22"] as const;

/** Marcas de eje redondas (0, 50, 100…) que cubren hasta `max`. */
export function niceTicks(max: number, count = 4): number[] {
  if (!(max > 0)) return [0];
  const raw = max / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= raw) ?? 10 * power;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 1000; v += step) ticks.push(Math.round(v * 1000) / 1000);
  return ticks;
}

// ---- Kilos por día ----

export type DaySeriesKey = "real" | "technician" | "farmer" | "atias";

export type KilosDay = {
  date: string;
  real: number | null;
  technician: number | null;
  farmer: number | null;
  atias: number;
  /** Margen de Atias para ese día, repartido igual que la cifra central. */
  atiasRange: KgRange;
};

export type KilosPorDia = {
  days: KilosDay[];
  /** Series que tienen al menos un dato: una serie vacía no ocupa leyenda. */
  series: DaySeriesKey[];
  max: number;
};

/** Mismo reparto que la capa de datos: con los 7 días de tiempo, según el calor; si no, a partes iguales. */
export function dayShares(weather: WeatherSummary, days: number): number[] {
  if (weather.days.length === 7 && days === 5) return harvestDayShares(weather.days.map((d) => d.degreeDays));
  return Array.from({ length: days }, () => 1 / Math.max(1, days));
}

export function kilosPorDia(g: Pick<GreenhouseRow, "daily" | "observed" | "forecast" | "weather">): KilosPorDia {
  const ranges = splitByDay(g.observed, g.forecast, dayShares(g.weather, g.daily.length));
  const days = g.daily.map((d, i) => {
    const range = ranges[i] ?? { kg: d.atias, min: d.atias, max: d.atias };
    // La cifra central ya viene redondeada para que cuadre con la semana; el margen se desplaza con ella.
    const shift = d.atias - range.kg;
    return {
      date: d.date,
      real: d.real,
      technician: d.technician,
      farmer: d.farmer,
      atias: d.atias,
      atiasRange: { kg: d.atias, min: Math.max(0, range.min + shift), max: range.max + shift },
    };
  });
  const series: DaySeriesKey[] = ["real", "technician", "farmer", "atias"].filter(
    (key) => key === "atias" || days.some((d) => d[key as DaySeriesKey] !== null),
  ) as DaySeriesKey[];
  const values = days.flatMap((d) => [d.real, d.technician, d.farmer, d.atiasRange.max]).filter((v): v is number => v !== null);
  return { days, series, max: Math.max(1, ...values) };
}

// ---- Mapa del invernadero ----

export type MapMeasure = "forecast" | "observed";

export type MapCell = { tramo: number; range: KgRange };

export type MapRow = {
  n: number;
  /** Sin análisis: la fila se dibuja rayada, sin color de cantidad. */
  pending: boolean;
  /** Advertencia más grave de la hilera, si la tiene. */
  warning: "alta" | "media" | null;
  total: KgRange | null;
  cells: MapCell[];
};

export type MapaInvernadero = {
  rows: MapRow[];
  tramos: number;
  min: number;
  max: number;
  pendingCount: number;
};

export function mapaInvernadero(
  g: Pick<GreenhouseRow, "hileras" | "warnings" | "warnedHileras">,
  measure: MapMeasure,
): MapaInvernadero {
  const warningOf = (n: number): MapRow["warning"] => {
    const own = g.warnings.filter((w) => w.hilera === n);
    if (g.warnedHileras.includes(n) || own.some((w) => w.severity === "alta")) return "alta";
    return own.length > 0 ? "media" : null;
  };
  const rows: MapRow[] = g.hileras.map((h) => {
    const total = measure === "forecast" ? h.forecast : h.observed;
    const pending = total === null;
    return {
      n: h.n,
      pending,
      warning: warningOf(h.n),
      total,
      cells: pending ? [] : h.tramos.map((t) => ({ tramo: t.n, range: measure === "forecast" ? t.forecast : t.observed })),
    };
  });
  const values = rows.flatMap((r) => r.cells.map((c) => c.range.kg));
  return {
    rows,
    tramos: Math.max(0, ...g.hileras.map((h) => h.tramos.length)),
    min: values.length ? Math.min(...values) : 0,
    max: values.length ? Math.max(...values) : 0,
    pendingCount: rows.filter((r) => r.pending).length,
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Color de la escala para un valor entre `min` y `max`, interpolando entre los pasos. */
export function sequentialColor(value: number, min: number, max: number, ramp: readonly string[] = SEQUENTIAL_GREEN): string {
  const t = max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0.5;
  const pos = t * (ramp.length - 1);
  const i = Math.min(ramp.length - 2, Math.floor(pos));
  const f = pos - i;
  const a = hexToRgb(ramp[i]);
  const b = hexToRgb(ramp[i + 1]);
  const mix = a.map((c, k) => Math.round(c + (b[k] - c) * f));
  return `#${mix.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** Texto legible dentro de una celda: tinta sobre los verdes claros, blanco sobre los oscuros. */
export function cellTextColor(value: number, min: number, max: number): string {
  const t = max > min ? (value - min) / (max - min) : 0.5;
  return t > 0.55 ? "#ffffff" : "#0f2b20";
}

// ---- Tiempo y maduración ----

export type TiempoDay = {
  date: string;
  kind: WeatherSummary["days"][number]["kind"];
  degreeDays: number;
  normal: number;
};

export type TiempoMaduracion =
  | { state: "sin_datos" }
  | {
      state: "ok";
      source: WeatherSummary["source"];
      days: TiempoDay[];
      weekly: number;
      normalWeekly: number;
      /** Diferencia de ritmo de maduración frente a lo normal, en %, redondeada. */
      changePct: number;
      sentence: string;
      max: number;
    };

/** La frase que resume el efecto del tiempo, igual que en la tabla de meteorología. */
export function ripeningSentence(changePct: number): string {
  if (changePct === 0) return "La fruta madura a ritmo normal";
  return `La fruta madura un ${Math.abs(changePct)} % más ${changePct > 0 ? "deprisa" : "despacio"}`;
}

export function tiempoMaduracion(weather: WeatherSummary): TiempoMaduracion {
  if (weather.source === "sin_datos" || weather.days.length === 0) return { state: "sin_datos" };
  const days = weather.days.map((d) => ({ date: d.date, kind: d.kind, degreeDays: d.degreeDays, normal: d.normalDegreeDays }));
  const changePct = Math.round((weather.factor - 1) * 100);
  return {
    state: "ok",
    source: weather.source,
    days,
    weekly: weather.weeklyDegreeDays,
    normalWeekly: weather.normalWeeklyDegreeDays,
    changePct,
    sentence: ripeningSentence(changePct),
    max: Math.max(1, ...days.flatMap((d) => [d.degreeDays, d.normal])),
  };
}

// ---- Rendimiento frente a semanas anteriores ----

export type WeekPoint = {
  id: string;
  label: string;
  /** Lunes de la recolección, para ordenar y rotular. */
  monday: string;
  current: boolean;
  partial: boolean;
  hileras: number;
  analyzed: number;
  forecast: KgRange;
  observed: KgRange;
  real: number | null;
  technician: number | null;
};

export type Normalization = "total" | "hilera";

/** Las semanas en que aparece este invernadero, de la más antigua a la más reciente. */
export function semanasDelInvernadero(reports: HarvestReport[], greenhouseId: string, currentId: string): WeekPoint[] {
  const seen = new Set<string>();
  const points: WeekPoint[] = [];
  for (const report of reports) {
    if (seen.has(report.id)) continue;
    seen.add(report.id);
    const g = report.greenhouses.find((x) => x.info.id === greenhouseId);
    if (!g) continue;
    const analyzed = g.hileras.filter((h) => h.forecast !== null).length;
    if (analyzed === 0) continue;
    points.push({
      id: report.id,
      label: report.label,
      monday: report.dates[0] ?? "",
      current: report.id === currentId,
      partial: g.partial,
      hileras: g.hileras.length,
      analyzed,
      forecast: g.forecast,
      observed: g.observed,
      real: g.realKg,
      technician: g.technicianKg,
    });
  }
  return points.sort((a, b) => a.monday.localeCompare(b.monday));
}

const scaleRange = (r: KgRange, by: number): KgRange => ({ kg: r.kg / by, min: r.min / by, max: r.max / by });

/**
 * Por hilera, para comparar semanas aunque cambie lo grabado: la previsión y lo observado se dividen
 * entre las hileras analizadas; lo real, que es del invernadero entero, entre todas sus hileras.
 */
export function normalizeWeek(w: WeekPoint, mode: Normalization) {
  if (mode === "total") return { forecast: w.forecast, observed: w.observed, real: w.real };
  return {
    forecast: scaleRange(w.forecast, w.analyzed),
    observed: scaleRange(w.observed, w.analyzed),
    real: w.real === null ? null : w.real / Math.max(1, w.hileras),
  };
}

export type Tendencia = {
  /** Semana con la que se compara la actual (la anterior con datos), o null si no hay. */
  previousLabel: string | null;
  /** Cambio en % de la cifra comparable: real si las dos lo tienen; si no, la previsión. */
  changePct: number | null;
  basis: "real" | "previsión" | null;
};

/** Cuánto produce la semana elegida frente a la anterior, por hilera, con la mejor cifra que haya en las dos. */
export function tendencia(weeks: WeekPoint[]): Tendencia {
  const i = weeks.findIndex((w) => w.current);
  if (i <= 0) return { previousLabel: null, changePct: null, basis: null };
  const now = normalizeWeek(weeks[i], "hilera");
  const before = normalizeWeek(weeks[i - 1], "hilera");
  const useReal = now.real !== null && before.real !== null;
  const a = useReal ? (now.real as number) : now.forecast.kg;
  const b = useReal ? (before.real as number) : before.forecast.kg;
  return {
    previousLabel: weeks[i - 1].label,
    changePct: b > 0 ? Math.round(((a - b) / b) * 100) : null,
    basis: useReal ? "real" : "previsión",
  };
}

/** Recolecciones que merece la pena cargar: con datos y, como mucho, las `limit` más recientes. */
export function harvestsToLoad(options: { id: string; hasData: boolean }[], limit = 8): string[] {
  return options.filter((h) => h.hasData).slice(0, limit).map((h) => h.id);
}
