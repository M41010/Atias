/**
 * Cuánto acierta una previsión, según docs/VALIDACION.md (misma lógica que src/atias/validation.py).
 * Unidad: un par (invernadero, semana) con kilos estimados y kilos pesados de verdad.
 * El veredicto es conservador: solo dice «cumple» con datos reales, comparables, fuera de muestra,
 * en cantidad suficiente y con el extremo alto del intervalo de confianza por debajo del objetivo.
 */

export const TARGET_PCT = 10;
/** Criterio confirmado por el usuario el 2026-11-10 (docs/VALIDACION.md). */
export const MIN_PAIRS = 8;

export type Pair = {
  greenhouse: string;
  week: string;
  estimatedKg: number;
  realKg: number;
  /** Estimación y cosecha miden lo mismo (p. ej. previsión lunes–viernes frente a lo recogido lunes–viernes). */
  comparable: boolean;
  simulated: boolean;
  /** No se usaron esos mismos datos para calibrar (peso medio, fruta tapada…). */
  outOfSample: boolean;
};

export type Verdict =
  | "sin_datos"
  | "simulado"
  | "no_comparable"
  | "insuficiente"
  | "no_cumple"
  | "cumple";

export const VERDICT_TEXT: Record<Verdict, string> = {
  sin_datos: "Aún no hay semanas que cuenten para el veredicto: hacen falta cosechas reales de semanas no usadas para calibrar.",
  simulado: "Datos simulados: este error comprueba el cálculo y no dice nada sobre la precisión real.",
  no_comparable: "Hay estimaciones que no miden lo mismo que la cosecha con la que se comparan.",
  insuficiente: `Datos reales insuficientes para concluir: hacen falta al menos ${MIN_PAIRS} semanas e invernaderos.`,
  no_cumple: "Con estos datos no se puede afirmar que se alcance el objetivo.",
  cumple: "Objetivo alcanzado en este piloto. No extrapolar a otros invernaderos, cultivos o formas de grabar sin validarlos.",
};

export type Evaluation = {
  verdict: Verdict;
  pairs: number;
  excluded: number;
  wapePct: number | null;
  ci90Pct: [number, number] | null;
  biasPct: number | null;
  p90Pct: number | null;
  withinTargetPct: number | null;
};

/** Error relativo de una semana, o null si no se recogió nada. */
export const pairErrorPct = (p: Pick<Pair, "estimatedKg" | "realKg">) =>
  p.realKg > 0 ? (Math.abs(p.estimatedKg - p.realKg) / p.realKg) * 100 : null;

/** Error ponderado por kilos: no se dispara con cosechas pequeñas. */
export function wapePct(pairs: Pick<Pair, "estimatedKg" | "realKg">[]): number | null {
  const real = pairs.reduce((s, p) => s + p.realKg, 0);
  if (!(real > 0)) return null;
  return (pairs.reduce((s, p) => s + Math.abs(p.estimatedKg - p.realKg), 0) / real) * 100;
}

/** Si se estima de más (positivo) o de menos (negativo). */
export function biasPct(pairs: Pick<Pair, "estimatedKg" | "realKg">[]): number | null {
  const real = pairs.reduce((s, p) => s + p.realKg, 0);
  if (!(real > 0)) return null;
  return (pairs.reduce((s, p) => s + (p.estimatedKg - p.realKg), 0) / real) * 100;
}

function percentile(sorted: number[], q: number): number {
  if (sorted.length === 1) return sorted[0];
  const position = (sorted.length - 1) * q;
  const low = Math.floor(position);
  const high = Math.ceil(position);
  return sorted[low] + (sorted[high] - sorted[low]) * (position - low);
}

/** Generador con semilla: el mismo resultado en cada carga. */
function seeded(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function evaluate(pairs: Pair[], { minPairs = MIN_PAIRS, boot = 2000, seed = 1 } = {}): Evaluation {
  const usable = pairs.filter((p) => p.realKg > 0 && p.outOfSample);
  const excluded = pairs.length - usable.length;
  const empty = { pairs: 0, excluded, wapePct: null, ci90Pct: null, biasPct: null, p90Pct: null, withinTargetPct: null };
  if (usable.length === 0) {
    return { verdict: pairs.some((p) => p.simulated) ? "simulado" : "sin_datos", ...empty };
  }
  const errors = usable.map((p) => pairErrorPct(p) as number).sort((a, b) => a - b);
  const random = seeded(seed);
  const samples = Array.from({ length: boot }, () => {
    const pick = usable.map(() => usable[Math.floor(random() * usable.length)]);
    return wapePct(pick) as number;
  }).sort((a, b) => a - b);
  const ci: [number, number] = [percentile(samples, 0.05), percentile(samples, 0.95)];

  let verdict: Verdict;
  if (usable.some((p) => p.simulated)) verdict = "simulado";
  else if (usable.some((p) => !p.comparable)) verdict = "no_comparable";
  else if (usable.length < minPairs) verdict = "insuficiente";
  else verdict = ci[1] <= TARGET_PCT ? "cumple" : "no_cumple";

  return {
    verdict,
    pairs: usable.length,
    excluded,
    wapePct: wapePct(usable),
    ci90Pct: ci,
    biasPct: biasPct(usable),
    p90Pct: percentile(errors, 0.9),
    withinTargetPct: (errors.filter((e) => e <= TARGET_PCT).length / errors.length) * 100,
  };
}
