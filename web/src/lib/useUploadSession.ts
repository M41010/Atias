"use client";

import { useCallback, useEffect, useState } from "react";
import { useOnline } from "./hooks";
import {
  addUpload,
  cancelUpload,
  type FarmerData,
  restoreAfterReload,
  type Side,
  summarize,
  tick,
  type Upload,
  uploadKey,
  type Uploads,
  validateVideo,
} from "./upload";

const TICK_MS = 250;
type Stored = { uploads: Uploads; data: FarmerData };

function read(key: string, defaults: FarmerData): Stored {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return { uploads: {}, data: defaults };
    const saved = JSON.parse(raw) as Stored;
    return { uploads: restoreAfterReload(saved.uploads), data: { ...defaults, ...saved.data } };
  } catch {
    return { uploads: {}, data: defaults };
  }
}

/** Estado de la subida de un enlace. Solo se usa en cliente: lee el almacenamiento al iniciarse. */
export function useUploadSession(token: string, defaults: FarmerData) {
  const storageKey = `atias.subida.v1.${token}`;
  const [initial] = useState(() => read(storageKey, defaults));
  const [uploads, setUploads] = useState<Uploads>(initial.uploads);
  const [removed, setRemoved] = useState<Record<string, Upload>>({});
  const [data, setData] = useState<FarmerData>(initial.data);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const online = useOnline();

  const hileras = data.hileras ?? 0;
  const summary = summarize(uploads, hileras);
  const hasActive = summary.active > 0;

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ uploads, data }));
    } catch {
      // Sin almacenamiento el estado dura lo que la sesión: no debe interrumpir la subida.
    }
  }, [storageKey, uploads, data]);

  useEffect(() => {
    if (!hasActive) return;
    const timer = setInterval(() => setUploads((current) => tick(current, TICK_MS / 1000, online)), TICK_MS);
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => {
      clearInterval(timer);
      window.removeEventListener("beforeunload", warn);
    };
  }, [hasActive, online]);

  const forgetRemoved = useCallback((key: string) => {
    setRemoved((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }, []);

  const choose = useCallback((hilera: number, lado: Side, file: File | undefined) => {
    if (!file) return;
    const key = uploadKey(hilera, lado);
    const problem = validateVideo(file);
    setErrors((current) => {
      const next = { ...current };
      if (problem) next[key] = problem;
      else delete next[key];
      return next;
    });
    if (problem) return;
    forgetRemoved(key);
    setUploads((current) => addUpload(current, hilera, lado, file));
  }, [forgetRemoved]);

  const cancel = useCallback((hilera: number, lado: Side) => {
    const key = uploadKey(hilera, lado);
    const upload = uploads[key];
    // Sin vídeo anterior al que volver, se puede deshacer igual que al quitar.
    if (upload && !upload.previous) setRemoved((current) => ({ ...current, [key]: upload }));
    setUploads((current) => cancelUpload(current, hilera, lado));
  }, [uploads]);

  const remove = useCallback((hilera: number, lado: Side) => {
    const key = uploadKey(hilera, lado);
    const upload = uploads[key];
    if (!upload) return;
    setRemoved((current) => ({ ...current, [key]: upload }));
    setUploads((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }, [uploads]);

  const undoRemove = useCallback((hilera: number, lado: Side) => {
    const key = uploadKey(hilera, lado);
    const upload = removed[key];
    if (!upload) return;
    setUploads((current) => ({ ...current, [key]: upload }));
    forgetRemoved(key);
  }, [forgetRemoved, removed]);

  return { uploads, removed, data, setData, errors, online, summary, choose, cancel, remove, undoRemove };
}
