import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addDays, computeNormals, localDateHour, localMidnight, pointOf } from "./weather.js";

describe("meteorología: cálculos sin base de datos", () => {
  it("sitúa la medianoche en hora de España, también con horario de verano", () => {
    assert.equal(new Date(localMidnight("2026-11-07")).toISOString(), "2026-11-06T23:00:00.000Z");
    assert.equal(new Date(localMidnight("2026-07-01")).toISOString(), "2026-06-30T22:00:00.000Z");
    // El 25 de octubre de 2026 tiene 25 horas: se atrasa el reloj.
    assert.equal((localMidnight("2026-10-26") - localMidnight("2026-10-25")) / 3_600_000, 25);
  });

  it("da la fecha y la hora locales de un instante", () => {
    assert.deepEqual(localDateHour(Date.parse("2026-11-06T23:30:00Z")), { date: "2026-11-07", hour: 0 });
  });

  it("agrupa invernaderos cercanos en el mismo punto", () => {
    assert.equal(pointOf(36.7461, -3.5203).id, pointOf(36.7479, -3.5198).id);
    assert.notEqual(pointOf(36.745, -3.52).id, pointOf(36.7, -3.443).id);
  });

  it("lo normal es la media de cada hora en todos los años, suavizada con los días cercanos", () => {
    const time: number[] = [];
    const temps: number[] = [];
    for (const year of [2024, 2025]) {
      const start = localMidnight(`${year}-01-01`);
      const end = localMidnight(`${year + 1}-01-01`);
      for (let t = start; t < end; t += 3_600_000) {
        time.push(t / 1000);
        // 2024 a la hora en punto, 2025 dos grados más: la media es la hora + 1.
        temps.push(localDateHour(t).hour + (year === 2025 ? 2 : 0));
      }
    }
    const normals = computeNormals({ time, temperature_2m: temps });
    assert.equal(normals.size, 366);
    assert.deepEqual(normals.get("06-15"), Array.from({ length: 24 }, (_, h) => h + 1));
  });

  it("ignora horas sin dato en lugar de contarlas como cero", () => {
    const start = localMidnight("2025-01-01");
    const time = Array.from({ length: 365 * 24 }, (_, i) => start / 1000 + i * 3600);
    const temps = time.map((_, i) => (i % 2 === 0 ? 12 : null));
    const normals = computeNormals({ time, temperature_2m: temps });
    assert.ok([...normals.values()].flat().every((t) => t === 12));
  });

  it("suma días sobre fechas de calendario", () => {
    assert.equal(addDays("2026-11-09", -2), "2026-11-07");
    assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  });
});
