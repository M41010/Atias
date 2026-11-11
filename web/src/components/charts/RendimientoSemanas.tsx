"use client";

import { useQueries } from "@tanstack/react-query";
import { useState } from "react";
import { getReport, type HarvestReport } from "@/lib/api";
import { fmtDay, fmtKg } from "@/lib/format";
import { queryKeys, useHarvests } from "@/lib/hooks";
import { useDataMode } from "@/lib/mode";
import {
  harvestsToLoad,
  niceTicks,
  type Normalization,
  normalizeWeek,
  SERIES_COLOR,
  semanasDelInvernadero,
  tendencia,
  type WeekPoint,
} from "./invernaderoDatos";
import { Legend, Marker, Tip, TipRow, useMeasuredWidth, useTip } from "./InvernaderoMarco";

/**
 * Carga las recolecciones recientes con la misma clave que el selector de recolección, así que lo ya
 * visto no se vuelve a pedir. La que está abierta se pasa tal cual.
 */
function useWeeks(current: HarvestReport, greenhouseId: string) {
  const mode = useDataMode();
  const harvests = useHarvests();
  const ids = harvestsToLoad(harvests.data ?? []).filter((id) => id !== current.id);
  const results = useQueries({
    queries: ids.map((id) => ({ queryKey: queryKeys.report(id, mode), queryFn: () => getReport(id) })),
  });
  const reports = [current, ...results.flatMap((r) => (r.data ? [r.data] : []))];
  const loading = harvests.isPending || results.some((r) => r.isPending);
  return { weeks: semanasDelInvernadero(reports, greenhouseId, current.id), loading };
}

const SHORT = (w: WeekPoint) => (w.monday ? fmtDay(w.monday).replace(/^\w+\.?,\s*/, "") : w.label);

export function RendimientoSemanas({ report, greenhouseId }: { report: HarvestReport; greenhouseId: string }) {
  const { weeks, loading } = useWeeks(report, greenhouseId);
  const [mode, setMode] = useState<Normalization>("hilera");
  const [ref, width] = useMeasuredWidth<HTMLDivElement>();
  const { tip, bind } = useTip();
  const trend = tendencia(weeks);

  if (weeks.length < 2) {
    return (
      <p className="px-5 py-4 text-sm text-muted">
        {loading ? "Cargando las semanas anteriores…" : "Aún no hay otras semanas de este invernadero con qué comparar. Aparecerán aquí a medida que se graben."}
      </p>
    );
  }

  const points = weeks.map((w) => ({ w, ...normalizeWeek(w, mode) }));
  const hasReal = points.some((p) => p.real !== null);
  const max = Math.max(1, ...points.flatMap((p) => [p.forecast.max, p.observed.kg, p.real ?? 0]));
  const height = 220;
  const m = { top: 12, right: 12, bottom: 28, left: 48 };
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1] || 1;
  const plotW = width - m.left - m.right;
  const plotH = height - m.top - m.bottom;
  const band = plotW / points.length;
  const x = (i: number) => m.left + band * i + band / 2;
  const y = (v: number) => m.top + plotH - (v / top) * plotH;
  const unit = mode === "hilera" ? "kg por hilera" : "kg";
  // Une semanas seguidas que tienen dato; un hueco corta la línea.
  // Previsión a la izquierda, observado a la derecha y lo real en el centro de cada semana.
  const off = Math.min(10, band / 6);
  const path = (pick: (p: (typeof points)[number]) => number | null, dx = 0) =>
    points
      .map((p, i) => {
        const v = pick(p);
        if (v === null) return "";
        const prev = i > 0 ? pick(points[i - 1]) : null;
        return `${prev === null ? "M" : "L"}${x(i) + dx} ${y(v)}`;
      })
      .join("");

  return (
    <div className="grid grid-cols-1 gap-3 px-5 pt-4 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Legend
          items={[
            ...(hasReal ? [{ key: "real", label: "Real", swatch: <Marker shape="dash" x={8} y={6} color={SERIES_COLOR.real} size={4} /> }] : []),
            {
              key: "atias",
              label: "Previsión de Atias, con su margen",
              swatch: (
                <>
                  <line x1={8} x2={8} y1={0} y2={12} stroke={SERIES_COLOR.atias} strokeWidth={2} strokeLinecap="round" />
                  <Marker shape="diamond" x={8} y={6} color={SERIES_COLOR.atias} size={3.5} />
                </>
              ),
            },
            { key: "observed", label: "Observado", swatch: <Marker shape="circle" x={8} y={6} color={SERIES_COLOR.observed} size={4} /> },
          ]}
        />
        <div role="group" aria-label="Cómo comparar las semanas" className="inline-flex rounded-md border border-line-strong p-0.5 text-xs font-medium">
          {([["hilera", "Por hilera"], ["total", "Total"]] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={mode === key}
              onClick={() => setMode(key)}
              className={`min-h-8 rounded px-3 transition-colors duration-150 ${mode === key ? "bg-ink text-white" : "text-muted hover:bg-sunken hover:text-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <figure className="m-0 min-w-0">
        <div ref={ref} data-tip-frame className="relative">
          <svg width={width} height={height} role="group" aria-labelledby="rend-titulo rend-desc" className="block">
            <title id="rend-titulo">Rendimiento frente a semanas anteriores</title>
            <desc id="rend-desc">{`${unit} de cada recolección de este invernadero, de la más antigua a la más reciente. Los valores están en la tabla de debajo.`}</desc>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={m.left} x2={width - m.right} y1={y(t)} y2={y(t)} stroke="var(--color-line)" shapeRendering="crispEdges" />
                <text x={m.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--color-muted)" className="tabular-nums">
                  {fmtKg(t)}
                </text>
              </g>
            ))}
            {points.map((p, i) =>
              p.w.current ? <rect key="actual" x={x(i) - band / 2} y={m.top} width={band} height={plotH} fill="var(--color-canvas)" /> : null,
            )}
            <path d={path((p) => p.forecast.kg, -off)} fill="none" stroke={SERIES_COLOR.atias} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {hasReal && <path d={path((p) => p.real)} fill="none" stroke={SERIES_COLOR.real} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
            {points.map((p, i) => {
              const cx = x(i);
              const label = `${p.w.label}${p.w.current ? " (la abierta)" : ""}: previsión ${fmtKg(p.forecast.kg)} ${unit}, observado ${fmtKg(p.observed.kg)}, real ${p.real === null ? "sin pesar" : fmtKg(p.real)}${p.w.partial ? ". Parcial: faltan hileras" : ""}`;
              return (
                <g
                  key={p.w.id}
                  role="img"
                  tabIndex={0}
                  aria-label={label}
                  className="outline-none focus-visible:[&>rect:first-child]:stroke-ink"
                  {...bind(
                    <>
                      <p className="mb-1 font-medium text-ink">{p.w.label}</p>
                      <TipRow color={SERIES_COLOR.real} label="Real" value={p.real === null ? "sin pesar" : `${fmtKg(p.real)} ${unit}`} />
                      <TipRow color={SERIES_COLOR.atias} label="Atias" value={`${fmtKg(p.forecast.kg)} ${unit}`} />
                      <TipRow color={SERIES_COLOR.observed} label="Observado" value={`${fmtKg(p.observed.kg)} ${unit}`} />
                      <p className="mt-1 text-muted">
                        {p.w.analyzed} de {p.w.hileras} hileras analizadas{p.w.partial ? ": parcial" : ""}
                      </p>
                    </>,
                  )}
                >
                  <rect x={cx - band / 2 + 1} y={m.top} width={band - 2} height={plotH} rx={4} fill="transparent" strokeWidth={2} />
                  <line x1={cx - off} x2={cx - off} y1={y(p.forecast.min)} y2={y(p.forecast.max)} stroke={SERIES_COLOR.atias} strokeWidth={2} strokeLinecap="round" />
                  <Marker shape="diamond" x={cx - off} y={y(p.forecast.kg)} color={p.w.partial ? "var(--color-surface)" : SERIES_COLOR.atias} />
                  {p.w.partial && (
                    <path
                      d={`M${cx - off} ${y(p.forecast.kg) - 5}L${cx - off + 5} ${y(p.forecast.kg)}L${cx - off} ${y(p.forecast.kg) + 5}L${cx - off - 5} ${y(p.forecast.kg)}Z`}
                      fill="var(--color-surface)"
                      stroke={SERIES_COLOR.atias}
                      strokeWidth={2}
                    />
                  )}
                  <Marker shape="circle" x={cx + off} y={y(p.observed.kg)} color={SERIES_COLOR.observed} size={4.5} />
                  {p.real !== null && <Marker shape="dash" x={cx} y={y(p.real)} color={SERIES_COLOR.real} size={5} />}
                  <text x={cx} y={height - 8} textAnchor="middle" fontSize={11} fill={p.w.current ? "var(--color-ink)" : "var(--color-muted)"} fontWeight={p.w.current ? 600 : 400}>
                    {SHORT(p.w)}
                  </text>
                </g>
              );
            })}
            <line x1={m.left} x2={width - m.right} y1={y(0)} y2={y(0)} stroke="var(--color-line-strong)" shapeRendering="crispEdges" />
          </svg>
          <Tip tip={tip} width={width} />
        </div>
        <figcaption className="mt-2 text-xs text-muted">
          {trend.changePct === null
            ? "La semana abierta es la primera de este invernadero."
            : `Por hilera, la semana abierta da un ${Math.abs(trend.changePct)} % ${trend.changePct >= 0 ? "más" : "menos"} que la anterior (${(trend.previousLabel ?? "").toLowerCase()}), según ${trend.basis === "real" ? "lo recogido" : "la previsión"}.`}{" "}
          Por hilera, la previsión y lo observado se dividen entre las hileras analizadas, y lo real entre todas. Rombo hueco: semana parcial.
        </figcaption>
      </figure>
      <div className="-mx-5 overflow-x-auto border-t border-line">
        <table className="data-table compact">
          <caption className="sr-only">Kilos de este invernadero por recolección</caption>
          <thead>
            <tr>
              <th scope="col">Recolección</th>
              <th scope="col" className="num">Observado (kg)</th>
              <th scope="col" className="num">Previsión (kg)</th>
              <th scope="col" className="num">Real (kg)</th>
              <th scope="col" className="num">Previsión por hilera</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((w) => {
              const per = normalizeWeek(w, "hilera");
              return (
                <tr key={w.id}>
                  <th scope="row" className="whitespace-nowrap font-normal!">
                    {w.label}
                    {w.current && <span className="ml-1.5 text-xs text-muted">abierta</span>}
                    {w.partial && <span className="ml-1.5 text-xs text-warn-ink">parcial</span>}
                  </th>
                  <td className="num">{fmtKg(w.observed.kg)}</td>
                  <td className="num">{fmtKg(w.forecast.kg)}</td>
                  <td className="num">{w.real === null ? "—" : fmtKg(w.real)}</td>
                  <td className="num">{fmtKg(per.forecast.kg)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
