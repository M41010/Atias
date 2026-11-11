import { describe, expect, it } from "vitest";
import type { ServerVideo } from "../../lib/upload";
import {
  defaultHilera,
  greenhouseTramoMax,
  niceTicks,
  qualityBars,
  rowProfile,
  sideDescription,
  sideState,
  stateCounts,
  statusGrid,
} from "./videosRecibidosData";

let seq = 0;
function video(over: Partial<ServerVideo> = {}): ServerVideo {
  seq += 1;
  return {
    id: `v${seq}`,
    hilera: 1,
    lado: "A",
    fileName: "a.mp4",
    sizeBytes: 1,
    status: "recibido",
    receivedAt: null,
    calidad: { estado: "ok", avisos: [] },
    ...over,
  };
}

const counted = (tramos: number[], over: Partial<ServerVideo> = {}) =>
  video({
    conteo: {
      estado: "ok",
      resultado: {
        detector: "x",
        maduros: tramos.reduce((a, b) => a + b, 0),
        frutos: 0,
        tramos: tramos.map((maduros, i) => ({ n: i + 1, maduros, clases: {} })),
        posicion: "desplazamiento",
        avisos: [],
      },
    },
    ...over,
  });

describe("estado de cada lado", () => {
  it("distingue falta, revisando, recibido sin contar, analizado y problema", () => {
    expect(sideState(undefined)).toBe("falta");
    expect(sideState(video({ calidad: { estado: "pendiente", avisos: [] } }))).toBe("analizando");
    expect(sideState(video())).toBe("recibido");
    expect(sideState(video({ conteo: { estado: "pendiente", resultado: null } }))).toBe("recibido");
    expect(sideState(counted([1, 2]))).toBe("analizado");
    expect(sideState(counted([1], { calidad: { estado: "avisos", avisos: ["POCA_LUZ"] } }))).toBe("problema");
    expect(sideState(video({ calidad: { estado: "error", avisos: [] } }))).toBe("problema");
    expect(sideState(video({ conteo: { estado: "error", resultado: null } }))).toBe("problema");
  });

  it("monta la rejilla con los lados que faltan y las hileras de más", () => {
    const grid = statusGrid(2, [counted([3], { hilera: 1, lado: "B", dePrueba: true }), video({ hilera: 3, lado: "A" })]);
    expect(grid.map((r) => r.hilera)).toEqual([1, 2, 3]);
    expect(grid[0].lados.map((s) => [s.lado, s.estado, s.prueba])).toEqual([["A", "falta", false], ["B", "analizado", true]]);
    expect(stateCounts(grid)).toEqual({ analizado: 1, recibido: 1, analizando: 0, problema: 0, falta: 4 });
  });

  it("sin hileras ni vídeos queda vacía", () => {
    expect(statusGrid(0, [])).toEqual([]);
    expect(defaultHilera([])).toBeNull();
  });

  it("explica el problema en palabras", () => {
    const [row] = statusGrid(1, [video({ calidad: { estado: "avisos", avisos: ["DESENFOCADO"] }, dePrueba: true })]);
    expect(sideDescription(1, row.lados[0])).toBe(
      "Hilera 1, lado A: Con problema. Imagen movida o desenfocada. Prueba: subido por la cooperativa.",
    );
    expect(sideDescription(1, row.lados[1])).toBe("Hilera 1, lado B: Falta.");
  });

  it("abre primero la hilera con problema, si no la analizada", () => {
    const problem = statusGrid(3, [counted([1], { hilera: 1 }), video({ hilera: 3, calidad: { estado: "error", avisos: [] } })]);
    expect(defaultHilera(problem)).toBe(3);
    expect(defaultHilera(statusGrid(3, [counted([1], { hilera: 2 })]))).toBe(2);
    expect(defaultHilera(statusGrid(3, []))).toBe(1);
  });
});

describe("perfil de la hilera", () => {
  it("compara los dos lados tramo a tramo, con los metros desde la cabecera", () => {
    const videos = [counted([2, 5, 1], { hilera: 4 }), counted([3, 0, 4], { hilera: 4, lado: "B" })];
    const profile = rowProfile(videos, 4, 30)!;
    expect(profile.lados).toEqual(["A", "B"]);
    expect(profile.totales).toEqual({ A: 8, B: 7 });
    expect(profile.puntos.map((p) => [p.n, p.valores.A, p.valores.B, p.desdeM, p.hastaM])).toEqual([
      [1, 2, 3, 0, 10],
      [2, 5, 0, 10, 20],
      [3, 1, 4, 20, 30],
    ]);
  });

  it("con un solo lado contado, el otro queda vacío y sin metros si no hay longitud", () => {
    const profile = rowProfile([counted([1, 2], { hilera: 1, lado: "B" }), video({ hilera: 1, lado: "A" })], 1, null)!;
    expect(profile.lados).toEqual(["B"]);
    expect(profile.puntos[0]).toEqual({ n: 1, valores: { A: null, B: 1 }, desdeM: null, hastaM: null });
  });

  it("un tramo que no viene en el conteo cuenta como cero", () => {
    const sparse = video({
      conteo: { estado: "ok", resultado: { detector: "x", maduros: 4, frutos: 4, tramos: [{ n: 3, maduros: 4, clases: {} }], posicion: "tiempo", avisos: [] } },
    });
    expect(rowProfile([sparse], 1, null)!.puntos.map((p) => p.valores.A)).toEqual([0, 0, 4]);
  });

  it("sin conteo no hay perfil", () => {
    expect(rowProfile([video()], 1, 20)).toBeNull();
    expect(rowProfile([], 1, 20)).toBeNull();
    expect(rowProfile([counted([])], 1, 20)).toBeNull();
  });

  it("usa una escala común para todo el invernadero", () => {
    expect(greenhouseTramoMax([counted([2, 9]), counted([4], { hilera: 2 }), video()])).toBe(9);
    expect(greenhouseTramoMax([])).toBe(0);
  });

  it("redondea las marcas del eje", () => {
    expect(niceTicks(9)).toEqual([0, 5, 10]);
    expect(niceTicks(37)).toEqual([0, 10, 20, 30, 40]);
    expect(niceTicks(0)).toEqual([0, 1]);
    expect(niceTicks(3)).toEqual([0, 1, 2, 3]);
  });
});

describe("calidad de la imagen", () => {
  it("compara cada medida con su umbral", () => {
    const bars = qualityBars({ duracionS: 95.4, anchura: 1280, altura: 720, brillo: 20, sobreexpuesto: 0.3, nitidez: 140 });
    expect(bars.map((b) => [b.clave, b.ok, b.texto])).toEqual([
      ["brillo", false, "20 de 255"],
      ["sobreexpuesto", false, "30 % de la imagen"],
      ["nitidez", true, "140"],
      ["resolucion", false, "1280 × 720"],
      ["duracion", true, "95 s"],
    ]);
    expect(bars.find((b) => b.clave === "nitidez")!.escalaMax).toBe(200);
    expect(bars.find((b) => b.clave === "duracion")!.escalaMax).toBe(100);
    expect(bars.find((b) => b.clave === "resolucion")!.valor).toBe(720);
  });

  it("en el umbral justo no avisa, igual que el análisis", () => {
    const bars = qualityBars({ duracionS: 10, anchura: 1920, altura: 1080, brillo: 35, sobreexpuesto: 0.25, nitidez: 25 });
    expect(bars.every((b) => b.ok)).toBe(true);
  });

  it("sin medidas, cada indicador queda sin medida", () => {
    for (const measures of [null, undefined]) {
      expect(qualityBars(measures).every((b) => b.valor === null && b.ok === null && b.texto === "Sin medida")).toBe(true);
    }
    const partial = qualityBars({ duracionS: null, anchura: 0, altura: 0, brillo: 80, sobreexpuesto: null, nitidez: null });
    expect(partial.map((b) => b.ok)).toEqual([true, null, null, null, null]);
  });
});
