/**
 * Informe semanal para imprimir o guardar en PDF: las cifras de la recolección en una hoja, para quien
 * no entra en la app. Los cálculos son los de la app; aquí solo se agrupan.
 */

import type { HarvestReport } from "./api";
import { type Forecaster, overallWapePct, pairsFor } from "./precision";
import { biasPct } from "./validation";

export type ReportDay = {
  date: string;
  atias: number;
  /** Solo se suman si todos los invernaderos lo tienen; si no, una suma parcial engañaría. */
  tecnico: number | null;
  agricultor: number | null;
  real: number | null;
};

const sumIfAll = (values: (number | null)[]) =>
  values.length > 0 && values.every((v) => v !== null) ? (values as number[]).reduce((s, v) => s + v, 0) : null;

export function reportDays(report: HarvestReport): ReportDay[] {
  return report.dates.map((date, i) => {
    const rows = report.greenhouses.map((g) => g.daily[i]);
    return {
      date,
      atias: rows.reduce((s, d) => s + (d?.atias ?? 0), 0),
      tecnico: sumIfAll(rows.map((d) => d?.technician ?? null)),
      agricultor: sumIfAll(rows.map((d) => d?.farmer ?? null)),
      real: sumIfAll(rows.map((d) => d?.real ?? null)),
    };
  });
}

export type WeekAccuracy = Record<Forecaster, { errorPct: number | null; biasPct: number | null }>;

/** Error de esta semana para cada previsión, solo en los invernaderos con cosecha. Null si no hay cosecha. */
export function weekAccuracy(report: HarvestReport): WeekAccuracy | null {
  if (!report.greenhouses.some((g) => g.realKg !== null && g.realKg > 0)) return null;
  const one = (who: Forecaster) => ({ errorPct: overallWapePct([report], who), biasPct: biasPct(pairsFor([report], who)) });
  return { atias: one("atias"), agricultor: one("agricultor"), tecnico: one("tecnico") };
}
