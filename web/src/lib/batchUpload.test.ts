import { describe, expect, it } from "vitest";
import { type BatchRow, greenhouseNumber, parseVideoName, rowProblems, rowsFromFiles } from "./batchUpload";

describe("parseVideoName", () => {
  it.each([
    ["inv1-h3-A.mp4", 3, "A", 1],
    ["INV1-H3-B.MOV", 3, "B", 1],
    ["h3a.mp4", 3, "A", null],
    ["H03-B.mp4", 3, "B", null],
    ["hilera3_ladoB.mov", 3, "B", null],
    ["Hilera 12 Lado a.mp4", 12, "A", null],
    ["hilera-7 lado_B.mp4", 7, "B", null],
    ["inv2_h10_b.mp4", 10, "B", 2],
    ["inv1h3a.mp4", 3, "A", 1],
    ["inv1-3-A.mp4", 3, "A", 1],
    ["3b.mp4", 3, "B", null],
    ["Invernadero 2 - Fila 4 (A).mp4", 4, "A", 2],
    ["nave1_hil5_ladoA.webm", 5, "A", 1],
  ])("%s → hilera %s, lado %s", (name, hilera, lado, invernadero) => {
    expect(parseVideoName(name)).toEqual({ hilera, lado, invernadero });
  });

  it.each([
    "VID_20261114_103000.mp4",
    "IMG_1234.MOV",
    "VID-20261114-WA0003.mp4",
    "video.mp4",
  ])("no inventa nada en %s", (name) => {
    expect(parseVideoName(name)).toEqual({ hilera: null, lado: null, invernadero: null });
  });

  it("sin lado deja el lado sin rellenar", () => {
    expect(parseVideoName("inv1-h3.mp4")).toEqual({ hilera: 3, lado: null, invernadero: 1 });
  });

  it("si el nombre se contradice, pregunta", () => {
    expect(parseVideoName("h3-h4-A.mp4").hilera).toBeNull();
    expect(parseVideoName("h3-ladoA-ladoB.mp4").lado).toBeNull();
    expect(parseVideoName("h0a.mp4").hilera).toBeNull();
  });
});

describe("greenhouseNumber", () => {
  it("toma el número si el nombre tiene uno solo", () => {
    expect(greenhouseNumber("Invernadero 1")).toBe(1);
    expect(greenhouseNumber("Nave Sur")).toBeNull();
    expect(greenhouseNumber("Finca 2 nave 3")).toBeNull();
  });
});

describe("rowProblems", () => {
  let n = 0;
  const rows = (names: string[]): BatchRow[] =>
    rowsFromFiles(names.map((name) => ({ name, size: 100, type: "video/mp4" })), () => `f${++n}`);
  const context = { hileras: 4, greenhouseNumber: 1 };

  it("sin problemas si todo cuadra", () => {
    const list = rows(["inv1-h1-A.mp4", "inv1-h1-B.mp4"]);
    expect(Object.values(rowProblems(list, context)).flat()).toEqual([]);
  });

  it("marca los no reconocidos, los repetidos y las hileras que no existen", () => {
    const list = rows(["video.mp4", "h2a.mp4", "h2-A.mp4", "h5b.mp4"]);
    const problems = rowProblems(list, context);
    expect(problems[list[0].id]).toEqual([{ kind: "sin_datos" }]);
    expect(problems[list[1].id]).toEqual([{ kind: "repetido" }]);
    expect(problems[list[2].id]).toEqual([{ kind: "repetido" }]);
    expect(problems[list[3].id]).toEqual([{ kind: "fuera", hileras: 4 }]);
  });

  it("marca lo que coincide con un vídeo que ya está en la cola", () => {
    const list = rows(["h1a.mp4", "h1b.mp4"]);
    const problems = rowProblems(list, { ...context, queued: new Set(["1-A"]) });
    expect(problems[list[0].id]).toEqual([{ kind: "en_cola" }]);
    expect(problems[list[1].id]).toEqual([]);
  });

  it("al corregir a mano desaparece el problema", () => {
    const list = rows(["video.mp4"]);
    const fixed = [{ ...list[0], hilera: 2, lado: "B" as const }];
    expect(rowProblems(fixed, context)[list[0].id]).toEqual([]);
  });

  it("avisa si el nombre dice otro invernadero hasta que se confirma", () => {
    const list = rows(["inv2-h1-A.mp4"]);
    expect(rowProblems(list, context)[list[0].id]).toEqual([{ kind: "otro_invernadero", invernadero: 2 }]);
    expect(rowProblems([{ ...list[0], confirmedGreenhouse: true }], context)[list[0].id]).toEqual([]);
    expect(rowProblems(list, { hileras: 4, greenhouseNumber: null })[list[0].id]).toEqual([]);
  });

  it("rechaza lo que no es vídeo", () => {
    const [row] = rowsFromFiles([{ name: "h1a.jpg", size: 10, type: "image/jpeg" }], () => "x");
    expect(rowProblems([row], context).x[0].kind).toBe("formato");
  });
});
