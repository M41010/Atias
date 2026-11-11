import type { HarvestReport } from "./api";

/** Previsión de Atias para los días de una recolección, sumando todos los invernaderos. */
export type HarvestForecast = {
  days: { date: string; kg: number }[];
  totalKg: number;
  /** Invernaderos con algún vídeo analizado. */
  greenhouses: number;
  /** Faltan hileras por grabar o analizar: la cifra crecerá al llegar más vídeos. */
  partial: boolean;
};

/**
 * Lo que ya prevé Atias para la recolección elegida al subir vídeos: los mismos kilos por día que
 * la Previsión diaria. Null si todavía no hay vídeos analizados.
 */
export function harvestForecast(report: HarvestReport | null | undefined): HarvestForecast | null {
  if (!report || report.empty || report.greenhouses.length === 0) return null;
  const days = report.dates.map((date, i) => ({
    date,
    kg: report.greenhouses.reduce((sum, g) => sum + (g.daily[i]?.atias ?? 0), 0),
  }));
  return {
    days,
    totalKg: days.reduce((sum, d) => sum + d.kg, 0),
    greenhouses: report.greenhouses.length,
    partial: report.partial,
  };
}
