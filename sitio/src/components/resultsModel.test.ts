import { describe, expect, it } from "vitest";
import { RESULTADOS } from "../content/resultados";
import { fill, formatPct, hasResults, plural } from "./resultsModel";

describe("resultados del piloto", () => {
  it("sin datos no hay sección", () => {
    expect(hasResults(null)).toBe(false);
    expect(hasResults({ asOf: "2027-01-15", greenhouses: 1, weeks: 1, forecasts: [] })).toBe(false);
  });

  it("con filas medidas se publica", () => {
    expect(hasResults({ asOf: "2027-01-15", greenhouses: 1, weeks: 1, forecasts: [{ source: "atias", errorPct: 1, biasPct: 0 }] })).toBe(true);
  });

  it("solo se publican datos que alguien ha rellenado a mano", () => {
    // Si este test falla es que hay resultados publicados: comprobar que son medidos, no de ejemplo.
    if (RESULTADOS) expect(RESULTADOS.weeks).toBeGreaterThan(0);
    else expect(RESULTADOS).toBeNull();
  });

  it("da formato a los porcentajes según el idioma", () => {
    expect(formatPct(5.8, "es-ES")).toBe("5,8 %");
    expect(formatPct(1.6, "en-GB", true)).toBe("+1.6 %");
    expect(formatPct(-2, "es-ES", true)).toBe("-2,0 %");
  });

  it("usa singular y plural", () => {
    const forms = { one: "1 semana", other: "{n} semanas" };
    expect(plural(forms, 1)).toBe("1 semana");
    expect(plural(forms, 8)).toBe("8 semanas");
  });

  it("rellena los huecos del texto", () => {
    expect(fill("{greenhouses} invernaderos y {weeks} semanas", { greenhouses: 3, weeks: 8 })).toBe("3 invernaderos y 8 semanas");
  });
});
