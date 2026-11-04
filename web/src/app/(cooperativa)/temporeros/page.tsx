"use client";

import { NumberField } from "@/components/Field";
import { ResetControl } from "@/components/ResetControl";
import { AnimatedNumber, EmptyState, ErrorState, ForecastHeader, PageHeader, PartialNote, Panel, Pill, ProvisionalNote, Skeleton } from "@/components/ui";
import { type CropId, DEFAULT_PARAMS, LATEST_HARVEST_ID, type Params } from "@/lib/api";
import { fmtKg } from "@/lib/format";
import { useDocumentTitle, useReport } from "@/lib/hooks";
import { useParamsEditor } from "@/lib/useParamsEditor";

function withDefaults(params: Params): Params {
  const crops = { ...params.crops };
  for (const crop of Object.keys(crops) as CropId[]) {
    crops[crop] = { ...crops[crop], kgPerWorkday: DEFAULT_PARAMS.crops[crop].kgPerWorkday };
  }
  return { days: DEFAULT_PARAMS.days, crops };
}

export default function TemporerosPage() {
  useDocumentTitle("Temporeros");
  const report = useReport(LATEST_HARVEST_ID);
  const editor = useParamsEditor();
  const { data: params, save } = editor;
  const data = report.data;

  const changed = params ? JSON.stringify(withDefaults(params)) !== JSON.stringify(params) : false;
  const header = (
    <PageHeader
      title="Temporeros"
      description={data ? `${data.label}, recolección actual. Personas según la previsión, los kg por jornal y los días disponibles.` : undefined}
      actions={params && (
        <ResetControl
          label="Restablecer jornales y días"
          changed={changed}
          canUndo={editor.undoTo !== null}
          onReset={() => editor.restore(params, withDefaults(params))}
          onUndo={editor.undo}
        />
      )}
    />
  );

  if (report.isPending || editor.isPending) return <>{header}<Skeleton /></>;
  if (report.isError) return <>{header}<ErrorState message={report.error.message} onRetry={report.refetch} /></>;
  if (editor.isError) return <>{header}<ErrorState message={editor.error.message} onRetry={editor.refetch} /></>;
  if (!data || !params) return <>{header}<EmptyState title="Sin datos">No hay una previsión con la que calcular.</EmptyState></>;

  const edit = (next: Params) => {
    editor.clearUndo();
    save.mutate(next);
  };

  return (
    <>
      {header}
      <div className="grid gap-5">
        <Panel>
          <div className="grid items-center gap-5 p-5 md:grid-cols-[1fr_auto]">
            <div aria-live="polite">
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                Temporeros necesarios <Pill tone="warn">Según previsión experimental</Pill>
              </p>
              <p className="mt-2 text-5xl font-semibold tracking-tight tabular-nums">
                {data.workers === null ? "—" : <AnimatedNumber value={data.workers} format={(n) => String(Math.round(n))} />}
                <span className="ml-2 text-xl font-medium tracking-normal text-muted">personas</span>
              </p>
              {data.workersMin !== null && data.workersMax !== null && (
                <p className="mt-2 text-sm text-muted">
                  {data.workersMin === data.workersMax
                    ? "No cambia en todo el rango de la previsión."
                    : `Entre ${data.workersMin} y ${data.workersMax} según el rango de la previsión.`}
                </p>
              )}
              <PartialNote missing={data.missingHileras} total={data.totalHileras} />
            </div>
            <NumberField
              label="Días de recolección"
              value={params.days}
              min={1}
              max={7}
              unit="días"
              onCommit={(days) => edit({ ...params, days })}
            />
          </div>
        </Panel>

        <ProvisionalNote missing={data.missingHileras} />

        <Panel title="Por cultivo" description="Personas = previsión ÷ (kg por jornal × días), redondeado hacia arriba. Los kg por jornal son valores de ejemplo: sustitúyelos por los vuestros.">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Cultivo</th>
                  <th scope="col" className="num"><ForecastHeader /></th>
                  <th scope="col" className="num">Kg por jornal</th>
                  <th scope="col" className="num">Personas</th>
                  <th scope="col" className="num hidden sm:table-cell">Rango</th>
                </tr>
              </thead>
              <tbody>
                {data.crops.map((crop) => (
                  <tr key={crop.crop}>
                    <th scope="row">{crop.name}</th>
                    <td className="num">
                      {fmtKg(crop.forecast.kg)}
                      {crop.partial && <span className="block text-xs text-warn-ink">parcial</span>}
                    </td>
                    <td className="num">
                      <NumberField
                        hideLabel
                        label={`Kg por jornal de ${crop.name}`}
                        value={params.crops[crop.crop].kgPerWorkday}
                        min={1}
                        max={5000}
                        onCommit={(kgPerWorkday) =>
                          edit({
                            ...params,
                            crops: { ...params.crops, [crop.crop]: { ...params.crops[crop.crop], kgPerWorkday } },
                          })
                        }
                      />
                    </td>
                    <td className="num text-base font-semibold">
                      {crop.workers ?? "—"}
                      {crop.partial && <span className="block text-xs font-normal text-warn-ink">parcial</span>}
                    </td>
                    <td className="num hidden text-muted sm:table-cell">
                      {crop.workersMin === crop.workersMax ? crop.workers : `${crop.workersMin}–${crop.workersMax}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {save.isError && <p role="alert" className="text-sm text-bad-ink">No se ha podido guardar el cambio. Inténtalo de nuevo.</p>}
      </div>
    </>
  );
}
