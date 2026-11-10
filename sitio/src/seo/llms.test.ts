import { describe, expect, it } from "vitest";
import { llmsText } from "./llms";

describe("llms.txt", () => {
  const text = llmsText();

  it("sigue el formato llms.txt: título, resumen en cita y listas de enlaces", () => {
    expect(text.startsWith("# Atias\n\n> ")).toBe(true);
    expect(text).toContain("## Spanish pages");
    expect(text).toContain("## English pages");
  });

  it("enlaza las páginas principales en español e inglés", () => {
    expect(text).toContain("(/es/producto/)");
    expect(text).toContain("(/en/product/)");
    expect(text.match(/^- \[/gm)?.length).toBeGreaterThanOrEqual(16);
  });

  it("no promete precisión ni nombra cifras de resultados", () => {
    expect(text).toContain("no accuracy figures are published yet");
    expect(text).not.toMatch(/\b\d+(?:[.,]\d+)?\s?% (?:accuracy|accurate)/i);
  });
});
