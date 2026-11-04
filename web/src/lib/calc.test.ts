import { describe, expect, it } from "vitest";
import { errorPct, forecastRange, observedRange, sumRanges, workersNeeded } from "./calc";

describe("forecastRange", () => {
  it("suma a lo observado la parte de inmaduros que madura", () => {
    expect(forecastRange(1000, 500, 40).kg).toBeCloseTo(1200);
  });

  it("con 0 % de maduración coincide con lo observado", () => {
    expect(forecastRange(1000, 500, 0)).toEqual(observedRange(1000));
  });

  it("limita porcentajes fuera de rango", () => {
    expect(forecastRange(1000, 500, 150).kg).toBeCloseTo(1500);
    expect(forecastRange(1000, 500, -10).kg).toBeCloseTo(1000);
  });

  it("es más incierta que lo observado", () => {
    const observed = observedRange(1000);
    const forecast = forecastRange(1000, 500, 40);
    expect(forecast.max - forecast.min).toBeGreaterThan(observed.max - observed.min);
  });
});

describe("workersNeeded", () => {
  it("redondea hacia arriba", () => {
    expect(workersNeeded(2310, 180, 4)).toBe(4);
    expect(workersNeeded(720, 180, 4)).toBe(1);
    expect(workersNeeded(721, 180, 4)).toBe(2);
  });

  it("no necesita a nadie si no hay kilos", () => {
    expect(workersNeeded(0, 180, 4)).toBe(0);
  });

  it("no inventa un resultado con datos inválidos", () => {
    expect(workersNeeded(100, 0, 4)).toBeNull();
    expect(workersNeeded(100, 180, 0)).toBeNull();
    expect(workersNeeded(100, Number.NaN, 4)).toBeNull();
    expect(workersNeeded(Number.NaN, 180, 4)).toBeNull();
  });
});

describe("sumRanges", () => {
  it("suma las anchuras porque los errores no se compensan", () => {
    const total = sumRanges([observedRange(100), observedRange(100)]);
    expect(total.kg).toBeCloseTo(200);
    expect(total.max - total.min).toBeCloseTo(36);
  });
});

describe("errorPct", () => {
  it("calcula el error relativo", () => {
    expect(errorPct(90, 100)).toBeCloseTo(10);
    expect(errorPct(110, 100)).toBeCloseTo(10);
  });

  it("no calcula sin cosecha real", () => {
    expect(errorPct(90, 0)).toBeNull();
  });
});
