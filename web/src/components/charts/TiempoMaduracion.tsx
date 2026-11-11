"use client";

import type { WeatherSummary } from "@/lib/api";
import { fmtDay, fmtDecimal } from "@/lib/format";
import { niceTicks, tiempoMaduracion } from "./invernaderoDatos";
import { GRADOS_DIA } from "./series";
import { Legend, Tip, TipRow, useMeasuredWidth, useTip } from "./InvernaderoMarco";

const KIND_WORD = { observado: "medido", prevision: "previsto", normal: "sin previsión: lo normal" } as const;

/**
 * Grados-día de cada día, de sábado (grabación) a viernes, frente a lo normal en ese lugar y esas
 * fechas, y lo que eso supone para la maduración.
 */
export function TiempoMaduracion({ weather }: { weather: WeatherSummary }) {
  const data = tiempoMaduracion(weather);
  const [ref, width] = useMeasuredWidth<HTMLDivElement>();
  const { tip, bind } = useTip();

  if (data.state === "sin_datos") {
    return (
      <p className="px-5 py-4 text-sm text-muted">
        No hay datos de tiempo para esta localización. La previsión cuenta con una maduración normal, sin acelerarla ni frenarla.
      </p>
    );
  }

  const height = 180;
  const m = { top: 10, right: 8, bottom: 28, left: 36 };
  const ticks = niceTicks(data.max, 3);
  const top = ticks[ticks.length - 1] || 1;
  const plotW = width - m.left - m.right;
  const plotH = height - m.top - m.bottom;
  const band = plotW / data.days.length;
  const bar = Math.min(24, band * 0.5);
  const y = (v: number) => m.top + plotH - (v / top) * plotH;
  const shortDays = band < 76;
  const sign = data.changePct > 0 ? "+" : data.changePct < 0 ? "−" : "";

  return (
    <div className="grid grid-cols-1 gap-4 px-5 pt-4 pb-3 md:grid-cols-[minmax(0,1fr)_200px] md:gap-6">
      <figure className="grid grid-cols-1 gap-3">
        <Legend
          items={[
            { key: "medido", label: "Grados-día medidos", swatch: <rect x={3} y={0} width={10} height={12} rx={2} fill={GRADOS_DIA} /> },
            ...(data.days.some((d) => d.kind === "prevision")
              ? [{ key: "previsto", label: "Previstos", swatch: <rect x={3} y={0} width={10} height={12} rx={2} fill={GRADOS_DIA} fillOpacity={0.4} /> }]
              : []),
            { key: "normal", label: "Lo normal", swatch: <line x1={1} x2={15} y1={6} y2={6} stroke="var(--color-ink)" strokeWidth={2.5} strokeLinecap="round" /> },
          ]}
        />
        <div ref={ref} data-tip-frame className="relative">
          <svg width={width} height={height} role="group" aria-labelledby="tiempo-titulo tiempo-desc" className="block">
            <title id="tiempo-titulo">Grados-día de la semana frente a lo normal</title>
            <desc id="tiempo-desc">
              {`De sábado a viernes. La semana suma ${fmtDecimal(data.weekly)} grados-día frente a ${fmtDecimal(data.normalWeekly)} de lo normal. Los valores están en la tabla de debajo.`}
            </desc>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={m.left} x2={width - m.right} y1={y(t)} y2={y(t)} stroke="var(--color-line)" shapeRendering="crispEdges" />
                <text x={m.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--color-muted)" className="tabular-nums">
                  {fmtDecimal(t).replace(",0", "")}
                </text>
              </g>
            ))}
            {data.days.map((d, i) => {
              const cx = m.left + band * i + band / 2;
              const h = y(0) - y(d.degreeDays);
              const label = `${fmtDay(d.date)}, ${KIND_WORD[d.kind]}: ${fmtDecimal(d.degreeDays)} grados-día; lo normal, ${fmtDecimal(d.normal)}`;
              return (
                <g
                  key={d.date}
                  role="img"
                  tabIndex={0}
                  aria-label={label}
                  className="outline-none focus-visible:[&>rect:first-child]:fill-canvas"
                  {...bind(
                    <>
                      <p className="mb-1 font-medium text-ink">{fmtDay(d.date)} <span className="font-normal text-muted">· {KIND_WORD[d.kind]}</span></p>
                      {d.kind !== "normal" && <TipRow color={GRADOS_DIA} label="Grados-día" value={fmtDecimal(d.degreeDays)} />}
                      <TipRow color="var(--color-ink)" label="Lo normal" value={fmtDecimal(d.normal)} />
                    </>,
                  )}
                >
                  <rect x={cx - band / 2} y={m.top} width={band} height={plotH} fill="transparent" className="transition-colors hover:fill-canvas" />
                  {d.kind !== "normal" && h > 0 && (
                    <path
                      d={roundedTop(cx - bar / 2, y(d.degreeDays), bar, h, Math.min(4, h))}
                      fill={GRADOS_DIA}
                      fillOpacity={d.kind === "prevision" ? 0.4 : 1}
                    />
                  )}
                  <line x1={cx - bar / 2 - 4} x2={cx + bar / 2 + 4} y1={y(d.normal)} y2={y(d.normal)} stroke="var(--color-ink)" strokeWidth={2.5} strokeLinecap="round" />
                  <text x={cx} y={height - 8} textAnchor="middle" fontSize={11} fill="var(--color-muted)">
                    {shortDays ? fmtDay(d.date).split(",")[0] : fmtDay(d.date)}
                  </text>
                </g>
              );
            })}
            <line x1={m.left} x2={width - m.right} y1={y(0)} y2={y(0)} stroke="var(--color-line-strong)" shapeRendering="crispEdges" />
          </svg>
          <Tip tip={tip} width={width} />
        </div>
      </figure>
      <div className="border-t border-line pt-4 md:border-t-0 md:border-l md:pt-1 md:pl-6">
        <p className="text-sm font-medium">Ritmo de maduración</p>
        <p className="numeral mt-2 text-3xl">
          {data.changePct === 0 ? "Normal" : `${sign}${Math.abs(data.changePct)} %`}
        </p>
        <p className="mt-2 text-sm text-muted">
          {data.sentence} que en una semana normal: {fmtDecimal(data.weekly)} grados-día frente a {fmtDecimal(data.normalWeekly)}.
        </p>
        {data.source === "simulada" && <p className="mt-2 text-xs text-warn-ink">Tiempo simulado: Open-Meteo no ha respondido.</p>}
      </div>
    </div>
  );
}

/** Columna con las esquinas de arriba redondeadas y la base recta, apoyada en el eje. */
function roundedTop(x: number, y: number, w: number, h: number, r: number): string {
  return `M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z`;
}
