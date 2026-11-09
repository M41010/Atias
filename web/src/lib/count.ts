/** Frutos contados por el detector en un vídeo, por tramo de hilera. */

export type VideoCount = {
  estado: "pendiente" | "ok" | "error";
  resultado: {
    detector: string;
    maduros: number;
    frutos: number;
    tramos: { n: number; maduros: number; clases: Record<string, number> }[];
    posicion: "desplazamiento" | "tiempo";
    avisos: string[];
  } | null;
};

const MESSAGES: Record<string, string> = {
  POSICION_POR_TIEMPO: "Tramos repartidos por tiempo: la cámara apenas avanzó",
  POCA_LUZ: "Imagen muy oscura: puede faltar fruta",
  DESENFOCADO: "Imagen movida: puede faltar fruta",
  FRUTOS_SIN_CLASE: "Muchos frutos sin clasificar por madurez",
  DETECTOR_DE_PRUEBA: "Contado con un detector de prueba, no entrenado",
};

export const countMessages = (count: VideoCount | undefined): string[] =>
  (count?.resultado?.avisos ?? []).map((code) => MESSAGES[code] ?? "Revisa este conteo");

/** Texto corto del estado del conteo. */
export function countSummary(count: VideoCount | undefined): string {
  if (!count || count.estado === "pendiente") return "Sin contar todavía";
  if (count.estado === "error" || !count.resultado) return "No se han podido contar los frutos";
  const { maduros } = count.resultado;
  return `${new Intl.NumberFormat("es-ES").format(maduros)} ${maduros === 1 ? "fruto maduro" : "frutos maduros"}`;
}
