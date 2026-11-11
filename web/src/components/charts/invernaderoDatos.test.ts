import { describe, expect, it } from "vitest";
import { buildDemoReport, type GreenhouseRow, type HarvestReport } from "../../lib/api";
import { DEFAULT_PARAMS, HARVESTS } from "../../lib/simulated";
import {
  harvestsToLoad,
  kilosPorDia,
  mapaInvernadero,
  niceTicks,
  normalizeWeek,
  ripeningSentence,
  semanasDelInvernadero,
  sequentialColor,
  SEQUENTIAL_GREEN,
  tendencia,
  tiempoMaduracion,
} from "./invernaderoDatos";

const reports = HARVESTS.map((h) => buildDemoReport(h.id, DEFAULT_PARAMS, new Map())).filter(
  (r): r is HarvestReport => r !== null && !r.empty,
);
const latest = reports.find((r) => r.id === "2026-W45")!;
const past = reports.find((r) => r.id === "2026-W44")!;
const gh = (report: HarvestReport, id: string) => report.greenhouses.find((g) => g.info.id === id)!;

describe("marcas de eje", () => {
  it("son redondas y cubren el máximo", () => {
    expect(niceTicks(930)).toEqual([0, 250, 500, 750, 1000]);
    expect(niceTicks(0)).toEqual([0]);
    const ticks = niceTicks(37.4, 3);
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(37.4);
  });
});

describe("kilos por día", () => {
  it("deja vacío lo que falta, sin ponerlo a cero", () => {
    const data = kilosPorDia(gh(latest, "inv-1"));
    expect(data.days).toHaveLength(5);
    // La última recolección aún no tiene kilos reales: la serie no sale.
    expect(data.days.every((d) => d.real === null)).toBe(true);
    expect(data.series).not.toContain("real");
    expect(data.series).toContain("atias");
  });

  it("con kilos reales, la serie aparece y el margen rodea la cifra de Atias", () => {
    const data = kilosPorDia(gh(past, "inv-1"));
    expect(data.series).toContain("real");
    for (const d of data.days) {
      expect(d.atiasRange.min).toBeLessThanOrEqual(d.atias);
      expect(d.atiasRange.max).toBeGreaterThanOrEqual(d.atias);
    }
    expect(data.max).toBeGreaterThanOrEqual(Math.max(...data.days.map((d) => d.atiasRange.max)));
  });

  it("sin dato del agricultor, su serie no ocupa leyenda", () => {
    const g = gh(past, "inv-1");
    const without: GreenhouseRow = { ...g, daily: g.daily.map((d) => ({ ...d, farmer: null })) };
    expect(kilosPorDia(without).series).not.toContain("farmer");
  });
});

describe("mapa del invernadero", () => {
  it("marca la hilera sin analizar y no la cuenta en la escala", () => {
    const g = gh(latest, "inv-3");
    const map = mapaInvernadero(g, "forecast");
    const pending = map.rows.find((r) => r.n === 4)!;
    expect(pending.pending).toBe(true);
    expect(pending.cells).toEqual([]);
    expect(pending.warning).toBe("media");
    expect(map.pendingCount).toBe(1);
    expect(map.tramos).toBe(8);
    expect(map.min).toBeLessThanOrEqual(map.max);
  });

  it("marca con advertencia alta la hilera con un vídeo malo", () => {
    const map = mapaInvernadero(gh(latest, "inv-2"), "observed");
    expect(map.rows.find((r) => r.n === 3)!.warning).toBe("alta");
    expect(map.rows.find((r) => r.n === 1)!.warning).toBeNull();
  });

  it("colorea de claro a oscuro según los kilos", () => {
    expect(sequentialColor(0, 0, 10)).toBe(SEQUENTIAL_GREEN[0]);
    expect(sequentialColor(10, 0, 10)).toBe(SEQUENTIAL_GREEN[SEQUENTIAL_GREEN.length - 1]);
    expect(sequentialColor(5, 5, 5)).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("tiempo y maduración", () => {
  it("sin datos de tiempo lo dice, no dibuja nada", () => {
    const empty = { days: [], weeklyDegreeDays: 0, normalWeeklyDegreeDays: 0, factor: 1, source: "sin_datos" as const, normalsYears: null, stale: false };
    expect(tiempoMaduracion(empty)).toEqual({ state: "sin_datos" });
  });

  it("traduce el factor a la frase de la maduración", () => {
    const weather = gh(latest, "inv-1").weather;
    const data = tiempoMaduracion({ ...weather, factor: 1.06 });
    expect(data.state).toBe("ok");
    if (data.state !== "ok") return;
    expect(data.days).toHaveLength(7);
    expect(data.changePct).toBe(6);
    expect(data.sentence).toBe("La fruta madura un 6 % más deprisa");
    expect(ripeningSentence(-4)).toBe("La fruta madura un 4 % más despacio");
    expect(ripeningSentence(0)).toBe("La fruta madura a ritmo normal");
  });
});

describe("rendimiento frente a semanas anteriores", () => {
  const weeks = semanasDelInvernadero([latest, ...reports], "inv-1", latest.id);

  it("ordena las semanas de la más antigua a la más reciente, sin repetir", () => {
    expect(weeks.map((w) => w.id)).toEqual(["2026-W43", "2026-W44", "2026-W45"]);
    expect(weeks.filter((w) => w.current).map((w) => w.id)).toEqual(["2026-W45"]);
    expect(weeks[0].real).not.toBeNull();
    expect(weeks[2].real).toBeNull();
  });

  it("por hilera divide la previsión entre las hileras analizadas y lo real entre todas", () => {
    const partial = semanasDelInvernadero([latest], "inv-3", latest.id)[0];
    expect(partial.partial).toBe(true);
    expect(partial.analyzed).toBe(3);
    const per = normalizeWeek(partial, "hilera");
    expect(per.forecast.kg).toBeCloseTo(partial.forecast.kg / 3);
    const full = normalizeWeek(weeks[0], "hilera");
    expect(full.real).toBeCloseTo((weeks[0].real as number) / weeks[0].hileras);
    expect(normalizeWeek(weeks[0], "total").forecast).toBe(weeks[0].forecast);
  });

  it("compara con la semana anterior usando la previsión si falta lo real", () => {
    const trend = tendencia(weeks);
    expect(trend.previousLabel).toBe(weeks[1].label);
    expect(trend.basis).toBe("previsión");
    expect(typeof trend.changePct).toBe("number");
    expect(tendencia(weeks.slice(0, 1).map((w) => ({ ...w, current: true })))).toEqual({ previousLabel: null, changePct: null, basis: null });
  });

  it("solo carga recolecciones con datos y como mucho las más recientes", () => {
    const options = [{ id: "a", hasData: false }, ...Array.from({ length: 10 }, (_, i) => ({ id: `s${i}`, hasData: true }))];
    expect(harvestsToLoad(options, 3)).toEqual(["s0", "s1", "s2"]);
  });
});
