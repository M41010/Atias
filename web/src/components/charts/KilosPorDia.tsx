"use client";

import type { GreenhouseRow } from "@/lib/api";
import { fmtDay, fmtKg } from "@/lib/format";
import { type DaySeriesKey, kilosPorDia, niceTicks, SERIES_COLOR } from "./invernaderoDatos";
import { Legend, Marker, Tip, TipRow, useMeasuredWidth, useTip } from "./InvernaderoMarco";

const LABEL: Record<DaySeriesKey, string> = { real: "Real", technician: "Técnico", farmer: "Agricultor", atias: "Atias" };
const SHAPE = { real: "dash", technician: "circle", farmer: "square", atias: "diamond" } as const;

/**
 * Kilos por día, de lunes a viernes: lo recogido como raya de referencia y cada previsión como un
 * punto, Atias con su margen. Un día sin dato queda vacío, nunca a cero.
 */
export function KilosPorDia({ g }: { g: GreenhouseRow }) {
  const data = kilosPorDia(g);
  const [ref, width] = useMeasuredWidth<HTMLDivElement>();
  const { tip, bind } = useTip();
  const height = 220;
  const m = { top: 12, right: 8, bottom: 28, left: 44 };
  const ticks = niceTicks(data.max);
  const top = ticks[ticks.length - 1] || 1;
  const plotW = width - m.left - m.right;
  const plotH = height - m.top - m.bottom;
  const band = plotW / Math.max(1, data.days.length);
  const y = (v: number) => m.top + plotH - (v / top) * plotH;
  const points = data.series.filter((s): s is Exclude<DaySeriesKey, "real"> => s !== "real");
  const step = Math.min(18, (band - 16) / Math.max(1, points.length));
  const offset = (key: (typeof points)[number]) => (points.indexOf(key) - (points.length - 1) / 2) * step;
  const shortDays = band < 76;
  const hasReal = data.series.includes("real");

  return (
    <figure className="grid grid-cols-1 gap-3 px-5 pt-4 pb-2">
      <Legend
        items={data.series.map((key) => ({
          key,
          label: key === "atias" ? "Atias, con su margen" : LABEL[key],
          swatch:
            key === "atias" ? (
              <>
                <line x1={8} x2={8} y1={0} y2={12} stroke={SERIES_COLOR.atias} strokeWidth={2} strokeLinecap="round" />
                <Marker shape="diamond" x={8} y={6} color={SERIES_COLOR.atias} size={3.5} />
              </>
            ) : (
              <Marker shape={SHAPE[key]} x={8} y={6} color={SERIES_COLOR[key]} size={key === "real" ? 4 : 4.5} />
            ),
        }))}
      />
      <div ref={ref} data-tip-frame className="relative">
        <svg width={width} height={height} role="group" aria-labelledby="kpd-titulo kpd-desc" className="block overflow-visible">
          <title id="kpd-titulo">Kilos por día de recolección</title>
          <desc id="kpd-desc">
            De lunes a viernes: lo recogido{hasReal ? "" : " (aún sin apuntar)"}, la previsión del técnico
            {data.series.includes("farmer") ? ", la del agricultor" : ""} y la de Atias con su margen. Los valores están en la tabla de debajo.
          </desc>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={m.left} x2={width - m.right} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth={1} shapeRendering="crispEdges" />
              <text x={m.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--color-muted)" className="tabular-nums">
                {fmtKg(t)}
              </text>
            </g>
          ))}
          {data.days.map((d, i) => {
            const cx = m.left + band * i + band / 2;
            const r = d.atiasRange;
            return (
              <g
                key={d.date}
                tabIndex={0}
                role="img"
                className="outline-none focus-visible:[&>.fondo]:fill-canvas"
                aria-label={`${fmtDay(d.date)}: ${data.series.map((s) => `${LABEL[s]} ${d[s] === null ? "sin dato" : `${fmtKg(d[s] as number)} kg`}`).join(", ")}`}
                {...bind(
                  <>
                    <p className="mb-1 font-medium text-ink">{fmtDay(d.date)}</p>
                    {data.series.map((s) => (
                      <TipRow key={s} color={SERIES_COLOR[s]} label={LABEL[s]} value={d[s] === null ? "sin dato" : `${fmtKg(d[s] as number)} kg`} />
                    ))}
                    <p className="mt-1 text-muted">Margen de Atias: {fmtKg(r.min)}–{fmtKg(r.max)} kg</p>
                  </>,
                )}
              >
                <rect x={cx - band / 2} y={m.top} width={band} height={plotH} fill="transparent" className="fondo transition-colors hover:fill-canvas" />
                {d.real !== null && (
                  <line x1={cx - band * 0.36} x2={cx + band * 0.36} y1={y(d.real)} y2={y(d.real)} stroke={SERIES_COLOR.real} strokeWidth={2.5} strokeLinecap="round" />
                )}
                <line x1={cx + offset("atias")} x2={cx + offset("atias")} y1={y(r.min)} y2={y(r.max)} stroke={SERIES_COLOR.atias} strokeWidth={2} strokeLinecap="round" />
                {points.map((s) =>
                  d[s] === null ? null : <Marker key={s} shape={SHAPE[s]} x={cx + offset(s)} y={y(d[s] as number)} color={SERIES_COLOR[s]} />,
                )}
                <text x={cx} y={height - 8} textAnchor="middle" fontSize={11} fill="var(--color-muted)">
                  {shortDays ? fmtDay(d.date).split(",")[0] : fmtDay(d.date)}
                </text>
              </g>
            );
          })}
          <line x1={m.left} x2={width - m.right} y1={y(0)} y2={y(0)} stroke="var(--color-line-strong)" strokeWidth={1} shapeRendering="crispEdges" />
        </svg>
        <Tip tip={tip} width={width} />
      </div>
      {!hasReal && <figcaption className="text-xs text-muted">Aún no hay kilos reales apuntados: la raya de lo recogido aparecerá cuando se registren.</figcaption>}
    </figure>
  );
}
