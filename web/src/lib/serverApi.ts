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
