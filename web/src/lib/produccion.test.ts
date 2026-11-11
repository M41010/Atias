import { describe, expect, it } from "vitest";
import type { FamilyId, GreenhouseRow, HarvestReport } from "./api";
import { addKilos, atiasDeviation, presentFamilies, productionPeriods, realIncomplete, weekKilos } from "./produccion";

type Gh = { family: FamilyId; atias: number; real: number | null; technician?: number | null; partial?: boolean };

const row = (g: Gh): GreenhouseRow =>
  ({
    info: { family: g.family },
    forecast: { kg: g.atias, min: g.atias, max: g.atias },
    realKg: g.real,
    technicianKg: g.technician ?? null,
    partial: g.partial ?? false,
  }) as unknown as GreenhouseRow;

const report = (monday: string, isoWeek: number, gs: Gh[], empty = false): HarvestReport =>
  ({
    id: `2026-W${isoWeek}`,
    label: `Recolección ${monday}`,
    isoWeek,
    year: Number(monday.slice(0, 4)),
    dates: [monday],
    empty,
    greenhouses: gs.map(row),
  }) as unknown as HarvestReport;

describe("weekKilos", () => {
  it("suma lo recogido solo si todos los invernaderos lo tienen", () => {
    const week = weekKilos([
      row({ family: "padron", atias: 100, real: 90, technician: 80 }),
      row({ family: "padron", atias: 50, real: null, technician: 40 }),
    ]);
    expect(week).toMatchObject({ weeks: 1, atias: 150, real: null, realWeeks: 0, atiasMatched: 0, technician: 120 });
  });

  it("sin invernaderos no hay semana, no un cero", () => {
    expect(weekKilos([])).toBeNull();
  });

  it("marca la previsión parcial si falta alguna hilera por contar", () => {
    expect(weekKilos([row({ family: "padron", atias: 10, real: 9, partial: true })])?.atiasPartial).toBe(true);
  });
});

describe("addKilos", () => {
  it("suma lo recogido de las semanas que lo tienen y compara con la previsión de esas mismas semanas", () => {
    const a = weekKilos([row({ family: "padron", atias: 100, real: 80 })])!;
    const b = weekKilos([row({ family: "padron", atias: 200, real: null })])!;
    const month = addKilos([a, b]);
    expect(month).toMatchObject({ weeks: 2, real: 80, realWeeks: 1, atias: 300, atiasMatched: 100, technician: null });
    expect(realIncomplete(month)).toBe(true);
    expect(atiasDeviation(month)).toBeCloseTo(25);
  });

  it("sin ningún dato real, lo recogido queda vacío y no hay desviación", () => {
    const k = addKilos([weekKilos([row({ family: "padron", atias: 100, real: null })])!]);
    expect(k.real).toBeNull();
    expect(atiasDeviation(k)).toBeNull();
    expect(realIncomplete(k)).toBe(false);
  });
});

describe("productionPeriods", () => {
  const reports = [
    // Desordenadas a propósito: salen en orden de tiempo.
    report("2026-11-02", 45, [{ family: "padron", atias: 300, real: null }, { family: "snack", atias: 50, real: null }]),
    // Lunes 28 de septiembre: la semana entera cuenta en septiembre, aunque acabe en octubre.
    report("2026-09-28", 40, [{ family: "padron", atias: 100, real: 110, technician: 90 }]),
    report("2026-10-19", 43, [{ family: "padron", atias: 200, real: 180, technician: 210 }, { family: "snack", atias: 40, real: 44 }]),
    report("2026-10-26", 44, [], true),
  ];

  it("por semana: una fila por recolección con capturas, en orden", () => {
    const weeks = productionPeriods(reports, "semana");
    expect(weeks.map((p) => p.short)).toEqual(["S40", "S43", "S45"]);
    expect(weeks[1].total).toMatchObject({ real: 224, atias: 240, technician: null });
    expect(weeks[1].families.map((f) => [f.family, f.kilos.real])).toEqual([["padron", 180], ["snack", 44]]);
  });

  it("por mes: el mes del lunes, y los totales suman lo mismo que las semanas", () => {
    const months = productionPeriods(reports, "mes");
    expect(months.map((p) => [p.key, p.label])).toEqual([
      ["2026-09", "Septiembre de 2026"],
      ["2026-10", "Octubre de 2026"],
      ["2026-11", "Noviembre de 2026"],
    ]);
    const weeks = productionPeriods(reports, "semana");
    const total = (ps: typeof months) => ps.reduce((s, p) => s + p.total.atias, 0);
    expect(total(months)).toBe(total(weeks));
  });

  it("por año: suma las semanas con lo recogido y dice cuántas son", () => {
    const [year] = productionPeriods(reports, "año");
    expect(year).toMatchObject({ key: "2026", label: "2026" });
    expect(year.total).toMatchObject({ weeks: 3, realWeeks: 2, real: 334, atias: 690, atiasMatched: 340, technicianWeeks: 1, technician: 90 });
    const padron = year.families.find((f) => f.family === "padron")!;
    expect(padron.kilos).toMatchObject({ weeks: 3, realWeeks: 2, real: 290, atias: 600, technician: 300, technicianWeeks: 2 });
  });

  it("filtra por familia: una familia ausente en una semana no cuenta esa semana", () => {
    const snack = productionPeriods(reports, "semana", ["snack"]);
    expect(snack.map((p) => p.short)).toEqual(["S43", "S45"]);
    expect(snack.every((p) => p.families.length === 1 && p.families[0].family === "snack")).toBe(true);
  });

  it("sin recolecciones no hay periodos", () => {
    expect(productionPeriods([], "mes")).toEqual([]);
  });

  it("lista las familias presentes en el orden de la empresa", () => {
    expect(presentFamilies(reports)).toEqual(["padron", "snack"]);
  });
});
