import { describe, expect, it } from "vitest";
import { buildRow, countAt, estimate, ROW, scanAt } from "./counterModel";

describe("contador de la portada", () => {
  const row = buildRow();

  it("dibuja siempre la misma hilera: igual en el servidor y en el navegador", () => {
    expect(buildRow()).toEqual(row);
    expect(row.ripeTotal).toBeGreaterThan(60);
  });

  it("cuenta más frutos según avanza y todos al final", () => {
    const steps = [0, 0.25, 0.5, 0.75, 1].map((p) => countAt(row, p));
    expect(steps).toEqual([...steps].sort((a, b) => a - b));
    expect(steps[4]).toBe(row.ripeTotal);
    expect(scanAt(0)).toBeCloseTo(ROW.window / 2);
  });

  it("los kilos llevan su margen y los temporeros salen de los kilos", () => {
    const result = estimate(row.ripeTotal, row.ripeTotal);
    expect(result.min).toBeLessThan(result.kg);
    expect(result.max).toBeGreaterThan(result.kg);
    expect(result.workers).toBe(Math.ceil(result.kg / (ROW.kgPerWorkday * ROW.days)));
    expect(result.bandRight).toBeLessThanOrEqual(1);
    expect(estimate(0, row.ripeTotal).workers).toBe(0);
  });
});
