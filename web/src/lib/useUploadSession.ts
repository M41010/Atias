"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DetailedError, Upload as TusUpload } from "tus-js-client";
import { useOnline } from "./hooks";
import {
  ApiError,
  deleteVideo,
  fetchLink,
  LINK_HEADER,
  type LinkInfo,
  restoreVideo,
  saveWeeklyData,
  UPLOADS_ENDPOINT,
} from "./serverApi";
import {
  addUpload,
  cancelUpload,
  type FarmerData,
  fromServer,
  markError,
  markReconnecting,
  mergeQuality,
  markReceived,
  nextToStart,
  removeUpload,
  requeue,
  setProgress,
  type Side,
  summarize,
  type Upload,
  uploadKey,
  type Uploads,
  validateVideo,
  videoMimeType,
} from "./upload";

const CHUNK_BYTES = 8 * 1024 * 1024;
const RETRY_DELAYS_MS = [0, 1000, 3000, 5000, 10_000, 20_000, 30_000, 60_000];
const SAVE_DEBOUNCE_MS = 700;
const QUALITY_POLL_MS = 5000;

export type SaveState = "guardado" | "guardando" | "error";
type Removed = { kind: "recibido"; upload: Upload } | { kind: "cancelado"; file: File };

function uploadErrorMessage(error: Error | DetailedError): string {
  const status = "originalResponse" in error ? error.originalResponse?.getStatus() : undefined;
  if (status === 403) return "Este enlace ya no es válido. Pide uno nuevo a la cooperativa.";
  if (status === 413) return "El vídeo supera los 8 GB. Graba la hilera con menos calidad.";
  if (status === 415) return "Ese archivo no es un vídeo, o su formato no se admite. Usa MP4, MOV o WebM.";
  if (status === 400) return "La hilera ya no existe. Revisa el número de hileras.";
  if (status === 429) return "Has subido demasiadas versiones esta semana. Avisa a la cooperativa.";
  if (status === 507) return "La cooperativa no tiene espacio para más vídeos ahora. Avísales.";
  return "No se ha podido subir. Comprueba la conexión y vuelve a intentarlo.";
}

/** Estado de la subida de un enlace: lo recibido viene del servidor; lo que está en curso, de este dispositivo. */
export function useUploadSession(token: string, link: LinkInfo) {
  const [uploads, setUploads] = useState<Uploads>(() => fromServer(link.videos));
  const [removed, setRemoved] = useState<Record<string, Removed>>({});
  const [data, setDataState] = useState<FarmerData>(link.datos);
  const [saveState, setSaveState] = useState<SaveState>("guardado");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const online = useOnline();

  // Los archivos y las transferencias no pueden guardarse en el estado de React.
  const files = useRef(new Map<string, File>());
  const uploadUrls = useRef(new Map<string, string>());
  const current = useRef<{ key: string; transfer: TusUpload } | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestData = useRef(data);

  const summary = summarize(uploads, data.hileras ?? 0);
  const hasActive = summary.active > 0;

  const startTransfer = useCallback((key: string, target: Upload, file: File) => {
    const transfer = new TusUpload(file, {
      endpoint: UPLOADS_ENDPOINT,
      uploadUrl: uploadUrls.current.get(key) ?? null,
      chunkSize: CHUNK_BYTES,
      retryDelays: RETRY_DELAYS_MS,
      headers: { [LINK_HEADER]: token },
      metadata: {
        filename: file.name,
        filetype: videoMimeType(file) ?? file.type,
        hilera: String(target.hilera),
        lado: target.lado,
        // Fecha del archivo en el dispositivo: la API la usa como fecha de grabación si el vídeo no trae la suya.
        lastmodified: String(file.lastModified),
      },
      // Identifica el mismo archivo en el mismo lado: volver a elegirlo continúa por donde iba.
      fingerprint: async (f: File) => ["atias", token, key, f.name, f.size, f.lastModified].join("|"),
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
        if (retriable) setUploads((value) => markReconnecting(value, key));
        return retriable;
      },
      onUploadUrlAvailable: () => {
        if (transfer.url) uploadUrls.current.set(key, transfer.url);
      },
      onProgress: (sent, total) => {
        setUploads((value) => setProgress(value, key, total > 0 ? sent / total : 0));
      },
      onSuccess: () => {
        current.current = null;
        files.current.delete(key);
        uploadUrls.current.delete(key);
        setUploads((value) => markReceived(value, key, transfer.url?.split("/").pop()));
      },
      onError: (error) => {
        current.current = null;
        setUploads((value) => markError(value, key, uploadErrorMessage(error)));
      },
    });
    current.current = { key, transfer };
    void transfer.findPreviousUploads().then((previous) => {
      // Si la subida se canceló mientras tanto, no se arranca.
      if (current.current?.transfer !== transfer) return;
      if (!uploadUrls.current.has(key) && previous[0]) transfer.resumeFromPreviousUpload(previous[0]);
      transfer.start();
    });
  }, [token]);

  // Motor de la cola: una subida cada vez, en pausa sin conexión y sigue sola al volver.
  useEffect(() => {
    if (!online) {
      void current.current?.transfer.abort(false);
      current.current = null;
      return;
    }
    if (current.current) return;
    const key = nextToStart(uploads, (k) => files.current.has(k));
    if (key) startTransfer(key, uploads[key], files.current.get(key) as File);
  }, [uploads, online, startTransfer]);

  useEffect(() => {
    if (!hasActive) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasActive]);

  // Mientras haya vídeos por revisar, consulta si ya está el resultado.
  const awaitingQuality = Object.values(uploads).some(
    (u) => u.status === "recibido" && u.calidad?.estado === "pendiente",
  );
  useEffect(() => {
    if (!awaitingQuality || !online) return;
    const timer = setInterval(() => {
      fetchLink(token)
        .then((info) => setUploads((value) => mergeQuality(value, info.videos)))
        .catch(() => {});
    }, QUALITY_POLL_MS);
    return () => clearInterval(timer);
  }, [awaitingQuality, online, token]);

  const setError = useCallback((key: string, message: string | null) => {
    setErrors((value) => {
      const next = { ...value };
      if (message) next[key] = message;
      else delete next[key];
      return next;
    });
  }, []);

  const forgetRemoved = useCallback((key: string) => {
    setRemoved((value) => {
      const next = { ...value };
      delete next[key];
      return next;
    });
  }, []);

  const stopTransfer = useCallback((key: string) => {
    if (current.current?.key !== key) return;
    void current.current.transfer.abort(false);
    current.current = null;
  }, []);

  const choose = useCallback((hilera: number, lado: Side, file: File | undefined) => {
    if (!file) return;
    const key = uploadKey(hilera, lado);
    const problem = validateVideo(file);
    setError(key, problem);
    if (problem) return;
    stopTransfer(key);
    forgetRemoved(key);
    files.current.set(key, file);
    uploadUrls.current.delete(key);
    setUploads((value) => addUpload(value, hilera, lado, file));
  }, [forgetRemoved, setError, stopTransfer]);

  const cancel = useCallback((hilera: number, lado: Side) => {
    const key = uploadKey(hilera, lado);
    const upload = uploads[key];
    if (!upload) return;
    stopTransfer(key);
    const url = uploadUrls.current.get(key);
    if (url) void deleteVideo(token, url.split("/").pop() as string).catch(() => {});
    const file = files.current.get(key);
    files.current.delete(key);
    uploadUrls.current.delete(key);
    if (file && !upload.previous) setRemoved((value) => ({ ...value, [key]: { kind: "cancelado", file } }));
    setUploads((value) => cancelUpload(value, key));
  }, [stopTransfer, token, uploads]);

  const retry = useCallback((hilera: number, lado: Side) => {
    setUploads((value) => requeue(value, uploadKey(hilera, lado)));
  }, []);

  const remove = useCallback((hilera: number, lado: Side) => {
    const key = uploadKey(hilera, lado);
    const upload = uploads[key];
    if (!upload?.videoId) return;
    setError(key, null);
    setUploads((value) => removeUpload(value, key));
    if (upload.status === "recibido") setRemoved((value) => ({ ...value, [key]: { kind: "recibido", upload } }));
    deleteVideo(token, upload.videoId).catch(() => {
      // No se ha podido quitar en el servidor: el vídeo sigue allí y debe verse.
      forgetRemoved(key);
      setUploads((value) => ({ ...value, [key]: upload }));
      setError(key, "No se ha podido quitar. Comprueba la conexión.");
    });
  }, [forgetRemoved, setError, token, uploads]);

  const undoRemove = useCallback((hilera: number, lado: Side) => {
    const key = uploadKey(hilera, lado);
    const entry = removed[key];
    if (!entry) return;
    if (entry.kind === "cancelado") {
      forgetRemoved(key);
      files.current.set(key, entry.file);
      setUploads((value) => addUpload(value, hilera, lado, entry.file));
      return;
    }
    restoreVideo(token, entry.upload.videoId as string)
      .then(() => {
        forgetRemoved(key);
        setUploads((value) => ({ ...value, [key]: entry.upload }));
      })
      .catch((error: unknown) => {
        setError(key, error instanceof ApiError && error.status === 409
          ? "Ya hay otro vídeo en este lado."
          : "No se ha podido recuperar. Comprueba la conexión.");
      });
  }, [forgetRemoved, removed, setError, token]);

  const flushData = useCallback(() => {
    setSaveState("guardando");
    saveWeeklyData(token, latestData.current)
      .then(() => setSaveState("guardado"))
      .catch(() => setSaveState("error"));
  }, [token]);

  const setData = useCallback((next: FarmerData) => {
    latestData.current = next;
    setDataState(next);
    setSaveState("guardando");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flushData, SAVE_DEBOUNCE_MS);
  }, [flushData]);

  // Si se perdió la conexión al guardar, se reintenta al volver.
  useEffect(() => {
    if (!online) return;
    const pendingRetry = saveState === "error";
    if (!pendingRetry) return;
    const timer = setTimeout(flushData, 0);
    return () => clearTimeout(timer);
  }, [online, saveState, flushData]);

  return {
    uploads, removed, data, setData, saveState, retrySave: flushData, errors, online, summary,
    choose, cancel, retry, remove, undoRemove,
  };
}
