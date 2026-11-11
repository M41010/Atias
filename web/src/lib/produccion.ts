/**
 * Producción en el tiempo: kilos por familia sumados por semana, mes o año, con lo recogido, la
 * previsión de Atias y la del técnico. Solo cálculo, sin interfaz, para poder probarlo.
 *
 * Regla de los meses y los años: cada recolección (lunes a viernes) cuenta entera en el mes y el año
 * de su lunes. La semana del 28 de septiembre al 2 de octubre es de septiembre. Así ninguna semana
 * se parte en dos y los totales de los meses suman lo mismo que los de las semanas.
 *
 * Lo recogido y lo del técnico de una semana solo se suman si todos los invernaderos lo tienen,
 * como en el resto de la app. Un mes o un año suma las semanas que sí lo tienen y dice cuántas son.
 */

import { errorPct } from "./calc";
import { FAMILIES, FAMILY_ORDER, type FamilyId, type GreenhouseRow, type HarvestReport } from "./api";
import { SIMULATED_NOTE, type XlsCell, type XlsSheet } from "./excelExport";

export type Granularity = "semana" | "mes" | "año";

export type Kilos = {
  /** Semanas que entran en la cifra. */
  weeks: number;
  /** Kilos recogidos en las semanas que tienen el dato; null si ninguna lo tiene. */
  real: number | null;
  realWeeks: number;
  /** Previsión de Atias de todas las semanas. */
  atias: number;
  /** Alguna semana con hileras sin contar: la previsión se queda corta. */
  atiasPartial: boolean;
  /** Previsión de Atias solo de las semanas con lo recogido, para comparar lo mismo. */
  atiasMatched: number;
  technician: number | null;
  technicianWeeks: number;
};

export type Period = {
  key: string;
  /** Rótulo largo: «Semana 45 · 2–6 nov», «Octubre de 2026», «2026». */
  label: string;
  /** Rótulo corto para el eje: «S45», «oct», «2026». */
  short: string;
  total: Kilos;
  families: { family: FamilyId; name: string; kilos: Kilos }[];
};

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** Una semana de un grupo de invernaderos. Sin invernaderos no hay semana (null), no un cero. */
export function weekKilos(rows: GreenhouseRow[]): Kilos | null {
  if (rows.length === 0) return null;
  const allOrNull = (pick: (g: GreenhouseRow) => number | null) =>
    rows.every((g) => pick(g) !== null) ? sum(rows.map((g) => pick(g) as number)) : null;
  const real = allOrNull((g) => g.realKg);
  const technician = allOrNull((g) => g.technicianKg);
  const atias = sum(rows.map((g) => g.forecast.kg));
  return {
    weeks: 1,
    real,
    realWeeks: real === null ? 0 : 1,
    atias,
    atiasPartial: rows.some((g) => g.partial),
    atiasMatched: real === null ? 0 : atias,
    technician,
    technicianWeeks: technician === null ? 0 : 1,
  };
}

/** Suma semanas: lo recogido y lo del técnico, de las que lo tienen. */
export function addKilos(items: Kilos[]): Kilos {
  const realWeeks = sum(items.map((k) => k.realWeeks));
  const technicianWeeks = sum(items.map((k) => k.technicianWeeks));
  return {
    weeks: sum(items.map((k) => k.weeks)),
    real: realWeeks === 0 ? null : sum(items.map((k) => k.real ?? 0)),
    realWeeks,
    atias: sum(items.map((k) => k.atias)),
    atiasPartial: items.some((k) => k.atiasPartial),
    atiasMatched: sum(items.map((k) => k.atiasMatched)),
    technician: technicianWeeks === 0 ? null : sum(items.map((k) => k.technician ?? 0)),
    technicianWeeks,
  };
}

/** Desviación de Atias frente a lo recogido, solo en las semanas que tienen lo recogido. */
export function atiasDeviation(k: Kilos): number | null {
  return k.real === null ? null : errorPct(k.atiasMatched, k.real);
}

/** Lo recogido no llega a todas las semanas de la cifra. */
export const realIncomplete = (k: Kilos) => k.real !== null && k.realWeeks < k.weeks;

const monthName = new Intl.DateTimeFormat("es-ES", { month: "long", timeZone: "UTC" });
const monthShort = new Intl.DateTimeFormat("es-ES", { month: "short", timeZone: "UTC" });
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const dateOf = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`);

/** Clave y rótulos del periodo de una recolección, según su lunes. */
export function periodOf(report: HarvestReport, granularity: Granularity): Omit<Period, "total" | "families"> {
  const monday = report.dates[0];
  const year = monday.slice(0, 4);
  if (granularity === "año") return { key: year, label: year, short: year };
  if (granularity === "mes") {
    const date = dateOf(monday);
    return {
      key: monday.slice(0, 7),
      label: `${capital(monthName.format(date))} de ${year}`,
      short: monthShort.format(date).replace(".", ""),
    };
  }
  return {
    key: report.id,
    label: `Semana ${report.isoWeek} · ${report.label.replace("Recolección ", "")}`,
    short: `S${report.isoWeek}`,
  };
}

/**
 * Periodos en orden de tiempo, con el total y cada familia. `families` vacío significa todas.
 * Las recolecciones sin capturas no cuentan: no tienen previsión con la que comparar.
 */
export function productionPeriods(reports: HarvestReport[], granularity: Granularity, families: FamilyId[] = []): Period[] {
  const keep = (g: GreenhouseRow) => families.length === 0 || families.includes(g.info.family);
  const weeks = reports
    .filter((r) => !r.empty && r.dates.length > 0)
    .sort((a, b) => a.dates[0].localeCompare(b.dates[0]))
    .map((r) => ({ report: r, rows: r.greenhouses.filter(keep) }))
    .filter((w) => w.rows.length > 0);

  const groups = new Map<string, { period: Omit<Period, "total" | "families">; weeks: typeof weeks }>();
  for (const week of weeks) {
    const period = periodOf(week.report, granularity);
    const group = groups.get(period.key) ?? { period, weeks: [] };
    group.weeks.push(week);
    groups.set(period.key, group);
  }

  return [...groups.values()].map(({ period, weeks: members }) => ({
    ...period,
    total: addKilos(members.map((w) => weekKilos(w.rows) as Kilos)),
    families: FAMILY_ORDER.flatMap((family) => {
      const cells = members.flatMap((w) => {
        const k = weekKilos(w.rows.filter((g) => g.info.family === family));
        return k ? [k] : [];
      });
      return cells.length > 0 ? [{ family, name: FAMILIES[family].name, kilos: addKilos(cells) }] : [];
    }),
  }));
}

const GRANULARITY_NAME: Record<Granularity, string> = { semana: "Semana", mes: "Mes", año: "Año" };

/** Hoja de Excel con las mismas cifras que la tabla de Producción: cada periodo y sus familias. */
export function productionSheets(periods: Period[], granularity: Granularity, opts: { simulated: boolean; families: FamilyId[] }): XlsSheet[] {
  const kg = (value: number | null) => (value === null ? null : Math.round(value));
  const pct = (value: number | null) => (value === null ? null : Math.round(value * 10) / 10);
  const cells = (k: Kilos): XlsCell[] => [
    kg(k.real),
    `${k.realWeeks} de ${k.weeks}`,
    kg(k.atias),
    kg(k.technician),
    pct(atiasDeviation(k)),
  ];
  const familyLine = `Familias: ${opts.families.length === 0 ? "todas" : opts.families.map((f) => FAMILIES[f].name).join(", ")}`;
  const head: XlsCell[][] = [
    ["Atias · Producción"],
    ...(opts.simulated ? [[SIMULATED_NOTE]] : []),
    [`Por ${GRANULARITY_NAME[granularity].toLowerCase()} · ${familyLine}`],
    ["Cada semana (lunes a viernes) cuenta en el mes y el año de su lunes."],
    [],
  ];
  const columns: XlsCell[] = [GRANULARITY_NAME[granularity], "Familia", "Recogido (kg)", "Semanas con recogido", "Previsto Atias (kg)", "Técnico (kg)", "Desviación Atias (%)"];
  const body: XlsCell[][] = [];
  const bold = [0, head.length];
  for (const p of periods) {
    bold.push(head.length + 1 + body.length);
    body.push([p.label, "Todas", ...cells(p.total)]);
    for (const f of p.families) body.push([p.label, f.name, ...cells(f.kilos)]);
  }
  const notes: XlsCell[][] = [
    [],
    ["Recogido y técnico suman solo las semanas en que todos los invernaderos tienen el dato. La desviación compara lo recogido con lo previsto en esas mismas semanas."],
    ["La previsión de Atias es experimental: aún sin validar con cosecha real."],
  ];
  return [{ name: "Producción", rows: [...head, columns, ...body, ...notes], widths: [26, 22, 15, 21, 19, 14, 20], boldRows: bold }];
}

/** Familias que aparecen en alguna recolección, en el orden de la empresa. */
export function presentFamilies(reports: HarvestReport[]): FamilyId[] {
  const present = new Set(reports.flatMap((r) => r.greenhouses.map((g) => g.info.family)));
  return FAMILY_ORDER.filter((f) => present.has(f));
}
