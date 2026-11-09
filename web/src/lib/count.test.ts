import { describe, expect, it } from "vitest";
import { countMessages, countSummary, type VideoCount } from "./count";

const ok = (maduros: number, avisos: string[] = []): VideoCount => ({
  estado: "ok",
  resultado: {
    detector: "m",
    maduros,
    frutos: maduros,
    tramos: [{ n: 1, maduros, clases: { rojo: maduros } }],
    posicion: "desplazamiento",
    avisos,
  },
});

describe("conteo de frutos", () => {
  it("resume el estado sin dar a entender que se está contando si no hay detector", () => {
    expect(countSummary(undefined)).toBe("Sin contar todavía");
    expect(countSummary({ estado: "pendiente", resultado: null })).toBe("Sin contar todavía");
    expect(countSummary({ estado: "error", resultado: null })).toBe("No se han podido contar los frutos");
    expect(countSummary(ok(1))).toBe("1 fruto maduro");
    expect(countSummary(ok(1250))).toBe("1250 frutos maduros".replace("1250", new Intl.NumberFormat("es-ES").format(1250)));
  });

  it("traduce los avisos y no oculta los desconocidos", () => {
    expect(countMessages(ok(3, ["POSICION_POR_TIEMPO", "OTRO"]))).toEqual([
      "Tramos repartidos por tiempo: la cámara apenas avanzó",
      "Revisa este conteo",
    ]);
  });
});
