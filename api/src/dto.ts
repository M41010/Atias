/** Formato compartido de las respuestas sobre datos de la semana y vídeos. */

import { recordingOf } from "./recording.js";

export const weeklyColumns = `
  w.variety, COALESCE(w.hileras, g.default_hileras) AS hileras, w.longitud_m, w.temperatura_c,
  w.humedad_pct, w.kilos_semana_pasada`;

export function weeklyData(row: Record<string, unknown>) {
  return {
    variety: row.variety ?? "",
    hileras: row.hileras,
    longitudM: row.longitud_m ?? null,
    temperaturaC: row.temperatura_c ?? null,
    humedadPct: row.humedad_pct ?? null,
    kilosSemanaPasada: row.kilos_semana_pasada ?? null,
  };
}

type Count = {
  detector: string;
  maduros: number;
  frutos: number;
  tramos: { n: number; maduros: number; clases: Record<string, number> }[];
  posicion: string;
  avisos: string[];
};

/** Frutos contados por el detector. Solo se envía lo que la pantalla necesita. */
function countDto(row: Record<string, unknown>) {
  const count = row.count as Count | null;
  return {
    estado: row.count_status ?? "pendiente",
    resultado: count
      ? {
        detector: count.detector,
        maduros: count.maduros ?? 0,
        frutos: count.frutos ?? 0,
        // Un conteo guardado a medias no debe tumbar la lista de vídeos.
        tramos: (count.tramos ?? []).map((t) => ({ n: t.n, maduros: t.maduros, clases: t.clases })),
        posicion: count.posicion,
        avisos: count.avisos ?? [],
      }
      : null,
  };
}

/** Vídeos vigentes de una recolección, con el nombre de quien los subió desde la cooperativa. */
export const RECEIVED_VIDEOS_SQL = `
  SELECT v.*, u.name AS uploaded_by_name FROM videos v
  LEFT JOIN users u ON u.id = v.uploaded_by
  WHERE v.harvest_id = $1 AND v.status = 'recibido'
  ORDER BY v.hilera, v.lado`;

/** Medidas de la revisión de calidad: solo las cifras conocidas. Sin medidas (pendiente, ilegible), null. */
function qualityMeasures(row: Record<string, unknown>) {
  const measures = (row.quality as { medidas?: unknown } | null)?.medidas;
  if (!measures || typeof measures !== "object") return null;
  const num = (key: string) => {
    const value = (measures as Record<string, unknown>)[key];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  };
  return {
    duracionS: num("duracionS"),
    anchura: num("anchura"),
    altura: num("altura"),
    brillo: num("brillo"),
    sobreexpuesto: num("sobreexpuesto"),
    nitidez: num("nitidez"),
  };
}

/** Para la cooperativa: además, las medidas de la revisión de calidad, para ver por qué avisa. */
export function coopVideoDto(row: Record<string, unknown>) {
  const video = videoDto(row);
  return { ...video, calidad: { ...video.calidad, medidas: qualityMeasures(row) } };
}

export function videoDto(row: Record<string, unknown>) {
  const origen = row.uploaded_via === "cooperativa" ? "cooperativa" : "agricultor";
  return {
    id: row.id,
    hilera: row.hilera,
    lado: row.lado,
    fileName: row.file_name,
    sizeBytes: Number(row.size_bytes),
    status: row.status,
    receivedAt: row.received_at ?? null,
    grabacion: recordingOf(row),
    // Quién lo subió. Lo subido por la cooperativa es de prueba: entra en los cálculos, pero
    // queda marcado para poder apartarlo más adelante.
    origen,
    dePrueba: origen === "cooperativa",
    // Nombre de la persona de la cooperativa; solo en las consultas que lo cruzan con users.
    subidoPor: (row.uploaded_by_name as string | null | undefined) ?? null,
    calidad: {
      estado: row.quality_status,
      avisos: (row.quality as { avisos?: string[] } | null)?.avisos ?? [],
    },
    conteo: countDto(row),
  };
}
