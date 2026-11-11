import { describe, expect, it } from "vitest";
import { buildDemoReport } from "./api";
import { DEFAULT_PARAMS, HARVESTS } from "./simulated";
import { harvestForecast } from "./uploadForecast";

describe("previsión al subir vídeos", () => {
  it("suma la previsión de Atias de todos los invernaderos, día a día, como la Previsión diaria", () => {
    const harvest = HARVESTS.find((h) => h.captures.length > 0);
    const report = buildDemoReport(harvest?.id ?? "", DEFAULT_PARAMS, new Map());
    const forecast = harvestForecast(report);
    expect(report && forecast).toBeTruthy();
    if (!report || !forecast) return;
    expect(forecast.days.map((d) => d.date)).toEqual(report.dates);
    report.dates.forEach((_, i) => {
      expect(forecast.days[i].kg).toBeCloseTo(report.greenhouses.reduce((s, g) => s + g.daily[i].atias, 0));
    });
    expect(forecast.totalKg).toBeCloseTo(forecast.days.reduce((s, d) => s + d.kg, 0));
    expect(forecast.greenhouses).toBe(report.greenhouses.length);
  });

  it("sin vídeos analizados no hay previsión", () => {
    expect(harvestForecast(null)).toBeNull();
    expect(harvestForecast(undefined)).toBeNull();
    const empty = HARVESTS.find((h) => h.captures.length === 0);
    if (empty) expect(harvestForecast(buildDemoReport(empty.id, DEFAULT_PARAMS, new Map()))).toBeNull();
  });
});
