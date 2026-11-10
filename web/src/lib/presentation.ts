/**
 * Datos del modo presentación: la última recolección con kilos recogidos, contada en pocas cifras
 * grandes para compartir pantalla. Reutiliza los cálculos de la pantalla de precisión.
 */

import type { HarvestReport } from "./api";
import { controlRows, controlSummary, type Forecaster, overallWapePct, pairsFor } from "./precision";
import { biasPct, evaluate, type Verdict } from "./validation";

export type PresentationDay = {
  date: string;
  real: number | null;
  atias: number | null;
  agricultor: number | null;
  tecnico: number | null;
};

export type ForecasterResult = {
  /** Kilos previstos de lunes a viernes, sumando los invernaderos con cosecha. */
  kg: number | null;
  /** Error de la semana, ponderado por kilos. */
  errorPct: number | null;
  /** Positivo: estimó de más. */
  biasPct: number | null;
};

export type PilotSummary = {
  report: HarvestReport;
  greenhouses: string[];
  realKg: number;
  matureFruits: number;
  videos: number;
  days: PresentationDay[];
  results: Record<Forecaster, ForecasterResult>;
  /** Quién se acercó más a lo recogido, si hay una diferencia clara. */
  closest: Forecaster | null;
  control: ReturnType<typeof controlSummary>;
  /** Veredicto con todas las recolecciones, no solo esta. */
  verdict: Verdict;
  weeksMeasured: number;
};

const FORECASTERS: Forecaster[] = ["atias", "agricultor", "tecnico"];

const sumOrNull = (values: (number | null)[]) =>
  values.some((v) => v !== null) ? values.reduce<number>((s, v) => s + (v ?? 0), 0) : null;

/** La recolección más reciente con kilos recogidos; null si todavía no hay ninguna. */
export function pilotSummary(reports: HarvestReport[]): PilotSummary | null {
  const withHarvest = reports
    .filter((r) => r.greenhouses.some((g) => g.realKg !== null && g.realKg > 0))
    .sort((a, b) => (a.dates[0] < b.dates[0] ? 1 : -1));
  const report = withHarvest[0];
  if (!report) return null;
  const harvested = report.greenhouses.filter((g) => g.realKg !== null && g.realKg > 0);

  const days = report.dates.map((date) => {
    const rows = harvested.map((g) => g.daily.find((d) => d.date === date));
    return {
      date,
      real: sumOrNull(rows.map((d) => d?.real ?? null)),
      atias: harvested.some((g) => g.partial) ? null : sumOrNull(rows.map((d) => d?.atias ?? null)),
      agricultor: sumOrNull(rows.map((d) => d?.farmer ?? null)),
      tecnico: sumOrNull(rows.map((d) => d?.technician ?? null)),
    };
  });

  const results = Object.fromEntries(
    FORECASTERS.map((who) => {
      const pairs = pairsFor([report], who);
      return [who, {
        kg: pairs.length ? pairs.reduce((s, p) => s + p.estimatedKg, 0) : null,
        errorPct: overallWapePct([report], who),
        biasPct: biasPct(pairs),
      }];
    }),
  ) as Record<Forecaster, ForecasterResult>;

  const ranked = FORECASTERS
    .filter((who) => results[who].errorPct !== null)
    .sort((a, b) => (results[a].errorPct as number) - (results[b].errorPct as number));
  const clear = ranked.length > 1 && (results[ranked[1]].errorPct as number) - (results[ranked[0]].errorPct as number) >= 0.5;

  const atias = evaluate(pairsFor(reports, "atias"));
  return {
    report,
    greenhouses: harvested.map((g) => g.info.name),
    realKg: harvested.reduce((s, g) => s + (g.realKg as number), 0),
    matureFruits: harvested.reduce((s, g) => s + g.matureFruits, 0),
    videos: harvested.reduce((s, g) => s + g.videos.length, 0),
    days,
    results,
    closest: clear ? ranked[0] : null,
    control: controlSummary(controlRows([report])),
    verdict: atias.verdict,
    weeksMeasured: atias.pairs + atias.excluded,
  };
}
