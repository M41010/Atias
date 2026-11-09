/**
 * Meteorología de la semana de una recolección, de sábado (día de grabar) a viernes.
 * Viene de Open-Meteo a través de la API; si no responde, se usa la simulada y se indica.
 */

import { degreeDaysFromHourly, weatherFactor } from "./calc";
import type { DayWeather, Location } from "./simulated";

/** sin_datos: el invernadero no tiene ubicación o la API no respondió; no se usa el tiempo. */
export type WeatherSource = "open-meteo" | "simulada" | "sin_datos";

export type WeatherDay = DayWeather & {
  tempMaxC: number;
  tempMinC: number;
  tempMeanC: number;
  degreeDays: number;
  normalDegreeDays: number;
};

export type WeatherSummary = {
  days: WeatherDay[];
  weeklyDegreeDays: number;
  /** Grados-día normales de esa semana en ese lugar: la referencia. */
  normalWeeklyDegreeDays: number;
  /** Cuánto más (o menos) madura la fruta que en una semana normal. */
  factor: number;
  source: WeatherSource;
  /** Años con los que se calculó lo normal. Null si es simulado. */
  normalsYears: number | null;
  /** Open-Meteo no respondió en la última consulta: son los últimos datos guardados. */
  stale: boolean;
};

export type RealWeather = { days: DayWeather[]; normalsYears: number; stale: boolean };

type ApiWeather = {
  anosNormal: number;
  desactualizado: boolean;
  dias: {
    fecha: string;
    tipo: "observado" | "prevision" | "normal";
    temperaturaHoraria: number[];
    normalHoraria: number[];
    lluviaMm: number;
  }[];
};

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

export const weatherKey = (location: Location, monday: string) =>
  `${location.latitude},${location.longitude},${monday}`;

/** Pide la semana a la API. Devuelve null si no está disponible: entonces se usa la simulada. */
export async function fetchRealWeather(location: Location, monday: string): Promise<RealWeather | null> {
  const query = new URLSearchParams({
    lat: String(location.latitude),
    lon: String(location.longitude),
    inicio: monday,
  });
  try {
    // La primera vez de cada lugar se descarga su histórico de 10 años: puede tardar unos segundos.
    const response = await fetch(`/api/cooperativa/meteorologia?${query}`, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) return null;
    return fromApi((await response.json()) as ApiWeather);
  } catch {
    return null;
  }
}

export function fromApi(body: ApiWeather): RealWeather {
  return {
    normalsYears: body.anosNormal,
    stale: body.desactualizado,
    days: body.dias.map((d) => ({
      date: d.fecha,
      hourlyTempC: d.temperaturaHoraria,
      normalHourlyTempC: d.normalHoraria,
      precipitationMm: d.lluviaMm,
      place: "exterior",
      kind: d.tipo,
    })),
  };
}

/** Resume la semana: grados-día de cada día, los normales y el factor de maduración. */
export function summarizeWeather(
  days: DayWeather[],
  meta: { source: WeatherSource; normalsYears: number | null; stale: boolean },
): WeatherSummary {
  const rows = days.map((d) => ({
    ...d,
    tempMaxC: Math.max(...d.hourlyTempC),
    tempMinC: Math.min(...d.hourlyTempC),
    tempMeanC: sum(d.hourlyTempC) / d.hourlyTempC.length,
    degreeDays: degreeDaysFromHourly(d.hourlyTempC) ?? 0,
    normalDegreeDays: degreeDaysFromHourly(d.normalHourlyTempC) ?? 0,
  }));
  const perDay = rows.map((d) => d.degreeDays);
  const normal = sum(rows.map((d) => d.normalDegreeDays));
  return {
    days: rows,
    weeklyDegreeDays: sum(perDay),
    normalWeeklyDegreeDays: normal,
    factor: weatherFactor(perDay, normal),
    ...meta,
  };
}
