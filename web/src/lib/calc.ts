/** Cálculos de la app. Son funciones puras para poder probarlas y auditarlas. */

export type KgRange = { kg: number; min: number; max: number };

/** Incertidumbre SIMULADA de lo observado. La real saldrá de medir frente a cosecha. */
export const OBSERVED_REL_ERROR = 0.09;
/** Incertidumbre SIMULADA del porcentaje de maduración indicado a mano. */
export const RIPENING_REL_ERROR = 0.4;

export function observedRange(observedKg: number): KgRange {
  return {
    kg: observedKg,
    min: observedKg * (1 - OBSERVED_REL_ERROR),
    max: observedKg * (1 + OBSERVED_REL_ERROR),
  };
}

/** Previsión: lo ya maduro más la parte de los inmaduros que madurará a tiempo, corregida por el tiempo. */
export function forecastRange(observedKg: number, immatureKg: number, ripeningPct: number, factor: number = 1): KgRange {
  const pct = Math.min(100, Math.max(0, ripeningPct)) / 100;
  // El tiempo acelera o frena la maduración, pero nunca madura más de lo que hay.
  const ripening = Math.min(immatureKg, immatureKg * pct * Math.max(0, factor));
  const observed = observedRange(observedKg);
  return {
    kg: observedKg + ripening,
    min: observed.min + ripening * (1 - RIPENING_REL_ERROR),
    max: observed.max + ripening * (1 + RIPENING_REL_ERROR),
  };
}

/**
 * Personas necesarias, redondeando hacia arriba porque no se contrata media persona.
 * Sin rendimiento o sin días válidos no hay cálculo posible: devuelve null, nunca 0.
 */
export function workersNeeded(kg: number, kgPerWorkday: number, days: number): number | null {
  if (!(kgPerWorkday > 0) || !(days > 0) || !Number.isFinite(kg) || kg < 0) return null;
  return Math.ceil(kg / (kgPerWorkday * days));
}

/** Suma rangos con errores sistemáticos compartidos: las anchuras se suman, no se compensan. */
export function sumRanges(ranges: KgRange[]): KgRange {
  return ranges.reduce(
    (total, r) => ({ kg: total.kg + r.kg, min: total.min + r.min, max: total.max + r.max }),
    { kg: 0, min: 0, max: 0 },
  );
}

/** Error relativo en %, o null si no hubo cosecha con la que comparar. */
export function errorPct(estimatedKg: number, realKg: number): number | null {
  return realKg > 0 ? (Math.abs(estimatedKg - realKg) / realKg) * 100 : null;
}

// ---- Previsión diaria y meteorología ----

/** Temperatura base de los grados-día. SIMULADA: se ajustará por familia con datos reales. */
export const BASE_TEMP_C = 10;
/** Límites del factor meteorológico, para que un dato raro no dispare la previsión. */
export const WEATHER_FACTOR_MIN = 0.5;
export const WEATHER_FACTOR_MAX = 1.5;

/**
 * Grados-día de un día a partir de lecturas por hora: la temperatura cambia a lo largo del día,
 * así que se suma el calor útil de cada hora por encima de la base y se divide entre las horas.
 * Sin lecturas devuelve null: no se inventa el dato.
 */
export function degreeDaysFromHourly(hourlyTempC: number[], baseC: number = BASE_TEMP_C): number | null {
  const valid = hourlyTempC.filter(Number.isFinite);
  if (valid.length === 0) return null;
  return valid.reduce((sum, t) => sum + Math.max(0, t - baseC), 0) / valid.length;
}

/**
 * Cuánto más o menos madura la fruta que en una semana normal: con más calor, más deprisa.
 * La referencia es la normal de esa semana en ese lugar (media de años anteriores).
 * Devuelve 1 si no hay datos de tiempo, para no inventar un efecto.
 */
export function weatherFactor(weeklyDegreeDays: number[], reference: number): number {
  const total = weeklyDegreeDays.reduce((sum, d) => sum + d, 0);
  if (weeklyDegreeDays.length === 0 || !(reference > 0) || !Number.isFinite(total)) return 1;
  return Math.min(WEATHER_FACTOR_MAX, Math.max(WEATHER_FACTOR_MIN, total / reference));
}

/**
 * Parte de la maduración de la semana que cae en cada día de recolección, de lunes a viernes.
 * Recibe los grados-día de sábado a viernes: lo que madura el sábado y el domingo se recoge el lunes.
 */
export function harvestDayShares(degreeDaysSatToFri: number[]): number[] {
  if (degreeDaysSatToFri.length !== 7) throw new Error("Hacen falta los 7 días, de sábado a viernes");
  const total = degreeDaysSatToFri.reduce((sum, d) => sum + d, 0);
  const days = total > 0 ? degreeDaysSatToFri : degreeDaysSatToFri.map(() => 1);
  const sum = total > 0 ? total : 7;
  const [sat, sun, mon, ...rest] = days;
  return [sat + sun + mon, ...rest].map((d) => d / sum);
}

/**
 * Reparte la previsión de la semana entre lunes y viernes. Cada día se recoge una zona del invernadero,
 * así que lo ya maduro al grabar se reparte a partes iguales; lo que madura después, según el calor
 * de cada día.
 */
export function splitByDay(observed: KgRange, forecast: KgRange, shares: number[]): KgRange[] {
  const ripening = { kg: forecast.kg - observed.kg, min: forecast.min - observed.min, max: forecast.max - observed.max };
  const zone = 1 / shares.length;
  return shares.map((share) => ({
    kg: observed.kg * zone + ripening.kg * share,
    min: observed.min * zone + ripening.min * share,
    max: observed.max * zone + ripening.max * share,
  }));
}

/** Redondea a enteros sin que cambie la suma: el total del día cuadra con el de la semana. */
export function roundKeepingTotal(values: number[]): number[] {
  const floors = values.map(Math.floor);
  let missing = Math.round(values.reduce((a, b) => a + b, 0)) - floors.reduce((a, b) => a + b, 0);
  const order = values.map((v, i) => ({ i, rest: v - Math.floor(v) })).sort((a, b) => b.rest - a.rest);
  for (const { i } of order) {
    if (missing <= 0) break;
    floors[i] += 1;
    missing -= 1;
  }
  return floors;
}
