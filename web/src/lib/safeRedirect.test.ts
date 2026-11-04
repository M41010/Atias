import { describe, expect, it } from "vitest";
import { safeRedirect } from "./safeRedirect";

describe("safeRedirect", () => {
  it("permite rutas internas con parámetros", () => {
    expect(safeRedirect("/videos")).toBe("/videos");
    expect(safeRedirect("/invernaderos/inv-1?recoleccion=2026-W45")).toBe("/invernaderos/inv-1?recoleccion=2026-W45");
  });

  it("rechaza destinos externos o vacíos", () => {
    for (const bad of ["https://malicioso.test", "//malicioso.test", "/\\malicioso.test", "javascript:alert(1)", "", null]) {
      expect(safeRedirect(bad)).toBe("/");
    }
  });
});
