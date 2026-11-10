import type { PilotResults } from "../content/resultados";

/** Semanas medidas a partir de las que el resultado ya permite concluir (docs/VALIDACION.md). */
export const MIN_WEEKS = 8;

/** ¿Hay algo que publicar? Sin filas medidas no se enseña la sección. */
export const hasResults = (data: PilotResults | null): data is PilotResults =>
  data !== null && data.forecasts.length > 0;

/** «5,8 %» o «+1,6 %» según el idioma. */
export function formatPct(value: number, numberLocale: string, signed = false): string {
  const text = new Intl.NumberFormat(numberLocale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: signed ? "exceptZero" : "auto",
  }).format(value);
  return `${text} %`;
}

/** «1 semana» o «8 semanas». */
export const plural = (forms: { one: string; other: string }, n: number) =>
  (n === 1 ? forms.one : forms.other).replace("{n}", String(n));

/** Rellena los huecos {clave} de un texto traducido. */
export const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
