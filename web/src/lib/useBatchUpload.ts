"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DetailedError, Upload as TusUpload } from "tus-js-client";
import { useOnline } from "./hooks";
import { discardUpload } from "./serverApi";
import { startTransfer, uploadStatus } from "./tusTransfer";
import {
  markError,
  markReceived,
  markReconnecting,
  nextToStart,
  requeue,
  setProgress,
  type Side,
  type Upload,
  uploadKey,
  type Uploads,
  videoMimeType,
} from "./upload";

export type BatchTarget = { harvestId: string; greenhouseId: string; greenhouseName: string };
export type BatchEntry = { id: string; file: File; hilera: number; lado: Side; target: BatchTarget };

function errorMessage(error: Error | DetailedError): string {
  const status = uploadStatus(error);
  if (status === 403) return "La sesión ha caducado. Vuelve a entrar y elige otra vez el archivo: seguirá por donde iba.";
  if (status === 404) return "El invernadero o la recolección ya no existen.";
  if (status === 400) return "Esa hilera no existe en el invernadero. Revisa el número de hileras.";
  if (status === 410) return "Esta subida se canceló. Elige otra vez el archivo.";
  if (status === 413) return "El vídeo supera los 8 GB.";
  if (status === 415) return "Ese formato no se admite. Usa MP4, MOV o WebM.";
  if (status === 429) return "Hay demasiadas versiones guardadas de este invernadero esta semana.";
  if (status === 507) return "No queda espacio en el servidor para más vídeos.";
  return "No se ha podido subir. Comprueba la conexión y vuelve a intentarlo.";
}

/**
 * Cola de subidas de la cooperativa: un vídeo cada vez, en pausa sin conexión y sigue sola al volver.
 * Usa la misma transferencia reanudable que el enlace del agricultor, con la sesión en lugar del enlace.
 */
export function useBatchUpload(onReceived: (target: BatchTarget) => void) {
  const [uploads, setUploads] = useState<Uploads>({});
  const [targets, setTargets] = useState<Record<string, BatchTarget>>({});
  const online = useOnline();

  // Los archivos y las transferencias no pueden guardarse en el estado de React.
  const files = useRef(new Map<string, File>());
  const uploadUrls = useRef(new Map<string, string>());
  const current = useRef<{ key: string; transfer: TusUpload } | null>(null);
  const received = useRef(onReceived);
  useEffect(() => {
    received.current = onReceived;
  }, [onReceived]);

  const active = Object.values(uploads).filter((u) => u.status === "subiendo" || u.status === "en_cola").length;

  const begin = useCallback((key: string, upload: Upload, file: File, target: BatchTarget) => {
    const transfer = startTransfer({
      file,
      uploadUrl: uploadUrls.current.get(key) ?? null,
      // Sin enlace: la API reconoce a la cooperativa por la cookie de sesión.
      headers: {},
      metadata: {
        filename: file.name,
        filetype: videoMimeType(file) ?? file.type,
        hilera: String(upload.hilera),
        lado: upload.lado,
        invernadero: target.greenhouseId,
        recoleccion: target.harvestId,
      },
      fingerprint: [
        "cooperativa", target.harvestId, target.greenhouseId, uploadKey(upload.hilera, upload.lado),
        file.name, file.size, file.lastModified,
      ],
      isCurrent: (t) => current.current?.transfer === t,
      onReconnecting: () => setUploads((value) => markReconnecting(value, key)),
      onUploadUrl: (url) => uploadUrls.current.set(key, url),
      onProgress: (fraction) => setUploads((value) => setProgress(value, key, fraction)),
      onSuccess: (videoId) => {
        current.current = null;
        files.current.delete(key);
        uploadUrls.current.delete(key);
        setUploads((value) => markReceived(value, key, videoId));
        received.current(target);
      },
      onError: (error) => {
        current.current = null;
        setUploads((value) => markError(value, key, errorMessage(error)));
      },
    });
    current.current = { key, transfer };
  }, []);

  useEffect(() => {
    if (!online) {
      void current.current?.transfer.abort(false);
      current.current = null;
      return;
    }
    if (current.current) return;
    const key = nextToStart(uploads, (k) => files.current.has(k));
    if (key) begin(key, uploads[key], files.current.get(key) as File, targets[key]);
  }, [uploads, targets, online, begin]);

  useEffect(() => {
    if (!active) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [active]);

  const add = useCallback((entries: BatchEntry[]) => {
    for (const entry of entries) files.current.set(entry.id, entry.file);
    setTargets((value) => ({ ...value, ...Object.fromEntries(entries.map((e) => [e.id, e.target])) }));
    setUploads((value) => ({
      ...value,
      ...Object.fromEntries(entries.map((e): [string, Upload] => [e.id, {
        hilera: e.hilera,
        lado: e.lado,
        fileName: e.file.name,
        sizeBytes: e.file.size,
        status: "en_cola",
        progress: 0,
      }])),
    }));
  }, []);

  const cancel = useCallback((key: string) => {
    if (current.current?.key === key) {
      void current.current.transfer.abort(false);
      current.current = null;
    }
    const url = uploadUrls.current.get(key);
    if (url) void discardUpload(url.split("/").pop() as string).catch(() => {});
    files.current.delete(key);
    uploadUrls.current.delete(key);
    setUploads((value) => {
      const next = { ...value };
      delete next[key];
      return next;
    });
  }, []);

  const retry = useCallback((key: string) => {
    setUploads((value) => requeue(value, key));
  }, []);

  /** Quita de la lista lo ya recibido. */
  const clearReceived = useCallback(() => {
    setUploads((value) => Object.fromEntries(Object.entries(value).filter(([, u]) => u.status !== "recibido")));
  }, []);

  return { uploads, targets, online, active, add, cancel, retry, clearReceived };
}
