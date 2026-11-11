/** Llamadas reales a la API de Express. Pasan por la propia web, en el mismo origen. */

import type { CropId } from "./simulated";
import type { VideoRecording } from "./recording";
import type { FarmerData, ServerVideo } from "./upload";

export const LINK_HEADER = "x-atias-enlace";
export const UPLOADS_ENDPOINT = "/api/subidas";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request(path: string, init: RequestInit = {}, token?: string): Promise<Response> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(token ? { [LINK_HEADER]: token } : {}),
    },
  }).catch(() => {
    // El navegador da este error en inglés, y las pantallas lo muestran.
    throw new Error("No se ha podido conectar con el servidor.");
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new ApiError(response.status, body?.error ?? "El servidor no ha respondido.");
  }
  return response;
}

export type LinkInfo = {
  invernadero: { id: string; nombre: string; cultivo: CropId };
  recoleccion: { id: string; etiqueta: string };
  datos: FarmerData;
  videos: ServerVideo[];
};

export const fetchLink = async (token: string): Promise<LinkInfo> =>
  (await request("/api/enlace", {}, token)).json();

export const saveWeeklyData = async (token: string, data: FarmerData): Promise<void> => {
  await request("/api/enlace/datos", { method: "PUT", body: JSON.stringify(data) }, token);
};

export const deleteVideo = async (token: string, id: string): Promise<void> => {
  await request(`/api/enlace/videos/${encodeURIComponent(id)}`, { method: "DELETE" }, token);
};

export const restoreVideo = async (token: string, id: string): Promise<void> => {
  await request(`/api/enlace/videos/${encodeURIComponent(id)}/restaurar`, { method: "POST" }, token);
};

export type HarvestOverview = {
  id: string;
  etiqueta: string;
  invernaderos: {
    id: string;
    nombre: string;
    cultivo: CropId;
    datos: FarmerData;
    videos: ServerVideo[];
  }[];
};

export const fetchHarvestList = async (): Promise<{ id: string; etiqueta: string }[]> =>
  ((await (await request("/api/cooperativa/recolecciones")).json()) as { recolecciones: { id: string; etiqueta: string }[] }).recolecciones;

/** Corrige cuándo se grabó un vídeo: AAAA-MM-DDTHH:MM en hora de España, o null para volver a la del vídeo. */
export const saveRecordingDate = async (videoId: string, fecha: string | null): Promise<VideoRecording> =>
  (await request(`/api/cooperativa/videos/${encodeURIComponent(videoId)}/grabacion`, { method: "PUT", body: JSON.stringify({ fecha }) })).json();

export const fetchHarvestOverview = async (id: string): Promise<HarvestOverview> =>
  (await request(`/api/cooperativa/recolecciones/${encodeURIComponent(id)}`)).json();

// ---- Acceso de la cooperativa ----
export type CurrentUser = { nombre: string; correo: string };

export const fetchCurrentUser = async (): Promise<CurrentUser> =>
  (await request("/api/auth/yo")).json();

export const signIn = async (correo: string, contrasena: string): Promise<CurrentUser> =>
  (await request("/api/auth/entrar", { method: "POST", body: JSON.stringify({ correo, contrasena }) })).json();

export const signOut = async (): Promise<void> => {
  await request("/api/auth/salir", { method: "POST" });
};

// ---- Enlaces e invernaderos ----
export type UpcomingHarvest = { inicio: string; id: string; etiqueta: string };
export type LinkRow = {
  id: string;
  nombre: string;
  cultivo: CropId;
  enlace: { id: string; creadoEn: string; caducaEn: string | null } | null;
};

export const fetchUpcomingHarvests = async (): Promise<UpcomingHarvest[]> =>
  ((await (await request("/api/cooperativa/proximas-recolecciones")).json()) as { recolecciones: UpcomingHarvest[] }).recolecciones;

export const fetchLinks = async (inicio: string): Promise<{ recoleccion: UpcomingHarvest; invernaderos: LinkRow[] }> =>
  (await request(`/api/cooperativa/enlaces?inicio=${encodeURIComponent(inicio)}`)).json();

export const createLink = async (invernaderoId: string, inicio: string): Promise<{ id: string; token: string; caducaEn: string }> =>
  (await request("/api/cooperativa/enlaces", { method: "POST", body: JSON.stringify({ invernaderoId, inicio }) })).json();

export const revokeLink = async (id: string): Promise<void> => {
  await request(`/api/cooperativa/enlaces/${encodeURIComponent(id)}/revocar`, { method: "POST" });
};

export const createGreenhouse = async (nombre: string, cultivo: CropId, hileras: number): Promise<void> => {
  await request("/api/cooperativa/invernaderos", { method: "POST", body: JSON.stringify({ nombre, cultivo, hileras }) });
};

// ---- Subir vídeos desde la cooperativa ----
export type UploadHarvest = { id: string; etiqueta: string; inicio: string };
export type UploadTargets = {
  recoleccion: { id: string; etiqueta: string };
  invernaderos: { id: string; nombre: string; cultivo: CropId; hileras: number; videos: ServerVideo[] }[];
};

export const fetchUploadHarvests = async (): Promise<{ recolecciones: UploadHarvest[]; propuesta: string }> =>
  (await request("/api/cooperativa/subidas")).json();

export const fetchUploadTargets = async (harvestId: string): Promise<UploadTargets> =>
  (await request(`/api/cooperativa/subidas/${encodeURIComponent(harvestId)}`)).json();

/** Retira una subida sin terminar. Lo ya recibido sigue vigente. */
export const discardUpload = async (videoId: string): Promise<void> => {
  await request(`/api/cooperativa/subidas/videos/${encodeURIComponent(videoId)}/descartar`, { method: "POST" });
};

// ---- Cosecha real ----
export type HarvestScope = "lunes_viernes" | "cosecha_inmediata";
export type HarvestRecord = { kg: number; registradoPor: string; registradoEn: string };
export type HarvestRecords = {
  id: string;
  etiqueta: string;
  invernaderos: {
    id: string;
    nombre: string;
    cultivo: CropId;
    registros: Record<HarvestScope, HarvestRecord | null>;
  }[];
};

export const fetchHarvestRecords = async (harvestId: string): Promise<HarvestRecords> =>
  (await request(`/api/cooperativa/recolecciones/${encodeURIComponent(harvestId)}/cosecha`)).json();

export const saveHarvestRecord = async (
  harvestId: string,
  greenhouseId: string,
  scope: HarvestScope,
  kg: number | null,
): Promise<void> => {
  await request(
    `/api/cooperativa/recolecciones/${encodeURIComponent(harvestId)}/cosecha/${encodeURIComponent(greenhouseId)}/${scope}`,
    { method: "PUT", body: JSON.stringify({ kg }) },
  );
};

// ---- Datos de campo: lo necesario para calcular con datos reales y medir el acierto ----
export type FieldFamily = { id: string; nombre: string; cultivo: CropId };
export type DayValues = (number | null)[];
export type ControlCount = {
  etiqueta: string;
  hilera: number;
  lado: "A" | "B";
  /** Metros desde la cabecera donde empieza y acaba la cinta. */
  inicioM: number;
  finM: number;
  /** Maduros visibles desde el pasillo, sin tocar las hojas. */
  visibles: number;
  /** Todos los maduros, apartando las hojas. */
  total: number | null;
  recogidos: number | null;
  pesoG: number | null;
  nota: string;
};
export type ControlWithAtias = ControlCount & {
  /** Maduros que contó Atias entre las dos cintas, o el motivo por el que aún no se puede saber. */
  atias: { frutos: number | null; motivo: "sin_video" | "sin_contar" | "sin_longitud" | "sin_posiciones" | "fuera_de_hilera" | null };
};
export type FieldGreenhouse = {
  id: string;
  nombre: string;
  cultivo: CropId;
  familia: { id: string; nombre: string } | null;
  agricultor: string | null;
  tecnico: string | null;
  ubicacion: { municipio: string; latitud: number; longitud: number } | null;
  hileras: number;
  tramos: number;
  longitudHileraM: number | null;
  variedad: string;
  muestra: { frutos: number; gramos: number } | null;
  videos: ServerVideo[];
  previsiones: { agricultor: DayValues; tecnico: DayValues };
  real: DayValues;
  cosecha: { lunesViernes: number | null; inmediata: number | null };
  controles: ControlWithAtias[];
};
export type FieldData = { id: string; etiqueta: string; dias: string[]; invernaderos: FieldGreenhouse[] };
export type FieldSheet = {
  familia: string | null;
  municipio: string | null;
  latitud: number | null;
  longitud: number | null;
  hileras: number;
  longitudHileraM: number | null;
  muestra: { frutos: number; gramos: number } | null;
};

const fieldPath = (harvestId: string, greenhouseId: string, rest: string) =>
  `/api/cooperativa/recolecciones/${encodeURIComponent(harvestId)}/campo/${encodeURIComponent(greenhouseId)}/${rest}`;

export const fetchFamilies = async (): Promise<FieldFamily[]> =>
  ((await (await request("/api/cooperativa/familias")).json()) as { familias: FieldFamily[] }).familias;

export const fetchFieldData = async (harvestId: string): Promise<FieldData> =>
  (await request(`/api/cooperativa/recolecciones/${encodeURIComponent(harvestId)}/campo`)).json();

export const saveForecast = async (harvestId: string, greenhouseId: string, source: "agricultor" | "tecnico", days: DayValues) => {
  await request(fieldPath(harvestId, greenhouseId, `previsiones/${source}`), { method: "PUT", body: JSON.stringify({ dias: days }) });
};

export const saveDailyHarvest = async (harvestId: string, greenhouseId: string, days: DayValues) => {
  await request(fieldPath(harvestId, greenhouseId, "real"), { method: "PUT", body: JSON.stringify({ dias: days }) });
};

export const saveControls = async (harvestId: string, greenhouseId: string, controls: ControlCount[]) => {
  await request(fieldPath(harvestId, greenhouseId, "controles"), { method: "PUT", body: JSON.stringify({ controles: controls }) });
};

export const saveFieldSheet = async (harvestId: string, greenhouseId: string, sheet: FieldSheet) => {
  await request(fieldPath(harvestId, greenhouseId, "ficha"), { method: "PUT", body: JSON.stringify(sheet) });
};
