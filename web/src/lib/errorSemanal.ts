/**
 * Datos del gráfico «Error semana a semana» de la pantalla de precisión: por cada semana con kilos
 * recogidos, el error de cada previsión ponderado por kilos (la misma definición que «Error de todas»),
 * con cuántos invernaderos entran y si esa semana cuenta para el veredicto.
 */

import type { HarvestReport } from "./api";
import { type Forecaster, pairsFor } from "./precision";
import { wapePct } from "./validation";

export const FORECASTERS: Forecaster[] = ["atias", "agricultor", "tecnico"];

export type ErrorWeek = { harvestId: string; isoWeek: number; year: number; label: string };

export type ErrorPoint = {
  errorPct: number;
  /** Invernaderos con previsión y kilos recogidos esa semana. */
  greenhouses: number;
  /** De ellos, los que se usaron para calibrar el peso esa misma semana. */
  calibrated: number;
  /** Invernaderos con cosecha que se quedan fuera porque faltan hileras por contar (solo Atias). */
  leftOut: number;
  /** La semana entera cuenta para el veredicto: nada calibrado con ella y nada parcial. */
  counts: boolean;
};

export type WeeklyError = {
  weeks: ErrorWeek[];
  /** Un punto por semana y previsión, alineado con `weeks`; null si esa previsión no tiene par. */
  series: Record<Forecaster, (ErrorPoint | null)[]>;
  /** Hacen falta al menos dos semanas con algún punto para ver una evolución. */
  enough: boolean;
};

const harvested = (r: HarvestReport) => r.greenhouses.filter((g) => g.realKg !== null && g.realKg > 0);

function point(report: HarvestReport, who: Forecaster): ErrorPoint | null {
  const pairs = pairsFor([report], who).filter((p) => p.realKg > 0);
  const errorPct = wapePct(pairs);
  if (errorPct === null) return null;
  const calibrated = pairs.filter((p) => !p.outOfSample).length;
  const leftOut = who === "atias" ? harvested(report).filter((g) => g.partial).length : 0;
  return { errorPct, greenhouses: pairs.length, calibrated, leftOut, counts: calibrated === 0 && leftOut === 0 };
}

export function weeklyError(reports: HarvestReport[]): WeeklyError {
  const sorted = reports
    .filter((r) => harvested(r).length > 0)
    .sort((a, b) => a.year - b.year || a.isoWeek - b.isoWeek);
  const series = Object.fromEntries(FORECASTERS.map((who) => [who, sorted.map((r) => point(r, who))])) as WeeklyError["series"];
  // Solo las semanas en que alguna previsión tiene par: una semana sin ninguno sería un hueco sin nada que leer.
  const keep = sorted.map((_, i) => FORECASTERS.some((who) => series[who][i] !== null));
  const weeks = sorted.filter((_, i) => keep[i]).map((r) => ({ harvestId: r.id, isoWeek: r.isoWeek, year: r.year, label: `Sem. ${r.isoWeek}` }));
  for (const who of FORECASTERS) series[who] = series[who].filter((_, i) => keep[i]);
  return { weeks, series, enough: weeks.length >= 2 };
}

/** Escala del eje: múltiplos de 5 o 10 que dejan ver siempre el objetivo con algo de aire encima. */
export function errorAxis(values: number[], target: number): { max: number; ticks: number[] } {
  const top = Math.max(target * 1.5, ...values);
  const step = top <= 30 ? 5 : top <= 60 ? 10 : top <= 150 ? 25 : 50;
  const max = Math.ceil((top * 1.05) / step) * step;
  return { max, ticks: Array.from({ length: max / step + 1 }, (_, i) => i * step) };
}
