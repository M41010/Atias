import { describe, expect, it } from "vitest";
import { biasPct, evaluate, type Pair, pairErrorPct, wapePct } from "./validation";

const pair = (estimatedKg: number, realKg: number, extra: Partial<Pair> = {}): Pair => ({
  greenhouse: "inv-1",
  week: "2026-W47",
  estimatedKg,
  realKg,
  comparable: true,
  simulated: false,
  outOfSample: true,
  ...extra,
});

describe("métricas de acierto", () => {
  it("calcula el error de una semana y lo deja vacío si no se recogió nada", () => {
    expect(pairErrorPct(pair(110, 100))).toBeCloseTo(10);
    expect(pairErrorPct(pair(10, 0))).toBeNull();
  });

  it("el WAPE pondera por kilos y el sesgo conserva el signo", () => {
    const pairs = [pair(110, 100), pair(900, 1000)];
    expect(wapePct(pairs)).toBeCloseTo((10 + 100) / 1100 * 100);
    expect(biasPct(pairs)).toBeCloseTo((10 - 100) / 1100 * 100);
  });
});

describe("veredicto", () => {
  it("sin semanas fuera de muestra no da cifras ni veredicto", () => {
    const result = evaluate([pair(100, 100, { outOfSample: false })]);
    expect(result.verdict).toBe("sin_datos");
    expect(result.wapePct).toBeNull();
    expect(result.excluded).toBe(1);
  });

  it("con datos simulados nunca dice que cumple", () => {
    const pairs = Array.from({ length: 10 }, () => pair(100, 100, { simulated: true }));
    expect(evaluate(pairs).verdict).toBe("simulado");
  });

  it("con pocas semanas no concluye aunque el error sea bajo", () => {
    expect(evaluate([pair(101, 100), pair(99, 100)]).verdict).toBe("insuficiente");
  });

  it("no mezcla estimaciones que no miden lo mismo que la cosecha", () => {
    const pairs = Array.from({ length: 8 }, () => pair(100, 100));
    pairs[0] = pair(100, 100, { comparable: false });
    expect(evaluate(pairs).verdict).toBe("no_comparable");
  });

  it("cumple solo si el extremo alto del intervalo queda por debajo del 10 %", () => {
    const good = Array.from({ length: 10 }, (_, i) => pair(100 + (i % 2 ? 3 : -3), 100));
    const result = evaluate(good);
    expect(result.verdict).toBe("cumple");
    expect(result.ci90Pct?.[1]).toBeLessThanOrEqual(10);
    expect(result.withinTargetPct).toBe(100);

    const bad = Array.from({ length: 10 }, (_, i) => pair(100 + (i % 2 ? 15 : -15), 100));
    expect(evaluate(bad).verdict).toBe("no_cumple");
  });
});
