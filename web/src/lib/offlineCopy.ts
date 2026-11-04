/**
 * Copia local de solo lectura para la cooperativa, guardada en este dispositivo.
 * Nunca incluye datos del agricultor ni enlaces: solo lo que aparece en SAVED_KEYS.
 */

import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { queryOptions } from "@tanstack/react-query";
import { del, get, set } from "idb-keyval";
import { ApiError, fetchHarvestList, fetchHarvestOverview, fetchHarvestRecords } from "./serverApi";

const STORAGE_KEY = "atias-copia";
/** Una recolección dura una semana: una copia más antigua llevaría a decidir con datos pasados. */
export const COPY_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
/** Se cambia cuando cambie la forma de los datos, para descartar las copias anteriores. */
export const COPY_VERSION = "1";

const USER_KEY = "usuario";
const SAVED_KEYS = new Set([USER_KEY, "recolecciones-reales", "videos-recibidos", "cosecha"]);

export const harvestListQuery = () =>
  queryOptions({ queryKey: ["recolecciones-reales"], queryFn: fetchHarvestList });

export const harvestOverviewQuery = (id: string) =>
  queryOptions({ queryKey: ["videos-recibidos", id], queryFn: () => fetchHarvestOverview(id) });

export const harvestRecordsQuery = (id: string) =>
  queryOptions({ queryKey: ["cosecha", id], queryFn: () => fetchHarvestRecords(id) });

type QueryLike = {
  queryKey: readonly unknown[];
  state: { data: unknown; dataUpdatedAt: number; status: string };
};

/**
 * Se guarda aunque la última actualización haya fallado: es justo cuando más falta hace,
 * y si se descartara, la primera consulta sin conexión borraría la copia.
 */
export const shouldSave = ({ queryKey, state }: QueryLike): boolean =>
  SAVED_KEYS.has(String(queryKey[0])) && state.data !== undefined;

/** Sin conexión, reintentar dejaría la pantalla cargando para siempre en vez de avisar. */
export const shouldRetry = (count: number, error: unknown, online: boolean): boolean =>
  online && !(error instanceof ApiError && error.status < 500) && count < 1;

export type CopyStatus = { savedAt: number | null; failing: boolean };

/** Qué hay en pantalla: la fecha del dato más antiguo y si alguno no se ha podido actualizar. */
export function copyStatus(queries: QueryLike[]): CopyStatus {
  const shown = queries.filter((q) => q.queryKey[0] !== USER_KEY && shouldSave(q));
  return {
    savedAt: shown.length > 0 ? Math.min(...shown.map((q) => q.state.dataUpdatedAt)) : null,
    failing: shown.some((q) => q.state.status === "error"),
  };
}

let copyCleared = false;

// Sin almacenamiento disponible (navegación privada, disco lleno) la app funciona igual, sin copia.
export const copyStorage = {
  getItem: (key: string) => get<string>(key).then((value) => value ?? null, () => null),
  // Las escrituras van retrasadas: una pendiente no debe recuperar la copia ya borrada.
  setItem: async (key: string, value: string) => {
    if (!copyCleared) await set(key, value).catch(() => undefined);
  },
  removeItem: (key: string) => del(key).catch(() => undefined),
};

export const copyPersister = createAsyncStoragePersister({
  key: STORAGE_KEY,
  throttleTime: 1000,
  storage: copyStorage,
});

/**
 * Borra la copia de este dispositivo, al cerrar sesión o si esta ya no es válida. Esta página ya
 * no vuelve a escribirla, así que después hay que hacer una carga completa.
 */
export const clearOfflineCopy = (): Promise<void> => {
  copyCleared = true;
  return del(STORAGE_KEY).catch(() => undefined);
};

/** Registra el service worker. Solo existe en HTTPS o localhost; sin él, la copia sigue en la pestaña. */
export function registerOfflineScreens(): void {
  if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
  void navigator.serviceWorker
    .register("/sw.js")
    .then(() => navigator.serviceWorker.ready)
    .then((registration) => registration.active?.postMessage("guardar-pantallas"))
    .catch(() => undefined);
}
