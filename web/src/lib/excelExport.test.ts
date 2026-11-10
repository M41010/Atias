import { describe, expect, it } from "vitest";
import { buildRealReport } from "./api";
import { dailySheets, dayTotals, excelFileName, SIMULATED_NOTE, summarySheets } from "./excelExport";
import type { FieldGreenhouse } from "./serverApi";
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
    resultado: { detector: "rfdetr", maduros, frutos: maduros, tramos: [{ n: 1, maduros, clases: { rojo: maduros } }], posicion: "desplazamiento" as const, avisos: [] },
  },
});

const greenhouse = (id: string, extra: Partial<FieldGreenhouse> = {}): FieldGreenhouse => ({
  id,
  nombre: `Invernadero ${id}`,
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

const report = (...gs: FieldGreenhouse[]) =>
  buildRealReport({ id: "2026-W47", etiqueta: "Recolección 16–20 nov", dias: DAYS, invernaderos: gs }, DEFAULT_PARAMS, new Map(), true);

const flat = (rows: (string | number | null)[][]) => rows.map((r) => r.join("|")).join("\n");

describe("exportar a Excel", () => {
  it("el nombre del fichero dice qué es, de qué semana y si los datos son simulados", () => {
    const r = report(greenhouse("1"));
    expect(excelFileName("resumen", r)).toBe("atias-resumen-2026-W47.xlsx");
    expect(excelFileName("prevision-diaria", { ...r, simulated: true })).toBe("atias-prevision-diaria-2026-W47-datos-simulados.xlsx");
  });

  it("el resumen tiene tres hojas con números (no texto) y avisa arriba si son datos simulados", () => {
    const r = report(greenhouse("1"));
    const sheets = summarySheets(r);
    expect(sheets.map((s) => s.name)).toEqual(["Resumen", "Por familia", "Por invernadero"]);
    expect(flat(sheets[0].rows)).not.toContain(SIMULATED_NOTE);
    const forecast = sheets[0].rows.find((row) => row[0] === "Previsión para la venta (kg)");
    expect(typeof forecast?.[1]).toBe("number");
    const real = sheets[0].rows.find((row) => row[0] === "Recogido de lunes a viernes (kg)");
    expect(real?.[1]).toBe(60);

    for (const sheet of summarySheets({ ...r, simulated: true })) expect(sheet.rows[1][0]).toBe(SIMULATED_NOTE);
  });

  it("la hoja por invernadero incluye técnico, agricultor, previsión y lo recogido", () => {
    const sheet = summarySheets(report(greenhouse("1")))[2];
    const header = sheet.rows.find((row) => row[0] === "Invernadero") as (string | number | null)[];
    const row = sheet.rows.find((r) => r[0] === "Invernadero 1") as (string | number | null)[];
    expect(row[header.indexOf("Agricultor")]).toBe("Antonio");
    expect(row[header.indexOf("Técnico")]).toBe("Lucía");
    expect(row[header.indexOf("Previsión técnico (kg)")]).toBe(70);
    expect(row[header.indexOf("Recogido (kg)")]).toBe(60);
  });

  it("los totales por día solo suman el real si lo tienen todos los invernaderos", () => {
    const r = report(greenhouse("1"), greenhouse("2", { real: [null, 12, 12, 12, 12] }));
    const t = dayTotals(r.greenhouses, 5);
    expect(t.real[0]).toBeNull();
    expect(t.real[1]).toBe(24);
    expect(t.technician[0]).toBe(28);
  });

  it("la previsión diaria lleva familia, sus invernaderos y el total, con los filtros indicados", () => {
    const r = report(greenhouse("1"), greenhouse("2"));
    const [sheet] = dailySheets(r, r.greenhouses, { families: ["cherry_pera"], technicians: [] });
    const text = flat(sheet.rows);
    expect(text).toContain("Familias: Cherry pera · Técnicos: todos");
    const familyRow = sheet.rows.find((row) => row[0] === "Cherry pera" && row[1] === "Todos") as (string | number | null)[];
    const total = sheet.rows.find((row) => row[0] === "Total") as (string | number | null)[];
    // Lunes: R, Téc., Atias; y al final la semana.
    expect(familyRow.slice(2, 4)).toEqual([24, 28]);
    expect(total.slice(-3, -1)).toEqual([120, 140]);
    expect(sheet.rows.filter((row) => row[1] === "Invernadero 1" || row[1] === "Invernadero 2")).toHaveLength(2);
    // Cabecera: 2 columnas fijas + 5 días × 3 + semana × 3.
    const header = sheet.rows.find((row) => row[0] === "Familia") as (string | number | null)[];
    expect(header).toHaveLength(2 + 6 * 3);
    expect(sheet.widths).toHaveLength(header.length);
  });
});
