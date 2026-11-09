/** Formato compartido de las respuestas sobre datos de la semana y vídeos. */

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
        maduros: count.maduros,
        frutos: count.frutos,
        tramos: count.tramos.map((t) => ({ n: t.n, maduros: t.maduros, clases: t.clases })),
        posicion: count.posicion,
        avisos: count.avisos,
      }
      : null,
  };
}

export function videoDto(row: Record<string, unknown>) {
  return {
    id: row.id,
    hilera: row.hilera,
    lado: row.lado,
    fileName: row.file_name,
    sizeBytes: Number(row.size_bytes),
    status: row.status,
    receivedAt: row.received_at ?? null,
    calidad: {
      estado: row.quality_status,
      avisos: (row.quality as { avisos?: string[] } | null)?.avisos ?? [],
    },
    conteo: countDto(row),
  };
}
