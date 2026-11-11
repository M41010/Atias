/** Estado de las subidas del agricultor, sin dependencias de la interfaz ni de la red. */

import type { VideoCount } from "./count";
import type { VideoQuality } from "./quality";

export type Side = "A" | "B";
export type UploadStatus = "en_cola" | "subiendo" | "recibido" | "interrumpido" | "error";
export type Upload = {
  hilera: number;
  lado: Side;
  fileName: string;
  sizeBytes: number;
  status: UploadStatus;
  /** Entre 0 y 1. */
  progress: number;
  /** Identificador en el servidor, si ya existe. */
  videoId?: string;
  /** Vídeo ya recibido que este sustituye: sigue vigente hasta recibir el nuevo. */
  previous?: Upload;
  errorMessage?: string;
  /** La conexión con el servidor ha fallado y se está reintentando sola. */
  reconnecting?: boolean;
  calidad?: VideoQuality;
};
export type Uploads = Record<string, Upload>;
export type ServerVideo = {
  id: string;
  hilera: number;
  lado: Side;
  fileName: string;
  sizeBytes: number;
  status: "recibido" | "subiendo";
  receivedAt: string | null;
  calidad: VideoQuality;
  /** Frutos contados por el detector. */
  conteo?: VideoCount;
};

export const MAX_VIDEO_BYTES = 8 * 1024 ** 3;

/** Límite del cuerpo de cada petición en Cloudflare (túnel o proxy), plan gratuito. */
export const CLOUDFLARE_MAX_BODY_BYTES = 100 * 1000 * 1000;
/**
 * Tamaño de cada trozo de la subida: muy por debajo del límite de Cloudflare, y pequeño para
 * que un corte de la conexión del móvil haga repetir poco.
 */
export const CHUNK_BYTES = 8 * 1024 * 1024;

export const uploadKey = (hilera: number, lado: Side) => `${hilera}-${lado}`;

/** Formatos que admite el servidor (api/src/uploads.ts, VIDEO_TYPES). */
const VIDEO_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm", "video/3gpp", "video/x-matroska"]);
const BY_EXTENSION: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  qt: "video/quicktime",
  webm: "video/webm",
  "3gp": "video/3gpp",
  mkv: "video/x-matroska",
};
const ALIASES: Record<string, string> = { "video/x-m4v": "video/mp4", "video/3gp": "video/3gpp" };

/**
 * Tipo del vídeo tal como lo espera el servidor. Algunas galerías de Android entregan el archivo
 * sin tipo o con uno poco común (`video/x-m4v`): entonces se deduce de la extensión.
 */
export function videoMimeType(file: { name?: string; type: string }): string | null {
  const type = file.type.trim().toLowerCase();
  const known = ALIASES[type] ?? type;
  if (VIDEO_TYPES.has(known)) return known;
  const extension = file.name?.split(".").pop()?.toLowerCase() ?? "";
  return BY_EXTENSION[extension] ?? null;
}

/** Devuelve el problema del archivo elegido, o null si se puede subir. */
export function validateVideo(file: { name?: string; type: string; size: number }): string | null {
  if (!videoMimeType(file)) {
    return file.type.startsWith("video/") || file.type === ""
      ? "Ese formato de vídeo no se admite. Usa MP4, MOV o WebM."
      : "Ese archivo no es un vídeo. Elige otro.";
  }
  if (file.size === 0) return "El vídeo está vacío. Vuelve a grabarlo.";
  if (file.size > MAX_VIDEO_BYTES) return "El vídeo supera los 8 GB. Graba la hilera con menos calidad.";
  return null;
}

/**
 * Convierte lo que hay en el servidor en estado inicial. Una subida sin terminar se muestra
 * como interrumpida, salvo que ya haya un vídeo vigente en ese lado, que es el que vale.
 */
export function fromServer(videos: ServerVideo[]): Uploads {
  const uploads: Uploads = {};
  for (const video of videos) {
    const key = uploadKey(video.hilera, video.lado);
    if (video.status === "subiendo" && uploads[key]?.status === "recibido") continue;
    uploads[key] = {
      hilera: video.hilera,
      lado: video.lado,
      fileName: video.fileName,
      sizeBytes: video.sizeBytes,
      status: video.status === "recibido" ? "recibido" : "interrumpido",
      progress: video.status === "recibido" ? 1 : 0,
      videoId: video.id,
      calidad: video.calidad,
    };
  }
  return uploads;
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
export function cancelUpload(uploads: Uploads, key: string): Uploads {
  const next = { ...uploads };
  const previous = uploads[key]?.previous;
  if (previous) next[key] = previous;
  else delete next[key];
  return next;
}

export function removeUpload(uploads: Uploads, key: string): Uploads {
  const next = { ...uploads };
  delete next[key];
  return next;
}

export function setProgress(uploads: Uploads, key: string, progress: number): Uploads {
  const upload = uploads[key];
  if (!upload) return uploads;
  return { ...uploads, [key]: { ...upload, status: "subiendo", progress: Math.min(1, progress), reconnecting: false } };
}

export function markReconnecting(uploads: Uploads, key: string): Uploads {
  const upload = uploads[key];
  if (!upload || upload.reconnecting) return uploads;
  return { ...uploads, [key]: { ...upload, reconnecting: true } };
}

export function markReceived(uploads: Uploads, key: string, videoId: string | undefined): Uploads {
  const upload = uploads[key];
  if (!upload) return uploads;
  const done: Upload = { ...upload, status: "recibido", progress: 1, videoId, calidad: { estado: "pendiente", avisos: [] } };
  delete done.previous;
  delete done.errorMessage;
  delete done.reconnecting;
  return { ...uploads, [key]: done };
}

/** Actualiza los resultados de calidad que ya tenga el servidor, sin tocar lo demás. */
export function mergeQuality(uploads: Uploads, videos: ServerVideo[]): Uploads {
  const byId = new Map(videos.map((v) => [v.id, v.calidad]));
  let changed = false;
  const next: Uploads = { ...uploads };
  for (const [key, upload] of Object.entries(uploads)) {
    const calidad = upload.videoId ? byId.get(upload.videoId) : undefined;
    if (calidad && calidad.estado !== upload.calidad?.estado) {
      next[key] = { ...upload, calidad };
      changed = true;
    }
  }
  return changed ? next : uploads;
}

export function markError(uploads: Uploads, key: string, errorMessage: string): Uploads {
  const upload = uploads[key];
  if (!upload) return uploads;
  return { ...uploads, [key]: { ...upload, status: "error", errorMessage, reconnecting: false } };
}

export function requeue(uploads: Uploads, key: string): Uploads {
  const upload = uploads[key];
  if (!upload) return uploads;
  const queued: Upload = { ...upload, status: "en_cola" };
  delete queued.errorMessage;
  return { ...uploads, [key]: queued };
}

/** Siguiente subida que debe arrancar: primero la que estaba en curso, después la cola. */
export function nextToStart(uploads: Uploads, hasFile: (key: string) => boolean): string | null {
  const entries = Object.entries(uploads).filter(([key]) => hasFile(key));
  const running = entries.find(([, u]) => u.status === "subiendo");
  if (running) return running[0];
  const queued = entries.find(([, u]) => u.status === "en_cola");
  return queued ? queued[0] : null;
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
  if (bytes < 1024 ** 2) return "menos de 1 MB";
  return `${format.format(bytes / 1024 ** 2)} MB`;
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
