"use client";

import Link from "next/link";
import { type KeyboardEvent, type PointerEvent, useEffect, useId, useRef, useState } from "react";
import { Panel, Pill } from "@/components/ui";
import type { HarvestReport } from "@/lib/api";
import { type ErrorPoint, errorAxis, FORECASTERS, type WeeklyError, weeklyError } from "@/lib/errorSemanal";
import { fmtInt, fmtPct } from "@/lib/format";
import type { Forecaster } from "@/lib/precision";
import { TARGET_PCT } from "@/lib/validation";

/*
 * Tres previsiones, tres tonos fijos (validados con el comprobador de paletas: separación con
 * daltonismo ΔE ≥ 11,7 en todos los pares y contraste ≥ 3:1 sobre blanco). Atias lleva el verde de la
 * marca; el ámbar queda para lo experimental y el rojo para los fallos, así que ninguno se usa aquí.
 * Cada previsión lleva además su forma de punto: la identidad nunca depende solo del color.
 */
const SERIES: Record<Forecaster, { name: string; color: string; shape: "circle" | "square" | "diamond" }> = {
  atias: { name: "Atias", color: "#17803d", shape: "circle" },
  agricultor: { name: "Agricultor", color: "#2a78d6", shape: "square" },
  tecnico: { name: "Técnico", color: "#9d3f8f", shape: "diamond" },
};

const pctAxis = (v: number) => `${fmtInt(v)} %`;

function whyNot(p: ErrorPoint): string | null {
  if (p.leftOut > 0) return `Parcial: ${p.leftOut === 1 ? "1 invernadero" : `${p.leftOut} invernaderos`} sin contar del todo`;
  if (p.calibrated > 0) return "No cuenta: semana usada para calibrar el peso";
  return null;
}

function Marker({ shape, x, y, r, color, hollow }: { shape: "circle" | "square" | "diamond"; x: number; y: number; r: number; color: string; hollow: boolean }) {
  // Relleno: anillo del color de la superficie para que se lea al cruzar otra línea. Hueco: borde del color de la serie.
  const paint = hollow
    ? { fill: "var(--color-surface)", stroke: color, strokeWidth: 2 }
    : { fill: color, stroke: "var(--color-surface)", strokeWidth: 2 };
  if (shape === "circle") return <circle cx={x} cy={y} r={r} {...paint} />;
  if (shape === "square") return <rect x={x - r * 0.9} y={y - r * 0.9} width={r * 1.8} height={r * 1.8} rx={1} {...paint} />;
  const d = r * 1.25;
  return <path d={`M${x} ${y - d}L${x + d} ${y}L${x} ${y + d}L${x - d} ${y}Z`} strokeLinejoin="round" {...paint} />;
}

function KeyMark({ who, hollow = false }: { who: Forecaster; hollow?: boolean }) {
  const s = SERIES[who];
  return (
    <svg width="26" height="12" viewBox="0 0 26 12" aria-hidden className="shrink-0">
      {!hollow && <line x1="1" x2="25" y1="6" y2="6" stroke={s.color} strokeWidth="2" strokeLinecap="round" />}
      <Marker shape={s.shape} x={13} y={6} r={4} color={s.color} hollow={hollow} />
    </svg>
  );
}

/** Frase para lectores de pantalla: de dónde a dónde va cada previsión. */
function describe(data: WeeklyError, shown: Forecaster[]): string {
  const parts = shown.map((who) => {
    const points = data.series[who].map((p, i) => (p ? { p, week: data.weeks[i] } : null)).filter((x) => x !== null);
    const first = points[0];
    const last = points[points.length - 1];
    if (points.length === 1) return `${SERIES[who].name}: ${fmtPct(first.p.errorPct)} en la semana ${first.week.isoWeek}`;
    return `${SERIES[who].name}: de ${fmtPct(first.p.errorPct)} en la semana ${first.week.isoWeek} a ${fmtPct(last.p.errorPct)} en la semana ${last.week.isoWeek}`;
  });
  return `${parts.join(". ")}. Objetivo: hasta el ${TARGET_PCT} %.`;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Gráfico de líneas del error semanal, con la banda del objetivo. `large` lo agranda para el modo presentación. */
export function ErrorSemanalChart({ data, large = false }: { data: WeeklyError; large?: boolean }) {
  const [box, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const titleId = useId();
  const descId = useId();
  const shown = FORECASTERS.filter((who) => data.series[who].some((p) => p !== null));
  const n = data.weeks.length;

  const font = large ? 16 : 12;
  const height = large ? 380 : width < 480 ? 220 : 260;
  const endLabels = width >= (large ? 640 : 520);
  const m = { top: 14, right: endLabels ? (large ? 150 : 112) : 14, bottom: font + 16, left: font * 3.4 };
  const plotW = Math.max(width - m.left - m.right, 40);
  const plotH = height - m.top - m.bottom;
  const inset = Math.min(20, plotW / 8);
  const x = (i: number) => m.left + inset + (n > 1 ? (i * (plotW - inset * 2)) / (n - 1) : (plotW - inset * 2) / 2);
  const values = shown.flatMap((who) => data.series[who].flatMap((p) => (p ? [p.errorPct] : [])));
  const axis = errorAxis(values, TARGET_PCT);
  const y = (v: number) => m.top + plotH - (v / axis.max) * plotH;
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(plotW / (font * 5)))));
  const r = large ? 5.5 : 4.5;

  // Etiquetas al final solo donde no chocan; si se juntan, quedan la leyenda y el detalle.
  const ends = shown.flatMap((who) => {
    const last = data.series[who][n - 1];
    return last ? [{ who, y: y(last.errorPct), value: last.errorPct }] : [];
  });
  const labelled = ends.filter((e) => ends.every((o) => o === e || Math.abs(o.y - e.y) >= font * 1.5));

  const pick = (event: PointerEvent<SVGRectElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - rect.left + m.left;
    let best = 0;
    for (let i = 1; i < n; i++) if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    setActive(best);
  };
  const onKey = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const step = event.key === "ArrowRight" ? 1 : -1;
      setActive((i) => Math.min(n - 1, Math.max(0, (i ?? n - 1) + step)));
    }
    if (event.key === "Escape") setActive(null);
  };

  // El detalle va al lado de la línea vertical, nunca encima de los puntos que describe.
  const tipLeft = active === null ? 0 : x(active) + 252 <= width ? x(active) + 12 : Math.max(x(active) - 252, 0);

  return (
    <div ref={box} className="relative min-w-0">
      {width > 0 && (
        <svg
          // Ancho en porcentaje: si fuera fijo, el SVG ensancharía su contenedor y nunca encogería con él.
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-labelledby={`${titleId} ${descId}`}
          tabIndex={0}
          onKeyDown={onKey}
          onFocus={() => setActive((i) => i ?? n - 1)}
          onBlur={() => setActive(null)}
          className="block touch-pan-y"
          style={{ fontSize: font }}
        >
          <title id={titleId}>Error en kilos de cada previsión, semana a semana</title>
          <desc id={descId}>{describe(data, shown)} Usa las flechas para recorrer las semanas.</desc>

          {/* Banda del objetivo: por debajo de la línea, dentro del objetivo. */}
          <rect x={m.left} width={plotW} y={y(TARGET_PCT)} height={y(0) - y(TARGET_PCT)} fill="var(--color-brand-soft)" />
          {axis.ticks.map((t) => (
            <g key={t}>
              <line x1={m.left} x2={m.left + plotW} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth={1} shapeRendering="crispEdges" />
              <text x={m.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fill="var(--color-muted)" className="tabular-nums">{pctAxis(t)}</text>
            </g>
          ))}
          <line x1={m.left} x2={m.left + plotW} y1={y(TARGET_PCT)} y2={y(TARGET_PCT)} stroke="var(--color-brand-ink)" strokeWidth={1} shapeRendering="crispEdges" />
          <text x={m.left + 6} y={y(TARGET_PCT) - 6} fill="var(--color-brand-ink)" fontWeight={500}>Objetivo: hasta {TARGET_PCT} %</text>

          {data.weeks.map((w, i) => (i % labelEvery === 0 || i === n - 1) && (n - 1 - i >= labelEvery || i === n - 1) ? (
            <text key={w.harvestId} x={x(i)} y={height - 6} textAnchor="middle" fill="var(--color-muted)">{w.label}</text>
          ) : null)}

          {active !== null && (
            <line x1={x(active)} x2={x(active)} y1={m.top} y2={m.top + plotH} stroke="var(--color-control)" strokeWidth={1} shapeRendering="crispEdges" />
          )}

          {shown.map((who) => {
            const points = data.series[who];
            const d = points
              .map((p, i) => (p ? `${i > 0 && points[i - 1] ? "L" : "M"}${x(i)} ${y(p.errorPct)}` : ""))
              .join("");
            return (
              <g key={who}>
                <path d={d} fill="none" stroke={SERIES[who].color} strokeWidth={large ? 3 : 2} strokeLinejoin="round" strokeLinecap="round" />
                {points.map((p, i) => p && (
                  <Marker key={i} shape={SERIES[who].shape} x={x(i)} y={y(p.errorPct)} r={active === i ? r + 1.5 : r} color={SERIES[who].color} hollow={!p.counts} />
                ))}
              </g>
            );
          })}

          {endLabels && labelled.map((e) => (
            <text key={e.who} x={x(n - 1) + r + 8} y={e.y} dy="0.32em" fill="var(--color-ink)">
              <tspan fontWeight={600} className="tabular-nums">{fmtPct(e.value)}</tspan>
              <tspan fill="var(--color-muted)"> {SERIES[e.who].name}</tspan>
            </text>
          ))}

          {/* Zona sensible: toda el área del gráfico, para no tener que acertar en una línea de 2 px. */}
          <rect
            x={m.left}
            y={m.top}
            width={plotW}
            height={plotH}
            fill="transparent"
            onPointerMove={pick}
            onPointerDown={pick}
            onPointerLeave={() => setActive(null)}
          />
        </svg>
      )}

      {active !== null && (
        <div
          aria-live="polite"
          className="pointer-events-none absolute top-1 z-10 w-60 rounded-md border border-line bg-surface p-3 text-sm shadow-[0_4px_12px_rgb(20_30_24/0.10)]"
          style={{ left: tipLeft }}
        >
          <p className="font-semibold">Semana {data.weeks[active].isoWeek}</p>
          <ul className="mt-1.5 grid gap-1.5">
            {shown.map((who) => {
              const p = data.series[who][active];
              const note = p && whyNot(p);
              return (
                <li key={who} className="flex items-start gap-2">
                  <span className="mt-1"><KeyMark who={who} hollow={p !== null && !p.counts} /></span>
                  <span>
                    <span className="font-semibold tabular-nums">{p ? fmtPct(p.errorPct) : "—"}</span>{" "}
                    <span className="text-muted">{SERIES[who].name}</span>
                    {p && <span className="block text-xs text-muted">{p.greenhouses === 1 ? "1 invernadero" : `${fmtInt(p.greenhouses)} invernaderos`}</span>}
                    {note && <span className={`block text-xs ${p.leftOut > 0 ? "text-warn-ink" : "text-muted"}`}>{note}</span>}
                    {!p && who === "atias" && <span className="block text-xs text-muted">Sin cifra comparable</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ErrorSemanalLegend({ data, large = false }: { data: WeeklyError; large?: boolean }) {
  const shown = FORECASTERS.filter((who) => data.series[who].some((p) => p !== null));
  const anyHollow = shown.some((who) => data.series[who].some((p) => p && !p.counts));
  return (
    <ul className={`flex flex-wrap items-center gap-x-5 gap-y-2 ${large ? "text-lg" : "text-sm"}`}>
      {shown.map((who) => (
        <li key={who} className="flex items-center gap-2">
          <KeyMark who={who} />
          {SERIES[who].name}
        </li>
      ))}
      {anyHollow && (
        <li className="flex items-center gap-2 text-muted">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="shrink-0">
            <circle cx="6" cy="6" r="4" fill="var(--color-surface)" stroke="var(--color-muted)" strokeWidth="2" />
          </svg>
          Punto hueco: no cuenta para el veredicto
        </li>
      )}
    </ul>
  );
}

/** Los mismos datos del gráfico en tabla: nada queda solo en el dibujo ni en el detalle al pasar el cursor. */
function DataTable({ data }: { data: WeeklyError }) {
  const shown = FORECASTERS.filter((who) => data.series[who].some((p) => p !== null));
  return (
    <details className="border-t border-line">
      <summary className="cursor-pointer px-5 py-3 text-sm font-medium">Ver los datos del gráfico</summary>
      <div className="overflow-x-auto">
        <table className="data-table compact">
          <thead>
            <tr>
              <th scope="col">Semana</th>
              {shown.map((who) => <th key={who} scope="col" className="num">{SERIES[who].name} (error · invernaderos)</th>)}
            </tr>
          </thead>
          <tbody>
            {data.weeks.map((w, i) => (
              <tr key={w.harvestId}>
                <th scope="row" className="whitespace-nowrap">Semana {w.isoWeek}</th>
                {shown.map((who) => {
                  const p = data.series[who][i];
                  const note = p && whyNot(p);
                  return (
                    <td key={who} className="num">
                      {p ? `${fmtPct(p.errorPct)} · ${fmtInt(p.greenhouses)}` : "—"}
                      {note && <span className={`block text-xs ${p.leftOut > 0 ? "text-warn-ink" : "text-muted"}`}>{p.leftOut > 0 ? "Parcial" : "No cuenta: calibración"}</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/** Panel «Error semana a semana» de la pantalla de precisión. */
export function ErrorSemanalPanel({ reports }: { reports: HarvestReport[] }) {
  const data = weeklyError(reports);
  const simulated = reports.some((r) => r.simulated);
  return (
    <Panel
      title="Error semana a semana"
      description={`Error en kilos de la semana de cada previsión frente a lo recogido, ponderado por kilos. La franja verde es el objetivo: hasta el ${TARGET_PCT} %.`}
      actions={simulated ? <Pill tone="warn">Datos simulados</Pill> : undefined}
    >
      {!data.enough ? (
        <p className="px-5 py-4 text-sm text-muted">
          Hace falta más de una semana con kilos recogidos para ver cómo evoluciona el error.
          {data.weeks.length === 1 ? " De momento hay una: está en la tabla de arriba." : <> Apúntalos día a día en <Link href="/campo" className="font-medium underline underline-offset-3">Datos de campo</Link>.</>}
        </p>
      ) : (
        <>
          <div className="grid gap-3 px-5 pb-4 pt-4">
            <ErrorSemanalLegend data={data} />
            <ErrorSemanalChart data={data} />
          </div>
          <DataTable data={data} />
        </>
      )}
    </Panel>
  );
}
