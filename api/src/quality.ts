import type { Pool } from "./db.js";
import { readRecordingDates } from "./recording.js";

const REVIEW_TIMEOUT_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 3;

/**
 * Pide al servicio de análisis que revise los vídeos pendientes, uno a uno.
 * Si el servicio está caído, los vídeos siguen pendientes y se reintentan después, sin gastar
 * intentos; solo cuenta como intento que el servicio responda con un error.
 */
export async function reviewPendingVideos(pool: Pool, analysisUrl: string): Promise<number> {
  let reviewed = 0;
  for (;;) {
    const { rows } = await pool.query(
      `SELECT id, quality_attempts FROM videos
       WHERE status = 'recibido' AND quality_status = 'pendiente'
       ORDER BY received_at LIMIT 1`,
    );
    const video = rows[0];
    if (!video) return reviewed;

    let response: Response;
    try {
      response = await fetch(`${analysisUrl}/calidad`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ video: video.id }),
        signal: AbortSignal.timeout(REVIEW_TIMEOUT_MS),
      });
    } catch {
      return reviewed;
    }

    if (response.ok) {
      const body = (await response.json()) as { avisos: string[] };
      await pool.query(
        `UPDATE videos SET quality_status = $2, quality = $3, quality_checked_at = now() WHERE id = $1`,
        [video.id, body.avisos.length > 0 ? "avisos" : "ok", JSON.stringify(body)],
      );
    } else {
      const attempts = video.quality_attempts + 1;
      await pool.query(
        `UPDATE videos SET quality_attempts = $2, quality_status = $3,
           quality_checked_at = CASE WHEN $3 = 'error' THEN now() ELSE quality_checked_at END
         WHERE id = $1`,
        [video.id, attempts, attempts >= MAX_ATTEMPTS ? "error" : "pendiente"],
      );
    }
    reviewed += 1;
  }
}

/**
 * Ejecuta la revisión sin solapes: si ya hay una en curso, esta llamada no hace nada. Antes lee la
 * fecha de grabación, que es rápida y no debe esperar a que se revise la imagen.
 */
export function createQualityRunner(pool: Pool, analysisUrl: string): () => Promise<void> {
  let running = false;
  return async () => {
    if (running) return;
    running = true;
    try {
      await readRecordingDates(pool, analysisUrl);
      await reviewPendingVideos(pool, analysisUrl);
    } catch (error) {
      console.error("Fallo al revisar la calidad de los vídeos", error);
    } finally {
      running = false;
    }
  };
}
