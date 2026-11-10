"use client";

import { useQuery } from "@tanstack/react-query";
import { MonitorPlay } from "lucide-react";
import Link from "next/link";
import { EmptyState, ErrorState, PageHeader, Panel, Pill, Skeleton } from "@/components/ui";
import { type HarvestReport, listReports } from "@/lib/api";
import { fmtDecimal, fmtInt, fmtKg, fmtPct } from "@/lib/format";
import { queryKeys, useDocumentTitle } from "@/lib/hooks";
import { useDataMode } from "@/lib/mode";
import {
  controlRows,
  controlSummary,
  evaluations,
  type Forecaster,
  observedRows,
  overallWapePct,
  weekRows,
  weightRows,
} from "@/lib/precision";
import { MIN_PAIRS, TARGET_PCT, VERDICT_TEXT, type Verdict } from "@/lib/validation";

const WHO: Record<Forecaster, string> = { atias: "Atias", agricultor: "Agricultor", tecnico: "Técnico" };
const pct = (value: number | null) => (value === null ? "—" : fmtPct(value));
const kg = (value: number | null) => (value === null ? "—" : fmtKg(value));

const SOURCE_TEXT = {
  muestra: "Muestra pesada esa semana",
  control: "Recogido en los tramos de control",
  provisional: "Provisional: falta pesar",
  simulado: "Simulado",
} as const;

const MOTIVES: Record<string, string> = {
  sin_video: "Sin vídeo de esa hilera y lado",
  sin_contar: "Vídeo aún sin contar",
  sin_longitud: "Falta la longitud de la hilera",
  sin_posiciones: "Hay que volver a contar el vídeo",
  fuera_de_hilera: "Revisa los metros del tramo",
};

function VerdictPill({ verdict }: { verdict: Verdict }) {
  if (verdict === "cumple") return <Pill tone="brand">Cumple en este piloto</Pill>;
  if (verdict === "no_cumple") return <Pill tone="bad">No cumple</Pill>;
  return <Pill tone="neutral">Sin concluir</Pill>;
}

/** Lo primero que se lee: si se puede afirmar el objetivo y cómo va cada previsión. */
function VerdictPanel({ reports }: { reports: HarvestReport[] }) {
  const evals = evaluations(reports);
  const atias = evals.atias;
  return (
    <Panel
      title={`Objetivo: error de hasta el ${TARGET_PCT} % en kilos de la semana`}
      description={`Solo se da por cumplido con datos reales, semanas no usadas para calibrar, al menos ${MIN_PAIRS} semanas e invernaderos y el extremo alto del intervalo de confianza por debajo del ${TARGET_PCT} %.`}
      actions={<VerdictPill verdict={atias.verdict} />}
    >
      <p className="px-5 pt-4 text-sm">{VERDICT_TEXT[atias.verdict]}</p>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Previsión</th>
              <th scope="col" className="num">Semanas con cosecha</th>
              <th scope="col" className="num">Error de todas</th>
              <th scope="col" className="num">Cuentan para el veredicto</th>
              <th scope="col" className="num">Error (intervalo 90 %)</th>
              <th scope="col" className="num">Sesgo</th>
              <th scope="col" className="num">Semanas ≤ {TARGET_PCT} %</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(WHO) as Forecaster[]).map((who) => {
              const e = evals[who];
              const all = e.pairs + e.excluded;
              return (
                <tr key={who}>
                  <th scope="row">{WHO[who]}</th>
                  <td className="num">{fmtInt(all)}</td>
                  <td className="num">{pct(overallWapePct(reports, who))}</td>
                  <td className="num">{fmtInt(e.pairs)}</td>
                  <td className="num">
                    {e.wapePct === null ? "—" : fmtPct(e.wapePct)}
                    {e.ci90Pct && <span className="block text-xs text-muted">{fmtDecimal(e.ci90Pct[0])}–{fmtDecimal(e.ci90Pct[1])} %</span>}
                  </td>
                  <td className="num">{e.biasPct === null ? "—" : `${e.biasPct > 0 ? "+" : ""}${fmtPct(e.biasPct)}`}</td>
                  <td className="num">{pct(e.withinTargetPct)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line px-5 py-3 text-sm text-muted">
        «Error de todas» pondera por kilos e incluye las semanas en que se pesó la muestra, que sirven para calibrar el peso:
        orienta, pero no permite concluir. Sesgo positivo es estimar de más.
      </p>
    </Panel>
  );
}

function WeeksPanel({ reports }: { reports: HarvestReport[] }) {
  const rows = weekRows(reports);
  return (
    <Panel title="Semana a semana" description="Previsión de lunes a viernes frente a lo recogido esos días, por invernadero.">
      {rows.length === 0 ? (
        <p className="px-5 py-4 text-sm text-muted">
          Aún no hay semanas con kilos recogidos. Apúntalos día a día en <Link href="/campo" className="font-medium underline underline-offset-3">Datos de campo</Link>.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Semana</th>
                <th scope="col">Invernadero</th>
                <th scope="col" className="num">Real (kg)</th>
                {(Object.keys(WHO) as Forecaster[]).map((who) => (
                  <th key={who} scope="col" className="num">{WHO[who]} (kg · error)</th>
                ))}
                <th scope="col">Más cerca</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.harvestId}-${r.greenhouseId}`}>
                  <th scope="row" className="whitespace-nowrap">{r.week}</th>
                  <td className="whitespace-nowrap">
                    <Link href={`/invernaderos/${r.greenhouseId}?recoleccion=${encodeURIComponent(r.harvestId)}`} className="underline underline-offset-3">
                      {r.greenhouse}
                    </Link>
                  </td>
                  <td className="num font-semibold">{fmtKg(r.realKg)}</td>
                  {(Object.keys(WHO) as Forecaster[]).map((who) => (
                    <td key={who} className="num">
                      {kg(r.kg[who])}
                      <span className={`block text-xs ${who === "atias" && r.partial ? "text-warn-ink" : "text-muted"}`}>
                        {who === "atias" && r.partial ? "Parcial: faltan hileras" : pct(r.errorPct[who])}
                      </span>
                    </td>
                  ))}
                  <td>{r.closest ? <Pill tone={r.closest === "atias" ? "brand" : "neutral"}>{WHO[r.closest]}</Pill> : <span className="text-muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

/** Eslabones del error: conteo, fruta tapada, peso y lo observado el día de grabar. */
function LinksPanels({ reports }: { reports: HarvestReport[] }) {
  const controls = controlRows(reports);
  const summary = controlSummary(controls);
  const weights = weightRows(reports);
  const observed = observedRows(reports);
  return (
    <>
      <Panel
        title="Conteo en los tramos de control"
        description="Lo contado a mano entre dos cintas frente a lo que contó Atias en el mismo trozo de hilera y lado."
      >
        <dl className="grid gap-4 p-5 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-muted">De la fruta madura que se ve, Atias cuenta</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{pct(summary.detectionPct)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Se ve sin apartar hojas</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{pct(summary.visibilityPct)}</dd>
            <dd className="text-xs text-muted">El resto queda tapada: es la fruta que ninguna cámara ve desde el pasillo.</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Tramos contados</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{fmtInt(summary.tramos)}</dd>
          </div>
        </dl>
        {controls.length > 0 ? (
          <div className="overflow-x-auto border-t border-line">
            <table className="data-table compact">
              <thead>
                <tr>
                  <th scope="col">Semana</th>
                  <th scope="col">Invernadero</th>
                  <th scope="col">Tramo</th>
                  <th scope="col" className="num">Visibles (a mano)</th>
                  <th scope="col" className="num">Atias</th>
                  <th scope="col" className="num">Atias / visibles</th>
                  <th scope="col" className="num">Total (a mano)</th>
                </tr>
              </thead>
              <tbody>
                {controls.map((c) => (
                  <tr key={`${c.week}-${c.greenhouse}-${c.label}`}>
                    <th scope="row" className="whitespace-nowrap">{c.week}</th>
                    <td className="whitespace-nowrap">{c.greenhouse}</td>
                    <td className="whitespace-nowrap">{c.label}<span className="block text-xs text-muted">{c.where}</span></td>
                    <td className="num">{fmtInt(c.visible)}</td>
                    <td className="num">{c.atias === null ? <span className="text-xs text-muted">{c.motive ? MOTIVES[c.motive] : "—"}</span> : fmtInt(c.atias)}</td>
                    <td className="num">{c.atias === null || c.visible === 0 ? "—" : fmtPct((c.atias / c.visible) * 100)}</td>
                    <td className="num">{c.total === null ? "—" : fmtInt(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="border-t border-line px-5 py-3 text-sm text-muted">
            Sin tramos de control todavía. Se apuntan en <Link href="/campo" className="font-medium underline underline-offset-3">Datos de campo</Link>.
          </p>
        )}
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Peso por fruto" description="Un error en el peso pasa entero a los kilos: no se compensa al sumar.">
          <div className="overflow-x-auto">
            <table className="data-table compact">
              <thead>
                <tr>
                  <th scope="col">Semana · invernadero</th>
                  <th scope="col" className="num">Usado (g)</th>
                  <th scope="col" className="num">De partida (g)</th>
                  <th scope="col">Origen</th>
                </tr>
              </thead>
              <tbody>
                {weights.map((w) => (
                  <tr key={`${w.week}-${w.greenhouse}`}>
                    <th scope="row" className="whitespace-nowrap">{w.week}<span className="block text-xs font-normal text-muted">{w.greenhouse} · {w.family}</span></th>
                    <td className="num">{fmtDecimal(w.grams)}</td>
                    <td className="num">{fmtDecimal(w.startingGrams)}</td>
                    <td className={w.source === "provisional" ? "text-warn-ink" : undefined}>{SOURCE_TEXT[w.source]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Lo maduro al grabar" description="Kilos que Atias ve maduros frente a lo recogido justo después de grabar (cosecha de control).">
          {observed.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted">Sin cosecha de control. Si se hace, se apunta en Cosecha real.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table compact">
                <thead>
                  <tr>
                    <th scope="col">Semana · invernadero</th>
                    <th scope="col" className="num">Atias (kg)</th>
                    <th scope="col" className="num">Recogido (kg)</th>
                    <th scope="col" className="num">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {observed.map((o) => (
                    <tr key={`${o.week}-${o.greenhouse}`}>
                      <th scope="row" className="whitespace-nowrap">{o.week}<span className="block text-xs font-normal text-muted">{o.greenhouse}</span></th>
                      <td className="num">{fmtKg(o.observedKg)}</td>
                      <td className="num">{fmtKg(o.immediateKg)}</td>
                      <td className="num">{pct(o.errorPct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

export default function PrecisionPage() {
  useDocumentTitle("Precisión");
  const mode = useDataMode();
  const reports = useQuery({ queryKey: queryKeys.reports(mode), queryFn: listReports });
  const header = (
    <PageHeader
      title="Precisión"
      description="Cuánto acierta Atias frente a lo recogido de verdad, junto a las previsiones del agricultor y del técnico, y en qué eslabón se pierde."
      actions={
        <Link href="/presentacion" className="btn-secondary">
          <MonitorPlay size={16} aria-hidden />
          Presentar
        </Link>
      }
    />
  );
  if (reports.isPending) return <>{header}<Skeleton /></>;
  if (reports.isError) return <>{header}<ErrorState message={reports.error.message} onRetry={reports.refetch} /></>;
  if (reports.data.length === 0) {
    return <>{header}<EmptyState title="Todavía no hay recolecciones con datos">Aparecerán cuando lleguen los primeros vídeos.</EmptyState></>;
  }
  return (
    <>
      {header}
      <div className="grid gap-5">
        {reports.data.some((r) => r.simulated) && (
          <p role="note" className="rounded-lg border border-warn-line bg-warn-soft px-4 py-3 text-sm font-medium text-warn-ink">
            Modo demostración: estas cifras comprueban el cálculo con datos simulados. No dicen nada de la precisión real.
          </p>
        )}
        <VerdictPanel reports={reports.data} />
        <WeeksPanel reports={reports.data} />
        <LinksPanels reports={reports.data} />
      </div>
    </>
  );
}
