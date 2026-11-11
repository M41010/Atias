import { describe, expect, it } from "vitest";
import writeXlsxFile from "write-excel-file/node";
import {
  buildWrites,
  countStatuses,
  greenhouseKey,
  matchDay,
  matchGreenhouse,
  parseKg,
  parsePaste,
  planImport,
  planPaste,
  planSignature,
  readTable,
  TEMPLATE_COLUMNS,
  templateSheets,
  verifyWrites,
} from "./kilosImport";
import type { FieldData, FieldGreenhouse } from "./serverApi";
import { parseCsv, readXlsx } from "./xlsxRead";

const DAYS = ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20"];

const greenhouse = (id: string, nombre: string, extra: Partial<FieldGreenhouse> = {}): FieldGreenhouse => ({
  id,
  nombre,
  cultivo: "tomate_cherry",
  familia: null,
  agricultor: null,
  tecnico: null,
  ubicacion: null,
  hileras: 4,
  tramos: 1,
  longitudHileraM: null,
  variedad: "",
  muestra: null,
  videos: [],
  previsiones: { agricultor: [null, null, null, null, null], tecnico: [null, null, null, null, null] },
  real: [null, null, null, null, null],
  realOrigen: [null, null, null, null, null],
  cosecha: { lunesViernes: null, inmediata: null },
  controles: [],
  ...extra,
});

const field = (invernaderos: FieldGreenhouse[]): FieldData => ({ id: "rec-47", etiqueta: "Recolección 47", dias: DAYS, invernaderos });

const ok = (value: number | null) => ({ ok: true, value });

describe("parseKg", () => {
  it("lee kilos a la española", () => {
    expect(parseKg("1.234,5")).toEqual(ok(1234.5));
    expect(parseKg("1234,5")).toEqual(ok(1234.5));
    expect(parseKg("1.234")).toEqual(ok(1234));
    expect(parseKg("1.234.567")).toEqual(ok(1234567));
    expect(parseKg("12,25 kg")).toEqual(ok(12.25));
    expect(parseKg(" 850 ")).toEqual(ok(850));
    expect(parseKg("1 234,5")).toEqual(ok(1234.5));
  });

  it("acepta punto decimal y comas de miles cuando no hay duda", () => {
    expect(parseKg("12.5")).toEqual(ok(12.5));
    expect(parseKg("1,234.5")).toEqual(ok(1234.5));
    expect(parseKg("1,234,567")).toEqual(ok(1234567));
    expect(parseKg(850.75)).toEqual(ok(850.75));
  });

  it("toma vacío, guion y raya como sin dato", () => {
    for (const empty of [null, undefined, "", "  ", "-", "—"]) expect(parseKg(empty)).toEqual(ok(null));
  });

  it("rechaza negativos, texto y números mal escritos", () => {
    expect(parseKg("-5")).toEqual({ ok: false, reason: "negativo" });
    expect(parseKg("(5)")).toEqual({ ok: false, reason: "negativo" });
    expect(parseKg("120-")).toEqual({ ok: false, reason: "negativo" });
    expect(parseKg(-1)).toEqual({ ok: false, reason: "negativo" });
    expect(parseKg("abc").ok).toBe(false);
    expect(parseKg("1.2.3").ok).toBe(false);
    expect(parseKg("1,2,3").ok).toBe(false);
    expect(parseKg("1.23,4.5").ok).toBe(false);
    expect(parseKg("12,").ok).toBe(false);
    expect(parseKg(20_000_000)).toEqual({ ok: false, reason: "demasiado grande" });
  });
});

describe("matchDay", () => {
  it("lee fechas de la semana en varios formatos", () => {
    expect(matchDay("16/11/2026", DAYS)).toEqual({ ok: true, index: 0 });
    expect(matchDay("17-11-26", DAYS)).toEqual({ ok: true, index: 1 });
    expect(matchDay("2026-11-18", DAYS)).toEqual({ ok: true, index: 2 });
    expect(matchDay("2026-11-18T00:00:00", DAYS)).toEqual({ ok: true, index: 2 });
    expect(matchDay("19/11", DAYS)).toEqual({ ok: true, index: 3 });
    // 20/11/2026 en número de serie de Excel.
    expect(matchDay(46346, DAYS)).toEqual({ ok: true, index: 4 });
  });

  it("acepta el nombre del día", () => {
    expect(matchDay("Lunes", DAYS)).toEqual({ ok: true, index: 0 });
    expect(matchDay("miércoles", DAYS)).toEqual({ ok: true, index: 2 });
    expect(matchDay("VIE", DAYS)).toEqual({ ok: true, index: 4 });
  });

  it("avisa de fechas fuera de la semana, fines de semana y fechas imposibles", () => {
    expect(matchDay("21/11/2026", DAYS)).toMatchObject({ ok: false, reason: expect.stringContaining("fuera de la semana") });
    expect(matchDay("09/11/2026", DAYS).ok).toBe(false);
    expect(matchDay("sábado", DAYS)).toMatchObject({ ok: false, reason: expect.stringContaining("fuera de lunes a viernes") });
    expect(matchDay("31/02/2026", DAYS).ok).toBe(false);
    expect(matchDay("mañana", DAYS).ok).toBe(false);
    expect(matchDay(null, DAYS)).toEqual({ ok: false, reason: "Falta la fecha" });
  });
});

describe("matchGreenhouse", () => {
  const list = [greenhouse("inv-1", "Invernadero 1"), greenhouse("inv-10", "Invernadero 10"), greenhouse("inv-3", "Invernadero 3")];

  it("reconoce el nombre aunque se escriba distinto", () => {
    expect(greenhouseKey("Invernadero 01")).toBe("1");
    for (const text of ["Invernadero 1", "invernadero 1", "inv 1", "Inv. 1", "INV-01", "1", "inv-1", "Nº 1"]) {
      expect(matchGreenhouse(text, list)).toMatchObject({ ok: true, greenhouse: { id: "inv-1" } });
    }
    expect(matchGreenhouse("10", list)).toMatchObject({ ok: true, greenhouse: { id: "inv-10" } });
  });

  it("no adivina: desconocidos y ambiguos son error", () => {
    expect(matchGreenhouse("Invernadero 7", list)).toMatchObject({ ok: false, reason: expect.stringContaining("No hay") });
    expect(matchGreenhouse("", list)).toEqual({ ok: false, reason: "Falta el invernadero" });
    const twins = [greenhouse("a", "Invernadero 1"), greenhouse("b", "Nave 1")];
    expect(matchGreenhouse("1", twins)).toMatchObject({ ok: false, reason: expect.stringContaining("puede ser") });
    expect(matchGreenhouse("Nave 1", twins)).toMatchObject({ ok: true, greenhouse: { id: "b" } });
  });
});

describe("readTable", () => {
  it("lee la plantilla, con un título encima y una columna que no usa", () => {
    const rows = [
      ["Kilos de la semana 47"],
      [],
      [...TEMPLATE_COLUMNS, "Observaciones"],
      ["Invernadero 1", "16/11/2026", "lunes", "1.200,5", null, "1000", "ok"],
      [null, null, null, null, null, null],
      ["inv 3", null, "martes", 300, 280, null],
    ];
    const read = readTable(rows, DAYS);
    expect(read).toMatchObject({ ok: true, format: "filas", ignored: ["Observaciones"] });
    if (!read.ok) return;
    expect(read.entries).toEqual([
      { line: 4, greenhouse: "Invernadero 1", day: "16/11/2026", values: { real: "1.200,5", tecnico: null, agricultor: "1000" } },
      { line: 6, greenhouse: "inv 3", day: "martes", values: { real: 300, tecnico: 280, agricultor: null } },
    ]);
  });

  it("entiende cabeceras de un ERP con otros nombres", () => {
    const read = readTable([["Fecha albarán", "Nave", "Kilos netos"], ["16/11/2026", "1", "500"]], DAYS);
    expect(read).toMatchObject({ ok: true, entries: [{ greenhouse: "1", day: "16/11/2026", values: { real: "500" } }] });
  });

  it("lee una fila por invernadero con columnas de lunes a viernes", () => {
    const rows = [
      ["Invernadero", "Dato", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Total"],
      ["Invernadero 1", "Recogido", 100, 110, null, null, null, 210],
      ["Invernadero 1", "Previsión técnico", 90, null, null, null, null, 90],
      ["Invernadero 1", "Otra cosa", 1, null, null, null, null, 1],
    ];
    const read = readTable(rows, DAYS);
    expect(read).toMatchObject({ ok: true, format: "columnas", ignored: ["Total"] });
    if (!read.ok) return;
    expect(read.entries.filter((e) => Object.values(e.values)[0] !== null && !e.problem)).toEqual([
      { line: 2, greenhouse: "Invernadero 1", day: "Lunes", values: { real: 100 } },
      { line: 2, greenhouse: "Invernadero 1", day: "Martes", values: { real: 110 } },
      { line: 3, greenhouse: "Invernadero 1", day: "Lunes", values: { tecnico: 90 } },
    ]);
    expect(read.entries.find((e) => e.problem)).toMatchObject({ line: 4, problem: expect.stringContaining("Otra cosa") });
  });

  it("explica qué falta si no reconoce la cabecera", () => {
    expect(readTable([["a", "b"], [1, 2]], DAYS)).toMatchObject({ ok: false, error: expect.stringContaining("Invernadero") });
    expect(readTable([["Invernadero", "Fecha", "Notas"]], DAYS)).toMatchObject({ ok: false, error: expect.stringContaining("columna de kilos") });
    expect(readTable([["Invernadero", "Lunes", "Martes"]], DAYS)).toMatchObject({ ok: false, error: expect.stringContaining("Dato") });
  });
});

describe("planImport", () => {
  const data = field([
    greenhouse("inv-1", "Invernadero 1", {
      real: [500, 100, null, null, null],
      realOrigen: ["erp", "manual", null, null, null],
      previsiones: { agricultor: [null, null, null, null, null], tecnico: [80, null, null, null, null] },
    }),
    greenhouse("inv-2", "Invernadero 2"),
  ]);
  const entry = (line: number, greenhouseName: string, day: string | number | null, values: Record<string, string | number | null>) =>
    ({ line, greenhouse: greenhouseName, day, values });

  it("separa lo nuevo, lo igual, lo que cambiaría, lo del ERP y los errores", () => {
    const rows = planImport([
      entry(2, "inv 1", "16/11/2026", { real: "600", tecnico: "80" }),
      entry(3, "1", "martes", { real: "120" }),
      entry(4, "Invernadero 2", "miércoles", { real: "1.000,5", agricultor: "-3" }),
      entry(5, "Invernadero 9", "16/11/2026", { real: "5" }),
      entry(6, "inv 2", "21/11/2026", { real: "5" }),
      entry(7, "inv 2", "jueves", { real: null, tecnico: "" }),
    ], data);
    expect(rows.map((r) => [r.lines[0], r.series, r.status])).toEqual([
      [2, "real", "erp"],
      [2, "tecnico", "igual"],
      [3, "real", "cambia"],
      [4, "agricultor", "error"],
      [4, "real", "nuevo"],
      [5, null, "error"],
      [6, null, "error"],
    ]);
    expect(rows[2]).toMatchObject({ before: 100, kg: 120, message: "Cambia 100 por 120." });
    expect(rows[3].message).toContain("negativo");
    expect(rows[4]).toMatchObject({ kg: 1000.5, before: null });
    expect(countStatuses(rows)).toEqual({ nuevo: 1, igual: 1, cambia: 1, erp: 1, error: 3 });
  });

  it("suma varias pesadas del mismo día y no deja dos previsiones distintas", () => {
    const rows = planImport([
      entry(2, "inv 2", "lunes", { real: "100", tecnico: "50" }),
      entry(3, "inv 2", "16/11/2026", { real: "250,5", tecnico: "60" }),
    ], data);
    expect(rows.find((r) => r.series === "real")).toMatchObject({ kg: 350.5, status: "nuevo", lines: [2, 3], message: expect.stringContaining("Suma de 2 filas") });
    expect(rows.find((r) => r.series === "tecnico")).toMatchObject({ status: "error", message: expect.stringContaining("distintas") });
  });

  it("guarda solo lo nuevo, y lo que cambia solo si se pide, sin tocar los demás días", () => {
    const rows = planImport([
      entry(2, "inv 1", "martes", { real: "120" }),
      entry(3, "inv 1", "miércoles", { real: "130", agricultor: "70" }),
    ], data);
    expect(buildWrites(rows, data, false)).toEqual([
      { greenhouseId: "inv-1", nombre: "Invernadero 1", series: "agricultor", days: [null, null, 70, null, null], cells: [{ index: 2, kg: 70 }] },
      { greenhouseId: "inv-1", nombre: "Invernadero 1", series: "real", days: [500, 100, 130, null, null], cells: [{ index: 2, kg: 130 }] },
    ]);
    const writes = buildWrites(rows, data, true);
    expect(writes.find((w) => w.series === "real")?.days).toEqual([500, 120, 130, null, null]);

    // Tras guardar, cuenta lo que de verdad quedó y señala lo que no.
    const fresh = field([greenhouse("inv-1", "Invernadero 1", {
      real: [500, 120, 130, null, null],
      previsiones: { agricultor: [null, null, null, null, null], tecnico: [80, null, null, null, null] },
    })]);
    expect(verifyWrites(writes, fresh)).toEqual({ saved: 2, missing: [{ nombre: "Invernadero 1", series: "agricultor", index: 2, kg: 70, now: null }] });
  });

  it("nota si los datos cambiaron entre revisar y guardar", () => {
    const entries = [entry(2, "inv 2", "lunes", { real: "100" })];
    const later = field([data.invernaderos[0], greenhouse("inv-2", "Invernadero 2", { real: [90, null, null, null, null] })]);
    expect(planSignature(planImport(entries, data))).not.toBe(planSignature(planImport(entries, later)));
  });
});

describe("parsePaste", () => {
  it("lee un bloque de 3 filas por 5 días copiado de Excel", () => {
    const read = parsePaste("100\t110,5\t\t1.200\t90\r\n80\t80\t80\t80\t80\r\n\t\t\t\t\r\n");
    expect(read.ok && read.rows.map((r) => r.values.map((v) => (v.ok ? v.value : "x")))).toEqual([
      [100, 110.5, null, 1200, 90],
      [80, 80, 80, 80, 80],
      [null, null, null, null, null],
    ]);
  });

  it("usa el rótulo de la fila si viene copiado", () => {
    const read = parsePaste("Previsión del técnico\t1\t2\t3\t4\t5\nRecogido de verdad\t5\t4\t3\t2\t1");
    expect(read.ok && read.rows.map((r) => r.series)).toEqual(["tecnico", "real"]);
    const unknown = parsePaste("Fila rara\t1\t2\t3\t4\t5");
    expect(unknown.ok && unknown.rows[0]).toMatchObject({ series: null, values: [{ value: 1 }, {}, {}, {}, { value: 5 }] });
  });

  it("empieza en el día donde se pega si el bloque no trae la semana entera", () => {
    const read = parsePaste("7\t8", 3);
    expect(read.ok && read.rows[0].values).toEqual([ok(null), ok(null), ok(null), ok(7), ok(8)]);
    const whole = parsePaste("1\t2\t3\t4\t5", 3);
    expect(whole.ok && whole.rows[0].values.map((v) => v.ok && v.value)).toEqual([1, 2, 3, 4, 5]);
    expect(parsePaste("7\t8\t9", 3)).toMatchObject({ ok: false, error: expect.stringContaining("no cabe") });
  });

  it("marca negativos y rechaza bloques demasiado grandes", () => {
    const read = parsePaste("1\t-2\t3");
    expect(read.ok && read.rows[0].values).toEqual([ok(1), { ok: false, reason: "negativo" }, ok(3), ok(null), ok(null)]);
    expect(parsePaste("1\t2\t3\t4\t5\t15")).toMatchObject({ ok: false, error: expect.stringContaining("más de 5 columnas") });
    expect(parsePaste("1\n2\n3\n4")).toMatchObject({ ok: false, error: expect.stringContaining("más de 3 filas") });
    expect(parsePaste("\n\n")).toMatchObject({ ok: false });
  });
});

describe("planPaste", () => {
  const current = { agricultor: [10, null, null, null, null], tecnico: [null, null, null, null, null], real: [500, null, null, null, null] };
  const erp = [true, false, false, false, false];

  it("pega desde la fila elegida y dice qué cambia, qué es nuevo y qué no se toca", () => {
    const read = parsePaste("12\t20\t\t-1\t5\n\t30\t\t\t");
    if (!read.ok) throw new Error(read.error);
    const plan = planPaste(read.rows, "agricultor", current, erp);
    if (!plan.ok) throw new Error(plan.error);
    expect(plan.targets).toEqual(["agricultor", "tecnico"]);
    expect(plan.cells.slice(0, 5).map((c) => [c.status, c.after])).toEqual([["cambia", 12], ["nuevo", 20], ["vacio", null], ["error", null], ["nuevo", 5]]);
    expect(plan.cells[6]).toMatchObject({ series: "tecnico", index: 1, status: "nuevo", after: 30 });
  });

  it("no cambia lo que llegó del ERP", () => {
    const read = parsePaste("Recogido\t600\t100\t\t\t");
    if (!read.ok) throw new Error(read.error);
    const plan = planPaste(read.rows, "agricultor", current, erp);
    expect(plan.ok && plan.cells.slice(0, 2).map((c) => c.status)).toEqual(["erp", "nuevo"]);
  });

  it("avisa si las filas no caben o van dos a la misma", () => {
    const two = parsePaste("1\n2");
    if (!two.ok) throw new Error(two.error);
    expect(planPaste(two.rows, "real", current, erp)).toMatchObject({ ok: false, error: expect.stringContaining("No caben 2 filas") });
    const same = parsePaste("Recogido\t1\nRecogido\t2");
    if (!same.ok) throw new Error(same.error);
    expect(planPaste(same.rows, "agricultor", current, erp)).toMatchObject({ ok: false });
  });
});

describe("leer ficheros", () => {
  it("lee CSV de Excel en español, con punto y coma y comillas", () => {
    const rows = parseCsv('Invernadero;Fecha;Recogido kg\r\n"Invernadero 1";16/11/2026;"1.234,5"\r\ninv 2;17/11/2026;\r\n');
    expect(rows).toEqual([["Invernadero", "Fecha", "Recogido kg"], ["Invernadero 1", "16/11/2026", "1.234,5"], ["inv 2", "17/11/2026", null]]);
    expect(parseCsv("a,b\n\"x, y\",2")).toEqual([["a", "b"], ["x, y", "2"]]);
  });

  it("lee la plantilla en .xlsx tal como la descarga la página, con fechas de Excel y celdas vacías", async () => {
    const data = field([greenhouse("inv-1", "Invernadero 1"), greenhouse("inv-2", "Invernadero 2")]);
    const [sheet] = templateSheets(data);
    expect(sheet.rows).toHaveLength(11);
    const filled = sheet.rows.map((row, i) => (i === 1 ? [row[0], row[1], row[2], 1234.5, null, 900] : row));
    const buffer = await writeXlsxFile([
      {
        sheet: "Kilos",
        data: [
          ...filled.map((row) => row.map((cell) => (cell === null ? null : { value: cell, type: typeof cell === "number" ? Number : String }))),
          [{ value: "Invernadero 2" }, { value: new Date(Date.UTC(2026, 10, 18)), type: Date, format: "dd/mm/yyyy" }, null, { value: 7, type: Number }],
        ],
      },
      { sheet: "Otra", data: [[{ value: "no se lee" }]] },
    ]).toBuffer();
    const rows = await readXlsx(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer);
    expect(rows[0]).toEqual(TEMPLATE_COLUMNS);
    expect(rows[1]).toEqual(["Invernadero 1", "16/11/2026", "lunes", 1234.5, null, 900]);
    const read = readTable(rows, DAYS);
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    const plan = planImport(read.entries, data);
    expect(plan.map((r) => [r.greenhouse?.id, r.dayIndex, r.series, r.kg, r.status])).toEqual([
      ["inv-1", 0, "agricultor", 900, "nuevo"],
      ["inv-1", 0, "real", 1234.5, "nuevo"],
      ["inv-2", 2, "real", 7, "nuevo"],
    ]);
  });

  it("dice que no es un .xlsx si no lo es", async () => {
    await expect(readXlsx(new TextEncoder().encode("hola").buffer as ArrayBuffer)).rejects.toThrow("no es un .xlsx");
  });
});
