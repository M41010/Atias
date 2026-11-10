/**
 * Hojas de cálculo para descargar en Excel: el Resumen de la recolección y la Previsión diaria.
 * Solo construye filas (sin dependencias de la interfaz ni de la librería que escribe el .xlsx),
 * para poder probarlo. Las cifras van como números, no como texto, para que se puedan sumar.
 */

import { FAMILIES, FAMILY_ORDER, type FamilyId, type GreenhouseRow, type HarvestReport } from "./api";
import { fmtDate, fmtDay } from "./format";

export type XlsCell = string | number | null;
export type XlsSheet = {
  /** Nombre de la pestaña (Excel admite hasta 31 caracteres). */
  name: string;
  rows: XlsCell[][];
  /** Ancho de cada columna, en caracteres. */
  widths: number[];
  /** Filas que van en negrita (títulos y cabeceras). */
  boldRows: number[];
};

export const SIMULATED_NOTE = "Datos simulados: ninguna cifra procede de un invernadero real ni indica la precisión del sistema.";
const EXPERIMENTAL_NOTE = "Previsión y temporeros son experimentales: aún sin validar con cosecha real.";

const STATUS: Record<GreenhouseRow["status"], string> = {
  analizado: "Analizado",
  con_advertencias: "Con advertencias",
  analizando: "Analizando",
};

const round = (value: number) => Math.round(value);

/** Primeras filas de cada hoja: título, aviso de datos simulados si lo son y una fila en blanco. */
function intro(title: string, report: HarvestReport): XlsCell[][] {
  return [[title], ...(report.simulated ? [[SIMULATED_NOTE]] : []), [`${report.label} · Semana ${report.isoWeek} de ${report.year}`], []];
}

/** Nombre del fichero: qué es, de qué semana y, si toca, que son datos simulados. */
export function excelFileName(kind: "resumen" | "prevision-diaria", report: HarvestReport): string {
  return `atias-${kind}-${report.id}${report.simulated ? "-datos-simulados" : ""}.xlsx`;
}

export function summarySheets(report: HarvestReport): XlsSheet[] {
  const head = intro("Atias · Resumen de la recolección", report);
  const general: XlsCell[][] = [
    ...head,
    ["Dato", "Valor"],
    ["Recolección", report.label],
    ["Semana", `${report.isoWeek} de ${report.year}`],
    ["Días", report.dates.map(fmtDay).join(", ")],
    ["Previsión para la venta (kg)", round(report.forecast.kg)],
    ["Previsión, mínimo (kg)", round(report.forecast.min)],
    ["Previsión, máximo (kg)", round(report.forecast.max)],
    ["Temporeros necesarios", report.workers],
    ["Temporeros en el extremo alto", report.workersMax],
    ["Fruta madura observada (kg)", round(report.observed.kg)],
    ["Frutos maduros contados", report.matureFruits],
    ["Recogido de lunes a viernes (kg)", report.realKg === null ? null : round(report.realKg)],
    ["Hileras sin contar", report.partial ? `${report.missingHileras} de ${report.totalHileras}` : "Ninguna"],
    ["Actualizado", fmtDate(report.updatedAt)],
    [],
    [EXPERIMENTAL_NOTE],
  ];

  const families: XlsCell[][] = [
    ...head,
    ["Familia", "Previsión (kg)", "Mínimo (kg)", "Máximo (kg)", "Observado (kg)", "Frutos maduros", "Temporeros", "Parcial"],
    ...report.families.map((f) => [
      f.name,
      round(f.forecast.kg),
      round(f.forecast.min),
      round(f.forecast.max),
      round(f.observed.kg),
      f.matureFruits,
      f.workers,
      f.partial ? "Sí" : "No",
    ]),
  ];

  const greenhouses: XlsCell[][] = [
    ...head,
    [
      "Invernadero", "Familia", "Agricultor", "Técnico", "Previsión Atias (kg)", "Mínimo (kg)", "Máximo (kg)",
      "Observado (kg)", "Previsión técnico (kg)", "Recogido (kg)", "Estado", "Parcial",
    ],
    ...report.greenhouses.map((g) => [
      g.info.name,
      g.familyName,
      g.growerName,
      g.technicianName,
      round(g.forecast.kg),
      round(g.forecast.min),
      round(g.forecast.max),
      round(g.observed.kg),
      g.technicianKg === null ? null : round(g.technicianKg),
      g.realKg === null ? null : round(g.realKg),
      STATUS[g.status],
      g.partial ? "Sí" : "No",
    ]),
  ];

  const header = head.length;
  return [
    { name: "Resumen", rows: general, widths: [34, 40], boldRows: [0, header] },
    { name: "Por familia", rows: families, widths: [24, 15, 13, 13, 15, 15, 12, 9], boldRows: [0, header] },
    { name: "Por invernadero", rows: greenhouses, widths: [16, 22, 20, 20, 19, 13, 13, 15, 21, 15, 17, 9], boldRows: [0, header] },
  ];
}

type DayTotals = { real: (number | null)[]; technician: (number | null)[]; atias: number[] };

/** Suma por día. El real y el del técnico solo se suman si todos los invernaderos lo tienen (como en pantalla). */
export function dayTotals(rows: GreenhouseRow[], days: number): DayTotals {
  const indexes = Array.from({ length: days }, (_, i) => i);
  const allOrNull = (pick: (g: GreenhouseRow, i: number) => number | null, i: number) =>
    rows.length > 0 && rows.every((g) => pick(g, i) !== null) ? rows.reduce((sum, g) => sum + (pick(g, i) as number), 0) : null;
  return {
    real: indexes.map((i) => allOrNull((g, d) => g.daily[d]?.real ?? null, i)),
    technician: indexes.map((i) => allOrNull((g, d) => g.daily[d]?.technician ?? null, i)),
    atias: indexes.map((i) => rows.reduce((sum, g) => sum + (g.daily[i]?.atias ?? 0), 0)),
  };
}

const sumOrNull = (values: (number | null)[]) => (values.some((v) => v === null) ? null : (values as number[]).reduce((a, b) => a + b, 0));

function dayCells(t: DayTotals): XlsCell[] {
  const kg = (v: number | null) => (v === null ? null : round(v));
  return [
    ...t.real.flatMap((_, i) => [kg(t.real[i]), kg(t.technician[i]), round(t.atias[i])]),
    kg(sumOrNull(t.real)),
    kg(sumOrNull(t.technician)),
    round(t.atias.reduce((a, b) => a + b, 0)),
  ];
}

export type DailyFilters = { families: string[]; technicians: string[] };

/**
 * Previsión diaria: kilos de lunes a viernes por familia (con sus invernaderos debajo) y el total,
 * con los mismos filtros que la pantalla. R: real; Téc.: técnico; Atias: previsión experimental.
 */
export function dailySheets(report: HarvestReport, rows: GreenhouseRow[], filters: DailyFilters): XlsSheet[] {
  const days = report.dates.length;
  const technicianNames = [...new Map(report.greenhouses.map((g) => [g.technicianId, g.technicianName])).entries()];
  const filterLine = [
    `Familias: ${filters.families.length === 0 ? "todas" : filters.families.map((f) => FAMILIES[f as FamilyId]?.name ?? f).join(", ")}`,
    `Técnicos: ${filters.technicians.length === 0 ? "todos" : filters.technicians.map((t) => technicianNames.find(([id]) => id === t)?.[1] ?? t).join(", ")}`,
  ].join(" · ");

  const head = [...intro("Atias · Previsión diaria", report), [filterLine], []];
  const columns: XlsCell[] = [
    "Familia",
    "Invernadero",
    ...report.dates.flatMap((d) => [`${fmtDay(d)} · R`, `${fmtDay(d)} · Téc.`, `${fmtDay(d)} · Atias`]),
    "Semana · R",
    "Semana · Téc.",
    "Semana · Atias",
  ];

  const body: XlsCell[][] = [];
  const bold: number[] = [0, head.length];
  for (const family of FAMILY_ORDER) {
    const members = rows.filter((g) => g.info.family === family);
    if (members.length === 0) continue;
    bold.push(head.length + 1 + body.length);
    body.push([FAMILIES[family].name, "Todos", ...dayCells(dayTotals(members, days))]);
    for (const g of members) body.push([FAMILIES[family].name, g.info.name, ...dayCells(dayTotals([g], days))]);
  }
  bold.push(head.length + 1 + body.length);
  const total: XlsCell[] = ["Total", "", ...dayCells(dayTotals(rows, days))];

  const notes: XlsCell[][] = [
    [],
    ["R: real, del ERP. Téc.: previsión del técnico. Atias: previsión experimental, sin validar. Vacío: falta el dato."],
  ];

  return [
    {
      name: "Previsión diaria",
      rows: [...head, columns, ...body, total, ...notes],
      widths: [22, 16, ...Array.from({ length: (days + 1) * 3 }, () => 15)],
      boldRows: bold,
    },
  ];
}
