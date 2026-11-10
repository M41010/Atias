import { describe, expect, it } from "vitest";
import { buildRealReport } from "./api";
import type { FieldGreenhouse } from "./serverApi";
import { DEFAULT_PARAMS } from "./simulated";
import { reportDays, weekAccuracy } from "./weeklyReport";

const DAYS = ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20"];

const greenhouse = (id: string, extra: Partial<FieldGreenhouse> = {}): FieldGreenhouse => ({
  id,
  nombre: id,
  cultivo: "tomate_cherry",
  familia: { id: "cherry_pera", nombre: "Cherry pera" },
  agricultor: "Antonio",
  tecnico: "Lucía",
  ubicacion: null,
  hileras: 1,
  tramos: 1,
  longitudHileraM: 50,
  variedad: "",
  muestra: { frutos: 50, gramos: 500 },
  videos: [],
  previsiones: { agricultor: [10, 10, 10, 10, 10], tecnico: [14, 14, 14, 14, 14] },
  real: [12, 12, 12, 12, 12],
  cosecha: { lunesViernes: null, inmediata: null },
  controles: [],
  ...extra,
});

const report = (...gs: FieldGreenhouse[]) =>
  buildRealReport({ id: "2026-W47", etiqueta: "Recolección", dias: DAYS, invernaderos: gs }, DEFAULT_PARAMS, new Map(), true);

describe("informe semanal", () => {
  it("suma cada día lo recogido y las previsiones de todos los invernaderos", () => {
    const days = reportDays(report(greenhouse("a"), greenhouse("b")));
    expect(days).toHaveLength(5);
    expect(days[0]).toMatchObject({ date: "2026-11-16", real: 24, tecnico: 28, agricultor: 20 });
  });

  it("no suma un dato si falta en algún invernadero", () => {
    const days = reportDays(report(greenhouse("a"), greenhouse("b", { real: [null, 12, 12, 12, 12] })));
    expect(days[0].real).toBeNull();
    expect(days[1].real).toBe(24);
  });

  it("sin cosecha no hay error que mostrar; con cosecha, el de cada previsión", () => {
    expect(weekAccuracy(report(greenhouse("a", { real: [null, null, null, null, null] })))).toBeNull();
    const accuracy = weekAccuracy(report(greenhouse("a")))!;
    expect(accuracy.agricultor.errorPct).toBeCloseTo((10 / 60) * 100);
    expect(accuracy.tecnico.biasPct).toBeCloseTo((10 / 60) * 100);
  });
});
