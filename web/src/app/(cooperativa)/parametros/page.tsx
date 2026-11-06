"use client";

import { useQuery } from "@tanstack/react-query";
import { NumberField } from "@/components/Field";
import { ResetControl } from "@/components/ResetControl";
import { AnimatedNumber, ErrorState, ForecastHeader, PageHeader, PartialNote, Panel, Pill, Skeleton } from "@/components/ui";
import { DEFAULT_PARAMS, type FamilyId, LATEST_HARVEST_ID, listPastHarvests, type Params } from "@/lib/api";
import { fmtBetween, fmtKg, fmtPct } from "@/lib/format";
import { useDocumentTitle, useReport } from "@/lib/hooks";
import { CROPS, FAMILIES, FAMILY_ORDER, GREENHOUSES, GROWERS, TECHNICIANS } from "@/lib/simulated";
import { useParamsEditor } from "@/lib/useParamsEditor";

function withDefaults(params: Params): Params {
  const families = { ...params.families };
  for (const family of Object.keys(families) as FamilyId[]) {
    families[family] = { ...DEFAULT_PARAMS.families[family], kgPerWorkday: families[family].kgPerWorkday };
  }
  return { ...params, families };
}

export default function ParametrosPage() {
  useDocumentTitle("Parámetros");
  const editor = useParamsEditor();
  const { data: params, save } = editor;
  const report = useReport(LATEST_HARVEST_ID);
  const past = useQuery({ queryKey: ["cosechas"], queryFn: listPastHarvests });

  const changed = params ? JSON.stringify(withDefaults(params)) !== JSON.stringify(params) : false;
  const header = (
    <PageHeader
      title="Parámetros"
      description="Datos con los que se calcula la previsión de la recolección actual. Las semanas pasadas no cambian."
      actions={params && (
        <ResetControl
          label="Restablecer maduración"
          changed={changed}
          canUndo={editor.undoTo !== null}
          onReset={() => editor.restore(params, withDefaults(params))}
          onUndo={editor.undo}
        />
      )}
    />
  );

  if (editor.isPending) return <>{header}<Skeleton /></>;
  if (editor.isError) return <>{header}<ErrorState message={editor.error.message} onRetry={editor.refetch} /></>;

  const current = params as Params;
  const update = (family: FamilyId, patch: Partial<Params["families"][FamilyId]>) => {
    editor.clearUndo();
    save.mutate({ ...current, families: { ...current.families, [family]: { ...current.families[family], ...patch } } });
  };

  return (
    <>
      {header}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid gap-5">
          <Panel
            title="Familias y maduración"
            description="Parte de los frutos inmaduros que se espera recoger en una semana de tiempo normal. La indica el agricultor o agrónomo y se corregirá con lo cosechado. Con más calor madura más deprisa."
          >
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Familia</th>
                    <th scope="col">Tipo de cultivo</th>
                    <th scope="col" className="num">Maduración</th>
                  </tr>
                </thead>
                <tbody>
                  {FAMILY_ORDER.map((crop) => (
                    <tr key={crop}>
                      <th scope="row" className="whitespace-nowrap">{FAMILIES[crop].name}</th>
                      <td className="text-muted">{CROPS[FAMILIES[crop].crop].name}</td>
                      <td className="num">
                        <NumberField
                          hideLabel
                          label={`Maduración de ${FAMILIES[crop].name}`}
                          value={current.families[crop].ripeningPct}
                          min={0}
                          max={100}
                          unit="%"
                          onCommit={(ripeningPct) => update(crop, { ripeningPct })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Invernaderos" description="Datos de ejemplo con nombres inventados. Cuando esté listo, la empresa dará de alta sus técnicos, agricultores e invernaderos. La localización sirve para obtener la meteorología.">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Invernadero</th>
                    <th scope="col">Agricultor</th>
                    <th scope="col">Localización</th>
                    <th scope="col" className="num">Hileras</th>
                    <th scope="col" className="num">Tramos por hilera</th>
                    <th scope="col" className="num">Temperatura</th>
                    <th scope="col" className="num">Humedad</th>
                  </tr>
                </thead>
                <tbody>
                  {GREENHOUSES.map((g) => (
                    <tr key={g.id}>
                      <th scope="row" className="whitespace-nowrap">
                        {g.name}
                        <span className="block text-xs font-normal text-muted">{FAMILIES[g.family].name}</span>
                      </th>
                      <td className="whitespace-nowrap">
                        {GROWERS.find((a) => a.id === g.growerId)?.name}
                        <span className="block text-xs text-muted">
                          Técnico: {TECHNICIANS.find((t) => t.id === GROWERS.find((a) => a.id === g.growerId)?.technicianId)?.name}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">
                        {g.location.municipality}
                        <span className="block text-xs text-muted tabular-nums">{g.location.latitude.toFixed(3)}, {g.location.longitude.toFixed(3)}</span>
                      </td>
                      <td className="num">{g.hileras}</td>
                      <td className="num">{g.tramosPorHilera}</td>
                      <td className="num">{g.temperaturaC} °C</td>
                      <td className="num">{g.humedadPct} %</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel
            title="Cosechas anteriores"
            description="Registros simulados. Con los reales se corregirá la maduración."
            actions={<Pill tone="warn">Simuladas</Pill>}
          >
            {past.isError ? (
              <p role="alert" className="px-5 py-4 text-sm text-bad-ink">No se han podido cargar las cosechas anteriores.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Recolección</th>
                      <th scope="col" className="num">Cosechado (kg)</th>
                      <th scope="col" className="num">Técnico (kg)</th>
                      <th scope="col" className="num">Error técnico</th>
                      <th scope="col" className="num"><ForecastHeader /></th>
                      <th scope="col" className="num">Error Atias</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(past.data ?? []).map((h) => (
                      <tr key={h.id}>
                        <th scope="row" className="whitespace-nowrap">{h.label.replace("Recolección ", "")}</th>
                        <td className="num">{fmtKg(h.realKg)}</td>
                        <td className="num">{fmtKg(h.technicianKg)}</td>
                        <td className="num">{h.technicianErrorPct === null ? "—" : fmtPct(h.technicianErrorPct)}</td>
                        <td className="num">{fmtKg(h.forecastKg)}</td>
                        <td className="num">{h.errorPct === null ? "—" : fmtPct(h.errorPct)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>

        <aside className="lg:sticky lg:top-14">
          <Panel>
            <div className="p-5" aria-live="polite">
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium">Previsión resultante <Pill tone="warn">Experimental</Pill></p>
              {report.isError ? (
                <p role="alert" className="mt-2 text-sm text-bad-ink">
                  No se ha podido calcular.{" "}
                  <button type="button" className="font-medium underline underline-offset-3" onClick={() => report.refetch()}>Reintentar</button>
                </p>
              ) : report.data ? (
                <>
                  <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
                    <AnimatedNumber value={report.data.forecast.kg} /> <span className="text-lg font-medium text-muted">kg</span>
                  </p>
                  <p className="mt-1 text-sm text-muted">{fmtBetween(report.data.forecast)}</p>
                  <PartialNote missing={report.data.missingHileras} total={report.data.totalHileras} />
                  <p className="mt-4 border-t border-line pt-3 text-sm">
                    <span className="font-medium">{report.data.workers ?? "—"} temporeros</span>
                    <span className="block text-muted">{report.data.label}</span>
                  </p>
                </>
              ) : (
                <div className="mt-2 h-20 animate-pulse rounded bg-sunken motion-reduce:animate-none" />
              )}
            </div>
          </Panel>
        </aside>
      </div>
      {save.isError && <p role="alert" className="mt-4 text-sm text-bad-ink">No se ha podido guardar el cambio. Inténtalo de nuevo.</p>}
    </>
  );
}
