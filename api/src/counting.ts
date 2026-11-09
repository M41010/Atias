import type { Pool } from "./db.js";

/** Un vídeo de 10 minutos en 4K puede tardar bastante en una CPU modesta. */
const COUNT_TIMEOUT_MS = 4 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 3;

/**
 * Pide al análisis que cuente los frutos de los vídeos recibidos, de uno en uno.
 * - Si no hay modelo para un cultivo (503 sin_detector), sus vídeos siguen pendientes y se
 *   reintentan cuando aparezca, sin gastar intentos.
 * - Si el servicio está caído, se para y se reintenta en la siguiente pasada.
 * - Un vídeo ilegible (422) queda en error sin más intentos.
 */
export async function countPendingVideos(pool: Pool, analysisUrl: string): Promise<number> {
  const withoutDetector: string[] = [];
  let counted = 0;
  for (;;) {
    const { rows } = await pool.query(
      `SELECT v.id, v.count_attempts, g.crop, g.tramos FROM videos v
       JOIN greenhouses g ON g.id = v.greenhouse_id
       WHERE v.status = 'recibido' AND v.count_status = 'pendiente' AND NOT (g.crop = ANY($1))
       ORDER BY v.received_at LIMIT 1`,
      [withoutDetector],
    );
    const video = rows[0];
    if (!video) return counted;

    let response: Response;
    try {
      response = await fetch(`${analysisUrl}/conteo`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ video: video.id, cultivo: video.crop, tramos: video.tramos }),
        signal: AbortSignal.timeout(COUNT_TIMEOUT_MS),
      });
    } catch {
      return counted;
    }

    if (response.ok) {
      await pool.query(
        "UPDATE videos SET count_status = 'ok', count = $2, counted_at = now() WHERE id = $1",
        [video.id, JSON.stringify(await response.json())],
      );
      counted += 1;
      continue;
    }
    if (response.status === 503) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (body?.error !== "sin_detector") return counted;
      withoutDetector.push(video.crop);
      continue;
    }
    const attempts = video.count_attempts + 1;
    const failed = response.status === 422 || attempts >= MAX_ATTEMPTS;
    await pool.query(
      `UPDATE videos SET count_attempts = $2, count_status = $3,
         counted_at = CASE WHEN $3 = 'error' THEN now() ELSE counted_at END
       WHERE id = $1`,
      [video.id, attempts, failed ? "error" : "pendiente"],
    );
  }
}

/** Ejecuta el conteo sin solapes: si ya hay uno en curso, esta llamada no hace nada. */
export function createCountRunner(pool: Pool, analysisUrl: string): () => Promise<void> {
  let running = false;
  return async () => {
    if (running) return;
    running = true;
    try {
      await countPendingVideos(pool, analysisUrl);
    } catch (error) {
      console.error("Fallo al contar los frutos de los vídeos", error);
    } finally {
      running = false;
    }
  };
}
