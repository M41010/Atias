import { describe, expect, it } from "vitest";
import { DIARIO, formatJournalDate, isUpcoming } from "../content/diario";

describe("diario del piloto", () => {
  it("una fecha con día es próxima hasta que llega ese día", () => {
    expect(isUpcoming("2026-11-14", "2026-11-10")).toBe(true);
    expect(isUpcoming("2026-11-14", "2026-11-14")).toBe(false);
    expect(isUpcoming("2026-11-14", "2026-12-01")).toBe(false);
  });

  it("una fecha de solo mes es próxima solo si el mes no ha empezado", () => {
    expect(isUpcoming("2026-12", "2026-11-30")).toBe(true);
    expect(isUpcoming("2026-11", "2026-11-01")).toBe(false);
  });

  it("escribe la fecha con o sin día según lo que se sepa", () => {
    expect(formatJournalDate("2026-11-14", "es")).toBe("14 de noviembre de 2026");
    expect(formatJournalDate("2026-10", "es")).toBe("octubre de 2026");
    expect(formatJournalDate("2026-10", "en")).toBe("October 2026");
  });

  it("las entradas van de la más reciente a la más antigua y tienen los seis idiomas", () => {
    const dates = DIARIO.map((e) => (e.date.length === 7 ? `${e.date}-01` : e.date));
    expect([...dates].sort().reverse()).toEqual(dates);
    for (const entry of DIARIO) {
      expect(Object.keys(entry.text).sort()).toEqual(["en", "es", "fr", "it", "nl", "pt"]);
    }
  });
});
