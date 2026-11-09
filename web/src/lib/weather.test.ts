import { afterEach, describe, expect, it, vi } from "vitest";
import type { Location } from "./simulated";
import { fetchRealWeather, fromApi, summarizeWeather } from "./weather";

const carchuna: Location = { municipality: "Carchuna (Motril)", latitude: 36.7, longitude: -3.443, offsetC: 0 };

const apiBody = {
  anosNormal: 10,
  desactualizado: false,
  dias: Array.from({ length: 7 }, (_, i) => ({
    fecha: `2026-11-${String(7 + i).padStart(2, "0")}`,
    tipo: i < 4 ? ("observado" as const) : ("prevision" as const),
    temperaturaHoraria: Array(24).fill(20),
    normalHoraria: Array(24).fill(15),
    lluviaMm: i === 0 ? 2.4 : 0,
  })),
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("meteorología real", () => {
  it("convierte la respuesta de la API en días", () => {
    const real = fromApi(apiBody);
    expect(real.normalsYears).toBe(10);
    expect(real.days[0]).toMatchObject({ date: "2026-11-07", kind: "observado", precipitationMm: 2.4, place: "exterior" });
  });

  it("calcula grados-día y factor frente a lo normal, e indica la fuente", () => {
    const summary = summarizeWeather(fromApi(apiBody).days, { source: "open-meteo", normalsYears: 10, stale: false });
    // 20 °C: 10 grados-día al día; lo normal, 15 °C: 5. La fruta madura el doble, con el tope de 1,5.
    expect(summary.weeklyDegreeDays).toBe(70);
    expect(summary.normalWeeklyDegreeDays).toBe(35);
    expect(summary.factor).toBe(1.5);
    expect(summary.source).toBe("open-meteo");
  });

  it("pide el lugar y la semana a la API", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(apiBody), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const real = await fetchRealWeather(carchuna, "2026-11-09");
    expect(real?.days).toHaveLength(7);
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toBe(
      "/api/cooperativa/meteorologia?lat=36.7&lon=-3.443&inicio=2026-11-09",
    );
  });

  it("si la API falla o no hay conexión devuelve null, para usar la simulada", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 503 })));
    expect(await fetchRealWeather(carchuna, "2026-11-09")).toBeNull();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("sin red"); }));
    expect(await fetchRealWeather(carchuna, "2026-11-09")).toBeNull();
  });
});
