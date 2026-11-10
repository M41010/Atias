"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize, X } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { Wordmark } from "@/components/Wordmark";
import { listReports } from "@/lib/api";
import { fmtDay, fmtInt, fmtKg, fmtPct } from "@/lib/format";
import { queryKeys, useDocumentTitle } from "@/lib/hooks";
import { useDataMode } from "@/lib/mode";
import type { Forecaster } from "@/lib/precision";
import { type PilotSummary, pilotSummary } from "@/lib/presentation";
import { MIN_PAIRS, TARGET_PCT, VERDICT_TEXT } from "@/lib/validation";

const WHO: Record<Forecaster, string> = { atias: "Atias", agricultor: "Agricultor", tecnico: "Técnico" };
const SERIES = [
  { key: "real", label: "Recogido", color: "var(--color-ink)" },
  { key: "atias", label: "Atias", color: "var(--color-sprout)" },
  { key: "agricultor", label: "Agricultor", color: "var(--color-warn)" },
  { key: "tecnico", label: "Técnico", color: "var(--color-control)" },
] as const;

const signed = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${fmtPct(Math.abs(value))}`;

function Slide({ eyebrow, title, children, dark }: { eyebrow: string; title: ReactNode; children?: ReactNode; dark?: boolean }) {
  return (
    <section className={`flex min-h-dvh flex-col justify-center gap-10 px-8 py-24 md:px-24 ${dark ? "bg-ink text-canvas" : ""}`}>
      <div className="grid gap-4">
        <p className={`text-sm font-semibold uppercase tracking-[0.18em] ${dark ? "text-sprout-light" : "text-brand-ink"}`}>{eyebrow}</p>
        <h1 className="display max-w-[22ch] text-[clamp(2.5rem,6vw,5.5rem)]">{title}</h1>
      </div>
      {children}
    </section>
  );
}

function Big({ value, label, note, accent }: { value: string; label: string; note?: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border bg-surface p-6 ${accent ? "border-ink border-2" : "border-line"}`}>
      <p className="text-base text-muted">{label}</p>
      <p className={`numeral mt-2 text-[clamp(2.5rem,5vw,4.5rem)] leading-none ${accent ? "text-ink" : ""}`}>{value}</p>
      {note && <p className="mt-3 text-base text-muted">{note}</p>}
    </div>
  );
}

/** Barras por día: lo recogido y cada previsión, con su valor escrito encima. */
function DaysChart({ summary }: { summary: PilotSummary }) {
  // Solo las previsiones que alguien dio: una serie vacía dejaría un hueco en cada día.
  const series = SERIES.filter((s) => summary.days.some((d) => d[s.key] !== null));
  const max = Math.max(1, ...summary.days.flatMap((d) => series.map((s) => d[s.key] ?? 0)));
  const W = 960, H = 360, base = 300, top = 40, group = W / summary.days.length, gap = 10;
  const bar = Math.min(44, (group - 24 - gap * (series.length - 1)) / series.length);
  const height = (v: number) => ((base - top) * v) / max;
  return (
    <figure className="grid gap-4">
      <ul className="flex flex-wrap gap-x-6 gap-y-2 text-base" aria-hidden>
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span className="size-4 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </li>
        ))}
      </ul>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-5xl" role="img" aria-label="Kilos por día: recogido frente a cada previsión">
        <line x1={0} x2={W} y1={base} y2={base} stroke="var(--color-line-strong)" />
        {summary.days.map((d, i) => {
          const x0 = i * group + (group - bar * series.length - gap * (series.length - 1)) / 2;
          return (
            <g key={d.date}>
              {series.map((s, j) => {
                const v = d[s.key];
                if (v === null) return null;
                const x = x0 + j * (bar + gap);
                const h = height(v);
                return (
                  <g key={s.key}>
                    <motion.rect
                      x={x}
                      width={bar}
                      rx={3}
                      fill={s.color}
                      initial={{ y: base, height: 0 }}
                      animate={{ y: base - h, height: h }}
                      transition={{ duration: 0.6, delay: 0.1 + i * 0.08 }}
                    />
                    <text x={x + bar / 2} y={base - h - 8} textAnchor="middle" fontSize={14} fill="var(--color-ink)" className="tabular-nums">
                      {fmtKg(v)}
                    </text>
                  </g>
                );
              })}
              <text x={i * group + group / 2} y={base + 34} textAnchor="middle" fontSize={18} fill="var(--color-muted)">{fmtDay(d.date)}</text>
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>Kilos por día</caption>
        <thead><tr><th>Día</th>{series.map((s) => <th key={s.key}>{s.label}</th>)}</tr></thead>
        <tbody>
          {summary.days.map((d) => (
            <tr key={d.date}><th>{fmtDay(d.date)}</th>{series.map((s) => <td key={s.key}>{d[s.key] === null ? "—" : fmtKg(d[s.key] as number)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function slides(s: PilotSummary): ReactNode[] {
  const weeks = s.weeksMeasured;
  const atias = s.results.atias;
  return [
    <Slide key="portada" dark eyebrow={`Piloto · Semana ${s.report.isoWeek}`} title={<>Contar la cosecha antes de recogerla</>}>
      <p className="max-w-[48ch] text-xl text-canvas/80">
        {s.greenhouses.length > 3 ? `${s.greenhouses.length} invernaderos` : s.greenhouses.join(", ")} · {fmtInt(s.videos)} vídeos · {fmtInt(s.matureFruits)} frutos maduros contados
      </p>
    </Slide>,
    <Slide key="conteo" eyebrow="El conteo" title="La cámara frente a lo contado a mano">
      {s.control.tramos === 0 ? (
        <p className="text-xl text-muted">Sin tramos de control apuntados en Datos de campo.</p>
      ) : (
        <div className="grid max-w-5xl gap-5 md:grid-cols-3">
          <Big accent label="De la fruta madura que se ve, Atias cuenta" value={s.control.detectionPct === null ? "—" : fmtPct(s.control.detectionPct)} />
          <Big label="Se ve sin apartar hojas" value={s.control.visibilityPct === null ? "—" : fmtPct(s.control.visibilityPct)} note="El resto queda tapada: ninguna cámara la ve desde el pasillo." />
          <Big label="Tramos contados a mano" value={fmtInt(s.control.tramos)} />
        </div>
      )}
    </Slide>,
    <Slide key="dias" eyebrow="Lunes a viernes" title={<>{fmtKg(s.realKg)} kg recogidos</>}>
      <DaysChart summary={s} />
    </Slide>,
    <Slide key="semana" eyebrow="La semana" title={s.closest ? <>Más cerca de lo recogido: {WHO[s.closest]}</> : "Error de cada previsión en la semana"}>
      <div className="grid max-w-5xl gap-5 md:grid-cols-3">
        {(Object.keys(WHO) as Forecaster[]).map((who) => {
          const r = s.results[who];
          return (
            <Big
              key={who}
              accent={who === "atias"}
              label={WHO[who]}
              value={r.errorPct === null ? "—" : fmtPct(r.errorPct)}
              note={r.kg === null ? (who === "atias" ? "Faltan hileras por contar" : "Sin previsión apuntada") : `${fmtKg(r.kg)} kg previstos${r.biasPct === null ? "" : ` · ${signed(r.biasPct)}`}`}
            />
          );
        })}
      </div>
      <p className="max-w-[60ch] text-lg text-muted">Error en kilos de la semana frente a lo recogido. Signo positivo: estimó de más.</p>
    </Slide>,
    <Slide key="lectura" dark eyebrow="Qué significa" title={weeks < MIN_PAIRS ? "Una primera medida, no una conclusión" : "La precisión, medida"}>
      <div className="grid max-w-[60ch] gap-4 text-xl text-canvas/85">
        {atias.errorPct !== null && <p>Esta semana Atias se desvió un {fmtPct(atias.errorPct)} de lo recogido. El objetivo es no pasar del {TARGET_PCT} %.</p>}
        <p>
          Llevamos {fmtInt(weeks)} {weeks === 1 ? "semana medida" : "semanas medidas"}.{" "}
          {weeks < MIN_PAIRS
            ? `Para afirmar el objetivo hacen falta al menos ${MIN_PAIRS} semanas e invernaderos que no se hayan usado para calibrar.`
            : VERDICT_TEXT[s.verdict]}
        </p>
      </div>
    </Slide>,
  ];
}

export default function PresentacionPage() {
  useDocumentTitle("Presentación");
  const mode = useDataMode();
  const reports = useQuery({ queryKey: queryKeys.reports(mode), queryFn: listReports });
  const summary = reports.data ? pilotSummary(reports.data) : null;
  const pages = summary ? slides(summary) : [];
  const [index, setIndex] = useState(0);
  const go = useCallback((step: number) => setIndex((i) => Math.min(Math.max(i + step, 0), Math.max(pages.length - 1, 0))), [pages.length]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (["ArrowRight", "PageDown", " "].includes(event.key)) { event.preventDefault(); go(1); }
      if (["ArrowLeft", "PageUp"].includes(event.key)) { event.preventDefault(); go(-1); }
      if (event.key === "Home") setIndex(0);
      if (event.key === "End") setIndex(Math.max(pages.length - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, pages.length]);

  const simulated = reports.data?.some((r) => r.simulated);
  const dark = index === 0 || index === pages.length - 1;

  return (
    <main className="relative min-h-dvh">
      {simulated && (
        <p role="note" className="absolute inset-x-0 top-0 z-20 bg-warn-soft px-4 py-2 text-center text-sm font-medium text-warn-ink">
          Modo demostración: datos simulados. Ninguna cifra indica la precisión real.
        </p>
      )}
      <div className={`absolute left-8 top-10 z-10 text-2xl md:left-24 ${dark && summary ? "text-canvas" : "text-ink"}`}>
        <Wordmark />
      </div>
      {reports.isPending ? (
        <p className="grid min-h-dvh place-items-center text-muted">Cargando…</p>
      ) : !summary ? (
        <Slide eyebrow="Modo presentación" title="Todavía no hay una semana con cosecha">
          <p className="max-w-[55ch] text-xl text-muted">
            Aparecerá en cuanto haya vídeos contados y los kilos recogidos de lunes a viernes en Datos de campo.
          </p>
        </Slide>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={index} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
            {pages[index]}
          </motion.div>
        </AnimatePresence>
      )}
      <nav aria-label="Presentación" className={`fixed bottom-6 right-6 z-10 flex items-center gap-2 ${dark && summary ? "text-canvas" : ""}`}>
        {summary && (
          <>
            <button type="button" onClick={() => go(-1)} disabled={index === 0} aria-label="Anterior" className="grid size-11 place-items-center rounded-md disabled:opacity-30">
              <ChevronLeft size={22} aria-hidden />
            </button>
            <span className="min-w-12 text-center text-sm tabular-nums" aria-live="polite">{index + 1} / {pages.length}</span>
            <button type="button" onClick={() => go(1)} disabled={index === pages.length - 1} aria-label="Siguiente" className="grid size-11 place-items-center rounded-md disabled:opacity-30">
              <ChevronRight size={22} aria-hidden />
            </button>
          </>
        )}
        <button type="button" onClick={() => void document.documentElement.requestFullscreen?.().catch(() => {})} aria-label="Pantalla completa" className="grid size-11 place-items-center rounded-md">
          <Maximize size={18} aria-hidden />
        </button>
        <Link href="/precision" aria-label="Salir de la presentación" className="grid size-11 place-items-center rounded-md">
          <X size={20} aria-hidden />
        </Link>
      </nav>
    </main>
  );
}
