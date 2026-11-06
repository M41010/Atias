import type { KgRange } from "./calc";

// useGrouping "always": en es-ES, por defecto, 4280 se escribiría sin separador de miles.
const kgFormat = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0, useGrouping: "always" });
const pctFormat = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });
const dateFormat = new Intl.DateTimeFormat("es-ES", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Madrid",
});

export const fmtInt = (value: number) => kgFormat.format(value);
export const fmtKg = (value: number) => kgFormat.format(Math.round(value));
export const fmtRange = (range: KgRange) => `${fmtKg(range.min)}–${fmtKg(range.max)}`;
export const fmtBetween = (range: KgRange) => `Entre ${fmtKg(range.min)} y ${fmtKg(range.max)} kg`;
export const fmtPct = (value: number) => `${pctFormat.format(value)} %`;
export const fmtDate = (iso: string) => dateFormat.format(new Date(iso));

const dayFormat = new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Madrid" });
const timeFormat = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });

/** Día y horas de todas las capturas de la semana, por ejemplo: sáb, 31 oct, 08:12–17:05. */
export function fmtCaptureSpan(isoDates: string[]): string {
  if (isoDates.length === 0) return "";
  const sorted = [...isoDates].sort();
  const first = new Date(sorted[0]);
  const last = new Date(sorted[sorted.length - 1]);
  const hours = sorted.length === 1 ? timeFormat.format(first) : `${timeFormat.format(first)}–${timeFormat.format(last)}`;
  return `${dayFormat.format(first)}, ${hours}`;
}

const shortDayFormat = new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const decimalFormat = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Día de calendario sin hora, por ejemplo: lun, 2 nov. */
export const fmtDay = (isoDate: string) => shortDayFormat.format(new Date(`${isoDate}T00:00:00Z`));
export const fmtDecimal = (value: number) => decimalFormat.format(value);
