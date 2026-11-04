import { randomUUID } from "node:crypto";
import { FileStore } from "@tus/file-store";
import { Server } from "@tus/server";
import type { Pool } from "./db.js";
import { currentHileras, LINK_HEADER, resolveLink } from "./links.js";

export const MAX_VIDEO_BYTES = 8 * 1024 ** 3;
export const UPLOADS_PATH = "/api/subidas";

const reject = (status_code: number, body: string) => ({ status_code, body });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createVideoStore(directory: string): FileStore {
  return new FileStore({ directory });
}

/**
 * Servidor de subidas reanudables (protocolo tus). Cada petición se valida contra el enlace,
 * y una subida solo es accesible desde el enlace de su propio invernadero y recolección.
 */
export function createUploadServer(pool: Pool, store: FileStore): Server {
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
      if (!upload.size) throw reject(400, "Falta el tamaño del vídeo\n");
      if (!filetype?.startsWith("video/")) throw reject(415, "El archivo no es un vídeo\n");
      if (lado !== "A" && lado !== "B") throw reject(400, "Lado no válido\n");
      if (!Number.isInteger(hilera) || hilera < 1 || hilera > (await currentHileras(pool, link))) {
        throw reject(400, "Hilera no válida\n");
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
        [upload.id, link.greenhouseId, link.harvestId, hilera, lado, fileName, filetype, upload.size],
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
