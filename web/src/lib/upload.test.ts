import { describe, expect, it } from "vitest";
import {
  addUpload,
  cancelUpload,
  type FarmerData,
  formatSize,
  highestHileraWithVideo,
  MAX_VIDEO_BYTES,
  missingData,
  nextPending,
  restoreAfterReload,
  summarize,
  tick,
  uploadKey,
  validateVideo,
} from "./upload";

const MB = 1024 ** 2;

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
});

describe("tick", () => {
  const file = { name: "a.mp4", size: 40 * MB };

  it("sube de uno en uno y deja el resto en cola", () => {
    const uploads = addUpload(addUpload({}, 1, "A", file), 1, "B", file);
    const next = tick(uploads, 1, true);
    expect(next[uploadKey(1, "A")].status).toBe("subiendo");
    expect(next[uploadKey(1, "A")].progress).toBeGreaterThan(0);
    expect(next[uploadKey(1, "B")].status).toBe("en_cola");
    expect(next[uploadKey(1, "B")].progress).toBe(0);
  });

  it("se pausa sin conexión y sigue por donde iba al volver", () => {
    const uploads = tick(addUpload({}, 1, "A", file), 1, true);
    const before = uploads[uploadKey(1, "A")].progress;
    const paused = tick(uploads, 100, false);
    expect(paused[uploadKey(1, "A")].progress).toBe(before);
    expect(tick(paused, 1, true)[uploadKey(1, "A")].progress).toBeGreaterThan(before);
  });

  it("marca recibido al terminar y pasa al siguiente", () => {
    const uploads = addUpload(addUpload({}, 1, "A", file), 1, "B", file);
    const done = tick(uploads, 1000, true);
    expect(done[uploadKey(1, "A")].status).toBe("recibido");
    expect(done[uploadKey(1, "A")].progress).toBe(1);
    expect(tick(done, 1, true)[uploadKey(1, "B")].status).toBe("subiendo");
  });

  it("no hace nada si no hay subidas", () => {
    const uploads = {};
    expect(tick(uploads, 1, true)).toBe(uploads);
  });
});

describe("addUpload", () => {
  it("sustituye el vídeo de ese lado y lo vuelve a subir", () => {
    const received = tick(addUpload({}, 1, "A", { name: "viejo.mp4", size: MB }), 1000, true);
    const replaced = addUpload(received, 1, "A", { name: "nuevo.mp4", size: MB })[uploadKey(1, "A")];
    expect(replaced.fileName).toBe("nuevo.mp4");
    expect(replaced.status).toBe("en_cola");
    expect(replaced.progress).toBe(0);
  });
});

describe("sustituir un vídeo recibido", () => {
  const received = tick(addUpload({}, 1, "A", { name: "viejo.mp4", size: MB }), 1000, true);
  const replacing = addUpload(received, 1, "A", { name: "nuevo.mp4", size: MB });

  it("al cancelar vuelve el vídeo anterior", () => {
    const restored = cancelUpload(replacing, 1, "A")[uploadKey(1, "A")];
    expect(restored.fileName).toBe("viejo.mp4");
    expect(restored.status).toBe("recibido");
  });

  it("al recargar se conserva el vídeo anterior", () => {
    const restored = restoreAfterReload(replacing)[uploadKey(1, "A")];
    expect(restored.fileName).toBe("viejo.mp4");
    expect(restored.status).toBe("recibido");
  });

  it("al terminar queda solo el nuevo", () => {
    const done = tick(replacing, 1000, true)[uploadKey(1, "A")];
    expect(done.fileName).toBe("nuevo.mp4");
    expect(done.previous).toBeUndefined();
  });

  it("cambiar varias veces conserva el recibido original", () => {
    const twice = addUpload(replacing, 1, "A", { name: "otro.mp4", size: MB });
    expect(cancelUpload(twice, 1, "A")[uploadKey(1, "A")].fileName).toBe("viejo.mp4");
  });

  it("mientras se sustituye sigue contando como recibido, pero no como terminado", () => {
    const summary = summarize(replacing, 1);
    expect(summary.received).toBe(1);
    expect(summary.complete).toBe(false);
  });

  it("cancelar sin vídeo anterior deja el lado pendiente", () => {
    expect(cancelUpload(addUpload({}, 1, "A", { name: "a", size: MB }), 1, "A")).toEqual({});
  });
});

describe("nextPending", () => {
  it("propone el primer lado sin vídeo o interrumpido", () => {
    expect(nextPending({}, 2)).toBe("1-A");
    const first = tick(addUpload({}, 1, "A", { name: "a", size: MB }), 1000, true);
    expect(nextPending(first, 2)).toBe("1-B");
    const interrupted = restoreAfterReload(addUpload(first, 1, "B", { name: "b", size: MB }));
    expect(nextPending(interrupted, 2)).toBe("1-B");
  });

  it("no propone nada si todo está recibido o en curso", () => {
    const first = addUpload({}, 1, "A", { name: "a", size: MB });
    expect(nextPending(addUpload(first, 1, "B", { name: "b", size: MB }), 1)).toBeNull();
  });
});

describe("restoreAfterReload", () => {
  it("no da por subido lo que estaba en curso, y conserva lo recibido", () => {
    const uploads = tick(addUpload(addUpload({}, 1, "A", { name: "a", size: MB }), 1, "B", { name: "b", size: MB }), 1000, true);
    const restored = restoreAfterReload(uploads);
    expect(restored[uploadKey(1, "A")].status).toBe("recibido");
    expect(restored[uploadKey(1, "B")].status).toBe("interrumpido");
    expect(restored[uploadKey(1, "B")].progress).toBe(0);
  });
});

describe("summarize", () => {
  it("cuenta dos vídeos por hilera y detecta cuándo está todo", () => {
    let uploads = addUpload({}, 1, "A", { name: "a", size: MB });
    expect(summarize(uploads, 1)).toEqual({ total: 2, received: 0, active: 1, complete: false });
    uploads = tick(uploads, 1000, true);
    uploads = tick(addUpload(uploads, 1, "B", { name: "b", size: MB }), 1000, true);
    expect(summarize(uploads, 1)).toEqual({ total: 2, received: 2, active: 0, complete: true });
  });

  it("ignora vídeos de hileras que ya no existen", () => {
    const uploads = tick(addUpload({}, 3, "A", { name: "a", size: MB }), 1000, true);
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
  });
});
