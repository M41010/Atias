"use client";

import { useQuery } from "@tanstack/react-query";
import { NumberField, TextField } from "@/components/Field";
import { ResetControl } from "@/components/ResetControl";
import { AnimatedNumber, ErrorState, ForecastHeader, PageHeader, PartialNote, Panel, Pill, Skeleton } from "@/components/ui";
import { type CropId, DEFAULT_PARAMS, LATEST_HARVEST_ID, listPastHarvests, type Params } from "@/lib/api";
import { fmtBetween, fmtKg, fmtPct } from "@/lib/format";
import { useDocumentTitle, useReport } from "@/lib/hooks";
import { CROPS, GREENHOUSES } from "@/lib/simulated";
import { useParamsEditor } from "@/lib/useParamsEditor";

function withDefaults(params: Params): Params {
  const crops = { ...params.crops };
  for (const crop of Object.keys(crops) as CropId[]) {
    crops[crop] = { ...DEFAULT_PARAMS.crops[crop], kgPerWorkday: crops[crop].kgPerWorkday };
  }
  return { ...params, crops };
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
          label="Restablecer maduración y variedades"
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
  const update = (crop: CropId, patch: Partial<Params["crops"][CropId]>) => {
    editor.clearUndo();
    save.mutate({ ...current, crops: { ...current.crops, [crop]: { ...current.crops[crop], ...patch } } });
  };

  return (
    <>
      {header}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid gap-5">
          <Panel
            title="Cultivo y maduración"
            description="Parte de los frutos inmaduros que se espera recoger. La indica el agricultor o agrónomo y se corregirá con lo cosechado."
          >
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Cultivo</th>
                    <th scope="col">Variedad</th>
                    <th scope="col" className="num">Maduración</th>
                  </tr>
                </thead>
                <tbody>
                  {(Object.keys(CROPS) as CropId[]).map((crop) => (
                    <tr key={crop}>
                      <th scope="row" className="whitespace-nowrap">{CROPS[crop].name}</th>
                      <td>
                        <TextField
                          label={`Variedad de ${CROPS[crop].name}`}
                          value={current.crops[crop].variety}
                          onCommit={(variety) => update(crop, { variety })}
                        />
                      </td>
                      <td className="num">
                        <NumberField
                          hideLabel
                          label={`Maduración de ${CROPS[crop].name}`}
                          value={current.crops[crop].ripeningPct}
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

          <Panel title="Invernaderos" description="Dimensiones y clima interior de ejemplo. Se editarán cuando se conecten datos reales.">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Invernadero</th>
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
                        <span className="block text-xs font-normal text-muted">{CROPS[g.crop].name}</span>
                      </th>
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
                      <th scope="col" className="num"><ForecastHeader /></th>
                      <th scope="col" className="num">Cosechado (kg)</th>
                      <th scope="col" className="num">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(past.data ?? []).map((h) => (
                      <tr key={h.id}>
                        <th scope="row" className="whitespace-nowrap">{h.label.replace("Recolección ", "")}</th>
                        <td className="num">{fmtKg(h.forecastKg)}</td>
                        <td className="num">{fmtKg(h.realKg)}</td>
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
