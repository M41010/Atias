"use client";

import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from "framer-motion";
import { AlertTriangle, CheckCircle2, ChevronRight, Info, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import type { AppWarning, HarvestReport } from "@/lib/api";
import type { KgRange } from "@/lib/calc";
import { fmtBetween, fmtCaptureSpan, fmtInt } from "@/lib/format";
import { useHarvests } from "@/lib/hooks";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions}
    </header>
  );
}

export function HarvestPicker({ selected }: { selected: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const { data, isError } = useHarvests();
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <span className="sr-only md:not-sr-only">Recolección</span>
      <select
        value={selected}
        onChange={(event) => {
          const next = new URLSearchParams(search);
          next.set("recoleccion", event.target.value);
          router.push(`?${next.toString()}`);
        }}
        className="min-h-10 rounded-md border border-control bg-surface px-3 text-sm font-medium text-ink transition-colors duration-150 hover:border-ink"
      >
        {(data ?? [{ id: selected, label: isError ? "Recolección actual" : "Cargando…", hasData: true }]).map((h) => (
          <option key={h.id} value={h.id}>
            {h.label.replace("Recolección ", "")}
            {h.hasData ? "" : " (sin capturas)"}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Panel({
  title,
  description,
  children,
  actions,
}: {
  title?: string;
  description?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-lg border border-line bg-surface shadow-[0_1px_2px_rgb(20_30_24/0.04)]">
      {title && (
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line px-5 py-3.5">
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

const PILLS = {
  ok: "bg-ok-soft text-ok-ink",
  warn: "bg-warn-soft text-warn-ink",
  bad: "bg-bad-soft text-bad-ink",
  neutral: "bg-sunken text-muted",
  brand: "bg-brand-soft text-brand-ink",
};

export function Pill({ tone, children }: { tone: keyof typeof PILLS; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${PILLS[tone]}`}>
      {children}
    </span>
  );
}

export function StatusPill({ status }: { status: "analizado" | "con_advertencias" | "analizando" | "problema" }) {
  if (status === "analizado") {
    return <Pill tone="ok"><CheckCircle2 size={12} aria-hidden />Analizado</Pill>;
  }
  if (status === "analizando") {
    return <Pill tone="neutral"><Loader2 size={12} className="animate-spin motion-reduce:animate-none" aria-hidden />Analizando</Pill>;
  }
  if (status === "problema") {
    return <Pill tone="bad"><AlertTriangle size={12} aria-hidden />Con problema</Pill>;
  }
  return <Pill tone="warn"><AlertTriangle size={12} aria-hidden />Con advertencias</Pill>;
}

/** Banda de rango sobre una escala común, para comparar cifras en el mismo panel. */
export function RangeBand({ range, scaleMax, tone }: { range: KgRange; scaleMax: number; tone: "brand" | "warn" }) {
  const percent = (value: number) => (scaleMax > 0 ? Math.min(100, (value / scaleMax) * 100) : 0);
  const band = tone === "brand" ? "bg-brand/25" : "bg-warn/30";
  const tick = tone === "brand" ? "bg-brand" : "bg-warn-ink";
  return (
    <div aria-hidden className="relative mt-3 h-1.5 rounded-full bg-sunken">
      <div className={`absolute inset-y-0 rounded-full ${band}`} style={{ left: `${percent(range.min)}%`, width: `${percent(range.max) - percent(range.min)}%` }} />
      <div className={`absolute -inset-y-0.5 w-0.5 rounded-full ${tick}`} style={{ left: `${percent(range.kg)}%` }} />
    </div>
  );
}

/** Cifra que transita al recalcularse, para que se note qué ha cambiado por un ajuste. */
export function AnimatedNumber({ value, format = fmtInt }: { value: number; format?: (n: number) => string }) {
  const motionValue = useMotionValue(value);
  const [shown, setShown] = useState(value);
  const reduced = useReducedMotion();
  useMotionValueEvent(motionValue, "change", setShown);
  useEffect(() => {
    // animate() no obedece a MotionConfig: la preferencia del usuario se aplica aquí.
    const controls = animate(motionValue, value, { duration: reduced ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [motionValue, reduced, value]);
  // La cifra animada se oculta al lector de pantalla: solo debe anunciarse el valor final.
  return (
    <>
      <span aria-hidden>{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}

export function WarningList({ warnings, harvestId }: { warnings: AppWarning[]; harvestId?: string }) {
  if (warnings.length === 0) return null;
  return (
    <ul className="divide-y divide-line">
      {warnings.map((w) => (
        <li key={`${w.scope}${w.message}`} className="flex gap-3 px-5 py-3">
          {w.severity === "alta" ? (
            <AlertTriangle size={17} className="mt-0.5 shrink-0 text-bad-ink" aria-hidden />
          ) : (
            <Info size={17} className="mt-0.5 shrink-0 text-warn-ink" aria-hidden />
          )}
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-medium">{w.scope}</p>
            <p className="text-muted">{w.message} {w.action}</p>
          </div>
          {harvestId && (
            <Link
              href={`/invernaderos/${w.greenhouseId}?recoleccion=${encodeURIComponent(harvestId)}#hilera-${w.hilera}`}
              className="flex shrink-0 items-center gap-0.5 self-center whitespace-nowrap text-sm font-medium text-brand-ink underline-offset-3 hover:underline"
            >
              Ver hilera
              <ChevronRight size={15} aria-hidden />
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Rótulo de columna: la previsión nunca se presenta como lo observado. */
export function ForecastHeader({ unit = "kg" }: { unit?: string }) {
  return (
    <span className="inline-flex flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-1.5">
      <span>Previsión<span className="hidden sm:inline"> ({unit})</span></span>
      <abbr title="Experimental, sin validar" className="rounded-full bg-warn-soft px-1.5 text-[0.6875rem] font-medium text-warn-ink no-underline">
        Exp.
      </abbr>
    </span>
  );
}

export function ProvisionalNote({ missing }: { missing: number }) {
  if (missing === 0) return null;
  return <p className="text-sm text-warn-ink">Cifras provisionales: pueden aumentar cuando termine el análisis.</p>;
}

export function PartialNote({ missing, total }: { missing: number; total: number }) {
  if (missing === 0) return null;
  return (
    <p className="mt-2">
      <Pill tone="warn">Parcial: falta {missing} de {total} {total === 1 ? "hilera" : "hileras"}</Pill>
    </p>
  );
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Cargando datos" className="grid gap-4">
      <div className="h-32 animate-pulse rounded-lg bg-sunken motion-reduce:animate-none" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-lg bg-sunken motion-reduce:animate-none" />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-line bg-surface px-6 py-10 text-center">
      <AlertTriangle size={22} className="mx-auto text-bad-ink" aria-hidden />
      <h2 className="mt-3 font-semibold">No se han podido cargar los datos</h2>
      <p className="mt-1 text-sm text-muted">{message} Comprueba la conexión y vuelve a intentarlo.</p>
      <button type="button" onClick={onRetry} className="btn-secondary mt-4">
        <RefreshCw size={15} aria-hidden />
        Reintentar
      </button>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
      <h2 className="font-semibold">{title}</h2>
      <p className="mx-auto mt-1 max-w-[56ch] text-sm text-muted">{children}</p>
    </div>
  );
}

export function SummaryPanel({ report }: { report: HarvestReport }) {
  const scale = report.forecast.max * 1.04;
  const secondary = "mt-2 text-3xl font-semibold tracking-tight tabular-nums";
  const partial = <PartialNote missing={report.missingHileras} total={report.totalHileras} />;
  const closed = report.realKg !== null;
  return (
    <Panel>
      <div aria-live="polite" className="grid divide-y divide-line md:grid-cols-[1.25fr_0.85fr_1fr] md:divide-x md:divide-y-0">
        <div className="p-5">
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
            {closed ? "Previsión de esa recolección" : "Previsión para la venta"}
            <Pill tone="warn">Experimental</Pill>
          </p>
          <p className="mt-2 text-5xl font-semibold tracking-tight tabular-nums">
            <AnimatedNumber value={report.forecast.kg} /> <span className="text-xl font-medium tracking-normal text-muted">kg</span>
          </p>
          <RangeBand range={report.forecast} scaleMax={scale} tone="warn" />
          <p className="mt-2 text-sm text-muted">{fmtBetween(report.forecast)}</p>
          <p className="text-sm text-muted">
            {closed
              ? "Comparada más abajo con lo cosechado"
              : "Cifra para planificar la venta, aún sin validar con cosecha real"}
          </p>
          {partial}
        </div>
        <div className="p-5">
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
            Temporeros necesarios
            <Pill tone="warn">Experimental</Pill>
          </p>
          <p className={secondary}>
            {report.workers === null ? "—" : <AnimatedNumber value={report.workers} format={(n) => fmtInt(Math.round(n))} />}
          </p>
          <p className="mt-2 text-sm text-muted">
            {report.workersMin !== null && report.workersMax !== null && (report.workersMin === report.workersMax
              ? "Igual en todo el rango · "
              : `Hasta ${report.workersMax} en el extremo alto · `)}
            {report.days} {report.days === 1 ? "día" : "días"}
          </p>
          <p className="text-sm text-muted">Con kg por jornal de ejemplo</p>
          {partial}
        </div>
        <div className="p-5">
          <p className="text-sm font-medium">Fruta madura observada</p>
          <p className={secondary}>
            <AnimatedNumber value={report.observed.kg} /> <span className="text-lg font-medium tracking-normal text-muted">kg</span>
          </p>
          <RangeBand range={report.observed} scaleMax={scale} tone="brand" />
          <p className="mt-2 text-sm text-muted">{fmtBetween(report.observed)} · {fmtInt(report.matureFruits)} frutos</p>
          <p className="text-sm text-muted">Capturas: {fmtCaptureSpan(report.captureDates)}</p>
          {partial}
        </div>
      </div>
    </Panel>
  );
}
