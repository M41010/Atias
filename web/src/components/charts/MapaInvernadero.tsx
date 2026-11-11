"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import type { GreenhouseRow } from "@/lib/api";
import { fmtKg, fmtRange } from "@/lib/format";
import { mapaInvernadero, type MapMeasure, SEQUENTIAL_GREEN, sequentialColor } from "./invernaderoDatos";
import { Tip, TipRow, useMeasuredWidth, useTip } from "./InvernaderoMarco";

const MEASURE_LABEL: Record<MapMeasure, string> = { forecast: "Previsión", observed: "Observado" };

/**
 * Mapa del invernadero: una fila por hilera y una casilla por tramo, de la cabecera al fondo, con más
 * verde donde hay más kilos. Las hileras sin analizar van rayadas; las que tienen advertencia, con
 * su icono. Al pulsar una hilera se abre en la tabla de debajo.
 */
export function MapaInvernadero({ g, onSelect }: { g: GreenhouseRow; onSelect: (hilera: number) => void }) {
  const [measure, setMeasure] = useState<MapMeasure>("forecast");
  const data = mapaInvernadero(g, measure);
  const [ref, width] = useMeasuredWidth<HTMLDivElement>();
  const { tip, bind } = useTip();
  // Con el teclado, la hilera da su resumen; con el cursor, cada casilla da el suyo.
  const focusTip = (content: React.ReactNode) => {
    const { onFocus, onBlur } = bind(content);
    return { onFocus, onBlur };
  };
  const narrow = width < 480;
  const labelW = narrow ? 54 : 92;
  const totalW = narrow ? 58 : 76;
  const rowH = 30;
  const gap = 2;
  const headerH = 20;
  const cellsW = Math.max(40, width - labelW - totalW);
  const cellW = (cellsW - gap * (data.tramos - 1)) / Math.max(1, data.tramos);
  const height = headerH + data.rows.length * (rowH + gap);
  const color = (kg: number) => sequentialColor(kg, data.min, data.max);
  const word = MEASURE_LABEL[measure].toLowerCase();

  return (
    <figure className="grid grid-cols-1 gap-3 px-5 pt-4 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Qué kilos colorean el mapa" className="inline-flex rounded-md border border-line-strong p-0.5 text-xs font-medium">
          {(["forecast", "observed"] as const).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={measure === key}
              onClick={() => setMeasure(key)}
              className={`min-h-8 rounded px-3 transition-colors duration-150 ${measure === key ? "bg-ink text-white" : "text-muted hover:bg-sunken hover:text-ink"}`}
            >
              {MEASURE_LABEL[key]}
            </button>
          ))}
        </div>
        <MapLegend min={data.min} max={data.max} pending={data.pendingCount > 0} high={data.rows.some((r) => r.warning === "alta")} medium={data.rows.some((r) => r.warning === "media")} />
      </div>
      <div ref={ref} data-tip-frame className="relative">
        <svg width={width} height={height} role="group" aria-labelledby="mapa-titulo mapa-desc" className="block">
          <title id="mapa-titulo">Mapa del invernadero: kilos por hilera y tramo</title>
          <desc id="mapa-desc">
            {`Kilos de ${word} por tramo, de la cabecera al fondo, en ${data.rows.length} hileras. Más oscuro, más kilos. Pulsa una hilera para abrirla en la tabla.`}
          </desc>
          <defs>
            <pattern id="mapa-rayado" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="var(--color-sunken)" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-line-strong)" strokeWidth="2" />
            </pattern>
          </defs>
          {Array.from({ length: data.tramos }, (_, t) => (
            <text key={t} x={labelW + t * (cellW + gap) + cellW / 2} y={12} textAnchor="middle" fontSize={11} fill="var(--color-muted)" className="tabular-nums">
              {narrow && data.tramos > 8 && t % 2 === 1 ? "" : t + 1}
            </text>
          ))}
          <text x={width} y={12} textAnchor="end" fontSize={11} fill="var(--color-muted)">Total</text>
          {data.rows.map((row, r) => {
            const y0 = headerH + r * (rowH + gap);
            const warnText = row.warning === "alta" ? ", con advertencia" : row.warning === "media" ? ", con aviso" : "";
            const label = row.pending
              ? `Hilera ${row.n}: pendiente de análisis${warnText}. Abrir en la tabla.`
              : `Hilera ${row.n}: ${fmtKg(row.total!.kg)} kg de ${word}${warnText}. Abrir en la tabla.`;
            return (
              <g
                key={row.n}
                role="button"
                tabIndex={0}
                aria-label={label}
                className="cursor-pointer outline-none [&:focus-visible>.foco]:opacity-100"
                onClick={() => onSelect(row.n)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(row.n);
                  }
                }}
                {...focusTip(
                  row.pending ? (
                    <p className="text-ink">Hilera {row.n}: pendiente de análisis</p>
                  ) : (
                    <>
                      <p className="mb-1 font-medium text-ink">Hilera {row.n}</p>
                      <TipRow label={MEASURE_LABEL[measure]} value={`${fmtKg(row.total!.kg)} kg`} />
                      <p className="mt-1 text-muted">Entre {fmtRange(row.total!)} kg · Intro para abrirla</p>
                    </>
                  ),
                )}
              >
                <rect className="foco opacity-0" x={1} y={y0 - 1} width={width - 2} height={rowH + 2} rx={5} fill="none" stroke="var(--color-ink)" strokeWidth={2} />
                <text x={0} y={y0 + rowH / 2} dy="0.32em" fontSize={narrow ? 12 : 13} fontWeight={500} fill="var(--color-ink)">
                  {narrow ? `H${row.n}` : `Hilera ${row.n}`}
                </text>
                {row.warning && (
                  <AlertTriangle
                    x={labelW - 22}
                    y={y0 + rowH / 2 - 7}
                    width={14}
                    height={14}
                    className={row.warning === "alta" ? "text-bad-ink" : "text-warn-ink"}
                    aria-hidden
                  />
                )}
                {row.pending ? (
                  <>
                    <rect {...bind(<p className="text-ink">Hilera {row.n}: pendiente de análisis</p>)} x={labelW} y={y0} width={cellsW} height={rowH} rx={4} fill="url(#mapa-rayado)" />
                    <rect x={labelW + cellsW / 2 - 76} y={y0 + 6} width={152} height={rowH - 12} rx={3} fill="var(--color-surface)" />
                    <text x={labelW + cellsW / 2} y={y0 + rowH / 2} dy="0.32em" textAnchor="middle" fontSize={11} fill="var(--color-muted)">
                      Pendiente de análisis
                    </text>
                  </>
                ) : (
                  row.cells.map((c, t) => (
                    <rect
                      key={c.tramo}
                      x={labelW + t * (cellW + gap)}
                      y={y0}
                      width={cellW}
                      height={rowH}
                      rx={4}
                      fill={color(c.range.kg)}
                      className="transition-opacity hover:opacity-80"
                      {...bind(
                        <>
                          <p className="mb-1 font-medium text-ink">Hilera {row.n} · Tramo {c.tramo}</p>
                          <TipRow label={MEASURE_LABEL[measure]} value={`${fmtKg(c.range.kg)} kg`} />
                          <p className="mt-1 text-muted">Entre {fmtRange(c.range)} kg</p>
                        </>,
                      )}
                    />
                  ))
                )}
                <text x={width} y={y0 + rowH / 2} dy="0.32em" textAnchor="end" fontSize={12} fill={row.pending ? "var(--color-muted)" : "var(--color-ink)"} className="tabular-nums">
                  {row.pending ? "—" : `${fmtKg(row.total!.kg)} kg`}
                </text>
              </g>
            );
          })}
        </svg>
        <Tip tip={tip} width={width} />
      </div>
      <figcaption className="text-xs text-muted">
        Tramos numerados desde la cabecera. Cada casilla es un tramo: sin marcadores físicos no hay detalle por planta.
      </figcaption>
    </figure>
  );
}

function MapLegend({ min, max, pending, high, medium }: { min: number; max: number; pending: boolean; high: boolean; medium: boolean }) {
  const gradient = `linear-gradient(to right, ${SEQUENTIAL_GREEN.join(", ")})`;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted" aria-hidden>
      <span className="flex items-center gap-1.5 tabular-nums">
        {fmtKg(min)} kg
        <span className="inline-block h-2.5 w-24 rounded-sm" style={{ background: gradient }} />
        {fmtKg(max)} kg
      </span>
      {pending && (
        <span className="flex items-center gap-1.5">
          <svg width="16" height="12" aria-hidden>
            <rect width="16" height="12" rx="2" fill="url(#mapa-rayado)" />
          </svg>
          Sin analizar
        </span>
      )}
      {high && (
        <span className="flex items-center gap-1.5">
          <AlertTriangle size={13} className="text-bad-ink" aria-hidden />
          Con advertencia
        </span>
      )}
      {medium && (
        <span className="flex items-center gap-1.5">
          <AlertTriangle size={13} className="text-warn-ink" aria-hidden />
          Con aviso
        </span>
      )}
    </div>
  );
}
