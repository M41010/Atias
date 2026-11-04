/** Textos de la revisión de calidad de un vídeo recibido. */

export type VideoQuality = { estado: "pendiente" | "ok" | "avisos" | "error"; avisos: string[] };

const MESSAGES: Record<string, string> = {
  POCA_LUZ: "Imagen muy oscura",
  SOBREEXPUESTO: "Demasiada luz: hay zonas quemadas",
  DESENFOCADO: "Imagen movida o desenfocada",
  MUY_CORTO: "Muy corto para recorrer una hilera",
  ILEGIBLE: "No se ha podido leer el vídeo",
};

export const qualityMessages = (quality: VideoQuality | undefined): string[] =>
  (quality?.avisos ?? []).map((code) => MESSAGES[code] ?? "Hay un problema con este vídeo");
