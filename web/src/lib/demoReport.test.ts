import { describe, expect, it } from "vitest";
import { buildDemoReport } from "./api";
import { DEFAULT_PARAMS, HARVESTS } from "./simulated";

describe("demostración", () => {
  it("en cada hilera, los tramos tal como se ven suman la hilera", () => {
    const add = (values: number[]) => values.reduce((a, b) => a + b, 0);
    const mismatches: string[] = [];
    for (const harvest of HARVESTS) {
      const report = buildDemoReport(harvest.id, DEFAULT_PARAMS, new Map());
      for (const g of report?.greenhouses ?? []) {
        for (const h of g.hileras) {
          for (const range of ["observed", "forecast"] as const) {
            for (const field of ["kg", "min", "max"] as const) {
              const total = h[range]?.[field];
              if (total === undefined) continue;
              // Así se enseñan: fmtKg redondea cada tramo.
              const shown = add(h.tramos.map((t) => Math.round(t[range][field])));
              if (shown !== total) mismatches.push(`${harvest.id} ${g.info.id} H${h.n} ${range}.${field}: ${shown} ≠ ${total}`);
            }
          }
        }
      }
    }
    expect(mismatches).toEqual([]);
  });
});
