import { randomUUID } from "node:crypto";
import { statfs } from "node:fs/promises";
import { FileStore } from "@tus/file-store";
import { Server } from "@tus/server";
import type { Pool } from "./db.js";
import { currentHileras, LINK_HEADER, resolveLink } from "./links.js";

// Un vídeo de 10 minutos grabado en 4K con el móvil ocupa unos 4-6 GB.
export const MAX_VIDEO_BYTES = 8 * 1024 ** 3;
export const UPLOADS_PATH = "/api/subidas";
/** Versiones guardadas a la vez por cada lado de hilera, de media, contando sustituidas y quitadas. */
export const MAX_VERSIONS_PER_SIDE = 4;
export const DEFAULT_MIN_FREE_BYTES = 10 * 1024 ** 3;

/**
 * Solo estos tipos se aceptan, y solo estos se sirven tal cual. Cualquier otro valor podría hacer
 * que el navegador tratase el archivo como una página web y ejecutase su código.
 */
export const VIDEO_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm", "video/3gpp", "video/x-matroska"]);

/** Espacio libre en la carpeta de vídeos, en bytes. */
export async function freeBytes(directory: string): Promise<number> {
  const stats = await statfs(directory);
  return stats.bavail * stats.bsize;
}

export type UploadLimits = {
  /** Espacio que siempre debe quedar libre en el disco tras aceptar una subida. */
  minFreeBytes?: number;
  freeSpace?: (directory: string) => Promise<number>;
};

const reject = (status_code: number, body: string) => ({ status_code, body });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createVideoStore(directory: string): FileStore {
  return new FileStore({ directory });
}

/**
 * Servidor de subidas reanudables (protocolo tus). Cada petición se valida contra el enlace,
 * y una subida solo es accesible desde el enlace de su propio invernadero y recolección.
 */
export function createUploadServer(
  pool: Pool,
  store: FileStore,
  { minFreeBytes = DEFAULT_MIN_FREE_BYTES, freeSpace = freeBytes }: UploadLimits = {},
): Server {
  return new Server({
    path: UPLOADS_PATH,
    datastore: store,
    relativeLocation: true,
    maxSize: MAX_VIDEO_BYTES,
    namingFunction: () => randomUUID(),

    onIncomingRequest: async (req, uploadId) => {
      const link = await resolveLink(pool, req.headers.get(LINK_HEADER));
      if (!link) throw reject(403, "Enlace no válido\n");

      // Los vídeos no se descargan por aquí, y se quitan solo mediante la API del enlace.
      if (req.method === "GET" || req.method === "DELETE") throw reject(405, "Método no permitido\n");
      if (req.method === "POST") return;

      if (!UUID.test(uploadId)) throw reject(404, "Subida no encontrada\n");
      const { rows } = await pool.query(
        "SELECT greenhouse_id, harvest_id, status FROM videos WHERE id = $1",
        [uploadId],
      );
      const video = rows[0];
      if (!video || video.greenhouse_id !== link.greenhouseId || video.harvest_id !== link.harvestId) {
        throw reject(404, "Subida no encontrada\n");
      }
      if (video.status === "sustituido" || video.status === "quitado") throw reject(410, "Subida retirada\n");
      if (req.method === "PATCH" && video.status !== "subiendo") throw reject(409, "Subida ya terminada\n");
    },

    onUploadCreate: async (req, upload) => {
      const link = await resolveLink(pool, req.headers.get(LINK_HEADER));
      if (!link) throw reject(403, "Enlace no válido\n");

      const { filename, filetype, hilera: rawHilera, lado } = upload.metadata ?? {};
      const hilera = Number(rawHilera);
      const mimeType = filetype?.trim().toLowerCase() ?? "";
      if (!upload.size) throw reject(400, "Falta el tamaño del vídeo\n");
      if (!VIDEO_TYPES.has(mimeType)) throw reject(415, "El archivo no es un vídeo\n");
      if (lado !== "A" && lado !== "B") throw reject(400, "Lado no válido\n");
      const hileras = await currentHileras(pool, link);
      if (!Number.isInteger(hilera) || hilera < 1 || hilera > hileras) {
        throw reject(400, "Hilera no válida\n");
      }

      // Cada versión sustituida o quitada sigue en el disco hasta 7 días: sin límite, un enlace
      // podría llenarlo subiendo una y otra vez.
      const stored = await pool.query(
        "SELECT count(*)::int AS total FROM videos WHERE greenhouse_id = $1 AND harvest_id = $2",
        [link.greenhouseId, link.harvestId],
      );
      if (stored.rows[0].total >= hileras * 2 * MAX_VERSIONS_PER_SIDE) {
        throw reject(429, "Demasiados vídeos guardados para este invernadero\n");
      }
      if ((await freeSpace(store.directory)) - upload.size < minFreeBytes) {
        throw reject(507, "No queda espacio para guardar el vídeo\n");
      }
      const fileName = (filename ?? "video").replace(/[\p{Cc}]/gu, "").slice(0, 255) || "video";

      // Una subida anterior sin terminar en este mismo lado queda sustituida por esta.
      await pool.query(
        `UPDATE videos SET status = 'sustituido', delete_after = now()
         WHERE greenhouse_id = $1 AND harvest_id = $2 AND hilera = $3 AND lado = $4 AND status = 'subiendo'`,
        [link.greenhouseId, link.harvestId, hilera, lado],
      );
      await pool.query(
        `INSERT INTO videos (id, greenhouse_id, harvest_id, hilera, lado, file_name, mime_type, size_bytes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'subiendo')`,
        [upload.id, link.greenhouseId, link.harvestId, hilera, lado, fileName, mimeType, upload.size],
      );
      return {};
    },

    onUploadFinish: async (_req, upload) => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const { rows } = await client.query(
          "SELECT greenhouse_id, harvest_id, hilera, lado FROM videos WHERE id = $1 AND status = 'subiendo' FOR UPDATE",
          [upload.id],
        );
        if (rows[0]) {
          // El vídeo anterior solo se retira ahora que ha llegado completo el que lo sustituye.
          await client.query(
            `UPDATE videos SET status = 'sustituido', delete_after = now() + interval '7 days'
             WHERE greenhouse_id = $1 AND harvest_id = $2 AND hilera = $3 AND lado = $4 AND status = 'recibido'`,
            [rows[0].greenhouse_id, rows[0].harvest_id, rows[0].hilera, rows[0].lado],
          );
          await client.query("UPDATE videos SET status = 'recibido', received_at = now() WHERE id = $1", [upload.id]);
        }
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
      return {};
    },
  });
}

/**
 * Elimina los vídeos con el plazo vencido y las subidas abandonadas. El archivo se borra antes
 * que la fila: si algo falla, la fila sigue ahí y se reintenta en la siguiente pasada.
 */
export async function purgeExpired(pool: Pool, store: FileStore): Promise<number> {
  const { rows } = await pool.query(
    `SELECT id FROM videos
     WHERE delete_after <= now() OR (status = 'subiendo' AND created_at < now() - interval '7 days')`,
  );
  let removed = 0;
  for (const { id } of rows) {
    try {
      await store.remove(id);
    } catch (error) {
      // Si el archivo ya no existe, solo queda borrar la fila.
      const missing = (error as { status_code?: number; code?: string }).status_code === 404
        || (error as { code?: string }).code === "ENOENT";
      if (!missing) {
        console.error(`No se pudo borrar el vídeo ${id}`, error);
        continue;
      }
    }
    await pool.query("DELETE FROM videos WHERE id = $1", [id]);
    removed += 1;
  }
  return removed;
}
