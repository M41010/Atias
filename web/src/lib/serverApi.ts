/** Llamadas reales a la API de Express. Pasan por la propia web, en el mismo origen. */

import type { CropId } from "./simulated";
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

// ---- Cosecha real ----
export type HarvestScope = "lunes_jueves" | "cosecha_inmediata";
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
