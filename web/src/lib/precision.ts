/**
 * Cuánto acierta Atias, eslabón a eslabón (docs/VALIDACION.md): el conteo en los tramos de control,
 * la fruta que queda tapada, el peso por fruto, lo observado frente a la cosecha de control y la
 * previsión de lunes a viernes frente a lo recogido, junto a las previsiones del agricultor y del técnico.
 */

import type { GramsSource, GreenhouseRow, HarvestReport } from "./api";
import { FAMILIES } from "./simulated";
import { evaluate, type Evaluation, type Pair, pairErrorPct } from "./validation";

export type Forecaster = "atias" | "agricultor" | "tecnico";

export type WeekRow = {
  harvestId: string;
  week: string;
  greenhouseId: string;
  greenhouse: string;
  realKg: number;
  kg: Record<Forecaster, number | null>;
  errorPct: Record<Forecaster, number | null>;
  /** Quién se acercó más, entre los que dieron previsión. */
  closest: Forecaster | null;
  /** Faltan hileras por contar: la cifra de Atias se queda corta y no se compara. */
  partial: boolean;
};

export type ControlRow = {
  week: string;
  greenhouse: string;
  label: string;
  where: string;
  visible: number;
  total: number | null;
  atias: number | null;
  motive: string | null;
};

export type WeightRow = {
  week: string;
  greenhouse: string;
  family: string;
  grams: number;
  source: GramsSource;
  startingGrams: number;
};

export type ObservedRow = { week: string; greenhouse: string; observedKg: number; immediateKg: number; errorPct: number | null };

/** El peso medido esa misma semana es calibración: esa semana no cuenta para el veredicto. */
const calibratedThatWeek = (g: GreenhouseRow) => g.gramsSource === "muestra" || g.gramsSource === "control";

const weekLabel = (r: HarvestReport) => `Semana ${r.isoWeek}`;

export function weekRows(reports: HarvestReport[]): WeekRow[] {
  return reports.flatMap((r) =>
    r.greenhouses.flatMap((g) => {
      if (g.realKg === null || g.realKg <= 0) return [];
      const kg = { atias: g.forecast.kg, agricultor: g.farmerKg, tecnico: g.technicianKg };
      const errorPct = {
        atias: g.partial ? null : pairErrorPct({ estimatedKg: kg.atias, realKg: g.realKg }),
        agricultor: kg.agricultor === null ? null : pairErrorPct({ estimatedKg: kg.agricultor, realKg: g.realKg }),
        tecnico: kg.tecnico === null ? null : pairErrorPct({ estimatedKg: kg.tecnico, realKg: g.realKg }),
      };
      const ranked = (Object.entries(errorPct) as [Forecaster, number | null][])
        .filter((e): e is [Forecaster, number] => e[1] !== null)
        .sort((a, b) => a[1] - b[1]);
      const tie = ranked.length > 1 && Math.abs(ranked[0][1] - ranked[1][1]) < 0.05;
      return [{
        harvestId: r.id,
        week: weekLabel(r),
        greenhouseId: g.info.id,
        greenhouse: g.info.name,
        realKg: g.realKg,
        kg,
        errorPct,
        closest: ranked.length < 2 || tie ? null : ranked[0][0],
        partial: g.partial,
      }];
    }),
  );
}

/**
 * Pares para el veredicto de cada previsión. Las humanas no se calibran: siempre cuentan. La de Atias
 * con hileras sin contar se queda fuera: compararía media cosecha con la cosecha entera.
 */
export function pairsFor(reports: HarvestReport[], who: Forecaster): Pair[] {
  return reports.flatMap((r) =>
    r.greenhouses.flatMap((g) => {
      const estimated = who === "atias" ? g.forecast.kg : who === "agricultor" ? g.farmerKg : g.technicianKg;
      if (g.realKg === null || estimated === null || (who === "atias" && g.partial)) return [];
      return [{
        greenhouse: g.info.id,
        week: r.id,
        estimatedKg: estimated,
        realKg: g.realKg,
        comparable: true,
        simulated: r.simulated,
        outOfSample: who !== "atias" || !calibratedThatWeek(g),
      }];
    }),
  );
}

export function evaluations(reports: HarvestReport[]): Record<Forecaster, Evaluation> {
  return {
    atias: evaluate(pairsFor(reports, "atias")),
    agricultor: evaluate(pairsFor(reports, "agricultor")),
    tecnico: evaluate(pairsFor(reports, "tecnico")),
  };
}

/** Error de todas las semanas juntas, aunque no basten para el veredicto: para orientarse, no para concluir. */
export function overallWapePct(reports: HarvestReport[], who: Forecaster): number | null {
  const pairs = pairsFor(reports, who).filter((p) => p.realKg > 0);
  const real = pairs.reduce((s, p) => s + p.realKg, 0);
  return real > 0 ? (pairs.reduce((s, p) => s + Math.abs(p.estimatedKg - p.realKg), 0) / real) * 100 : null;
}

export function observedRows(reports: HarvestReport[]): ObservedRow[] {
  return reports.flatMap((r) =>
    r.greenhouses.flatMap((g) =>
      g.immediateKg === null
        ? []
        : [{
          week: weekLabel(r),
          greenhouse: g.info.name,
          observedKg: g.observed.kg,
          immediateKg: g.immediateKg,
          errorPct: pairErrorPct({ estimatedKg: g.observed.kg, realKg: g.immediateKg }),
        }],
    ),
  );
}

export function controlRows(reports: HarvestReport[]): ControlRow[] {
  return reports.flatMap((r) =>
    r.greenhouses.flatMap((g) =>
      g.controls.map((c) => ({
        week: weekLabel(r),
        greenhouse: g.info.name,
        label: c.etiqueta,
        where: `Hilera ${c.hilera} · Lado ${c.lado} · ${c.inicioM}–${c.finM} m`,
        visible: c.visibles,
        total: c.total,
        atias: c.atias.frutos,
        motive: c.atias.motivo,
      })),
    ),
  );
}

/**
 * Resumen de los tramos de control:
 * - detección: de la fruta madura que se ve desde el pasillo, cuánta cuenta Atias;
 * - visibilidad: de toda la fruta madura, cuánta se ve sin apartar hojas (el factor k).
 */
export function controlSummary(rows: ControlRow[]): { detectionPct: number | null; visibilityPct: number | null; tramos: number } {
  const counted = rows.filter((r) => r.atias !== null);
  const visible = counted.reduce((s, r) => s + r.visible, 0);
  const withTotal = rows.filter((r) => r.total !== null && r.total > 0);
  const total = withTotal.reduce((s, r) => s + (r.total as number), 0);
  return {
    detectionPct: visible > 0 ? (counted.reduce((s, r) => s + (r.atias as number), 0) / visible) * 100 : null,
    visibilityPct: total > 0 ? (withTotal.reduce((s, r) => s + r.visible, 0) / total) * 100 : null,
    tramos: rows.length,
  };
}

export function weightRows(reports: HarvestReport[]): WeightRow[] {
  return reports.flatMap((r) =>
    r.greenhouses.map((g) => ({
      week: weekLabel(r),
      greenhouse: g.info.name,
      family: g.familyName,
      grams: g.gramsPerFruit,
      source: g.gramsSource,
      startingGrams: FAMILIES[g.info.family].grams,
    })),
  );
}
