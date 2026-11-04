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

/** Previsión: lo ya maduro más la parte de los inmaduros que madurará a tiempo. */
export function forecastRange(observedKg: number, immatureKg: number, ripeningPct: number): KgRange {
  const pct = Math.min(100, Math.max(0, ripeningPct)) / 100;
  const ripening = immatureKg * pct;
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
