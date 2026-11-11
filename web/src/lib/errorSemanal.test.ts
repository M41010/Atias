import { describe, expect, it } from "vitest";
import type { GramsSource, HarvestReport } from "./api";
import { errorAxis, weeklyError } from "./errorSemanal";

type Gh = {
  id?: string;
  real: number | null;
  atias: number;
  farmer?: number | null;
  tech?: number | null;
  partial?: boolean;
  source?: GramsSource;
};

// Solo los campos que leen los cálculos de precisión.
const report = (isoWeek: number, greenhouses: Gh[], year = 2026) =>
  ({
    id: `${year}-W${isoWeek}`,
    isoWeek,
    year,
    simulated: false,
    greenhouses: greenhouses.map((g, i) => ({
      info: { id: g.id ?? `inv-${i + 1}` },
      realKg: g.real,
      forecast: { kg: g.atias },
      farmerKg: g.farmer ?? null,
      technicianKg: g.tech ?? null,
      partial: g.partial ?? false,
      gramsSource: g.source ?? "parametros",
    })),
  }) as unknown as HarvestReport;

describe("error semana a semana", () => {
  it("pondera por kilos dentro de cada semana y ordena las semanas", () => {
    const data = weeklyError([
      report(45, [{ real: 100, atias: 110, farmer: 80 }, { real: 300, atias: 270, farmer: 300 }]),
      report(44, [{ real: 200, atias: 210, farmer: 150, tech: 220 }]),
    ]);
    expect(data.weeks.map((w) => w.label)).toEqual(["Sem. 44", "Sem. 45"]);
    expect(data.enough).toBe(true);
    // Semana 45: Atias (10 + 30) / 400 = 10 %. Agricultor 20 / 400 = 5 %, no la media de 20 % y 0 %.
    expect(data.series.atias[1]).toMatchObject({ errorPct: 10, greenhouses: 2, counts: true });
    expect(data.series.agricultor[1]?.errorPct).toBeCloseTo(5);
    expect(data.series.agricultor[0]?.errorPct).toBeCloseTo(25);
    expect(data.series.tecnico[0]?.errorPct).toBeCloseTo(10);
    // El técnico no dio previsión la semana 45: hueco, no cero.
    expect(data.series.tecnico[1]).toBeNull();
  });

  it("ordena por año antes que por semana", () => {
    const data = weeklyError([report(1, [{ real: 10, atias: 10 }], 2027), report(52, [{ real: 10, atias: 10 }], 2026)]);
    expect(data.weeks.map((w) => w.harvestId)).toEqual(["2026-W52", "2027-W1"]);
  });

  it("marca las semanas usadas para calibrar el peso: no cuentan para el veredicto de Atias", () => {
    const data = weeklyError([
      report(44, [{ real: 100, atias: 105, farmer: 90, source: "muestra" }, { real: 100, atias: 100 }]),
      report(45, [{ real: 100, atias: 95, farmer: 90 }]),
    ]);
    expect(data.series.atias[0]).toMatchObject({ greenhouses: 2, calibrated: 1, counts: false });
    expect(data.series.atias[1]?.counts).toBe(true);
    // Las previsiones humanas no se calibran: siempre cuentan.
    expect(data.series.agricultor[0]).toMatchObject({ calibrated: 0, counts: true });
  });

  it("deja fuera los invernaderos con hileras sin contar y marca la semana como parcial", () => {
    const data = weeklyError([
      report(44, [{ real: 100, atias: 40, partial: true }, { real: 100, atias: 110 }]),
      report(45, [{ real: 100, atias: 30, farmer: 100, partial: true }]),
    ]);
    // Solo entra el invernadero completo: 10 %, no la media cosecha del parcial.
    expect(data.series.atias[0]).toMatchObject({ errorPct: 10, greenhouses: 1, leftOut: 1, counts: false });
    // Sin ningún invernadero completo, Atias no tiene punto; la semana sigue por el agricultor.
    expect(data.series.atias[1]).toBeNull();
    expect(data.series.agricultor[1]?.errorPct).toBe(0);
    expect(data.weeks).toHaveLength(2);
  });

  it("con menos de dos semanas no hay evolución que mostrar", () => {
    expect(weeklyError([])).toMatchObject({ weeks: [], enough: false });
    expect(weeklyError([report(45, [{ real: 100, atias: 90 }])]).enough).toBe(false);
    // Una semana sin kilos recogidos no cuenta como semana.
    expect(weeklyError([report(45, [{ real: 100, atias: 90 }]), report(46, [{ real: null, atias: 90 }])]).enough).toBe(false);
    // Ni una con todo parcial y sin previsiones humanas: no hay ningún punto.
    expect(weeklyError([report(45, [{ real: 100, atias: 90 }]), report(46, [{ real: 100, atias: 20, partial: true }])]).weeks).toHaveLength(1);
  });

  it("el eje deja ver siempre el objetivo y redondea a pasos limpios", () => {
    expect(errorAxis([], 10)).toEqual({ max: 20, ticks: [0, 5, 10, 15, 20] });
    expect(errorAxis([4, 23], 10).max).toBe(25);
    expect(errorAxis([48], 10)).toEqual({ max: 60, ticks: [0, 10, 20, 30, 40, 50, 60] });
  });
});
