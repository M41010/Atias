"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  EmptyState,
  ErrorState,
  ForecastHeader,
  HarvestPicker,
  PageHeader,
  PartialNote,
  Panel,
  Pill,
  RangeBand,
  Skeleton,
  StatusPill,
  WarningList,
} from "@/components/ui";
import { type GreenhouseRow, type HileraRow, markSeen } from "@/lib/api";
import { fmtBetween, fmtCaptureSpan, fmtDay, fmtDecimal, fmtInt, fmtKg, fmtPct, fmtRange } from "@/lib/format";
import { queryKeys, useDocumentTitle, useReport, useSelectedHarvest } from "@/lib/hooks";
import { useDataMode } from "@/lib/mode";
import type { Video } from "@/lib/simulated";

const STATUS_WORD = { analizado: "analizado", analizando: "analizando", problema: "con problema" };

function VideoSummary({ videos }: { videos: Video[] }) {
  return (
    <a href="#estado-analisis" className="text-muted underline-offset-3 hover:text-ink hover:underline">
      {videos.map((v) => `${v.lado}: ${STATUS_WORD[v.status]}`).join(" · ")}
    </a>
  );
}

function HileraRows({ hilera, videos, warned, startOpen }: { hilera: HileraRow; videos: Video[]; warned: boolean; startOpen: boolean }) {
  const [open, setOpen] = useState(startOpen);
  if (!hilera.observed || !hilera.forecast) {
    return (
      <tr id={`hilera-${hilera.n}`} className="scroll-mt-16">
        <th scope="row">Hilera {hilera.n}</th>
        <td className="num text-muted" colSpan={2}>Pendiente de análisis</td>
        <td className="num hidden text-muted sm:table-cell">—</td>
        <td className="hidden text-xs lg:table-cell"><VideoSummary videos={videos} /></td>
      </tr>
    );
  }
  return (
    <>
      <tr id={`hilera-${hilera.n}`} className="scroll-mt-16">
        <th scope="row">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="-mx-1 flex min-h-8 items-center gap-1.5 rounded px-1 font-medium transition-colors duration-150 hover:text-brand-ink"
          >
            <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.15 }} className="flex">
              <ChevronRight size={15} aria-hidden />
            </motion.span>
            Hilera {hilera.n}
            {warned && <AlertTriangle size={14} className="text-bad-ink" aria-label="Con advertencia" />}
          </button>
        </th>
        <td className="num">
          {fmtKg(hilera.observed.kg)}
          <span className="hidden text-xs text-muted lg:block">{fmtRange(hilera.observed)}</span>
        </td>
        <td className="num">
          {fmtKg(hilera.forecast.kg)}
          <span className="hidden text-xs text-muted lg:block">{fmtRange(hilera.forecast)}</span>
        </td>
        <td className="num hidden sm:table-cell">{fmtInt(hilera.matureFruits ?? 0)}</td>
        <td className="hidden text-xs lg:table-cell"><VideoSummary videos={videos} /></td>
      </tr>
      <AnimatePresence initial={false}>
        {open &&
          hilera.tramos.map((t) => (
            <motion.tr
              key={t.n}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-canvas text-[0.8125rem]"
            >
              <th scope="row" className="pl-11! font-normal! text-muted">Tramo {t.n}</th>
              <td className="num">
                {fmtKg(t.observed.kg)}
                <span className="hidden text-xs text-muted lg:block">{fmtRange(t.observed)}</span>
              </td>
              <td className="num">
                {fmtKg(t.forecast.kg)}
                <span className="hidden text-xs text-muted lg:block">{fmtRange(t.forecast)}</span>
              </td>
              <td className="num hidden sm:table-cell">{fmtInt(t.matureFruits)}</td>
              <td className="hidden lg:table-cell" />
            </motion.tr>
          ))}
      </AnimatePresence>
    </>
  );
}

function DailyPanel({ g }: { g: GreenhouseRow }) {
  const total = (pick: (d: GreenhouseRow["daily"][number]) => number | null) => {
    const values = g.daily.map(pick);
    return values.some((v) => v === null) ? null : (values as number[]).reduce((a, b) => a + b, 0);
  };
  const cells = (value: number | null) => (value === null ? "—" : fmtKg(value));
  // La previsión del agricultor solo aparece si alguien la ha apuntado.
  const showFarmer = g.daily.some((d) => d.farmer !== null);
  return (
    <Panel title="Por día de recolección" description="Cada día se recoge una zona del invernadero. Lo que madura después de grabar se reparte según el calor de cada día; el del fin de semana, el lunes.">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Día</th>
              <th scope="col" className="num">Real (kg)</th>
              {showFarmer && <th scope="col" className="num">Agricultor (kg)</th>}
              <th scope="col" className="num">Técnico (kg)</th>
              <th scope="col" className="num"><ForecastHeader unit="Atias, kg" /></th>
            </tr>
          </thead>
          <tbody>
            {g.daily.map((d) => (
              <tr key={d.date}>
                <th scope="row" className="whitespace-nowrap font-normal!">{fmtDay(d.date)}</th>
                <td className="num">{cells(d.real)}</td>
                {showFarmer && <td className="num">{cells(d.farmer)}</td>}
                <td className="num">{cells(d.technician)}</td>
                <td className="num">{fmtKg(d.atias)}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <th scope="row">Total</th>
              <td className="num">{cells(total((d) => d.real))}</td>
              {showFarmer && <td className="num">{cells(total((d) => d.farmer))}</td>}
              <td className="num">{cells(g.technicianKg)}</td>
              <td className="num">{fmtKg(g.forecast.kg)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {g.partial && <p className="border-t border-line px-5 py-3 text-sm text-warn-ink">La previsión de Atias es parcial: faltan hileras por analizar.</p>}
    </Panel>
  );
}

/** Curva de las 24 horas del día, sobre una escala común para comparar días. */
function HourlyCurve({ temps, min, max }: { temps: number[]; min: number; max: number }) {
  const span = max - min || 1;
  const points = temps.map((t, h) => `${(h / Math.max(1, temps.length - 1)) * 72},${20 - ((t - min) / span) * 18 - 1}`).join(" ");
  return (
    <svg viewBox="0 0 72 20" width="72" height="20" aria-hidden className="inline-block text-warn-ink">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function WeatherPanel({ g }: { g: GreenhouseRow }) {
  const all = g.weather.days.flatMap((d) => d.hourlyTempC);
  const low = Math.min(...all);
  const high = Math.max(...all);
  const change = Math.round((g.weather.factor - 1) * 100);
  return (
    <Panel
      title={`Meteorología en ${g.info.location.municipality}`}
      description="Temperatura exterior hora a hora, de sábado (día de la grabación) a viernes. Cuando haya un sensor dentro del invernadero, se usará su temperatura."
      actions={
        g.weather.source === "simulada"
          ? <Pill tone="warn">Simulada</Pill>
          : g.weather.stale
            ? <Pill tone="warn">Sin actualizar</Pill>
            : <Pill tone="ok">Open-Meteo</Pill>
      }
    >
      <div className="overflow-x-auto">
        <table className="data-table compact">
          <thead>
            <tr>
              <th scope="col">Día</th>
              <th scope="col" className="hidden sm:table-cell">0–23 h</th>
              <th scope="col" className="num">Mín.</th>
              <th scope="col" className="num">Máx.</th>
              <th scope="col" className="num hidden sm:table-cell">Lluvia</th>
              <th scope="col" className="num">Grados-día</th>
              <th scope="col" className="num">Normal</th>
            </tr>
          </thead>
          <tbody>
            {g.weather.days.map((d) => (
              <tr key={d.date}>
                <th scope="row" className="whitespace-nowrap font-normal!">
                  {fmtDay(d.date)}
                  {d.kind === "prevision" && <span className="ml-1.5 text-xs text-muted">previsto</span>}
                  {d.kind === "normal" && <span className="ml-1.5 text-xs text-muted">sin previsión: lo normal</span>}
                </th>
                <td className="hidden sm:table-cell"><HourlyCurve temps={d.hourlyTempC} min={low} max={high} /></td>
                <td className="num">{fmtDecimal(d.tempMinC)} °C</td>
                <td className="num">{fmtDecimal(d.tempMaxC)} °C</td>
                <td className="num hidden sm:table-cell">{d.precipitationMm > 0 ? `${fmtDecimal(d.precipitationMm)} mm` : "—"}</td>
                <td className="num">{fmtDecimal(d.degreeDays)}</td>
                <td className="num text-muted">{fmtDecimal(d.normalDegreeDays)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line px-5 py-3 text-sm text-muted">
        Grados-día: calor útil hora a hora por encima de 10 °C. Esta semana suma {fmtDecimal(g.weather.weeklyDegreeDays)}, frente a{" "}
        {fmtDecimal(g.weather.normalWeeklyDegreeDays)} de lo normal en estas fechas en {g.info.location.municipality}:{" "}
        {change === 0
          ? "la fruta madura a ritmo normal."
          : `la fruta madura un ${Math.abs(change)} % más ${change > 0 ? "deprisa" : "despacio"}.`}{" "}
        {g.weather.source === "simulada"
          ? "Open-Meteo no ha respondido: estos datos son simulados."
          : `Datos de Open-Meteo.com (CC BY 4.0) en la localización del invernadero; lo normal es la media de ${g.weather.normalsYears} años.${g.weather.stale ? " Open-Meteo no responde ahora: son los últimos datos guardados." : ""}`}
      </p>
    </Panel>
  );
}

function Comparison({ g, simulated }: { g: GreenhouseRow; simulated: boolean }) {
  if (g.realKg === null) {
    return (
      <p className="px-5 py-4 text-sm text-muted">
        Aún no hay cosecha pesada para esta recolección. Cuando se registre, aquí se comparará con la previsión.
      </p>
    );
  }
  return (
    <>
      <dl className="grid grid-cols-3 divide-x divide-line">
        <div className="p-5">
          <dt className="flex flex-wrap items-center gap-1.5 text-sm text-muted">Previsión <Pill tone="warn">Experimental</Pill></dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums">{fmtKg(g.forecast.kg)} kg</dd>
        </div>
        <div className="p-5">
          <dt className="text-sm text-muted">Cosechado</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums">{fmtKg(g.realKg)} kg</dd>
        </div>
        <div className="p-5">
          <dt className="text-sm text-muted">Error</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums">{g.errorPct === null || g.partial ? "—" : fmtPct(g.errorPct)}</dd>
        </div>
      </dl>
      <p className={`border-t border-line px-5 py-3 text-sm ${g.partial ? "text-warn-ink" : "text-muted"}`}>
        {simulated
          ? "Cosecha simulada: el error comprueba el cálculo, no la precisión real."
          : g.partial
            ? "Faltan hileras por contar: la previsión se queda corta y no se compara con la cosecha entera."
            : "Una sola semana no basta para saber cuánto acierta Atias: el conjunto está en Precisión."}
      </p>
    </>
  );
}

export default function GreenhousePage() {
  const { id } = useParams<{ id: string }>();
  const harvestId = useSelectedHarvest();
  const client = useQueryClient();
  const { data: report, isPending, isError, error, refetch } = useReport(harvestId);
  const greenhouse = report?.greenhouses.find((g) => g.info.id === id);
  useDocumentTitle(greenhouse?.info.name ?? "Invernadero");
  const isNew = greenhouse?.isNew ?? false;

  const mode = useDataMode();
  const { mutate: seen } = useMutation({
    mutationFn: () => markSeen(harvestId, id),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.report(harvestId, mode) }),
  });
  useEffect(() => {
    if (isNew) seen();
  }, [isNew, seen]);

  const [target, setTarget] = useState<number | null>(null);
  const hasData = Boolean(greenhouse);
  useEffect(() => {
    const match = window.location.hash.match(/^#hilera-(\d+)$/);
    if (!hasData || !match) return;
    const raf = requestAnimationFrame(() => setTarget(Number(match[1])));
    return () => cancelAnimationFrame(raf);
  }, [hasData]);
  useEffect(() => {
    if (target !== null) document.getElementById(`hilera-${target}`)?.scrollIntoView({ block: "center" });
  }, [target]);

  const back = (
    <Link href={`/invernaderos?recoleccion=${encodeURIComponent(harvestId)}`} className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted transition-colors duration-150 hover:text-ink">
      <ArrowLeft size={15} aria-hidden />
      Invernaderos
    </Link>
  );

  if (isPending) return <>{back}<Skeleton /></>;
  if (isError) return <>{back}<ErrorState message={error.message} onRetry={refetch} /></>;
  if (!greenhouse) {
    return (
      <>
        {back}
        <PageHeader title="Sin datos para esta recolección" actions={<HarvestPicker selected={harvestId} />} />
        <EmptyState title="No hay capturas de este invernadero">Elige otra recolección o espera a que el agricultor suba los vídeos.</EmptyState>
      </>
    );
  }

  const g = greenhouse;
  const scale = g.forecast.max * 1.04;
  const done = g.videos.filter((v) => v.status !== "analizando").length;
  const number = "mt-2 text-3xl numeral";
  const partial = <PartialNote missing={g.missingHileras} total={g.hileras.length} />;

  return (
    <>
      {back}
      <PageHeader
        title={g.info.name}
        description={
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            {g.familyName} · {g.growerName} · Técnico: {g.technicianName} · Captura: {fmtCaptureSpan(g.captureDates)}{!g.captureFromRecording && " (cuando llegaron: no se sabe cuándo se grabaron)"}
            <StatusPill status={g.status} />
          </span>
        }
        actions={<HarvestPicker selected={harvestId} />}
      />
      <div className="grid gap-5">
        <Panel>
          <div className="grid divide-y divide-line md:grid-cols-[1fr_1fr_0.8fr] md:divide-x md:divide-y-0">
            <div className="p-5">
              <p className="text-sm font-medium">Fruta madura observada</p>
              <p className={number}>{fmtKg(g.observed.kg)} <span className="text-lg font-medium text-muted">kg</span></p>
              <RangeBand range={g.observed} scaleMax={scale} tone="brand" />
              <p className="mt-2 text-sm text-muted">{fmtBetween(g.observed)}</p>
              {partial}
            </div>
            <div className="p-5">
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium">Previsión <Pill tone="warn">Experimental</Pill></p>
              <p className={number}>{fmtKg(g.forecast.kg)} <span className="text-lg font-medium text-muted">kg</span></p>
              <RangeBand range={g.forecast} scaleMax={scale} tone="warn" />
              <p className="mt-2 text-sm text-muted">{fmtBetween(g.forecast)} · maduración {g.ripeningPct} %</p>
              {partial}
            </div>
            <div className="p-5">
              <p className="text-sm font-medium">Frutos maduros</p>
              <p className={number}>{fmtInt(g.matureFruits)}</p>
              <ul className="mt-3 text-sm text-muted">
                {g.classes.map((c) => (
                  <li key={c.name} className="flex justify-between gap-3">
                    <span>{g.criterion} {c.name.toLowerCase()}</span>
                    <span className="tabular-nums">{fmtInt(c.fruits)}</span>
                  </li>
                ))}
              </ul>
              {partial}
            </div>
          </div>
        </Panel>

        {g.warnings.length > 0 && (
          <Panel title={`Advertencias (${g.warnings.length})`}>
            <WarningList warnings={g.warnings} />
          </Panel>
        )}

        <div className="grid gap-5">
          <DailyPanel g={g} />
          <WeatherPanel g={g} />
        </div>

        <Panel title="Por hilera y tramo" description="Abre una hilera para ver sus tramos. No se da detalle por planta porque no hay marcadores físicos.">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Ámbito</th>
                  <th scope="col" className="num">Observado (kg)</th>
                  <th scope="col" className="num"><ForecastHeader /></th>
                  <th scope="col" className="num hidden sm:table-cell">Frutos maduros</th>
                  <th scope="col" className="hidden lg:table-cell">Vídeos</th>
                </tr>
              </thead>
              <tbody>
                {g.hileras.map((h) => (
                  <HileraRows
                    key={`${h.n}-${target === h.n}`}
                    hilera={h}
                    videos={g.videos.filter((v) => v.hilera === h.n)}
                    warned={g.warnedHileras.includes(h.n)}
                    startOpen={target === h.n}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid items-start gap-5 lg:grid-cols-2">
          <div id="estado-analisis" className="scroll-mt-16">
            <Panel title="Estado del análisis" description={`${done} de ${g.videos.length} vídeos terminados`}>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Vídeo</th>
                      <th scope="col">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.videos.map((v) => (
                      <tr key={`${v.hilera}${v.lado}`}>
                        <th scope="row" className="font-normal!">
                          Hilera {v.hilera} · Lado {v.lado}
                          {v.note && <span className="block text-xs text-muted">{v.note}</span>}
                        </th>
                        <td><StatusPill status={v.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
          <Panel title="Cosecha real">
            <Comparison g={g} simulated={report?.simulated ?? false} />
          </Panel>
        </div>
      </div>
    </>
  );
}
