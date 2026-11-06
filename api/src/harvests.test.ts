import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { harvestWeek, isValidMonday, upcomingHarvests } from "./harvests.js";

describe("recolecciones", () => {
  it("genera etiqueta e identificador de semana", () => {
    assert.deepEqual(harvestWeek("2026-11-09"), { inicio: "2026-11-09", id: "2026-W46", etiqueta: "Recolección 9–13 nov" });
  });

  it("nombra los dos meses si la recolección los cruza", () => {
    assert.equal(harvestWeek("2026-11-30").etiqueta, "Recolección 30 nov–4 dic");
  });

  it("termina el viernes aunque ese día sea de otro mes y otro año", () => {
    assert.equal(harvestWeek("2026-12-28").etiqueta, "Recolección 28 dic–1 ene");
  });

  it("usa la semana ISO del jueves al cruzar de año", () => {
    assert.equal(harvestWeek("2026-12-28").id, "2026-W53");
    assert.equal(harvestWeek("2029-12-31").id, "2030-W01");
  });

  it("valida que la fecha sea un lunes real", () => {
    assert.ok(isValidMonday("2026-11-09"));
    assert.ok(!isValidMonday("2026-11-10"));
    assert.ok(!isValidMonday("2026-02-30"));
    assert.ok(!isValidMonday("no"));
  });

  it("propone los próximos lunes, sin contar el de hoy", () => {
    const fromWednesday = upcomingHarvests(new Date("2026-11-04T12:00:00Z"));
    assert.equal(fromWednesday.length, 4);
    assert.equal(fromWednesday[0].inicio, "2026-11-09");
    assert.equal(fromWednesday[3].inicio, "2026-11-30");
    assert.equal(upcomingHarvests(new Date("2026-11-09T12:00:00Z"))[0].inicio, "2026-11-16");
    assert.equal(upcomingHarvests(new Date("2026-11-08T12:00:00Z"))[0].inicio, "2026-11-09");
  });

  it("calcula el día con la hora de España, no la UTC", () => {
    // 23:30 UTC del domingo ya es lunes en Madrid: ese lunes ha empezado.
    assert.equal(upcomingHarvests(new Date("2026-11-08T23:30:00Z"))[0].inicio, "2026-11-16");
  });
});
