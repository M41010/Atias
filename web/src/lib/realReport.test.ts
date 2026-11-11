import { describe, expect, it } from "vitest";
import { buildRealReport, gramsPerFruit, realHileras } from "./api";
import { controlRows, controlSummary, evaluations, pairsFor, weekRows } from "./precision";
import type { FieldData, FieldGreenhouse } from "./serverApi";
import { DEFAULT_PARAMS } from "./simulated";

const DAYS = ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20"];

function video(hilera: number, lado: "A" | "B", tramos: { maduros: number; inmaduros: number }[]) {
  return {
    id: `${hilera}${lado}`,
    hilera,
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
        maduros: tramos.reduce((s, t) => s + t.maduros, 0),
        frutos: tramos.reduce((s, t) => s + t.maduros + t.inmaduros, 0),
        tramos: tramos.map((t, i) => ({ n: i + 1, maduros: t.maduros, clases: { rojo: t.maduros, inmaduro: t.inmaduros } })),
        posicion: "desplazamiento" as const,
        avisos: [],
      },
    },
  };
}

function greenhouse(extra: Partial<FieldGreenhouse> = {}): FieldGreenhouse {
  return {
    id: "inv-1",
    nombre: "Invernadero 1",
    cultivo: "tomate_cherry",
    familia: { id: "cherry_pera", nombre: "Cherry pera" },
    agricultor: "Antonio",
    tecnico: "Lucía",
    ubicacion: null,
    hileras: 2,
    tramos: 2,
    longitudHileraM: 50,
    variedad: "",
    muestra: { frutos: 50, gramos: 500 },
    videos: [
      video(1, "A", [{ maduros: 100, inmaduros: 50 }, { maduros: 200, inmaduros: 0 }]),
      video(1, "B", [{ maduros: 120, inmaduros: 10 }, { maduros: 150, inmaduros: 20 }]),
    ],
    previsiones: { agricultor: [10, 10, 10, 10, 10], tecnico: [null, null, null, null, null] },
    real: [12, 12, 12, 12, 12],
    cosecha: { lunesViernes: null, inmediata: null },
    controles: [],
    ...extra,
  };
}

const field = (g: FieldGreenhouse): FieldData => ({ id: "2026-W47", etiqueta: "Recolección 16–20 nov", dias: DAYS, invernaderos: [g] });

describe("kilos a partir del conteo real", () => {
  it("toma el lado que más ve en cada tramo y pasa frutos a kilos con el peso medido", () => {
    const { hileras } = realHileras(greenhouse(), 10);
    expect(hileras[0].tramos).toEqual([
      { n: 1, matureFruits: 120, observedKg: 1.2, immatureKg: 0.5 },
      { n: 2, matureFruits: 200, observedKg: 2, immatureKg: 0.2 },
    ]);
  });

  it("sin vídeo la hilera queda pendiente y se avisa una vez si faltan los dos lados", () => {
    const { hileras, warnings } = realHileras(greenhouse(), 10);
    expect(hileras[1].tramos).toBeNull();
    expect(warnings.filter((w) => w.hilera === 2).map((w) => w.message)).toEqual(["Faltan los vídeos de los dos lados: esta hilera no tiene kilos."]);
  });

  it("el peso sale de la muestra; si no, de lo recogido en los tramos; si no, es provisional", () => {
    expect(gramsPerFruit(greenhouse(), "cherry_pera")).toEqual({ grams: 10, source: "muestra" });
    const control = {
      etiqueta: "T1", hilera: 1, lado: "A" as const, inicioM: 0, finM: 5, visibles: 10, total: 12,
      recogidos: 20, pesoG: 240, nota: "", atias: { frutos: 9, motivo: null },
    };
    expect(gramsPerFruit(greenhouse({ muestra: null, controles: [control] }), "cherry_pera")).toEqual({ grams: 12, source: "control" });
    expect(gramsPerFruit(greenhouse({ muestra: null }), "cherry_pera").source).toBe("provisional");
  });

  it("el informe usa datos reales, no los simulados, y suma las previsiones humanas por semana", () => {
    const report = buildRealReport(field(greenhouse()), DEFAULT_PARAMS, new Map(), true);
    const g = report.greenhouses[0];
    expect(report.simulated).toBe(false);
    expect(report.isoWeek).toBe(47);
    expect(g.matureFruits).toBe(320);
    // 3,2 kg contados: se dan en kilos enteros, como se muestran.
    expect(g.observed.kg).toBe(3);
    expect(g.partial).toBe(true);
    expect(g.realKg).toBe(60);
    expect(g.farmerKg).toBe(50);
    expect(g.technicianKg).toBeNull();
    // Sin ubicación, el tiempo no cuenta y se reparte por igual; la suma de los días cuadra.
    expect(g.weather.source).toBe("sin_datos");
    expect(g.daily.reduce((s, d) => s + d.atias, 0)).toBe(Math.round(g.forecast.kg));
    expect(g.warnings.some((w) => w.message.startsWith("Sin ubicación"))).toBe(true);
  });

  it("los totales son la suma de lo que se ve: hileras, invernaderos, familias y días cuadran al kilo", () => {
    // Kilos con decimales en cada hilera, para que redondear cada parte por separado no cuadre.
    const side = (h: number, lado: "A" | "B", maduros: number) => video(h, lado, [{ maduros, inmaduros: 37 }]);
    const many = (id: string, base: number) =>
      greenhouse({
        id,
        nombre: id,
        hileras: 4,
        tramos: 1,
        videos: [1, 2, 3, 4].flatMap((h) => [side(h, "A", base + h * 13), side(h, "B", 0)]),
      });
    const data: FieldData = { ...field(greenhouse()), invernaderos: [many("inv-1", 1234), many("inv-2", 2345)] };
    const report = buildRealReport(data, DEFAULT_PARAMS, new Map(), true);
    const add = (values: number[]) => values.reduce((a, b) => a + b, 0);
    for (const g of report.greenhouses) {
      expect(add(g.hileras.map((h) => h.forecast?.kg ?? 0))).toBe(g.forecast.kg);
      expect(add(g.hileras.map((h) => h.observed?.kg ?? 0))).toBe(g.observed.kg);
      expect(add(g.daily.map((d) => d.atias))).toBe(g.forecast.kg);
      expect(Number.isInteger(g.forecast.min) && Number.isInteger(g.forecast.max)).toBe(true);
    }
    expect(add(report.greenhouses.map((g) => g.forecast.kg))).toBe(report.forecast.kg);
    expect(add(report.families.map((f) => f.forecast.kg))).toBe(report.forecast.kg);
    expect(add(report.dates.map((_, i) => add(report.greenhouses.map((g) => g.daily[i].atias))))).toBe(report.forecast.kg);
  });

  it("al abrir una hilera, sus tramos en kilos enteros suman lo que dice la hilera", () => {
    // Tres tramos de 1,5 kg: redondeados uno a uno serían 2 + 2 + 2 = 6 frente a los 5 de la hilera.
    const tramos = [1, 2, 3].map(() => ({ maduros: 150, inmaduros: 37 }));
    const g = greenhouse({ hileras: 1, tramos: 3, videos: [video(1, "A", tramos), video(1, "B", tramos)] });
    const [hilera] = buildRealReport(field(g), DEFAULT_PARAMS, new Map(), true).greenhouses[0].hileras;
    const add = (values: number[]) => values.reduce((a, b) => a + b, 0);
    for (const range of ["observed", "forecast"] as const) {
      for (const key of ["kg", "min", "max"] as const) {
        const parts = hilera.tramos.map((t) => t[range][key]);
        expect(parts.every(Number.isInteger)).toBe(true);
        expect(add(parts)).toBe(hilera[range]?.[key]);
      }
    }
    expect(hilera.observed?.kg).toBe(5);
  });
});

describe("captura en el informe real", () => {
  it("es cuándo se grabó y avisa de un vídeo de otra semana", () => {
    const [a, b] = greenhouse().videos;
    const g = greenhouse({
      videos: [
        { ...a, grabacion: { fecha: "2026-11-14T08:00:00Z", fuente: "metadatos" } },
        { ...b, grabacion: { fecha: "2026-11-07T08:00:00Z", fuente: "archivo" } },
      ],
    });
    const report = buildRealReport(field(g), DEFAULT_PARAMS, new Map(), true);
    const row = report.greenhouses[0];
    expect(row.capturedAt).toBe("2026-11-07T08:00:00Z");
    expect(row.captureFromRecording).toBe(true);
    expect(report.captureDates).toEqual(["2026-11-07T08:00:00Z", "2026-11-14T08:00:00Z"]);
    expect(row.warnings.filter((w) => w.message.startsWith("Grabado el")).map((w) => w.scope)).toEqual([
      "Invernadero 1 · Hilera 1 · Lado B",
    ]);
  });

  it("sin fecha de grabación usa la de llegada y lo marca", () => {
    const row = buildRealReport(field(greenhouse()), DEFAULT_PARAMS, new Map(), true).greenhouses[0];
    expect(row.capturedAt).toBe("2026-11-14T10:00:00Z");
    expect(row.captureFromRecording).toBe(false);
  });
});

describe("precisión", () => {
  const control = (visibles: number, total: number | null, atias: number | null) => ({
    etiqueta: `T${visibles}`, hilera: 1, lado: "A" as const, inicioM: 0, finM: 5, visibles, total,
    recogidos: null, pesoG: null, nota: "", atias: { frutos: atias, motivo: atias === null ? "sin_contar" as const : null },
  });

  it("compara cada previsión con lo recogido y dice quién se acercó más", () => {
    const report = buildRealReport(field(greenhouse()), DEFAULT_PARAMS, new Map(), true);
    const [row] = weekRows([report]);
    expect(row.realKg).toBe(60);
    expect(row.errorPct.agricultor).toBeCloseTo((10 / 60) * 100);
    expect(row.kg.tecnico).toBeNull();
  });

  it("con hileras sin contar, la cifra de Atias no se compara con la cosecha entera", () => {
    const report = buildRealReport(field(greenhouse()), DEFAULT_PARAMS, new Map(), true);
    expect(weekRows([report])[0]).toMatchObject({ partial: true, errorPct: { atias: null } });
    expect(pairsFor([report], "atias")).toHaveLength(0);
  });

  it("la semana en que se pesó la muestra calibra el peso: no cuenta para el veredicto de Atias", () => {
    const complete = greenhouse({ hileras: 1 });
    const report = buildRealReport(field(complete), DEFAULT_PARAMS, new Map(), true);
    expect(pairsFor([report], "atias")[0].outOfSample).toBe(false);
    expect(pairsFor([report], "agricultor")[0].outOfSample).toBe(true);
    expect(evaluations([report]).atias.verdict).toBe("sin_datos");
  });

  it("resume la detección y la fruta tapada de los tramos de control", () => {
    const report = buildRealReport(
      field(greenhouse({ controles: [control(20, 25, 18), control(30, 40, 27), control(10, null, null)] })),
      DEFAULT_PARAMS, new Map(), true,
    );
    const summary = controlSummary(controlRows([report]));
    expect(summary.tramos).toBe(3);
    // Atias cuenta 45 de los 50 visibles en los tramos ya contados.
    expect(summary.detectionPct).toBeCloseTo(90);
    // Se ven 50 de 65 maduros en los tramos con total.
    expect(summary.visibilityPct).toBeCloseTo((50 / 65) * 100);
  });
});
