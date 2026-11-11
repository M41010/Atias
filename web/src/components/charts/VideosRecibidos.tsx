"use client";

/**
 * Gráficos de «Vídeos recibidos», por invernadero: estado de cada hilera y lado, perfil de la
 * hilera tramo a tramo y medidas de calidad de la imagen frente a sus umbrales.
 */

import { AlertTriangle, CheckCircle2, Clock, Film, Loader2 } from "lucide-react";
import { type CSSProperties, useEffect, useId, useRef, useState } from "react";
import type { ServerVideo, Side } from "@/lib/upload";
import {
  countNotes,
  defaultHilera,
  greenhouseTramoMax,
  niceTicks,
  type ProfilePoint,
  type QualityBar,
  qualityBars,
  rowProfile,
  type RowStatus,
  type SideState,
  SIDES,
  sideDescription,
  STATE_LABELS,
  STATE_ORDER,
  stateCounts,
  statusGrid,
} from "./videosRecibidosData";

/**
 * Lado A en el verde de la marca y lado B en azul: comprobados para daltonismo (ΔE 23 deutan,
 * 7,5 tritan, por eso cada lado lleva además su forma: círculo el A, cuadrado el B).
 */
const SIDE_COLORS: Record<Side, string> = { A: "var(--color-brand)", B: "#2a78d6" };

const fmtInt = (value: number) => new Intl.NumberFormat("es-ES").format(value);
const fmtM = (value: number) => new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(value);

// ---- Estado de cada hilera y lado ----

const CELL_STYLES: Record<SideState, string> = {
  analizado: "bg-ok-soft text-ok-ink border-transparent",
  recibido: "bg-sunken text-muted border-transparent",
  analizando: "bg-sunken text-muted border-transparent",
  problema: "bg-bad-soft text-bad-ink border-transparent",
  falta: "bg-surface text-control border-dashed border-control",
};

function StateIcon({ state, size = 14 }: { state: SideState; size?: number }) {
  if (state === "analizado") return <CheckCircle2 size={size} aria-hidden />;
  if (state === "problema") return <AlertTriangle size={size} aria-hidden />;
  if (state === "analizando") return <Loader2 size={size} aria-hidden />;
  if (state === "recibido") return <Film size={size} aria-hidden />;
  return <Clock size={size} aria-hidden />;
}

function PruebaMark() {
  return (
    <span aria-hidden className="absolute -right-1 -top-1 grid h-3.5 w-3.5 place-items-center rounded-full border border-surface bg-warn-soft text-[9px] font-bold leading-none text-warn-ink">
      P
    </span>
  );
}

function StatusOverview({ grid, selected, onSelect }: { grid: RowStatus[]; selected: number | null; onSelect: (hilera: number) => void }) {
  const counts = stateCounts(grid);
  const hasPrueba = grid.some((row) => row.lados.some((s) => s.prueba));
  return (
    <div>
      <div className="flex items-start gap-2">
        {/* Rótulos de los lados, a la altura de cada fila de celdas. */}
        <div aria-hidden className="grid shrink-0 gap-1 pt-5 text-xs font-medium text-muted">
          {SIDES.map((lado) => <span key={lado} className="flex h-7 items-center">{lado}</span>)}
        </div>
        <ul aria-label="Estado de cada hilera y lado" className="flex flex-wrap gap-x-1 gap-y-2">
          {grid.map((row) => {
            const active = row.hilera === selected;
            return (
              <li key={row.hilera} className="grid justify-items-center gap-1">
                <span aria-hidden className={`h-4 text-xs tabular-nums ${active ? "font-semibold text-ink" : "text-muted"}`}>{row.hilera}</span>
                {row.lados.map((side) => (
                  <button
                    key={side.lado}
                    type="button"
                    onClick={() => onSelect(row.hilera)}
                    aria-label={sideDescription(row.hilera, side)}
                    aria-pressed={active}
                    title={sideDescription(row.hilera, side)}
                    className={`relative grid h-7 w-7 place-items-center rounded-md border transition-[filter] hover:brightness-95 ${CELL_STYLES[side.estado]} ${active ? "outline-2 outline-offset-1 outline-ink" : ""}`}
                  >
                    <StateIcon state={side.estado} />
                    {side.prueba && <PruebaMark />}
                  </button>
                ))}
              </li>
            );
          })}
        </ul>
      </div>
      <ul aria-label="Leyenda y recuento de lados" className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
        {STATE_ORDER.map((state) => (
          <li key={state} className="flex items-center gap-1.5">
            <span className={`grid h-4 w-4 place-items-center rounded border ${CELL_STYLES[state]}`}><StateIcon state={state} size={10} /></span>
            {STATE_LABELS[state]}
            <span className={`font-semibold tabular-nums ${counts[state] > 0 && (state === "falta" || state === "problema") ? "text-ink" : ""}`}>{counts[state]}</span>
          </li>
        ))}
        {hasPrueba && (
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="grid h-3.5 w-3.5 place-items-center rounded-full bg-warn-soft text-[9px] font-bold text-warn-ink">P</span>
            Prueba: subido por la cooperativa
          </li>
        )}
      </ul>
    </div>
  );
}

// ---- Perfil de la hilera ----

function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

const tramoLabel = (point: ProfilePoint) =>
  point.desdeM !== null && point.hastaM !== null ? `Tramo ${point.n} · ${fmtM(point.desdeM)}–${fmtM(point.hastaM)} m` : `Tramo ${point.n}`;

function SideMarker({ lado, x, y, r = 4 }: { lado: Side; x: number; y: number; r?: number }) {
  const common = { fill: SIDE_COLORS[lado], stroke: "var(--color-surface)", strokeWidth: 2 };
  return lado === "A"
    ? <circle cx={x} cy={y} r={r} {...common} />
    : <rect x={x - r} y={y - r} width={r * 2} height={r * 2} rx={1} {...common} />;
}

function LegendKey({ lado }: { lado: Side }) {
  return (
    <svg width="22" height="10" aria-hidden className="shrink-0">
      <line x1="1" x2="21" y1="5" y2="5" stroke={SIDE_COLORS[lado]} strokeWidth="2" strokeLinecap="round" />
      <SideMarker lado={lado} x={11} y={5} r={3.5} />
    </svg>
  );
}

const HEIGHT = 180;
const MARGIN = { top: 10, right: 12, bottom: 34, left: 34 };

function ProfileChart({ videos, hilera, longitudM, scaleMax }: { videos: ServerVideo[]; hilera: number; longitudM: number | null; scaleMax: number }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const titleId = useId();
  const profile = rowProfile(videos, hilera, longitudM);
  const notes = SIDES.flatMap((lado) => countNotes(videos.find((v) => v.hilera === hilera && v.lado === lado)).map((note) => `Lado ${lado}: ${note}`));

  if (!profile) {
    return (
      <p className="rounded-md bg-canvas px-3 py-6 text-center text-sm text-muted">
        Ningún lado de esta hilera tiene los frutos contados todavía.
      </p>
    );
  }

  const ticks = niceTicks(scaleMax);
  const top = ticks[ticks.length - 1];
  const plotW = Math.max(0, width - MARGIN.left - MARGIN.right);
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const count = profile.puntos.length;
  const band = count > 0 ? plotW / count : 0;
  const x = (i: number) => MARGIN.left + band * (i + 0.5);
  const y = (value: number) => MARGIN.top + plotH - (value / top) * plotH;
  // Rótulos del eje x: como mucho uno cada 36 px.
  const every = Math.max(1, Math.ceil(36 / Math.max(band, 1)));
  const withMeters = profile.puntos[0]?.desdeM !== null;
  const activePoint = active !== null ? profile.puntos[active] : null;
  // La ayuda va al lado de la línea guía, sin tapar los puntos de ese tramo.
  const tooltipOnLeft = active !== null && x(active) > width / 2;

  return (
    <figure aria-labelledby={titleId}>
      <figcaption id={titleId} className="sr-only">
        Frutos maduros por tramo de la hilera {hilera}, desde la cabecera hasta el final, lado A y lado B.
      </figcaption>
      <ul aria-label="Leyenda" className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {SIDES.map((lado) => (
          <li key={lado} className="flex items-center gap-1.5">
            <LegendKey lado={lado} />
            Lado {lado}
            <span className="font-semibold tabular-nums text-ink">
              {profile.totales[lado] === null ? "sin contar" : `${fmtInt(profile.totales[lado]!)} maduros`}
            </span>
          </li>
        ))}
      </ul>
      <div ref={ref} className="relative" onPointerLeave={() => setActive(null)}>
        {width > 0 && (
          <svg width={width} height={HEIGHT} aria-hidden className="block overflow-visible">
            {ticks.map((tick) => (
              <g key={tick}>
                <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(tick)} y2={y(tick)} stroke="var(--color-line)" strokeWidth={1} />
                <text x={MARGIN.left - 6} y={y(tick)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--color-muted)" className="tabular-nums">
                  {fmtInt(tick)}
                </text>
              </g>
            ))}
            {profile.puntos.map((point, i) => (i % every === 0 || i === count - 1) && (
              <text key={point.n} x={x(i)} y={HEIGHT - MARGIN.bottom + 14} textAnchor="middle" fontSize={11} fill="var(--color-muted)" className="tabular-nums">
                {withMeters ? fmtM(point.hastaM!) : point.n}
              </text>
            ))}
            <text x={MARGIN.left} y={HEIGHT - 4} fontSize={11} fill="var(--color-muted)">Cabecera</text>
            <text x={width - MARGIN.right} y={HEIGHT - 4} textAnchor="end" fontSize={11} fill="var(--color-muted)">
              {withMeters ? "Metros desde la cabecera" : "Tramo"} · Final
            </text>
            {activePoint && <line x1={x(active!)} x2={x(active!)} y1={MARGIN.top} y2={MARGIN.top + plotH} stroke="var(--color-line-strong)" strokeWidth={1} />}
            {profile.lados.map((lado) => {
              const points = profile.puntos.map((p, i) => `${x(i)},${y(p.valores[lado] ?? 0)}`).join(" ");
              return (
                <g key={lado}>
                  {count > 1 && <polyline points={points} fill="none" stroke={SIDE_COLORS[lado]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
                  {profile.puntos.map((p, i) => (
                    <SideMarker key={p.n} lado={lado} x={x(i)} y={y(p.valores[lado] ?? 0)} r={active === i ? 5 : 4} />
                  ))}
                </g>
              );
            })}
          </svg>
        )}
        {/* Zonas de cada tramo: más grandes que los puntos, con ratón y con teclado. */}
        <div className="absolute flex" style={{ left: MARGIN.left, top: MARGIN.top, width: plotW, height: plotH }}>
          {profile.puntos.map((point, i) => (
            <button
              key={point.n}
              type="button"
              className="h-full flex-1 cursor-default focus-visible:bg-ink/5"
              aria-label={`${tramoLabel(point)}: ${SIDES.map((lado) => `lado ${lado} ${point.valores[lado] === null ? "sin contar" : `${fmtInt(point.valores[lado]!)} maduros`}`).join(", ")}`}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
            />
          ))}
        </div>
        {activePoint && (
          <div
            aria-hidden
            className={`pointer-events-none absolute z-10 rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs shadow-sm ${tooltipOnLeft ? "-translate-x-full" : ""}`}
            style={{ left: x(active!) + (tooltipOnLeft ? -10 : 10), top: 0 }}
          >
            <p className="mb-0.5 whitespace-nowrap text-muted">{tramoLabel(activePoint)}</p>
            {SIDES.map((lado) => (
              <p key={lado} className="flex items-center gap-1.5 whitespace-nowrap">
                <span aria-hidden className="h-0.5 w-3 rounded-full" style={{ background: SIDE_COLORS[lado] }} />
                <span className="font-semibold tabular-nums text-ink">
                  {activePoint.valores[lado] === null ? "—" : fmtInt(activePoint.valores[lado]!)}
                </span>
                <span className="text-muted">lado {lado}</span>
              </p>
            ))}
          </div>
        )}
      </div>
      {notes.length > 0 && (
        <ul className="mt-2 grid gap-0.5 text-xs font-medium text-warn-ink">
          {notes.map((note) => (
            <li key={note} className="flex items-start gap-1">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden />
              {note}
            </li>
          ))}
        </ul>
      )}
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-xs font-medium text-brand-ink">Ver en tabla</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Tramo</th>
                {SIDES.map((lado) => <th key={lado} scope="col" className="num">Lado {lado}</th>)}
              </tr>
            </thead>
            <tbody>
              {profile.puntos.map((point) => (
                <tr key={point.n}>
                  <th scope="row" className="whitespace-nowrap">{tramoLabel(point)}</th>
                  {SIDES.map((lado) => (
                    <td key={lado} className="num">{point.valores[lado] === null ? "—" : fmtInt(point.valores[lado]!)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

// ---- Calidad de la imagen ----

/** Barra con umbral: la zona que avisa, sombreada; la marca del umbral; el valor medido. */
function ThresholdBar({ bar }: { bar: QualityBar }) {
  const pct = (value: number) => `${Math.min(100, Math.max(0, (value / bar.escalaMax) * 100))}%`;
  const failZone: CSSProperties = bar.sentido === "min"
    ? { left: 0, width: pct(bar.umbral) }
    : { left: pct(bar.umbral), right: 0 };
  const status = bar.ok === null ? "Sin medida" : bar.ok ? "Bien" : bar.sentido === "min" ? "Bajo el mínimo" : "Sobre el máximo";
  return (
    <div className="grid gap-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="whitespace-nowrap font-medium text-ink">{bar.etiqueta}</span>
        <span className="whitespace-nowrap tabular-nums text-muted">{bar.texto}</span>
      </div>
      <div
        role="img"
        aria-label={`${bar.etiqueta}: ${bar.texto}. ${bar.umbralTexto}. ${status}.`}
        className="relative h-2 rounded-full bg-sunken"
      >
        <div className="absolute inset-y-0 rounded-full bg-bad-soft" style={failZone} />
        {bar.valor !== null && (
          <div
            className={`absolute inset-y-0 left-0 rounded-r-full ${bar.ok ? "bg-ok-ink" : "bg-bad-ink"}`}
            style={{ width: pct(bar.valor), minWidth: 2 }}
          />
        )}
        <div className="absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-ink" style={{ left: pct(bar.umbral) }} />
      </div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="whitespace-nowrap text-muted">{bar.umbralTexto}</span>
        {bar.ok === false && (
          <span className="flex items-center gap-1 whitespace-nowrap font-medium text-bad-ink">
            <AlertTriangle size={12} aria-hidden />
            {status}
          </span>
        )}
      </div>
    </div>
  );
}

function QualitySide({ lado, video }: { lado: Side; video: ServerVideo | undefined }) {
  let body;
  if (!video) body = <p className="text-sm text-muted">Falta el vídeo.</p>;
  else if (video.calidad.estado === "pendiente") body = <p className="text-sm text-muted">Revisando la imagen…</p>;
  else if (video.calidad.estado === "error") body = <p className="text-sm text-bad-ink">No se ha podido revisar la imagen.</p>;
  else if (!video.calidad.medidas) {
    body = (
      <p className="text-sm text-muted">
        {video.calidad.avisos.includes("ILEGIBLE") ? "No se ha podido leer el vídeo." : "Sin medidas de esta revisión."}
      </p>
    );
  } else body = <div className="grid gap-3">{qualityBars(video.calidad.medidas).map((bar) => <ThresholdBar key={bar.clave} bar={bar} />)}</div>;
  return (
    <section aria-label={`Calidad de la imagen, lado ${lado}`} className="min-w-0">
      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted">
        <LegendKey lado={lado} />
        Lado {lado}
      </h4>
      {body}
    </section>
  );
}

// ---- Panel completo ----

export function VideosRecibidosGraficos({ videos, hileras, longitudM }: { videos: ServerVideo[]; hileras: number; longitudM: number | null }) {
  const grid = statusGrid(hileras, videos);
  const [chosen, setChosen] = useState<number | null>(null);
  const selectId = useId();
  const selected = chosen !== null && grid.some((row) => row.hilera === chosen) ? chosen : defaultHilera(grid);
  if (grid.length === 0) return null;
  const scaleMax = greenhouseTramoMax(videos);
  const sideVideo = (lado: Side) => videos.find((v) => v.hilera === selected && v.lado === lado);

  return (
    <div className="border-b border-line">
      <div className="px-5 py-4">
        <h3 className="mb-3 text-sm font-semibold">Estado por hilera y lado</h3>
        <StatusOverview grid={grid} selected={selected} onSelect={setChosen} />
      </div>
      {selected !== null && (
        <div className="border-t border-line px-5 py-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Hilera {selected}</h3>
            <label htmlFor={selectId} className="flex items-center gap-2 text-xs text-muted">
              Ver otra hilera
              <select
                id={selectId}
                value={selected}
                onChange={(event) => setChosen(Number(event.target.value))}
                className="min-h-8 rounded-md border border-control bg-surface px-2 text-sm font-medium text-ink"
              >
                {grid.map((row) => <option key={row.hilera} value={row.hilera}>Hilera {row.hilera}</option>)}
              </select>
            </label>
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div className="min-w-0">
              <h4 className="text-sm font-medium">Perfil de la hilera</h4>
              <p className="mb-2 text-xs text-muted">Frutos maduros en cada tramo, de la cabecera al final.</p>
              <ProfileChart videos={videos} hilera={selected} longitudM={longitudM} scaleMax={scaleMax} />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-medium">Calidad de la imagen</h4>
              <p className="mb-2 text-xs text-muted">Cada medida frente al umbral de la revisión. La zona roja es la que avisa.</p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {SIDES.map((lado) => <QualitySide key={lado} lado={lado} video={sideVideo(lado)} />)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
