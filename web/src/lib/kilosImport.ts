/**
 * Importar kilos a Datos de campo: lo pegado desde una hoja de cálculo y los Excel o CSV con una fila
 * por invernadero y día. Aquí solo se lee y se compara; guardar lo hace la pantalla con las rutas de
 * siempre. Nada se pisa sin avisar: cada valor sale como nuevo, igual, cambia, del ERP o con error.
 */

import type { XlsSheet } from "./excelExport";
import { fmtDay } from "./format";
import type { DayValues, FieldData, FieldGreenhouse } from "./serverApi";
import type { SheetCell } from "./xlsxRead";

export const MAX_KG = 10_000_000;
const DAY_MS = 86_400_000;

export type Series = "real" | "tecnico" | "agricultor";
export const SERIES_NAMES: Record<Series, string> = {
  real: "Recogido",
  tecnico: "Previsión del técnico",
  agricultor: "Previsión del agricultor",
};

const fold = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
/** Minúsculas, sin tildes y con cualquier signo convertido en espacio. */
const words = (text: string) => fold(text).replace(/[^a-z0-9]+/g, " ").trim();

// ---- Kilos ----

export type Kg = { ok: true; value: number | null } | { ok: false; reason: string };

/**
 * Kilos escritos a la española: coma decimal y punto de miles («1.234,5»). Si solo hay un punto y no
 * separa grupos de tres cifras, es decimal («12.5»). Vacío, «-» o «—» es que no hay dato.
 */
export function parseKg(input: SheetCell | undefined): Kg {
  if (input === null || input === undefined) return { ok: true, value: null };
  if (typeof input === "number") {
    if (!Number.isFinite(input)) return { ok: false, reason: "no es un número" };
    if (input < 0) return { ok: false, reason: "negativo" };
    if (input > MAX_KG) return { ok: false, reason: "demasiado grande" };
    return { ok: true, value: input };
  }
  let text = input.replace(/[\s  ]/g, "").replace(/kgs?\.?$/i, "");
  if (text === "" || text === "-" || text === "—" || text === "–") return { ok: true, value: null };
  if (/^-\d|^\(.*\)$|^\d.*-$|^−/.test(text)) return { ok: false, reason: "negativo" };
  if (text.startsWith("+")) text = text.slice(1);
  if (!/^\d[\d.,]*$/.test(text) || /[.,]$/.test(text)) return { ok: false, reason: "no es un número" };
  const dot = text.lastIndexOf(".");
  const comma = text.lastIndexOf(",");
  let normal: string | null = null;
  if (dot >= 0 && comma >= 0) {
    // El último separador es el decimal; el otro, el de miles, en grupos de tres.
    const [thousands, decimal] = dot > comma ? [",", "."] : [".", ","];
    const cut = text.lastIndexOf(decimal);
    const groups = text.slice(0, cut).split(thousands);
    const fraction = text.slice(cut + 1);
    if (/^\d{1,3}$/.test(groups[0]) && groups.slice(1).every((g) => /^\d{3}$/.test(g)) && /^\d+$/.test(fraction)) {
      normal = `${groups.join("")}.${fraction}`;
    }
  } else if (comma >= 0) {
    if (/^\d{1,3}(,\d{3}){2,}$/.test(text)) normal = text.replace(/,/g, "");
    else if (/^\d+,\d+$/.test(text)) normal = text.replace(",", ".");
  } else if (dot >= 0) {
    if (/^\d{1,3}(\.\d{3})+$/.test(text)) normal = text.replace(/\./g, "");
    else if (/^\d+\.\d+$/.test(text)) normal = text;
  } else normal = text;
  if (normal === null) return { ok: false, reason: "no es un número" };
  const value = Number(normal);
  if (!Number.isFinite(value)) return { ok: false, reason: "no es un número" };
  if (value > MAX_KG) return { ok: false, reason: "demasiado grande" };
  return { ok: true, value };
}

export const fmtKgText = (value: number | null) =>
  value === null ? "—" : new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2, useGrouping: "always" }).format(value);

// ---- Días ----

export type DayMatch = { ok: true; index: number } | { ok: false; reason: string };

const WEEKDAYS = [
  ["domingo", "dom"],
  ["lunes", "lun"],
  ["martes", "mar"],
  ["miercoles", "mie", "mi", "x"],
  ["jueves", "jue"],
  ["viernes", "vie"],
  ["sabado", "sab"],
];

/** 0 domingo … 6 sábado, si el texto empieza por un nombre de día. */
function weekdayOf(text: string): number | null {
  const first = words(text).split(" ")[0];
  const found = WEEKDAYS.findIndex((names) => names.includes(first));
  return found >= 0 ? found : null;
}

const isoOf = (time: number) => new Date(time).toISOString().slice(0, 10);

/** Fecha ISO a partir de un número de serie de Excel o de «16/11/2026», «16-11-26», «16/11» o «2026-11-16». */
function dateOf(input: SheetCell, year: number): string | null {
  if (typeof input === "number") {
    // Excel cuenta los días desde el 30 de diciembre de 1899. Entre 1982 y 2119 para no confundirlo con kilos.
    if (input < 30_000 || input > 80_000) return null;
    return isoOf(Date.UTC(1899, 11, 30) + Math.floor(input) * DAY_MS);
  }
  if (input === null) return null;
  const iso = input.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  const local = input.match(/(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?/);
  let [y, m, d] = [0, 0, 0];
  if (iso) [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else if (local) {
    const rawYear = local[3] ? Number(local[3]) : year;
    [y, m, d] = [rawYear < 100 ? 2000 + rawYear : rawYear, Number(local[2]), Number(local[1])];
  } else return null;
  const time = Date.UTC(y, m - 1, d);
  const check = new Date(time);
  if (check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) return null;
  return isoOf(time);
}

/**
 * Día de la semana de la recolección (0 lunes … 4 viernes). Vale una fecha (día/mes, como en España)
 * o el nombre del día. Si hay fecha, manda la fecha.
 */
export function matchDay(input: SheetCell, days: string[]): DayMatch {
  if (input === null || (typeof input === "string" && input.trim() === "")) return { ok: false, reason: "Falta la fecha" };
  const year = Number(days[0].slice(0, 4));
  const iso = dateOf(input, year);
  if (iso) {
    const index = days.indexOf(iso);
    return index >= 0 ? { ok: true, index } : { ok: false, reason: `${fmtDay(iso)}: fuera de la semana del ${fmtDay(days[0])} al ${fmtDay(days[days.length - 1])}` };
  }
  if (typeof input === "string") {
    const weekday = weekdayOf(input);
    if (weekday !== null) {
      return weekday >= 1 && weekday <= 5 ? { ok: true, index: weekday - 1 } : { ok: false, reason: `${input.trim()}: fuera de lunes a viernes` };
    }
  }
  return { ok: false, reason: `Fecha no válida: «${String(input).trim()}»` };
}

// ---- Invernaderos ----

const NOISE = new Set(["invernadero", "invernaderos", "inv", "invern", "nave", "n", "no", "num", "numero"]);

/** «Invernadero 01», «inv. 1», «INV-1» y «1» dan lo mismo: «1». */
export function greenhouseKey(text: string): string {
  return words(text)
    .split(" ")
    .filter((w) => w && !NOISE.has(w))
    .map((w) => (/^\d+$/.test(w) ? String(Number(w)) : w))
    .join(" ");
}

export type GreenhouseMatch = { ok: true; greenhouse: FieldGreenhouse } | { ok: false; reason: string };

export function matchGreenhouse(text: string, greenhouses: FieldGreenhouse[]): GreenhouseMatch {
  const wanted = words(text);
  if (!wanted) return { ok: false, reason: "Falta el invernadero" };
  const exact = greenhouses.filter((g) => words(g.nombre) === wanted || words(g.id) === wanted);
  if (exact.length === 1) return { ok: true, greenhouse: exact[0] };
  const key = greenhouseKey(text);
  const close = key ? greenhouses.filter((g) => greenhouseKey(g.nombre) === key || greenhouseKey(g.id) === key) : [];
  if (close.length === 1) return { ok: true, greenhouse: close[0] };
  if (close.length > 1 || exact.length > 1) {
    return { ok: false, reason: `«${text.trim()}» puede ser ${(exact.length > 1 ? exact : close).map((g) => g.nombre).join(" o ")}` };
  }
  return { ok: false, reason: `No hay ningún invernadero «${text.trim()}»` };
}

// ---- Leer la tabla ----

export type Entry = {
  /** Fila del fichero, contando desde 1 como en Excel. */
  line: number;
  greenhouse: string;
  day: SheetCell;
  values: Partial<Record<Series, SheetCell>>;
  /** Algo de la fila que impide leerla, aparte del invernadero, el día y los kilos. */
  problem?: string;
};

export type TableRead =
  | { ok: true; format: "filas" | "columnas"; entries: Entry[]; ignored: string[] }
  | { ok: false; error: string };

type ColumnKind = "invernadero" | "fecha" | "dia" | "dato" | Series;

function columnKind(cell: SheetCell): ColumnKind | null {
  if (typeof cell !== "string") return null;
  const w = words(cell);
  if (/\binvernadero\b|^inv\b|^nave\b|^finca\b/.test(w)) return "invernadero";
  if (/\bfecha\b/.test(w)) return "fecha";
  if (/^dia\b/.test(w)) return "dia";
  if (/\btecnico\b/.test(w)) return "tecnico";
  if (/\bagricultor\b/.test(w)) return "agricultor";
  if (/\b(recogido|real|bascula|neto|netos|cosechado)\b/.test(w) || /^(kilos|kg|peso)$/.test(w)) return "real";
  if (/^(dato|serie|tipo|concepto)\b/.test(w)) return "dato";
  return null;
}

export function seriesFromLabel(text: string): Series | null {
  const w = words(text);
  if (/\btecnico\b/.test(w)) return "tecnico";
  if (/\bagricultor\b/.test(w)) return "agricultor";
  if (/\b(recogido|real|bascula|neto|cosecha|cosechado)\b/.test(w)) return "real";
  return null;
}

/** Columna de un día en el formato de una fila por invernadero (Lunes … Viernes, o fechas). */
const isDayHeader = (cell: SheetCell, days: string[]) =>
  cell !== null && (typeof cell === "number" ? matchDay(cell, days).ok : weekdayOf(cell) !== null || dateOf(cell, Number(days[0].slice(0, 4))) !== null);

const isEmptyRow = (row: SheetCell[]) => row.every((c) => c === null || (typeof c === "string" && c.trim() === ""));
const text = (cell: SheetCell | undefined) => (cell === null || cell === undefined ? "" : String(cell).trim());

/**
 * Busca la cabecera en las primeras filas (puede haber un título encima) y lee los valores.
 * - Una fila por invernadero y día: Invernadero, Fecha o Día, y columnas de kilos.
 * - Una fila por invernadero y dato: Invernadero, Dato (Recogido, Previsión técnico…), Lunes … Viernes.
 */
export function readTable(rows: SheetCell[][], days: string[]): TableRead {
  for (let h = 0; h < Math.min(rows.length, 15); h++) {
    const header = rows[h] ?? [];
    const kinds = header.map(columnKind);
    const greenhouseColumn = kinds.indexOf("invernadero");
    if (greenhouseColumn < 0) continue;
    const dayColumns = header.map((cell, i) => (i !== greenhouseColumn && kinds[i] === null && isDayHeader(cell, days) ? i : -1)).filter((i) => i >= 0);
    const body = rows.slice(h + 1).map((row, i) => ({ row, line: h + 2 + i })).filter(({ row }) => !isEmptyRow(row));
    const ignored = header.filter((cell, i) => text(cell) && kinds[i] === null && !dayColumns.includes(i)).map(text);

    if (dayColumns.length > 0 && kinds.indexOf("fecha") < 0) {
      const labelColumn = kinds.indexOf("dato");
      const onlySeries = kinds.filter((k): k is Series => k === "real" || k === "tecnico" || k === "agricultor");
      if (labelColumn < 0 && onlySeries.length !== 1) {
        return { ok: false, error: "Hay columnas de lunes a viernes pero falta la columna «Dato» que diga si es recogido, previsión del técnico o del agricultor." };
      }
      const entries: Entry[] = [];
      for (const { row, line } of body) {
        const label = labelColumn >= 0 ? text(row[labelColumn]) : "";
        const series = labelColumn >= 0 ? seriesFromLabel(label) : onlySeries[0];
        const greenhouse = text(row[greenhouseColumn]);
        if (!series) {
          if (dayColumns.some((c) => text(row[c]) !== "")) {
            entries.push({ line, greenhouse, day: null, values: {}, problem: `Dato no reconocido: «${label}» (pon Recogido, Previsión técnico o Previsión agricultor)` });
          }
          continue;
        }
        for (const column of dayColumns) entries.push({ line, greenhouse, day: header[column], values: { [series]: row[column] ?? null } });
      }
      return { ok: true, format: "columnas", entries, ignored };
    }

    const dateColumn = kinds.indexOf("fecha");
    const dayColumn = kinds.indexOf("dia");
    if (dateColumn < 0 && dayColumn < 0) continue;
    const seriesColumns = (["real", "tecnico", "agricultor"] as const).map((s) => [s, kinds.indexOf(s)] as const).filter(([, i]) => i >= 0);
    if (seriesColumns.length === 0) {
      return { ok: false, error: "No hay ninguna columna de kilos: pon «Recogido kg», «Previsión técnico kg» o «Previsión agricultor kg»." };
    }
    // Si una columna sale dos veces (dos «kg»), vale la primera y la otra se avisa como no usada.
    ignored.push(...header.filter((_, i) => kinds[i] !== null && kinds.indexOf(kinds[i]) !== i).map(text));
    const entries = body.map(({ row, line }) => {
      const dateCell = dateColumn >= 0 ? (row[dateColumn] ?? null) : null;
      return {
        line,
        greenhouse: text(row[greenhouseColumn]),
        day: dateCell !== null && text(dateCell) !== "" ? dateCell : dayColumn >= 0 ? (row[dayColumn] ?? null) : null,
        values: Object.fromEntries(seriesColumns.map(([s, i]) => [s, row[i] ?? null])),
      };
    });
    return { ok: true, format: "filas", entries, ignored };
  }
  return { ok: false, error: "No se encuentra la cabecera: hace falta una columna «Invernadero» y otra «Fecha» o «Día» (o columnas de lunes a viernes)." };
}

// ---- Comparar con lo guardado ----

export type Status = "nuevo" | "igual" | "cambia" | "erp" | "error";

export type PlanRow = {
  lines: number[];
  greenhouseText: string;
  greenhouse: { id: string; nombre: string } | null;
  dayIndex: number | null;
  dayText: string;
  series: Series | null;
  kg: number | null;
  before: number | null;
  status: Status;
  message: string;
};

const same = (a: number, b: number) => Math.abs(a - b) < 1e-6;

export function previousValue(g: FieldGreenhouse, series: Series, index: number): number | null {
  return (series === "real" ? g.real : g.previsiones[series])[index] ?? null;
}

const isErp = (g: FieldGreenhouse, index: number) => g.realOrigen?.[index] === "erp";

/**
 * Qué pasaría con cada valor. El recogido de un mismo invernadero y día en varias filas se suma (una
 * fila por pesada); dos previsiones distintas para el mismo día son un error.
 */
export function planImport(entries: Entry[], field: FieldData): PlanRow[] {
  const result: PlanRow[] = [];
  const groups = new Map<string, { g: FieldGreenhouse; index: number; series: Series; lines: number[]; values: number[]; greenhouseText: string }>();
  for (const entry of entries) {
    if (entry.problem) {
      result.push({
        lines: [entry.line], greenhouseText: entry.greenhouse, greenhouse: null, dayIndex: null, dayText: "", series: null,
        kg: null, before: null, status: "error", message: entry.problem,
      });
      continue;
    }
    const present = (Object.entries(entry.values) as [Series, SheetCell][]).filter(([, cell]) => text(cell) !== "");
    if (present.length === 0) continue;
    const base = { lines: [entry.line], greenhouseText: entry.greenhouse, dayText: text(entry.day), kg: null, before: null, status: "error" as const };
    const greenhouse = matchGreenhouse(entry.greenhouse, field.invernaderos);
    if (!greenhouse.ok) {
      result.push({ ...base, greenhouse: null, dayIndex: null, series: null, message: greenhouse.reason });
      continue;
    }
    const g = greenhouse.greenhouse;
    const day = matchDay(entry.day, field.dias);
    if (!day.ok) {
      result.push({ ...base, greenhouse: { id: g.id, nombre: g.nombre }, dayIndex: null, series: null, message: day.reason });
      continue;
    }
    for (const [series, cell] of present) {
      const kg = parseKg(cell);
      if (!kg.ok || kg.value === null) {
        const reason = kg.ok ? "no es un número" : kg.reason;
        result.push({ ...base, greenhouse: { id: g.id, nombre: g.nombre }, dayIndex: day.index, series, message: `Kilos no válidos (${reason}): «${text(cell)}»` });
        continue;
      }
      const key = `${g.id}|${day.index}|${series}`;
      const group = groups.get(key) ?? { g, index: day.index, series, lines: [], values: [], greenhouseText: entry.greenhouse };
      group.lines.push(entry.line);
      group.values.push(kg.value);
      groups.set(key, group);
    }
  }

  for (const { g, index, series, lines, values, greenhouseText } of groups.values()) {
    const row = {
      lines, greenhouseText, greenhouse: { id: g.id, nombre: g.nombre }, dayIndex: index, dayText: fmtDay(field.dias[index]), series,
      before: previousValue(g, series, index),
    };
    if (series !== "real" && values.some((v) => !same(v, values[0]))) {
      result.push({ ...row, kg: null, status: "error", message: `Dos previsiones distintas para el mismo día (filas ${lines.join(", ")})` });
      continue;
    }
    const kg = series === "real" ? Math.round(values.reduce((a, b) => a + b, 0) * 1000) / 1000 : values[0];
    const summed = series === "real" && values.length > 1 ? `Suma de ${values.length} filas. ` : "";
    const repeated = series !== "real" && values.length > 1 ? `Repetido en ${values.length} filas. ` : "";
    const note = summed + repeated;
    if (row.before !== null && same(row.before, kg)) result.push({ ...row, kg, status: "igual", message: `${note}Ya estaba así.` });
    else if (series === "real" && isErp(g, index)) result.push({ ...row, kg, status: "erp", message: `${note}Ese día llegó del ERP y no se cambia a mano.` });
    else if (row.before === null) result.push({ ...row, kg, status: "nuevo", message: `${note}Se añade.`.trim() });
    else result.push({ ...row, kg, status: "cambia", message: `${note}Cambia ${fmtKgText(row.before)} por ${fmtKgText(kg)}.` });
  }
  return result.sort((a, b) => a.lines[0] - b.lines[0] || (a.series ?? "").localeCompare(b.series ?? ""));
}

export function countStatuses(rows: PlanRow[]): Record<Status, number> {
  const counts: Record<Status, number> = { nuevo: 0, igual: 0, cambia: 0, erp: 0, error: 0 };
  for (const row of rows) counts[row.status]++;
  return counts;
}

// ---- Guardar ----

export type Write = { greenhouseId: string; nombre: string; series: Series; days: DayValues; cells: { index: number; kg: number }[] };

/**
 * Lo que hay que enviar: por invernadero y dato, los cinco días tal como están guardados, cambiando solo
 * los importados. Así las rutas de siempre (que reciben la semana entera) no borran nada más.
 */
export function buildWrites(rows: PlanRow[], field: FieldData, overwrite: boolean): Write[] {
  const writes = new Map<string, Write>();
  for (const row of rows) {
    if (!(row.status === "nuevo" || (row.status === "cambia" && overwrite))) continue;
    const g = field.invernaderos.find((x) => x.id === row.greenhouse?.id);
    if (!g || row.series === null || row.dayIndex === null || row.kg === null) continue;
    const key = `${g.id}|${row.series}`;
    const write = writes.get(key) ?? {
      greenhouseId: g.id, nombre: g.nombre, series: row.series,
      days: [...(row.series === "real" ? g.real : g.previsiones[row.series])], cells: [],
    };
    write.days[row.dayIndex] = row.kg;
    write.cells.push({ index: row.dayIndex, kg: row.kg });
    writes.set(key, write);
  }
  return [...writes.values()];
}

/** Firma de lo que se enseñó, para notar si los datos cambiaron entre revisar y guardar. */
export const planSignature = (rows: PlanRow[]) =>
  rows.map((r) => `${r.lines.join(",")}:${r.series}:${r.status}:${r.before}:${r.kg}`).join("|");

export type Missing = { nombre: string; series: Series; index: number; kg: number; now: number | null };

/** Tras guardar, vuelve a leer: cuenta solo lo que de verdad quedó guardado. */
export function verifyWrites(writes: Write[], fresh: FieldData): { saved: number; missing: Missing[] } {
  let saved = 0;
  const missing: Missing[] = [];
  for (const write of writes) {
    const g = fresh.invernaderos.find((x) => x.id === write.greenhouseId);
    for (const cell of write.cells) {
      const now = g ? previousValue(g, write.series, cell.index) : null;
      if (now !== null && same(now, cell.kg)) saved++;
      else missing.push({ nombre: write.nombre, series: write.series, index: cell.index, kg: cell.kg, now });
    }
  }
  return { saved, missing };
}

// ---- Pegar en la tabla de un invernadero ----

export type PasteRow = { series: Series | null; values: Kg[] };

/**
 * Un bloque copiado de una hoja de cálculo: filas separadas por saltos de línea y celdas por tabuladores.
 * Hasta 3 filas de 5 días. Si la primera celda es un rótulo («Previsión del técnico»), dice la fila.
 */
export function parsePaste(raw: string, startDay = 0): { ok: true; rows: PasteRow[] } | { ok: false; error: string } {
  const lines = raw.replace(/\r\n?/g, "\n").split("\n");
  // Excel termina el bloque con un salto de línea; una fila de celdas vacías («\t\t\t\t») sí cuenta.
  while (lines.length > 0 && lines[lines.length - 1].trim() === "" && !lines[lines.length - 1].includes("\t")) lines.pop();
  while (lines.length > 0 && lines[0].trim() === "" && !lines[0].includes("\t")) lines.shift();
  if (lines.length === 0) return { ok: false, error: "No hay nada pegado." };
  const rows: PasteRow[] = [];
  for (const line of lines) {
    const cells = line.split("\t").map((c) => c.trim());
    let series: Series | null = null;
    if (cells.length > 0 && cells[0] !== "" && !parseKg(cells[0]).ok) {
      series = seriesFromLabel(cells[0]);
      if (series === null && cells.length > 5) cells.shift();
      else if (series !== null) cells.shift();
    }
    if (cells.length > 5) return { ok: false, error: "Hay más de 5 columnas: copia solo de lunes a viernes (sin el total de la semana)." };
    // Pegado en una casilla que no es el lunes: si el bloque no trae la semana entera, empieza ahí.
    if (cells.length < 5 && startDay > 0) {
      if (cells.length + startDay > 5) return { ok: false, error: "El bloque no cabe desde ese día hasta el viernes." };
      cells.unshift(...Array.from({ length: startDay }, () => ""));
    }
    while (cells.length < 5) cells.push("");
    rows.push({ series, values: cells.map((c) => parseKg(c)) });
  }
  if (rows.length > 3) return { ok: false, error: "Hay más de 3 filas: como mucho agricultor, técnico y recogido." };
  return { ok: true, rows };
}

/** Orden de las filas en la tabla de la pantalla. */
export const GRID_ORDER: Series[] = ["agricultor", "tecnico", "real"];

export type PasteCell = {
  series: Series;
  index: number;
  before: number | null;
  after: number | null;
  status: "nuevo" | "cambia" | "igual" | "vacio" | "erp" | "error";
  reason?: string;
};

/**
 * Qué cambiaría en la tabla al pegar. Cada fila pegada va a la que diga su rótulo o, si no lo trae,
 * a la siguiente desde la elegida. Una celda vacía deja lo que hubiera.
 */
export function planPaste(
  rows: PasteRow[],
  start: Series,
  current: Record<Series, (number | null)[]>,
  erpDays: boolean[],
): { ok: true; targets: Series[]; cells: PasteCell[] } | { ok: false; error: string } {
  const from = GRID_ORDER.indexOf(start);
  const targets = rows.map((row, i) => row.series ?? GRID_ORDER[from + i]);
  if (targets.some((t) => t === undefined)) return { ok: false, error: `No caben ${rows.length} filas a partir de «${SERIES_NAMES[start]}».` };
  if (new Set(targets).size !== targets.length) return { ok: false, error: "Dos filas pegadas van a la misma fila de la tabla." };
  const cells: PasteCell[] = rows.flatMap((row, r) =>
    row.values.map((kg, index): PasteCell => {
      const series = targets[r];
      const before = current[series][index] ?? null;
      if (!kg.ok) return { series, index, before, after: before, status: "error", reason: kg.reason };
      if (kg.value === null) return { series, index, before, after: before, status: "vacio" };
      if (before !== null && same(before, kg.value)) return { series, index, before, after: before, status: "igual" };
      if (series === "real" && erpDays[index]) return { series, index, before, after: before, status: "erp" };
      return { series, index, before, after: kg.value, status: before === null ? "nuevo" : "cambia" };
    }),
  );
  return { ok: true, targets, cells };
}

// ---- Plantilla ----

export const TEMPLATE_COLUMNS = ["Invernadero", "Fecha", "Día", "Recogido kg", "Previsión técnico kg", "Previsión agricultor kg"];

const DAY_NAMES = ["lunes", "martes", "miércoles", "jueves", "viernes"];
const dmy = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

/** Plantilla para rellenar: una fila por invernadero y día de la semana elegida, con los kilos vacíos. */
export function templateSheets(field: FieldData): XlsSheet[] {
  const rows = field.invernaderos.flatMap((g) => field.dias.map((d, i) => [g.nombre, dmy(d), DAY_NAMES[i] ?? "", null, null, null]));
  const help = [
    ["Cómo rellenar la plantilla"],
    [],
    ["Una fila por invernadero y día. Deja vacío lo que no se sepa: una celda vacía no borra nada."],
    ["Invernadero: el nombre como sale en Atias. También vale «inv 1» o «1»."],
    ["Fecha: día/mes/año. Si no hay fecha, vale el día de la semana (lunes … viernes)."],
    ["Kilos: números sin negativos. Con coma decimal (1.234,5) o sin decimales."],
    ["Recogido kg: lo pesado en báscula. Si hay varias filas del mismo invernadero y día, se suman."],
    ["Previsión técnico kg y Previsión agricultor kg: lo que dijeron que se recogería ese día."],
    ["Antes de guardar, Atias enseña qué es nuevo, qué cambiaría y qué tiene errores."],
  ];
  return [
    { name: "Kilos", rows: [TEMPLATE_COLUMNS, ...rows], widths: [22, 12, 11, 13, 21, 23], boldRows: [0] },
    { name: "Cómo rellenarla", rows: help, widths: [100], boldRows: [0] },
  ];
}
