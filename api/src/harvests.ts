/** Recolecciones: empiezan en lunes y duran hasta el viernes. Fechas de calendario de España. */

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DAY_MS = 86_400_000;
const UPCOMING = 4;

export type HarvestWeek = { inicio: string; id: string; etiqueta: string };

const toUtc = (isoDate: string) => new Date(`${isoDate}T00:00:00Z`);
const toIso = (date: Date) => date.toISOString().slice(0, 10);

export function isValidMonday(isoDate: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return false;
  const date = toUtc(isoDate);
  return !Number.isNaN(date.getTime()) && toIso(date) === isoDate && date.getUTCDay() === 1;
}

export function harvestWeek(monday: string): HarvestWeek {
  const start = toUtc(monday);
  const end = new Date(start.getTime() + 4 * DAY_MS);
  // Semana ISO: la define su jueves, aunque la recolección siga hasta el viernes.
  const thursday = new Date(start.getTime() + 3 * DAY_MS);
  const year = thursday.getUTCFullYear();
  const week = Math.floor((thursday.getTime() - Date.UTC(year, 0, 1)) / (7 * DAY_MS)) + 1;
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  const label = sameMonth
    ? `${start.getUTCDate()}–${end.getUTCDate()} ${MONTHS[end.getUTCMonth()]}`
    : `${start.getUTCDate()} ${MONTHS[start.getUTCMonth()]}–${end.getUTCDate()} ${MONTHS[end.getUTCMonth()]}`;
  return { inicio: monday, id: `${year}-W${String(week).padStart(2, "0")}`, etiqueta: `Recolección ${label}` };
}

function todayInSpain(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", dateStyle: "short" }).format(now);
}

/** Las próximas recolecciones, sin contar una que ya haya empezado. */
export function upcomingHarvests(now: Date = new Date()): HarvestWeek[] {
  const today = toUtc(todayInSpain(now));
  const daysToMonday = ((8 - today.getUTCDay()) % 7) || 7;
  return Array.from({ length: UPCOMING }, (_, i) =>
    harvestWeek(toIso(new Date(today.getTime() + (daysToMonday + i * 7) * DAY_MS))));
}
