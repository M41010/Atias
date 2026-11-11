/**
 * Paleta de series de todos los gráficos de la app: lo mismo lleva siempre el mismo color y la misma
 * forma de punto, en Previsión, Producción, la ficha del invernadero, Precisión, Vídeos y Presentar.
 * Los colores viven como tokens en globals.css (--color-serie-*); aquí solo se nombran.
 *
 * - Real / recogido: tinta. Es la referencia, no una previsión más; raya horizontal.
 * - Atias (previsión): Ámbar Señal, porque aún es experimental (la Regla del Ámbar Honesto); rombo.
 * - Atias observado (lo que cuenta la cámara): Verde Hoja, como su banda; triángulo.
 * - Técnico: azul; círculo.  Agricultor: ciruela; cuadrado.
 * - Lado A / lado B: verde azulado y violeta, tonos que no usa ninguna previsión; círculo y cuadrado.
 * - Objetivo: línea Verde Hoja Tinta sobre la zona en Verde Hoja Suave.
 *
 * Validado con el comprobador de paletas (todos los pares, fondo blanco): Atias, técnico, agricultor
 * y observado separan ΔE ≥ 9,8 con daltonismo y ≥ 20,9 con visión normal; lado A y B, 19,2 y 24,7.
 * El ámbar queda en 2,95:1 sobre blanco: todo gráfico con Atias lleva leyenda, forma propia y la
 * tabla con las mismas cifras.
 */

export type SeriesKey = "real" | "atias" | "observado" | "tecnico" | "agricultor" | "ladoA" | "ladoB";
export type MarkShape = "dash" | "diamond" | "triangle" | "circle" | "square";

export const SERIE: Record<SeriesKey, { color: string; shape: MarkShape }> = {
  real: { color: "var(--color-serie-real)", shape: "dash" },
  atias: { color: "var(--color-serie-atias)", shape: "diamond" },
  observado: { color: "var(--color-serie-observado)", shape: "triangle" },
  tecnico: { color: "var(--color-serie-tecnico)", shape: "circle" },
  agricultor: { color: "var(--color-serie-agricultor)", shape: "square" },
  ladoA: { color: "var(--color-serie-lado-a)", shape: "circle" },
  ladoB: { color: "var(--color-serie-lado-b)", shape: "square" },
};

/** Objetivo o umbral: la línea y la zona que queda dentro. */
export const OBJETIVO = { line: "var(--color-brand-ink)", zone: "var(--color-brand-soft)" } as const;

/** Grados-día (calor acumulado): una magnitud, no una previsión, en naranja. */
export const GRADOS_DIA = "var(--color-serie-grados-dia)";

/**
 * Punto de una serie con su forma. `hollow`: solo el borde (en Precisión, una semana que no cuenta).
 * Lleno lleva un anillo del color de la superficie para leerse al cruzar otra línea.
 */
export function Marker({ shape, x, y, color, size = 5, hollow = false }: {
  shape: MarkShape;
  x: number;
  y: number;
  color: string;
  size?: number;
  hollow?: boolean;
}) {
  if (shape === "dash") {
    return <line x1={x - size * 1.6} x2={x + size * 1.6} y1={y} y2={y} stroke={color} strokeWidth={2.5} strokeLinecap="round" />;
  }
  const paint = hollow
    ? { fill: "var(--color-surface)", stroke: color, strokeWidth: 2 }
    : { fill: color, stroke: "var(--color-surface)", strokeWidth: 2, paintOrder: "stroke" as const };
  if (shape === "circle") return <circle cx={x} cy={y} r={size} {...paint} />;
  if (shape === "square") {
    const s = size * 0.9;
    return <rect x={x - s} y={y - s} width={s * 2} height={s * 2} rx={1.5} {...paint} />;
  }
  if (shape === "triangle") {
    const d = size * 1.2;
    return <path d={`M${x} ${y - d}L${x + d} ${y + d * 0.8}L${x - d} ${y + d * 0.8}Z`} strokeLinejoin="round" {...paint} />;
  }
  const d = size * 1.3;
  return <path d={`M${x} ${y - d}L${x + d} ${y}L${x} ${y + d}L${x - d} ${y}Z`} strokeLinejoin="round" {...paint} />;
}

/** Muestra de leyenda: trazo corto y la forma de la serie encima. Sin trazo para gráficos de puntos. */
export function SeriesSwatch({ serie, line = true, hollow = false, size = 4 }: { serie: SeriesKey; line?: boolean; hollow?: boolean; size?: number }) {
  const s = SERIE[serie];
  return (
    <svg width="26" height="12" viewBox="0 0 26 12" aria-hidden className="shrink-0 overflow-visible">
      {line && s.shape !== "dash" && !hollow && <line x1="1" x2="25" y1="6" y2="6" stroke={s.color} strokeWidth="2" strokeLinecap="round" />}
      <Marker shape={s.shape} x={13} y={6} color={s.color} size={size} hollow={hollow} />
    </svg>
  );
}
