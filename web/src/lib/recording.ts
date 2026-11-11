/**
 * Cuándo se grabó cada vídeo. No es cuándo llegó: el agricultor puede mandarlo a la cooperativa y
 * que alguien lo suba días después. La API da la fecha y de dónde sale (api/src/recording.ts).
 */

import type { AppWarning } from "./simulated";
import type { ServerVideo } from "./upload";

export type RecordingSource = "manual" | "metadatos" | "archivo";
export type VideoRecording = { fecha: string | null; fuente: RecordingSource | null };

/** Se graba el fin de semana antes de la recolección: de viernes a domingo, en hora de España. */
const WINDOW_FIRST_DAY = -3;
const WINDOW_LAST_DAY = -1;
/** Más separación que esto dentro de un mismo invernadero hace sospechar de un vídeo antiguo. */
const MAX_SPREAD_MS = 24 * 3_600_000;

const madridDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" });
const madridParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Madrid",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const dayLabel = new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Madrid" });

/** Día de calendario en España (AAAA-MM-DD) de un instante. */
export const madridDate = (iso: string) => madridDay.format(new Date(iso));

/** AAAA-MM-DDTHH:MM en hora de España, como lo espera un campo de fecha y hora. */
export function madridInputValue(iso: string): string {
  const parts = Object.fromEntries(madridParts.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

const addDays = (isoDate: string, days: number) => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

/** Lunes de una recolección a partir de su identificador (2026-W46), o null si no lo es. */
export function mondayOfIsoWeek(id: string): string | null {
  const match = /^(\d{4})-W(\d{1,2})$/.exec(id);
  if (!match) return null;
  const jan4 = new Date(Date.UTC(Number(match[1]), 0, 4));
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7) + (Number(match[2]) - 1) * 7);
  return monday.toISOString().slice(0, 10);
}

export const SOURCE_LABELS: Record<RecordingSource, string> = {
  metadatos: "según el vídeo",
  archivo: "fecha del archivo: puede ser cuándo se copió",
  manual: "corregida a mano",
};

/** Fecha de grabación conocida de un vídeo, o null. */
export const recordedAt = (video: ServerVideo): string | null => video.grabacion?.fecha ?? null;

/**
 * Fechas de captura de un invernadero: las de grabación y, si no se conoce ninguna, las de recepción.
 * `fromRecording` dice cuál de las dos es, para no presentar la recepción como captura.
 */
export function captureDates(videos: ServerVideo[]): { dates: string[]; fromRecording: boolean } {
  const recorded = videos.map(recordedAt).filter((d): d is string => d !== null).sort();
  if (recorded.length > 0) return { dates: recorded, fromRecording: true };
  return { dates: videos.map((v) => v.receivedAt).filter((d): d is string => Boolean(d)).sort(), fromRecording: false };
}

/** Por qué la fecha de grabación de un vídeo es sospechosa, o null si no lo es. */
export function recordingProblem(video: ServerVideo, siblings: ServerVideo[], monday: string): string | null {
  const at = recordedAt(video);
  if (!at) return null;
  const day = madridDate(at);
  const from = addDays(monday, WINDOW_FIRST_DAY);
  const to = addDays(monday, WINDOW_LAST_DAY);
  const label = dayLabel.format(new Date(at));
  if (day < from || day > to) {
    return `Grabado el ${label}: no es del fin de semana antes de la recolección. Puede ser un vídeo antiguo o una fecha mal leída.`;
  }
  // Se compara con la mediana del invernadero (contando este vídeo): solo se señala el que se aparta.
  const all = [video, ...siblings.filter((v) => v.id !== video.id)].map(recordedAt).filter((d): d is string => d !== null);
  if (all.length < 2) return null;
  const sorted = all.map((d) => Date.parse(d)).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  if (Math.abs(Date.parse(at) - median) > MAX_SPREAD_MS) {
    return `Grabado el ${label}, más de un día antes o después que el resto de vídeos de este invernadero.`;
  }
  return null;
}

/** Avisos por vídeo con la fecha de grabación fuera de lo esperado, en el formato del resto. */
export function recordingWarnings(
  greenhouse: { id: string; nombre: string; videos: ServerVideo[] },
  monday: string,
): AppWarning[] {
  return greenhouse.videos.flatMap((video) => {
    const problem = recordingProblem(video, greenhouse.videos, monday);
    if (!problem) return [];
    return [{
      severity: "media" as const,
      message: problem,
      scope: `${greenhouse.nombre} · Hilera ${video.hilera} · Lado ${video.lado}`,
      greenhouseId: greenhouse.id,
      hilera: video.hilera,
      action: "Compruébalo en Vídeos recibidos: corrige la fecha o pide repetir la grabación.",
    }];
  });
}
