"use client";

/**
 * Gráficos de producción hechos a mano en SVG: columnas agrupadas (por periodo o por día) y barras
 * por familia. Lo usan Producción, la tendencia de Resumen y los kilos por día de Previsión diaria.
 *
 * Colores por serie, siempre los mismos: lo recogido en Verde Hoja (lo observado), la previsión de
 * Atias en Ámbar Señal (lo experimental) y la del técnico en azul, el único color que no es un token
 * de la app: hacía falta un tercer tono que se distinga de los otros dos también con daltonismo
 * (comprobado con el validador de paleta). El ámbar tiene 2,95:1 sobre blanco, por eso cada gráfico
 * lleva leyenda y su tabla con las mismas cifras.
 */

import { type KeyboardEvent, type ReactNode, type RefObject, useLayoutEffect, useRef, useState } from "react";
import { fmtKg } from "@/lib/format";

export const TECHNICIAN_BLUE = "#2a78d6";

export type SeriesId = "real" | "technician" | "atias";
export const SERIES: Record<SeriesId, { name: string; short: string; color: string }> = {
  real: { name: "Recogido", short: "R", color: "var(--color-brand)" },
  technician: { name: "Previsión del técnico", short: "Téc.", color: TECHNICIAN_BLUE },
  atias: { name: "Previsto por Atias", short: "Atias", color: "var(--color-warn)" },
};

export type ChartSeries = { id: SeriesId; values: (number | null)[] };
export type ChartCategory = { key: string; label: string; short: string; notes?: string[] };

/** Ancho del contenedor, al día con cada cambio de tamaño (el SVG se dibuja en píxeles reales). */
export function useWidth<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

/** Paso «redondo» (1, 2, 2,5 o 5 por potencia de diez) para que el eje lea cifras limpias. */
function niceStep(raw: number): number {
  const power = 10 ** Math.floor(Math.log10(raw));
  const f = raw / power;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * power;
}

export function axisTicks(max: number, count = 4): number[] {
  if (!(max > 0)) return [0];
  const step = niceStep(max / count);
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}

const compact = new Intl.NumberFormat("es-ES", { notation: "compact", maximumFractionDigits: 1 });
/** Un solo estilo por eje: en cifras completas bajo 10.000 y compactas (12 mil) a partir de ahí. */
export const tickFormat = (top: number) => (value: number) => (top >= 10_000 ? compact.format(value) : fmtKg(value));

export const kgText = (value: number | null) => (value === null ? "sin dato" : `${fmtKg(value)} kg`);

/** Columna con la punta redondeada (4 px) y la base recta, sobre la línea de cero. */
function columnPath(x: number, y: number, w: number, h: number): string {
  const r = Math.min(4, h, w / 2);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

export function Legend({ ids, after }: { ids: SeriesId[]; after?: Partial<Record<SeriesId, ReactNode>> }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
      {ids.map((id) => (
        <li key={id} className="flex items-center gap-1.5">
          <svg width="10" height="10" aria-hidden className="shrink-0">
            <rect width="10" height="10" rx="2" fill={SERIES[id].color} />
          </svg>
          {SERIES[id].name}
          {after?.[id]}
        </li>
      ))}
    </ul>
  );
}

/** Tarjeta flotante: la cifra primero y el nombre de la serie después, con su trazo de color. */
export function Tooltip({ x, width, gap, top, title, rows, notes }: {
  /** Centro de la marca; la tarjeta va a su lado (a la derecha en la mitad izquierda, y al revés). */
  x: number;
  width: number;
  /** Separación desde el centro, para no tapar la marca. */
  gap: number;
  top: number;
  title: string;
  rows: { id: SeriesId; value: number | null }[];
  notes?: string[];
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-10 w-max max-w-[15rem] rounded-md border border-line bg-surface px-3 py-2 text-sm shadow-[0_4px_12px_rgb(20_30_24/0.12)]"
      style={x < width / 2
        ? { left: Math.max(0, x + gap), top, maxWidth: Math.max(160, width - x - gap) }
        : { right: Math.max(0, width - x + gap), top, maxWidth: Math.max(160, x - gap) }}
    >
      <p className="mb-1 text-xs font-medium text-muted">{title}</p>
      <ul className="grid gap-0.5">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center gap-2">
            <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: SERIES[row.id].color }} />
            <span className="font-semibold tabular-nums text-ink">{row.value === null ? "—" : `${fmtKg(row.value)} kg`}</span>
            <span className="text-xs text-muted">{SERIES[row.id].name}</span>
          </li>
        ))}
      </ul>
      {notes?.map((note) => <p key={note} className="mt-1 text-xs text-warn-ink">{note}</p>)}
    </div>
  );
}

const LEFT = 52;
const RIGHT = 8;
const TOP = 12;
const AXIS = 28;
const GAP = 2;

/**
 * Columnas agrupadas: una agrupación por periodo o día, una columna por serie. El grupo entero es
 * la zona de puntero y de teclado (flechas para moverse), y la tarjeta enseña todas las series.
 * Un dato que falta no se dibuja como cero: no hay columna y la tarjeta dice «—».
 */
export function GroupedColumns({ categories, series, height = 220, label }: {
  categories: ChartCategory[];
  series: ChartSeries[];
  height?: number;
  label: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const [focused, setFocused] = useState(false);
  const groups = useRef<(SVGRectElement | null)[]>([]);

  const values = series.flatMap((s) => s.values).filter((v): v is number => v !== null);
  const ticks = axisTicks(Math.max(0, ...values));
  const top = ticks[ticks.length - 1] || 1;
  const fmtTick = tickFormat(top);
  const plotH = height - TOP - AXIS;
  const plotW = Math.max(0, width - LEFT - RIGHT);
  const band = categories.length > 0 ? plotW / categories.length : 0;
  const k = series.length;
  const barW = Math.max(2, Math.min(24, (band * 0.72 - GAP * (k - 1)) / k));
  const groupW = barW * k + GAP * (k - 1);
  const y = (v: number) => TOP + plotH - (v / top) * plotH;
  // Rótulos del eje sin pisarse: si no caben todos, uno de cada `every`.
  const longest = Math.max(1, ...categories.map((c) => c.short.length));
  const every = Math.max(1, Math.ceil((longest * 7 + 8) / Math.max(band, 1)));

  const move = (event: KeyboardEvent, i: number) => {
    const next = event.key === "ArrowRight" ? i + 1 : event.key === "ArrowLeft" ? i - 1 : null;
    if (next === null || next < 0 || next >= categories.length) return;
    event.preventDefault();
    groups.current[next]?.focus();
  };

  const tip = active === null ? null : categories[active];
  return (
    <div ref={ref} className="relative" onPointerLeave={() => setActive(null)}>
      {width > 0 && (
        <svg width={width} height={height} role="group" aria-label={label} className="block overflow-visible">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={LEFT} x2={width - RIGHT} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth={1} shapeRendering="crispEdges" />
              <text aria-hidden x={LEFT - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular-nums">
                {fmtTick(t)}
              </text>
            </g>
          ))}
          {categories.map((c, i) => {
            const x0 = LEFT + band * i;
            const start = x0 + (band - groupW) / 2;
            return (
              <g key={c.key}>
                {active === i && <rect x={x0 + 2} y={TOP} width={band - 4} height={plotH} rx={4} fill="var(--color-canvas)" />}
                {series.map((s, j) => {
                  const v = s.values[i];
                  if (v === null || v <= 0) return null;
                  return <path key={s.id} d={columnPath(start + j * (barW + GAP), y(v), barW, TOP + plotH - y(v))} fill={SERIES[s.id].color} />;
                })}
                {i % every === 0 && (
                  <text aria-hidden x={x0 + band / 2} y={height - 9} textAnchor="middle" className="fill-muted text-[11px]">
                    {c.short}
                  </text>
                )}
                <rect
                  ref={(el) => { groups.current[i] = el; }}
                  x={x0}
                  y={0}
                  width={band}
                  height={height}
                  fill="transparent"
                  tabIndex={0}
                  role="img"
                  aria-label={`${c.label}: ${series.map((s) => `${SERIES[s.id].name} ${kgText(s.values[i])}`).join(", ")}${c.notes?.length ? `. ${c.notes.join(". ")}` : ""}`}
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => { setActive(i); setFocused(true); }}
                  onBlur={() => { setActive(null); setFocused(false); }}
                  onKeyDown={(event) => move(event, i)}
                  className="outline-none"
                />
              </g>
            );
          })}
          <line x1={LEFT} x2={width - RIGHT} y1={TOP + plotH} y2={TOP + plotH} stroke="var(--color-line-strong)" strokeWidth={1} shapeRendering="crispEdges" />
          {active !== null && focused && (
            <rect x={LEFT + band * active + 1} y={1} width={band - 2} height={height - 2} rx={4} fill="none" stroke="var(--color-ink)" strokeWidth={2} pointerEvents="none" />
          )}
        </svg>
      )}
      {tip && active !== null && (
        <Tooltip
          x={LEFT + band * (active + 0.5)}
          width={width}
          gap={Math.min(band / 2, groupW / 2 + 12)}
          top={8}
          title={tip.label}
          rows={series.map((s) => ({ id: s.id, value: s.values[active] }))}
          notes={tip.notes}
        />
      )}
    </div>
  );
}

/**
 * Barras horizontales por familia, tres finas por fila (recogido, técnico y Atias) con la cifra en
 * la punta. En el móvil el nombre va encima de las barras.
 */
export function FamilyBars({ rows }: {
  rows: { key: string; name: string; values: Record<SeriesId, number | null>; note?: string }[];
}) {
  const ids: SeriesId[] = ["real", "technician", "atias"];
  const max = Math.max(1, ...rows.flatMap((r) => ids.map((id) => r.values[id] ?? 0)));
  return (
    <ul className="grid gap-4">
      {rows.map((row) => (
        <li key={row.key} className="grid gap-1.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
          <div className="text-sm">
            <p className="font-medium">{row.name}</p>
            {row.note && <p className="text-xs text-warn-ink">{row.note}</p>}
          </div>
          <div className="grid gap-[3px]">
            {ids.map((id) => {
              const value = row.values[id];
              return (
                <div key={id} className="flex items-center gap-2" aria-label={`${SERIES[id].name}: ${kgText(value)}`} role="img">
                  {value !== null && value > 0 && (
                    <span
                      className="h-2 rounded-r-[4px]"
                      style={{ width: `calc((100% - 5.5rem) * ${value / max})`, background: SERIES[id].color }}
                    />
                  )}
                  <span className="text-xs tabular-nums text-muted">{value === null ? "—" : fmtKg(value)}</span>
                </div>
              );
            })}
          </div>
        </li>
      ))}
    </ul>
  );
}
