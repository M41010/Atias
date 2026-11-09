"use client";

import { AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { GreenhouseTable } from "@/components/GreenhouseTable";
import {
  EmptyState,
  ErrorState,
  ForecastHeader,
  HarvestPicker,
  PageHeader,
  Panel,
  Pill,
  ProvisionalNote,
  Skeleton,
  SummaryPanel,
  WarningList,
} from "@/components/ui";
import { fmtInt, fmtKg, fmtPct, fmtRange } from "@/lib/format";
import { useDocumentTitle, useReport, useSelectedHarvest } from "@/lib/hooks";

export default function ResumenPage() {
  useDocumentTitle("Resumen");
  const harvestId = useSelectedHarvest();
  const { data: report, isPending, isError, error, refetch } = useReport(harvestId);

  const header = (
    <PageHeader
      title={report?.label ?? "Resumen semanal"}
      description={report ? `Semana ${report.isoWeek}. Lo observado es la fruta madura vista en la captura, no lo que se recogerá.` : undefined}
      actions={<HarvestPicker selected={harvestId} />}
    />
  );

  if (isPending) return <>{header}<Skeleton /></>;
  if (isError) return <>{header}<ErrorState message={error.message} onRetry={refetch} /></>;
  if (!report) {
    return <>{header}<EmptyState title="Recolección no encontrada">Elige otra recolección en el selector.</EmptyState></>;
  }
  if (report.empty) {
    return (
      <>
        {header}
        <EmptyState title="Todavía no hay capturas">
          Los resultados aparecerán aquí cuando el agricultor suba los vídeos del sábado y termine el análisis.
        </EmptyState>
      </>
    );
  }

  return (
    <>
      {header}
      <div className="grid gap-5">
        <SummaryPanel report={report} />
        <ProvisionalNote missing={report.missingHileras} />

        {report.warnings.length > 0 && (
          <Panel title={`Advertencias (${report.warnings.length})`}>
            <WarningList warnings={report.warnings} harvestId={harvestId} />
          </Panel>
        )}

        {report.realKg !== null && (
          <Panel
            title="Previsión frente a cosecha real"
            description={report.simulated
              ? "Cosecha simulada: el error comprueba el cálculo, no la precisión real."
              : report.partial
                ? "Faltan hileras por contar: la previsión se queda corta y el error no se calcula."
                : "Una sola semana no basta para saber cuánto acierta Atias: el conjunto está en Precisión."}
          >
            <dl className="grid grid-cols-3 divide-x divide-line">
              <div className="p-5">
                <dt className="flex flex-wrap items-center gap-1.5 text-sm text-muted">Previsión <Pill tone="warn">Experimental</Pill></dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums">{fmtKg(report.forecast.kg)} kg</dd>
              </div>
              <div className="p-5">
                <dt className="text-sm text-muted">Cosechado</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums">{fmtKg(report.realKg)} kg</dd>
              </div>
              <div className="p-5">
                <dt className="text-sm text-muted">Error</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums">{report.errorPct === null || report.partial ? "—" : fmtPct(report.errorPct)}</dd>
              </div>
            </dl>
          </Panel>
        )}

        <Panel
          title="Por familia"
          actions={report.isLatest ? (
            <Link href="/temporeros" className="text-sm font-medium text-brand-ink underline-offset-3 hover:underline">
              Ajustar temporeros
            </Link>
          ) : undefined}
        >
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Familia</th>
                  <th scope="col" className="num">Observado<span className="hidden sm:inline"> (kg)</span></th>
                  <th scope="col" className="num hidden lg:table-cell">Rango observado</th>
                  <th scope="col" className="num"><ForecastHeader /></th>
                  <th scope="col" className="num hidden lg:table-cell">Rango previsión</th>
                  <th scope="col" className="num hidden sm:table-cell">Frutos maduros</th>
                  <th scope="col" className="num"><span className="sm:hidden">Personas</span><span className="hidden sm:inline">Temporeros</span></th>
                  <th scope="col" aria-label="Abrir" className="hidden sm:table-cell" />
                </tr>
              </thead>
              <tbody>
                {report.families.map((crop) => (
                  <tr key={crop.family} className="row-link">
                    <th scope="row">
                      <Link
                        href={`/invernaderos?recoleccion=${encodeURIComponent(harvestId)}&familia=${crop.family}`}
                        className="whitespace-nowrap font-medium text-ink"
                      >
                        {crop.name}
                      </Link>
                      {crop.warned && (
                        <AlertTriangle size={14} className="ml-1.5 inline align-[-2px] text-bad-ink" aria-label="Con advertencias" />
                      )}
                      <span className="hidden text-xs font-normal text-muted sm:block">
                        {crop.classes.map((c, i) => (
                          <span key={c.name}>
                            {i > 0 && " · "}
                            <span className="whitespace-nowrap">{crop.criterion} {c.name.toLowerCase()}: {fmtInt(c.fruits)}</span>
                          </span>
                        ))}
                      </span>
                    </th>
                    <td className="num">
                      {fmtKg(crop.observed.kg)}
                      {crop.partial && <span className="block text-xs text-warn-ink">parcial</span>}
                    </td>
                    <td className="num hidden text-muted lg:table-cell">{fmtRange(crop.observed)}</td>
                    <td className="num">
                      {fmtKg(crop.forecast.kg)}
                      {crop.partial && <span className="block text-xs text-warn-ink">parcial</span>}
                    </td>
                    <td className="num hidden text-muted lg:table-cell">{fmtRange(crop.forecast)}</td>
                    <td className="num hidden sm:table-cell">{fmtInt(crop.matureFruits)}</td>
                    <td className="num font-medium">
                      {crop.workers ?? "—"}
                      {crop.partial && <span className="block text-xs font-normal text-warn-ink">parcial</span>}
                    </td>
                    <td className="hidden w-8 pl-0! text-muted sm:table-cell">
                      <ChevronRight size={16} aria-hidden />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Invernaderos"
          actions={report.greenhouses.some((g) => g.isNew) ? <Pill tone="brand">Resultados nuevos</Pill> : undefined}
        >
          <GreenhouseTable rows={report.greenhouses} harvestId={harvestId} />
        </Panel>
      </div>
    </>
  );
}
