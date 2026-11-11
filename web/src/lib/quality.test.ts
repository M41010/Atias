import { describe, expect, it } from "vitest";
import { qualityMessages } from "./quality";

describe("qualityMessages", () => {
  it("explica la resolución baja de un vídeo reenviado por WhatsApp", () => {
    expect(qualityMessages({ estado: "avisos", avisos: ["BAJA_RESOLUCION"] })).toEqual([
      "Resolución baja: hace falta el vídeo original, en 4K o 1080p",
    ]);
  });

  it("no deja un aviso desconocido sin texto", () => {
    expect(qualityMessages({ estado: "avisos", avisos: ["OTRO"] })).toEqual(["Hay un problema con este vídeo"]);
  });
});
