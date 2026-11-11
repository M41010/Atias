"use client";

import { type DetailedError, Upload as TusUpload } from "tus-js-client";
import { UPLOADS_ENDPOINT } from "./serverApi";

const CHUNK_BYTES = 8 * 1024 * 1024;
const RETRY_DELAYS_MS = [0, 1000, 3000, 5000, 10_000, 20_000, 30_000, 60_000];

/** Código HTTP con que respondió el servidor, si llegó a responder. */
export function uploadStatus(error: Error | DetailedError): number | undefined {
  return "originalResponse" in error ? error.originalResponse?.getStatus() : undefined;
}

/**
 * Transferencia reanudable de un vídeo (tus). La comparten el agricultor y la cooperativa: lo que
 * cambia es cómo se identifica cada uno (`headers`) y a dónde va el vídeo (`metadata`).
 */
export function startTransfer({
  file,
  uploadUrl,
  headers,
  metadata,
  fingerprint,
  isCurrent,
  onReconnecting,
  onUploadUrl,
  onProgress,
  onSuccess,
  onError,
}: {
  file: File;
  /** Dirección de la subida ya creada en esta sesión, para seguir por donde iba. */
  uploadUrl: string | null;
  headers: Record<string, string>;
  metadata: Record<string, string>;
  /** Identifica el mismo archivo en el mismo destino: volver a elegirlo continúa por donde iba. */
  fingerprint: (string | number)[];
  /** Si la transferencia se canceló mientras buscaba una subida anterior, no se arranca. */
  isCurrent: (transfer: TusUpload) => boolean;
  onReconnecting: () => void;
  onUploadUrl: (url: string) => void;
  onProgress: (fraction: number) => void;
  onSuccess: (videoId: string | undefined) => void;
  onError: (error: Error | DetailedError) => void;
}): TusUpload {
  const transfer = new TusUpload(file, {
    endpoint: UPLOADS_ENDPOINT,
    uploadUrl,
    chunkSize: CHUNK_BYTES,
    retryDelays: RETRY_DELAYS_MS,
    headers,
    metadata,
    fingerprint: async () => ["atias", ...fingerprint].join("|"),
    removeFingerprintOnSuccess: true,
    // Si el servidor está caído, tus-js-client trataría el error 5xx al consultar por dónde iba
    // como «esa subida ya no existe» y empezaría otra desde cero. Debe contar como fallo temporal.
    onAfterResponse: (request, response) => {
      if (request.getMethod() === "HEAD" && response.getStatus() >= 500) {
        throw new Error("Servidor no disponible");
      }
    },
    // Se reintenta solo ante fallos de red o del servidor; un 4xx no se arregla reintentando.
    onShouldRetry: (error) => {
      const status = error.originalResponse?.getStatus() ?? 0;
      // Sin espacio (507) no se arregla solo: reintentar solo llenaría el registro.
      const retriable = status === 0 || (status >= 500 && status !== 507) || status === 409 || status === 423;
      if (retriable) onReconnecting();
      return retriable;
    },
    onUploadUrlAvailable: () => {
      if (transfer.url) onUploadUrl(transfer.url);
    },
    onProgress: (sent, total) => onProgress(total > 0 ? sent / total : 0),
    onSuccess: () => onSuccess(transfer.url?.split("/").pop()),
    onError,
  });
  void transfer.findPreviousUploads().then((previous) => {
    if (!isCurrent(transfer)) return;
    if (!uploadUrl && previous[0]) transfer.resumeFromPreviousUpload(previous[0]);
    transfer.start();
  });
  return transfer;
}
