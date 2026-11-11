import { describe, expect, it } from "vitest";
import { fmtCaptureSpan } from "./format";
import { captureDates, madridInputValue, mondayOfIsoWeek, recordingProblem, recordingWarnings, type VideoRecording } from "./recording";
import type { ServerVideo } from "./upload";

const MONDAY = "2026-11-16";

function video(id: string, grabacion?: VideoRecording, receivedAt = "2026-11-15T21:00:00Z"): ServerVideo {
  return {
    id,
    hilera: Number(id[0]),
    lado: id[1] as "A" | "B",
    fileName: "v.mp4",
    sizeBytes: 1,
    status: "recibido",
    receivedAt,
    grabacion,
    calidad: { estado: "ok", avisos: [] },
  };
}
const at = (fecha: string, fuente: VideoRecording["fuente"] = "metadatos"): VideoRecording => ({ fecha, fuente });

describe("fecha de grabación", () => {
  it("la captura es cuándo se grabó, no cuándo llegó", () => {
    const videos = [video("1A", at("2026-11-14T09:30:00Z")), video("1B", at("2026-11-14T08:10:00Z")), video("2A")];
    expect(captureDates(videos)).toEqual({ dates: ["2026-11-14T08:10:00Z", "2026-11-14T09:30:00Z"], fromRecording: true });
  });

  it("sin ninguna fecha de grabación usa la de llegada y lo dice", () => {
    expect(captureDates([video("1A", { fecha: null, fuente: null })])).toEqual({
      dates: ["2026-11-15T21:00:00Z"],
      fromRecording: false,
    });
  });

  it("acepta de viernes a domingo antes del lunes, en hora de España", () => {
    // El último es el domingo a las 23:30 en España.
    for (const fecha of ["2026-11-13T08:00:00Z", "2026-11-14T09:00:00Z", "2026-11-15T22:30:00Z"]) {
      const v = video("1A", at(fecha));
      expect(recordingProblem(v, [v], MONDAY)).toBeNull();
    }
  });

  it("avisa de un vídeo de otra semana", () => {
    const old = video("1A", at("2026-11-07T09:00:00Z"));
    expect(recordingProblem(old, [old], MONDAY)).toMatch(/^Grabado el sáb, 7 nov: no es del fin de semana/);
    // El domingo a las 23:30 UTC ya es lunes en España.
    const late = video("1A", at("2026-11-15T23:30:00Z"));
    expect(recordingProblem(late, [late], MONDAY)).toMatch(/lun, 16 nov/);
  });

  it("avisa del vídeo que se separa más de un día del resto del invernadero", () => {
    const videos = [
      video("1A", at("2026-11-14T09:00:00Z")),
      video("1B", at("2026-11-14T10:00:00Z")),
      video("2A", at("2026-11-14T11:00:00Z")),
      video("2B", at("2026-11-15T15:00:00Z")),
    ];
    const warnings = recordingWarnings({ id: "inv-1", nombre: "Invernadero 1", videos }, MONDAY);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatchObject({ severity: "media", hilera: 2, scope: "Invernadero 1 · Hilera 2 · Lado B", greenhouseId: "inv-1" });
    expect(warnings[0].message).toMatch(/más de un día antes o después/);
  });

  it("sin fecha no hay aviso de fecha", () => {
    const v = video("1A");
    expect(recordingWarnings({ id: "inv-1", nombre: "Inv", videos: [v] }, MONDAY)).toEqual([]);
  });

  it("calcula el lunes de la semana ISO y la hora de España para corregir", () => {
    expect(mondayOfIsoWeek("2026-W47")).toBe("2026-11-16");
    expect(mondayOfIsoWeek("2026-W01")).toBe("2025-12-29");
    expect(mondayOfIsoWeek("otra")).toBeNull();
    expect(madridInputValue("2026-11-14T08:05:00Z")).toBe("2026-11-14T09:05");
    expect(madridInputValue("2026-07-04T08:05:00Z")).toBe("2026-07-04T10:05");
  });

  it("el intervalo de capturas da los dos días si no coinciden", () => {
    expect(fmtCaptureSpan(["2026-11-14T09:30:00Z", "2026-11-14T08:10:00Z"])).toBe("sáb, 14 nov, 09:10–10:30");
    expect(fmtCaptureSpan(["2026-11-14T08:10:00Z", "2026-11-15T10:00:00+01:00"])).toBe("sáb, 14 nov, 09:10 – dom, 15 nov, 10:00");
  });
});
