/**
 * Lógica de la subida del agricultor, sin dependencias de la interfaz. La transferencia es
 * SIMULADA: el progreso avanza con el tiempo y los archivos no se envían a ningún servidor.
 */

export type Side = "A" | "B";
export type UploadStatus = "en_cola" | "subiendo" | "recibido" | "interrumpido";
export type Upload = {
  hilera: number;
  lado: Side;
  fileName: string;
  sizeBytes: number;
  status: UploadStatus;
  /** Entre 0 y 1. */
  progress: number;
  /** Vídeo ya recibido que este sustituye: se conserva hasta recibir el nuevo. */
  previous?: Upload;
};
export type Uploads = Record<string, Upload>;

export const MAX_VIDEO_BYTES = 8 * 1024 ** 3;
const SIMULATED_BYTES_PER_SECOND = 4 * 1024 ** 2;
const MIN_SECONDS = 5;
const MAX_SECONDS = 40;

export const uploadKey = (hilera: number, lado: Side) => `${hilera}-${lado}`;

/** Devuelve el problema del archivo elegido, o null si se puede subir. */
export function validateVideo(file: { type: string; size: number }): string | null {
  if (!file.type.startsWith("video/")) return "Ese archivo no es un vídeo. Elige otro.";
  if (file.size === 0) return "El vídeo está vacío. Vuelve a grabarlo.";
  if (file.size > MAX_VIDEO_BYTES) return "El vídeo supera los 8 GB. Graba la hilera con menos calidad.";
  return null;
}

/** Añade o sustituye el vídeo de un lado: solo sube uno cada vez y el resto espera. */
export function addUpload(uploads: Uploads, hilera: number, lado: Side, file: { name: string; size: number }): Uploads {
  const key = uploadKey(hilera, lado);
  const existing = uploads[key];
  const previous = existing?.status === "recibido" ? existing : existing?.previous;
  return {
    ...uploads,
    [key]: {
      hilera,
      lado,
      fileName: file.name,
      sizeBytes: file.size,
      status: "en_cola",
      progress: 0,
      ...(previous ? { previous } : {}),
    },
  };
}

/** Cancela una subida. Si sustituía a un vídeo recibido, ese vídeo vuelve a su sitio. */
export function cancelUpload(uploads: Uploads, hilera: number, lado: Side): Uploads {
  const key = uploadKey(hilera, lado);
  const next = { ...uploads };
  const previous = uploads[key]?.previous;
  if (previous) next[key] = previous;
  else delete next[key];
  return next;
}

/** Primer lado sin vídeo: es el siguiente paso que se le propone al agricultor. */
export function nextPending(uploads: Uploads, hileras: number): string | null {
  for (let hilera = 1; hilera <= hileras; hilera++) {
    for (const lado of ["A", "B"] as const) {
      const status = uploads[uploadKey(hilera, lado)]?.status;
      if (!status || status === "interrumpido") return uploadKey(hilera, lado);
    }
  }
  return null;
}

/** Avanza la cola. Sin conexión no cambia nada: la subida queda en pausa y sigue al volver. */
export function tick(uploads: Uploads, elapsedSeconds: number, online: boolean): Uploads {
  if (!online) return uploads;
  const active = Object.values(uploads).filter((u) => u.status === "subiendo" || u.status === "en_cola");
  if (active.length === 0) return uploads;
  const current = active.find((u) => u.status === "subiendo") ?? active[0];
  const duration = Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, current.sizeBytes / SIMULATED_BYTES_PER_SECOND));
  const progress = Math.min(1, current.progress + elapsedSeconds / duration);
  const updated: Upload = { ...current, progress, status: progress >= 1 ? "recibido" : "subiendo" };
  if (updated.status === "recibido") delete updated.previous;
  return { ...uploads, [uploadKey(current.hilera, current.lado)]: updated };
}

/** Al recargar, los archivos en curso ya no están en memoria y hay que volver a elegirlos. */
export function restoreAfterReload(uploads: Uploads): Uploads {
  return Object.fromEntries(
    Object.entries(uploads).map(([key, u]) => {
      if (u.status !== "subiendo" && u.status !== "en_cola") return [key, u];
      // Si sustituía a un vídeo recibido, ese vídeo sigue siendo el válido.
      return [key, u.previous ?? { ...u, status: "interrumpido" as const, progress: 0 }];
    }),
  );
}

/** Última hilera con vídeo: no se pueden indicar menos hileras sin perderlo. */
export function highestHileraWithVideo(uploads: Uploads): number {
  return Object.values(uploads).reduce((max, u) => Math.max(max, u.hilera), 0);
}

export function summarize(uploads: Uploads, hileras: number) {
  const total = hileras * 2;
  const list = Object.values(uploads).filter((u) => u.hilera <= hileras);
  // Mientras se sustituye un vídeo, el anterior sigue siendo válido y cuenta como recibido.
  const received = list.filter((u) => u.status === "recibido" || u.previous).length;
  const active = list.filter((u) => u.status === "subiendo" || u.status === "en_cola").length;
  return { total, received, active, complete: total > 0 && received === total && active === 0 };
}

export function formatSize(bytes: number): string {
  const format = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });
  if (bytes >= 1024 ** 3) return `${format.format(bytes / 1024 ** 3)} GB`;
  return `${format.format(Math.max(bytes, 1024 * 1024) / 1024 ** 2)} MB`;
}

export type FarmerData = {
  variety: string;
  hileras: number | null;
  longitudM: number | null;
  temperaturaC: number | null;
  humedadPct: number | null;
  kilosSemanaPasada: number | null;
};

/** Datos que faltan por rellenar. No impiden subir vídeos. */
export function missingData(data: FarmerData): number {
  return [
    data.variety.trim() === "" ? null : data.variety,
    data.hileras,
    data.longitudM,
    data.temperaturaC,
    data.humedadPct,
    data.kilosSemanaPasada,
  ].filter((v) => v === null).length;
}
