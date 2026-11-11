import { describe, expect, it } from "vitest";
import {
  degreeDaysFromHourly,
  errorPct,
  forecastRange,
  harvestDayShares,
  observedRange,
  roundKeepingTotal,
  splitByDay,
  sumRanges,
  weatherFactor,
  workersNeeded,
} from "./calc";

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

describe("forecastRange con meteorología", () => {
  it("con más calor madura más, sin pasar de los inmaduros que hay", () => {
    expect(forecastRange(1000, 500, 40, 1.25).kg).toBeCloseTo(1250);
    expect(forecastRange(1000, 500, 90, 1.5).kg).toBeCloseTo(1500);
  });

  it("con frío madura menos", () => {
    expect(forecastRange(1000, 500, 40, 0.5).kg).toBeCloseTo(1100);
  });
});

describe("degreeDaysFromHourly y weatherFactor", () => {
  it("cuenta hora a hora solo el calor por encima de la base", () => {
    expect(degreeDaysFromHourly(Array(24).fill(19))).toBeCloseTo(9);
    // 12 horas a 22 °C y 12 a 8 °C: las frías no restan, aunque la media diaria sea 15 °C.
    expect(degreeDaysFromHourly([...Array(12).fill(22), ...Array(12).fill(8)])).toBeCloseTo(6);
    expect(degreeDaysFromHourly(Array(24).fill(6))).toBe(0);
  });

  it("sin lecturas no inventa el dato", () => {
    expect(degreeDaysFromHourly([])).toBeNull();
    expect(degreeDaysFromHourly([Number.NaN])).toBeNull();
  });

  it("vale 1 en una semana normal y se limita en semanas extremas", () => {
    expect(weatherFactor([8, 8, 8, 8, 8, 8, 8], 56)).toBeCloseTo(1);
    expect(weatherFactor([30, 30, 30, 30, 30, 30, 30], 56)).toBe(1.5);
    expect(weatherFactor([0, 0, 0, 0, 0, 0, 0], 56)).toBe(0.5);
  });

  it("sin datos de tiempo no inventa un efecto", () => {
    expect(weatherFactor([], 56)).toBe(1);
    expect(weatherFactor([8, 8], 0)).toBe(1);
  });
});

describe("harvestDayShares", () => {
  it("lo que madura el fin de semana se recoge el lunes", () => {
    const shares = harvestDayShares([1, 1, 1, 1, 1, 1, 1]);
    expect(shares).toHaveLength(5);
    expect(shares[0]).toBeCloseTo(3 / 7);
    expect(shares[4]).toBeCloseTo(1 / 7);
    expect(shares.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });

  it("los días más cálidos reciben más", () => {
    const shares = harvestDayShares([5, 5, 5, 5, 5, 5, 10]);
    expect(shares[4]).toBeGreaterThan(shares[3]);
  });

  it("sin calor reparte por igual en vez de dividir entre cero", () => {
    expect(harvestDayShares([0, 0, 0, 0, 0, 0, 0])[1]).toBeCloseTo(1 / 7);
  });
});

describe("splitByDay", () => {
  it("reparte lo observado por zonas y la suma de los días es la previsión", () => {
    const observed = observedRange(1000);
    const forecast = forecastRange(1000, 500, 40);
    const days = splitByDay(observed, forecast, harvestDayShares([1, 1, 1, 1, 1, 1, 1]));
    expect(days[0].kg).toBeCloseTo(200 + 200 * (3 / 7));
    expect(days[1].kg).toBeCloseTo(200 + 200 / 7);
    expect(sumRanges(days).kg).toBeCloseTo(forecast.kg);
    expect(sumRanges(days).min).toBeCloseTo(forecast.min);
    expect(sumRanges(days).max).toBeCloseTo(forecast.max);
  });
});

describe("roundKeepingTotal", () => {
  it("redondea sin cambiar el total", () => {
    const values = [100.4, 100.4, 100.4, 100.4, 100.4];
    const rounded = roundKeepingTotal(values);
    expect(rounded.reduce((a, b) => a + b, 0)).toBe(502);
    expect(rounded.every(Number.isInteger)).toBe(true);
  });

  it("con un total dado lo reparte, aunque no sea el redondeo de la suma", () => {
    expect(roundKeepingTotal([1.5, 1.5, 1.5], 5)).toEqual([2, 2, 1]);
    expect(roundKeepingTotal([1.5, 1.5, 1.5], 4)).toEqual([2, 1, 1]);
    expect(roundKeepingTotal([3.3, 3.3, 3.4], 9)).toEqual([3, 3, 3]);
  });
});
