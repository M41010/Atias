"use client";

/**
 * «Tendencia de la temporada» en Resumen: kilos totales por semana, lo recogido frente a lo previsto
 * por Atias, en dos líneas. Una línea vertical sigue al puntero y se queda en la semana más cercana.
 */

import { type KeyboardEvent, type PointerEvent, useState } from "react";
import type { Period } from "@/lib/produccion";
import { realIncomplete } from "@/lib/produccion";
import { axisTicks, type SeriesId, SERIES, tickFormat, Tooltip, useWidth } from "./Produccion";
import { Marker } from "./series";

const LEFT = 52;
const RIGHT = 16;
const TOP = 12;
const AXIS = 26;

/** Tramos sin huecos: un dato que falta corta la línea en vez de bajarla a cero. */
function segments(points: ({ x: number; y: number } | null)[]): string[] {
  const paths: string[] = [];
  let current = "";
  for (const p of points) {
    if (p === null) {
      if (current) paths.push(current);
      current = "";
    } else {
      current += `${current ? "L" : "M"}${p.x},${p.y}`;
    }
  }
  if (current) paths.push(current);
  return paths;
}

export function TendenciaTemporada({ weeks, height = 168 }: { weeks: Period[]; height?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const [focused, setFocused] = useState(false);

  const ids: SeriesId[] = ["real", "atias"];
  const value = (p: Period, id: SeriesId) => (id === "real" ? p.total.real : p.total.atias);
  const all = weeks.flatMap((p) => ids.map((id) => value(p, id))).filter((v): v is number => v !== null);
  const ticks = axisTicks(Math.max(0, ...all), 3);
  const top = ticks[ticks.length - 1] || 1;
  const fmtTick = tickFormat(top);
  const plotH = height - TOP - AXIS;
  const plotW = Math.max(0, width - LEFT - RIGHT);
  const step = weeks.length > 1 ? plotW / (weeks.length - 1) : 0;
  const x = (i: number) => LEFT + (weeks.length > 1 ? step * i : plotW / 2);
  const y = (v: number) => TOP + plotH - (v / top) * plotH;
  const every = Math.max(1, Math.ceil(36 / Math.max(step, 1)));

  const nearest = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!box || step === 0) return setActive(0);
    const px = event.clientX - box.left;
    setActive(Math.max(0, Math.min(weeks.length - 1, Math.round((px - LEFT) / step))));
  };
  const keys = (event: KeyboardEvent) => {
    const current = active ?? weeks.length - 1;
    const next = event.key === "ArrowRight" ? current + 1 : event.key === "ArrowLeft" ? current - 1 : null;
    if (next === null) return;
    event.preventDefault();
    setActive(Math.max(0, Math.min(weeks.length - 1, next)));
  };

  const description = weeks
    .map((p) => `${p.label}: recogido ${p.total.real === null ? "sin dato" : `${Math.round(p.total.real)} kg`}, previsto ${Math.round(p.total.atias)} kg`)
    .join("; ");
  const tip = active === null ? null : weeks[active];
  return (
    <div ref={ref} className="relative">
      {width > 0 && (
        <svg width={width} height={height} className="block overflow-visible" role="group" aria-label={`Kilos por semana. ${description}`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={LEFT} x2={width - RIGHT} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth={1} shapeRendering="crispEdges" />
              <text aria-hidden x={LEFT - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular-nums">{fmtTick(t)}</text>
            </g>
          ))}
          {weeks.map((p, i) => (i % every === 0 || i === weeks.length - 1) && (
            <text aria-hidden key={p.key} x={x(i)} y={height - 8} textAnchor="middle" className="fill-muted text-[11px]">{p.short}</text>
          ))}
          {active !== null && (
            <line x1={x(active)} x2={x(active)} y1={TOP} y2={TOP + plotH} stroke="var(--color-line-strong)" strokeWidth={1} shapeRendering="crispEdges" />
          )}
          {ids.map((id) => {
            const points = weeks.map((p, i) => {
              const v = value(p, id);
              return v === null ? null : { x: x(i), y: y(v) };
            });
            const last = points.findLastIndex((p) => p !== null);
            return (
              <g key={id}>
                {segments(points).map((d) => (
                  <path key={d} d={d} fill="none" stroke={SERIES[id].color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                ))}
                {points.map((p, i) => p && (weeks.length <= 12 || i === last || i === active || (points[i - 1] == null && points[i + 1] == null)) && (
                  <Marker key={i} shape={SERIES[id].shape} x={p.x} y={p.y} size={4} color={SERIES[id].color} />
                ))}
              </g>
            );
          })}
          <rect
            x={LEFT - step / 2}
            y={0}
            width={plotW + step}
            height={height}
            fill="transparent"
            tabIndex={0}
            role="img"
            aria-label="Recorre las semanas con las flechas"
            onPointerMove={nearest}
            onPointerLeave={() => !focused && setActive(null)}
            onFocus={() => { setFocused(true); setActive(weeks.length - 1); }}
            onBlur={() => { setFocused(false); setActive(null); }}
            onKeyDown={keys}
            className="outline-none"
          />
          {focused && <rect x={1} y={1} width={width - 2} height={height - 2} rx={6} fill="none" stroke="var(--color-ink)" strokeWidth={2} pointerEvents="none" />}
        </svg>
      )}
      {tip && active !== null && (
        <Tooltip
          x={x(active)}
          width={width}
          gap={12}
          top={4}
          title={tip.label}
          rows={[{ id: "real", value: tip.total.real }, { id: "atias", value: tip.total.atias }]}
          notes={[
            ...(tip.total.real === null ? ["Aún sin cosecha pesada."] : realIncomplete(tip.total) ? ["Recogido incompleto."] : []),
            ...(tip.total.atiasPartial ? ["Previsión parcial: faltan hileras."] : []),
          ]}
        />
      )}
      {focused && tip && (
        <p className="sr-only" aria-live="polite">
          {tip.label}: recogido {tip.total.real === null ? "sin dato" : `${Math.round(tip.total.real)} kg`}, previsto por Atias {Math.round(tip.total.atias)} kg.
        </p>
      )}
    </div>
  );
}
