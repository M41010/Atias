import type { Pool } from "./db.js";

const READ_TIMEOUT_MS = 60_000;

export type RecordingSource = "manual" | "metadatos" | "archivo";

/** Fecha de grabación que vale y de dónde sale: la corregida a mano, la del vídeo o la del archivo. */
export function recordingOf(row: Record<string, unknown>): { fecha: Date | null; fuente: RecordingSource | null } {
  if (row.manual_recorded_at) return { fecha: row.manual_recorded_at as Date, fuente: "manual" };
  if (row.metadata_recorded_at) return { fecha: row.metadata_recorded_at as Date, fuente: "metadatos" };
  if (row.file_modified_at) return { fecha: row.file_modified_at as Date, fuente: "archivo" };
  return { fecha: null, fuente: null };
}

/**
 * Pide al servicio de análisis la fecha de grabación de los vídeos recibidos que aún no se han
 * leído, también de los que llegaron antes de existir esta lectura. Es rápido: solo lee cabeceras.
 * Si el servicio está caído, quedan pendientes para la siguiente pasada.
 */
export async function readRecordingDates(pool: Pool, analysisUrl: string): Promise<number> {
  let read = 0;
  for (;;) {
    const { rows } = await pool.query(
      `SELECT id FROM videos WHERE status = 'recibido' AND recording_checked_at IS NULL
       ORDER BY received_at LIMIT 1`,
    );
    const video = rows[0];
    if (!video) return read;

    let response: Response;
    try {
      response = await fetch(`${analysisUrl}/grabacion`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ video: video.id }),
        signal: AbortSignal.timeout(READ_TIMEOUT_MS),
      });
    } catch {
      return read;
    }
    const body = (await response.json().catch(() => null)) as { fecha?: unknown; error?: unknown } | null;
    // Servicio con fallos o aún sin esta ruta: se vuelve a intentar en la siguiente pasada.
    if (response.status >= 500 || body?.error === "Ruta no encontrada") return read;
    // Cualquier otra respuesta (vídeo ilegible, archivo que ya no está) cuenta como leída sin fecha.
    const fecha = response.ok && typeof body?.fecha === "string" && Number.isFinite(Date.parse(body.fecha))
      ? body.fecha
      : null;
    await pool.query(
      "UPDATE videos SET metadata_recorded_at = $2, recording_checked_at = now() WHERE id = $1",
      [video.id, fecha],
    );
    read += 1;
  }
}
