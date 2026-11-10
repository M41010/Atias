import { describe, expect, it } from "vitest";
import {
  addUpload,
  cancelUpload,
  type FarmerData,
  formatSize,
  fromServer,
  highestHileraWithVideo,
  markError,
  markReconnecting,
  mergeQuality,
  markReceived,
  MAX_VIDEO_BYTES,
  missingData,
  nextPending,
  nextToStart,
  requeue,
  type ServerVideo,
  setProgress,
  summarize,
  uploadKey,
  validateVideo,
  videoMimeType,
} from "./upload";

const MB = 1024 ** 2;
const file = { name: "a.mp4", size: MB };
const always = () => true;

const serverVideo = (overrides: Partial<ServerVideo> = {}): ServerVideo => ({
  id: "v1",
  hilera: 1,
  lado: "A",
  fileName: "a.mp4",
  sizeBytes: MB,
  status: "recibido",
  receivedAt: null,
  calidad: { estado: "ok", avisos: [] },
  ...overrides,
});

describe("validateVideo", () => {
  it("acepta vídeos", () => {
    expect(validateVideo({ type: "video/mp4", size: 100 * MB })).toBeNull();
    expect(validateVideo({ type: "video/quicktime", size: 100 * MB })).toBeNull();
  });

  it("rechaza otros archivos, vídeos vacíos y demasiado grandes", () => {
    expect(validateVideo({ type: "image/jpeg", size: MB })).toMatch(/no es un vídeo/);
    expect(validateVideo({ type: "video/mp4", size: 0 })).toMatch(/vacío/);
    expect(validateVideo({ type: "video/mp4", size: MAX_VIDEO_BYTES + 1 })).toMatch(/8 GB/);
  });

  it("acepta vídeos de galerías de Android sin tipo, por la extensión", () => {
    expect(validateVideo({ name: "VID_20261114.mp4", type: "", size: MB })).toBeNull();
    expect(validateVideo({ name: "clip.MOV", type: "", size: MB })).toBeNull();
    expect(validateVideo({ name: "clip.m4v", type: "video/x-m4v", size: MB })).toBeNull();
  });

  it("explica que el formato no se admite cuando es un vídeo raro", () => {
    expect(validateVideo({ name: "clip.avi", type: "video/x-msvideo", size: MB })).toMatch(/formato/);
    expect(validateVideo({ name: "sin-extension", type: "", size: MB })).toMatch(/formato/);
  });
});

describe("videoMimeType", () => {
  it("da el tipo que espera el servidor", () => {
    expect(videoMimeType({ name: "a.mp4", type: "video/mp4" })).toBe("video/mp4");
    expect(videoMimeType({ name: "a.m4v", type: "video/x-m4v" })).toBe("video/mp4");
    expect(videoMimeType({ name: "a.3gp", type: "" })).toBe("video/3gpp");
    expect(videoMimeType({ name: "a.jpg", type: "image/jpeg" })).toBeNull();
  });
});

describe("fromServer", () => {
  it("lo recibido queda recibido y lo que estaba subiendo, interrumpido", () => {
    const uploads = fromServer([
      serverVideo(),
      serverVideo({ id: "v2", lado: "B", status: "subiendo" }),
    ]);
    expect(uploads["1-A"].status).toBe("recibido");
    expect(uploads["1-A"].videoId).toBe("v1");
    expect(uploads["1-B"].status).toBe("interrumpido");
    expect(uploads["1-B"].progress).toBe(0);
  });

  it("si una sustitución quedó a medias, vale el vídeo vigente", () => {
    const uploads = fromServer([serverVideo(), serverVideo({ id: "v2", status: "subiendo", fileName: "nuevo.mp4" })]);
    expect(uploads["1-A"].status).toBe("recibido");
    expect(uploads["1-A"].fileName).toBe("a.mp4");
  });
});

describe("cola", () => {
  it("sigue primero con la que estaba en curso y después por la cola", () => {
    let uploads = addUpload(addUpload({}, 1, "A", file), 1, "B", file);
    expect(nextToStart(uploads, always)).toBe("1-A");
    uploads = setProgress(uploads, "1-B", 0.5);
    expect(nextToStart(uploads, always)).toBe("1-B");
  });

  it("no arranca lo que no tiene archivo en memoria", () => {
    const uploads = addUpload({}, 1, "A", file);
    expect(nextToStart(uploads, () => false)).toBeNull();
  });

  it("no arranca lo recibido ni lo fallido", () => {
    let uploads = markReceived(addUpload({}, 1, "A", file), "1-A", "v1");
    uploads = markError(addUpload(uploads, 1, "B", file), "1-B", "fallo");
    expect(nextToStart(uploads, always)).toBeNull();
  });

  it("reintentar devuelve a la cola y limpia el error", () => {
    const uploads = requeue(markError(addUpload({}, 1, "A", file), "1-A", "fallo"), "1-A");
    expect(uploads["1-A"].status).toBe("en_cola");
    expect(uploads["1-A"].errorMessage).toBeUndefined();
  });

  it("ignora actualizaciones de una subida ya cancelada", () => {
    expect(setProgress({}, "1-A", 0.5)).toEqual({});
    expect(markReceived({}, "1-A", "v1")).toEqual({});
    expect(markError({}, "1-A", "x")).toEqual({});
  });

  it("reconectar se indica y se limpia al volver a avanzar", () => {
    const uploads = markReconnecting(setProgress(addUpload({}, 1, "A", file), "1-A", 0.2), "1-A");
    expect(uploads["1-A"].reconnecting).toBe(true);
    expect(uploads["1-A"].progress).toBe(0.2);
    expect(setProgress(uploads, "1-A", 0.3)["1-A"].reconnecting).toBe(false);
  });

  it("el progreso no supera el 100 %", () => {
    expect(setProgress(addUpload({}, 1, "A", file), "1-A", 1.2)["1-A"].progress).toBe(1);
  });
});

describe("sustituir un vídeo recibido", () => {
  const received = markReceived(addUpload({}, 1, "A", { name: "viejo.mp4", size: MB }), "1-A", "v1");
  const replacing = addUpload(received, 1, "A", { name: "nuevo.mp4", size: MB });

  it("al cancelar vuelve el vídeo anterior, con su identificador", () => {
    const restored = cancelUpload(replacing, "1-A")["1-A"];
    expect(restored.fileName).toBe("viejo.mp4");
    expect(restored.status).toBe("recibido");
    expect(restored.videoId).toBe("v1");
  });

  it("al terminar queda solo el nuevo", () => {
    const done = markReceived(replacing, "1-A", "v2")["1-A"];
    expect(done.fileName).toBe("nuevo.mp4");
    expect(done.videoId).toBe("v2");
    expect(done.previous).toBeUndefined();
  });

  it("cambiar varias veces conserva el recibido original", () => {
    const twice = addUpload(replacing, 1, "A", { name: "otro.mp4", size: MB });
    expect(cancelUpload(twice, "1-A")["1-A"].fileName).toBe("viejo.mp4");
  });

  it("si falla, el vídeo anterior sigue disponible al cancelar", () => {
    const failed = markError(replacing, "1-A", "fallo");
    expect(cancelUpload(failed, "1-A")["1-A"].fileName).toBe("viejo.mp4");
  });

  it("mientras se sustituye sigue contando como recibido, pero no como terminado", () => {
    const summary = summarize(replacing, 1);
    expect(summary.received).toBe(1);
    expect(summary.complete).toBe(false);
  });

  it("cancelar sin vídeo anterior deja el lado pendiente", () => {
    expect(cancelUpload(addUpload({}, 1, "A", file), "1-A")).toEqual({});
  });
});

describe("mergeQuality", () => {
  const received = markReceived(addUpload({}, 1, "A", file), "1-A", "v1");

  it("un vídeo recién recibido queda pendiente de revisar", () => {
    expect(received["1-A"].calidad?.estado).toBe("pendiente");
  });

  it("incorpora el resultado del servidor", () => {
    const merged = mergeQuality(received, [serverVideo({ calidad: { estado: "avisos", avisos: ["POCA_LUZ"] } })]);
    expect(merged["1-A"].calidad).toEqual({ estado: "avisos", avisos: ["POCA_LUZ"] });
    expect(merged["1-A"].status).toBe("recibido");
  });

  it("no toca nada si no cambia, para no repintar", () => {
    const pending = serverVideo({ calidad: { estado: "pendiente", avisos: [] } });
    expect(mergeQuality(received, [pending])).toBe(received);
  });

  it("ignora vídeos que ya no están en este lado", () => {
    expect(mergeQuality(received, [serverVideo({ id: "otro" })])).toBe(received);
  });
});

describe("nextPending", () => {
  it("propone el primer lado sin vídeo o interrumpido", () => {
    expect(nextPending({}, 2)).toBe("1-A");
    const first = markReceived(addUpload({}, 1, "A", file), "1-A", "v1");
    expect(nextPending(first, 2)).toBe("1-B");
    expect(nextPending(fromServer([serverVideo({ status: "subiendo" })]), 2)).toBe("1-A");
  });

  it("no propone nada si todo está recibido o en curso", () => {
    const first = addUpload({}, 1, "A", file);
    expect(nextPending(addUpload(first, 1, "B", file), 1)).toBeNull();
  });
});

describe("summarize", () => {
  it("cuenta dos vídeos por hilera y detecta cuándo está todo", () => {
    let uploads = addUpload({}, 1, "A", file);
    expect(summarize(uploads, 1)).toEqual({ total: 2, received: 0, active: 1, complete: false });
    uploads = markReceived(uploads, "1-A", "v1");
    uploads = markReceived(addUpload(uploads, 1, "B", file), "1-B", "v2");
    expect(summarize(uploads, 1)).toEqual({ total: 2, received: 2, active: 0, complete: true });
  });

  it("ignora vídeos de hileras que ya no existen", () => {
    const uploads = markReceived(addUpload({}, 3, "A", file), uploadKey(3, "A"), "v1");
    expect(summarize(uploads, 2).received).toBe(0);
    expect(highestHileraWithVideo(uploads)).toBe(3);
  });

  it("sin hileras definidas nunca está completo", () => {
    expect(summarize({}, 0).complete).toBe(false);
  });
});

describe("missingData", () => {
  const complete: FarmerData = {
    variety: "X",
    hileras: 4,
    longitudM: 50,
    temperaturaC: 24,
    humedadPct: 70,
    kilosSemanaPasada: 0,
  };

  it("cero kilos es un dato válido, no un dato ausente", () => {
    expect(missingData(complete)).toBe(0);
  });

  it("cuenta los vacíos", () => {
    expect(missingData({ ...complete, variety: "  ", temperaturaC: null })).toBe(2);
  });
});

describe("formatSize", () => {
  it("usa MB y GB", () => {
    expect(formatSize(1.5 * 1024 ** 3)).toBe("1,5 GB");
    expect(formatSize(250 * MB)).toBe("250 MB");
    expect(formatSize(26_000)).toBe("menos de 1 MB");
  });
});
