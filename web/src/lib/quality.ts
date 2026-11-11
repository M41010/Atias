/** Textos de la revisión de calidad de un vídeo recibido. */

/** Medidas de la revisión. Solo llegan a la cooperativa; null si aún no hay o no se pudo leer. */
export type QualityMeasures = {
  duracionS: number | null;
  anchura: number | null;
  altura: number | null;
  /** Brillo medio, de 0 a 255. */
  brillo: number | null;
  /** Parte de la imagen quemada, de 0 a 1. */
  sobreexpuesto: number | null;
  /** Varianza del laplaciano: más es más nítido. */
  nitidez: number | null;
};

export type VideoQuality = { estado: "pendiente" | "ok" | "avisos" | "error"; avisos: string[]; medidas?: QualityMeasures | null };

const MESSAGES: Record<string, string> = {
  POCA_LUZ: "Imagen muy oscura",
  SOBREEXPUESTO: "Demasiada luz: hay zonas quemadas",
  DESENFOCADO: "Imagen movida o desenfocada",
  MUY_CORTO: "Muy corto para recorrer una hilera",
  BAJA_RESOLUCION: "Resolución baja: hace falta el vídeo original, en 4K o 1080p",
  ILEGIBLE: "No se ha podido leer el vídeo",
};

export const qualityMessages = (quality: VideoQuality | undefined): string[] =>
  (quality?.avisos ?? []).map((code) => MESSAGES[code] ?? "Hay un problema con este vídeo");
