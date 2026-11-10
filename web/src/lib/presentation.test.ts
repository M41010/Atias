import { describe, expect, it } from "vitest";
import { buildRealReport } from "./api";
import { pilotSummary } from "./presentation";
import type { FieldData, FieldGreenhouse } from "./serverApi";
import { DEFAULT_PARAMS } from "./simulated";

const DAYS = ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20"];

const video = (lado: "A" | "B", maduros: number) => ({
  id: `1${lado}`,
  hilera: 1,
  lado,
  fileName: "v.mp4",
  sizeBytes: 1,
  status: "recibido" as const,
  receivedAt: "2026-11-14T10:00:00Z",
  calidad: { estado: "ok" as const, avisos: [] },
  conteo: {
    estado: "ok" as const,
    resultado: {
      detector: "rfdetr",
      maduros,
      frutos: maduros,
      tramos: [{ n: 1, maduros, clases: { rojo: maduros } }],
      posicion: "desplazamiento" as const,
      avisos: [],
    },
  },
});

const greenhouse = (extra: Partial<FieldGreenhouse> = {}): FieldGreenhouse => ({
  id: "inv-1",
  nombre: "Invernadero 1",
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
  videos: [video("A", 300), video("B", 280)],
  previsiones: { agricultor: [10, 10, 10, 10, 10], tecnico: [14, 14, 14, 14, 14] },
  real: [12, 12, 12, 12, 12],
  cosecha: { lunesViernes: null, inmediata: null },
  controles: [],
  ...extra,
});

const report = (g: FieldGreenhouse, id = "2026-W47", dias = DAYS) => {
  const field: FieldData = { id, etiqueta: "Recolección", dias, invernaderos: [g] };
  return buildRealReport(field, DEFAULT_PARAMS, new Map(), true);
};

describe("modo presentación", () => {
  it("sin kilos recogidos no hay nada que presentar", () => {
    expect(pilotSummary([report(greenhouse({ real: [null, null, null, null, null] }))])).toBeNull();
  });

  it("resume la semana: lo recogido, el error de cada previsión y quién se acercó más", () => {
    const summary = pilotSummary([report(greenhouse())]);
    expect(summary).not.toBeNull();
    const s = summary!;
    expect(s.realKg).toBe(60);
    expect(s.matureFruits).toBe(300);
    expect(s.days).toHaveLength(5);
    expect(s.days[0]).toMatchObject({ real: 12, agricultor: 10, tecnico: 14 });
    // Agricultor 50 frente a 60: 16,7 % de menos. Técnico 70: 16,7 % de más.
    expect(s.results.agricultor.errorPct).toBeCloseTo((10 / 60) * 100);
    expect(s.results.agricultor.biasPct).toBeCloseTo((-10 / 60) * 100);
    expect(s.results.tecnico.biasPct).toBeCloseTo((10 / 60) * 100);
    expect(s.weeksMeasured).toBe(1);
  });

  it("si Atias tiene hileras sin contar, no compara su cifra", () => {
    const s = pilotSummary([report(greenhouse({ hileras: 2 }))])!;
    expect(s.results.atias.errorPct).toBeNull();
    expect(s.days.every((d) => d.atias === null)).toBe(true);
  });

  it("elige la recolección más reciente con cosecha", () => {
    const older = report(greenhouse(), "2026-W46", ["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13"]);
    const newer = report(greenhouse({ real: [20, 20, 20, 20, 20] }));
    expect(pilotSummary([older, newer])!.realKg).toBe(100);
    expect(pilotSummary([newer, older])!.realKg).toBe(100);
  });
});
