/**
 * Datos de los gráficos de «Vídeos recibidos»: estado de cada lado, perfil de la hilera por tramos
 * y medidas de calidad frente a sus umbrales. Sin React, para poder probarlo.
 */

import { countMessages, type VideoCount } from "../../lib/count";
import { type QualityMeasures, qualityMessages } from "../../lib/quality";
import type { ServerVideo, Side } from "../../lib/upload";

export const SIDES: Side[] = ["A", "B"];

// ---- Estado de cada lado ----

export type SideState = "analizado" | "recibido" | "analizando" | "problema" | "falta";

export const STATE_LABELS: Record<SideState, string> = {
  analizado: "Analizado",
  recibido: "Recibido, sin contar",
  analizando: "Revisando la imagen",
  problema: "Con problema",
  falta: "Falta",
};

/** Orden de la leyenda: primero lo que pide atención. */
export const STATE_ORDER: SideState[] = ["falta", "problema", "analizando", "recibido", "analizado"];

export type SideStatus = {
  lado: Side;
  estado: SideState;
  /** Subido por la cooperativa: cuenta, pero se marca como prueba. */
  prueba: boolean;
  /** Motivos del problema, en palabras. */
  motivos: string[];
  video?: ServerVideo;
};

export type RowStatus = { hilera: number; lados: SideStatus[] };

export function sideState(video: ServerVideo | undefined): SideState {
  if (!video) return "falta";
  if (video.calidad.estado === "avisos" || video.calidad.estado === "error" || video.conteo?.estado === "error") return "problema";
  if (video.conteo?.estado === "ok" && video.conteo.resultado) return "analizado";
  if (video.calidad.estado === "pendiente") return "analizando";
  return "recibido";
}

function reasons(video: ServerVideo | undefined): string[] {
  if (!video) return [];
  const list = [...qualityMessages(video.calidad)];
  if (video.calidad.estado === "error") list.push("No se ha podido revisar la imagen");
  if (video.conteo?.estado === "error") list.push("No se han podido contar los frutos");
  return list;
}

/** Hileras × lados. Incluye hileras de más si llegó un vídeo con un número mayor que el previsto. */
export function statusGrid(hileras: number, videos: ServerVideo[]): RowStatus[] {
  const last = Math.max(hileras, 0, ...videos.map((v) => v.hilera));
  return Array.from({ length: last }, (_, i) => {
    const hilera = i + 1;
    return {
      hilera,
      lados: SIDES.map((lado) => {
        const video = videos.find((v) => v.hilera === hilera && v.lado === lado);
        return { lado, estado: sideState(video), prueba: video?.dePrueba === true, motivos: reasons(video), video };
      }),
    };
  });
}

export function stateCounts(grid: RowStatus[]): Record<SideState, number> {
  const counts: Record<SideState, number> = { analizado: 0, recibido: 0, analizando: 0, problema: 0, falta: 0 };
  for (const row of grid) for (const side of row.lados) counts[side.estado] += 1;
  return counts;
}

/** Frase para el lector de pantalla y la ayuda flotante de una celda. */
export function sideDescription(hilera: number, side: SideStatus): string {
  const parts = [`Hilera ${hilera}, lado ${side.lado}: ${STATE_LABELS[side.estado]}`];
  if (side.motivos.length > 0) parts.push(side.motivos.join(". "));
  const result = side.video?.conteo?.estado === "ok" ? side.video.conteo.resultado : null;
  if (result) parts.push(`${result.maduros} ${result.maduros === 1 ? "fruto maduro" : "frutos maduros"}`);
  if (side.prueba) parts.push("Prueba: subido por la cooperativa");
  return `${parts.join(". ")}.`;
}

/** Hilera que se abre al entrar: la primera con problema, si no la primera analizada, si no la 1. */
export function defaultHilera(grid: RowStatus[]): number | null {
  const first = (state: SideState) => grid.find((row) => row.lados.some((s) => s.estado === state))?.hilera;
  return first("problema") ?? first("analizado") ?? grid[0]?.hilera ?? null;
}

// ---- Perfil de la hilera ----

export type ProfilePoint = {
  /** Tramo, desde la cabecera, empezando en 1. */
  n: number;
  /** Frutos maduros de cada lado; null si ese lado no está contado. */
  valores: Record<Side, number | null>;
  /** Metros desde la cabecera, si se sabe la longitud de la hilera. */
  desdeM: number | null;
  hastaM: number | null;
};

export type RowProfile = {
  puntos: ProfilePoint[];
  /** Lados con conteo, en orden A, B. */
  lados: Side[];
  totales: Record<Side, number | null>;
};

type Tramo = NonNullable<VideoCount["resultado"]>["tramos"][number];

const countedTramos = (video: ServerVideo | undefined): Tramo[] | null =>
  video?.conteo?.estado === "ok" && video.conteo.resultado ? video.conteo.resultado.tramos : null;

/** Frutos maduros por tramo de los dos lados de una hilera. Null si ningún lado está contado. */
export function rowProfile(videos: ServerVideo[], hilera: number, longitudM: number | null): RowProfile | null {
  const bySide = Object.fromEntries(
    SIDES.map((lado) => [lado, countedTramos(videos.find((v) => v.hilera === hilera && v.lado === lado))]),
  ) as Record<Side, Tramo[] | null>;
  const lados = SIDES.filter((lado) => bySide[lado] !== null);
  if (lados.length === 0) return null;
  const tramos = Math.max(...lados.flatMap((lado) => bySide[lado]!.map((t) => t.n)), 0);
  if (tramos === 0) return null;
  const length = longitudM !== null && longitudM > 0 ? longitudM : null;
  const puntos = Array.from({ length: tramos }, (_, i): ProfilePoint => {
    const n = i + 1;
    const value = (lado: Side) => {
      const list = bySide[lado];
      if (!list) return null;
      return list.find((t) => t.n === n)?.maduros ?? 0;
    };
    return {
      n,
      valores: { A: value("A"), B: value("B") },
      desdeM: length === null ? null : round1((i * length) / tramos),
      hastaM: length === null ? null : round1(((i + 1) * length) / tramos),
    };
  });
  const total = (lado: Side) => (bySide[lado] ? bySide[lado]!.reduce((sum, t) => sum + t.maduros, 0) : null);
  return { puntos, lados, totales: { A: total("A"), B: total("B") } };
}

const round1 = (value: number) => Math.round(value * 10) / 10;

/** Máximo de frutos en un tramo de todo el invernadero: misma escala al cambiar de hilera. */
export function greenhouseTramoMax(videos: ServerVideo[]): number {
  let max = 0;
  for (const video of videos) for (const t of countedTramos(video) ?? []) max = Math.max(max, t.maduros);
  return max;
}

/** Marcas redondas del eje: 0 y pasos de 1, 2 o 5 × 10ⁿ hasta cubrir el máximo. */
export function niceTicks(max: number, target = 4): number[] {
  if (!(max > 0)) return [0, 1];
  const raw = max / target;
  const power = 10 ** Math.floor(Math.log10(raw));
  // Frutos enteros: nunca un paso menor que 1.
  const step = Math.max(1, [1, 2, 5, 10].map((m) => m * power).find((s) => s >= raw) ?? 10 * power);
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= top + step / 2; value += step) ticks.push(Math.round(value * 1e6) / 1e6);
  return ticks;
}

// ---- Calidad de la imagen ----

/**
 * Los mismos umbrales que la revisión del servicio de análisis (src/atias/quality.py y
 * src/atias/vision/pipeline.py). Si cambian allí, hay que cambiarlos aquí.
 */
export const QUALITY_LIMITS = {
  brilloMin: 35,
  sobreexpuestoMax: 0.25,
  nitidezMin: 25,
  duracionMinS: 10,
  ladoCortoMin: 1080,
};

export type QualityBar = {
  clave: "brillo" | "sobreexpuesto" | "nitidez" | "resolucion" | "duracion";
  etiqueta: string;
  /** Valor en la escala del gráfico; null si no hay medida. */
  valor: number | null;
  texto: string;
  umbral: number;
  /** «min»: por debajo del umbral avisa. «max»: por encima avisa. */
  sentido: "min" | "max";
  umbralTexto: string;
  escalaMax: number;
  /** null si no hay medida. */
  ok: boolean | null;
};

const fmt = (value: number, digits = 0) => new Intl.NumberFormat("es-ES", { maximumFractionDigits: digits }).format(value);

/** Techo redondo para escalas sin máximo natural (nitidez, duración). */
function roundUp(value: number, floor: number): number {
  if (value <= floor) return floor;
  const power = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / power) * power;
}

export function qualityBars(measures: QualityMeasures | null | undefined): QualityBar[] {
  const m = measures ?? null;
  const L = QUALITY_LIMITS;
  const bar = (b: Omit<QualityBar, "ok">): QualityBar => ({
    ...b,
    ok: b.valor === null ? null : b.sentido === "min" ? b.valor >= b.umbral : b.valor <= b.umbral,
  });
  const shortSide = m && m.anchura !== null && m.altura !== null && m.anchura > 0 && m.altura > 0 ? Math.min(m.anchura, m.altura) : null;
  const brillo = m?.brillo ?? null;
  const sobre = m?.sobreexpuesto ?? null;
  const nitidez = m?.nitidez ?? null;
  const duracion = m?.duracionS ?? null;
  return [
    bar({
      clave: "brillo", etiqueta: "Luz", valor: brillo, sentido: "min", umbral: L.brilloMin, escalaMax: 255,
      texto: brillo === null ? "Sin medida" : `${fmt(brillo)} de 255`, umbralTexto: `Mínimo ${L.brilloMin}`,
    }),
    bar({
      clave: "sobreexpuesto", etiqueta: "Zonas quemadas", valor: sobre === null ? null : sobre * 100, sentido: "max",
      umbral: L.sobreexpuestoMax * 100, escalaMax: 100,
      texto: sobre === null ? "Sin medida" : `${fmt(sobre * 100, 1)} %`, umbralTexto: `Máximo ${fmt(L.sobreexpuestoMax * 100)} %`,
    }),
    bar({
      clave: "nitidez", etiqueta: "Nitidez", valor: nitidez, sentido: "min", umbral: L.nitidezMin,
      escalaMax: roundUp(nitidez ?? 0, L.nitidezMin * 4),
      texto: nitidez === null ? "Sin medida" : fmt(nitidez), umbralTexto: `Mínimo ${L.nitidezMin}`,
    }),
    bar({
      clave: "resolucion", etiqueta: "Resolución", valor: shortSide, sentido: "min", umbral: L.ladoCortoMin,
      escalaMax: Math.max(2160, shortSide ?? 0),
      texto: shortSide === null ? "Sin medida" : `${m!.anchura} × ${m!.altura}`, umbralTexto: `Mínimo ${L.ladoCortoMin}p`,
    }),
    bar({
      clave: "duracion", etiqueta: "Duración", valor: duracion, sentido: "min", umbral: L.duracionMinS,
      escalaMax: roundUp(duracion ?? 0, 60),
      texto: duracion === null ? "Sin medida" : `${fmt(duracion)} s`, umbralTexto: `Mínimo ${L.duracionMinS} s`,
    }),
  ];
}

/** Avisos del conteo de un vídeo, para mostrar junto al perfil. */
export const countNotes = (video: ServerVideo | undefined): string[] => countMessages(video?.conteo);
