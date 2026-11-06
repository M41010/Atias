"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";
import { EmptyState, ErrorState, PageHeader, Panel, Skeleton } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { useDocumentTitle } from "@/lib/hooks";
import { harvestListQuery, harvestRecordsQuery } from "@/lib/offlineCopy";
import {
  type HarvestRecord,
  type HarvestScope,
  saveHarvestRecord,
} from "@/lib/serverApi";
import { CROPS } from "@/lib/simulated";

const MAX_KG = 10_000_000;

function parseKg(text: string): number | null | "invalid" {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed.replace(",", "."));
  return Number.isFinite(value) && value >= 0 && value <= MAX_KG ? value : "invalid";
}

const toText = (kg: number | undefined) => (kg === undefined ? "" : String(kg).replace(".", ","));

function RecordCell({
  harvestId,
  greenhouseId,
  greenhouse,
  scope,
  scopeLabel,
  record,
}: {
  harvestId: string;
  greenhouseId: string;
  greenhouse: string;
  scope: HarvestScope;
  scopeLabel: string;
  record: HarvestRecord | null;
}) {
  const id = useId();
  const client = useQueryClient();
  const saved = toText(record?.kg);
  const [text, setText] = useState(saved);
  const parsed = parseKg(text);
  const invalid = parsed === "invalid";
  const save = useMutation({
    mutationFn: (kg: number | null) => saveHarvestRecord(harvestId, greenhouseId, scope, kg),
    onSuccess: () => client.invalidateQueries({ queryKey: ["cosecha", harvestId] }),
  });

  return (
    <td>
      <label htmlFor={id} className="sr-only">{scopeLabel} de {greenhouse}, en kilos</label>
      <span className="flex items-center gap-2">
        <input
          id={id}
          inputMode="decimal"
          value={text}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${id}-error` : undefined}
          onChange={(event) => {
            setText(event.target.value);
            save.reset();
          }}
          onBlur={() => {
            if (invalid || text.trim() === saved) return;
            save.mutate(parsed as number | null);
          }}
          className={`input w-28 text-right tabular-nums ${invalid ? "border-bad-ink!" : ""}`}
        />
        <span className="text-sm text-muted">kg</span>
      </span>
      <span role="status" className="mt-1 block min-h-4 text-xs">
        {invalid && <span id={`${id}-error`} className="text-bad-ink">Indica un número válido, sin negativos.</span>}
        {save.isPending && <span className="text-muted">Guardando…</span>}
        {save.isError && (
          <span className="text-bad-ink">
            No se ha guardado.{" "}
            <button type="button" className="font-medium underline underline-offset-3" onClick={() => save.mutate(parsed as number | null)}>
              Reintentar
            </button>
          </span>
        )}
        {!invalid && !save.isPending && !save.isError && record && (
          <span className="text-muted">{record.registradoPor} · {fmtDate(record.registradoEn)}</span>
        )}
      </span>
    </td>
  );
}

export default function CosechaPage() {
  useDocumentTitle("Cosecha real");
  const harvests = useQuery(harvestListQuery());
  const [selected, setSelected] = useState<string | null>(null);
  const harvestId = selected ?? harvests.data?.[0]?.id ?? null;
  const records = useQuery({
    ...harvestRecordsQuery(harvestId as string),
    enabled: harvestId !== null,
  });

  const header = (
    <PageHeader
      title="Cosecha real"
      description="Los kilos pesados de verdad. Sin ellos no se puede medir el error de las estimaciones."
      actions={harvests.data && harvests.data.length > 0 ? (
        <label className="flex items-center gap-2 text-sm text-muted">
          <span className="sr-only md:not-sr-only">Recolección</span>
          <select
            value={harvestId ?? ""}
            onChange={(event) => setSelected(event.target.value)}
            className="min-h-10 rounded-md border border-control bg-surface px-3 text-sm font-medium text-ink"
          >
            {harvests.data.map((h) => <option key={h.id} value={h.id}>{h.etiqueta.replace("Recolección ", "")}</option>)}
          </select>
        </label>
      ) : undefined}
    />
  );

  if (harvests.isError && !harvests.data) return <>{header}<ErrorState message={harvests.error.message} onRetry={harvests.refetch} /></>;
  if (records.isError && !records.data) return <>{header}<ErrorState message={records.error.message} onRetry={records.refetch} /></>;
  if (harvests.data?.length === 0) {
    return <>{header}<EmptyState title="Todavía no hay recolecciones">Aparecerán aquí cuando crees el primer enlace para un agricultor.</EmptyState></>;
  }
  if (!records.data) return <>{header}<Skeleton /></>;

  return (
    <>
      {header}
      <div className="grid gap-5">
        <Panel title={records.data.etiqueta} description="Se guarda al salir de cada casilla. Déjala vacía para borrar el dato.">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Invernadero</th>
                  <th scope="col">Recolección de lunes a viernes</th>
                  <th scope="col">Cosecha de control</th>
                </tr>
              </thead>
              <tbody>
                {records.data.invernaderos.map((g) => (
                  <tr key={`${g.id}-${records.data.id}`}>
                    <th scope="row" className="whitespace-nowrap">
                      {g.nombre}
                      <span className="block text-xs font-normal text-muted">{CROPS[g.cultivo]?.name ?? g.cultivo}</span>
                    </th>
                    <RecordCell
                      key={`lj-${g.registros.lunes_viernes?.kg ?? ""}`}
                      harvestId={records.data.id}
                      greenhouseId={g.id}
                      greenhouse={g.nombre}
                      scope="lunes_viernes"
                      scopeLabel="Recolección de lunes a viernes"
                      record={g.registros.lunes_viernes}
                    />
                    <RecordCell
                      key={`ci-${g.registros.cosecha_inmediata?.kg ?? ""}`}
                      harvestId={records.data.id}
                      greenhouseId={g.id}
                      greenhouse={g.nombre}
                      scope="cosecha_inmediata"
                      scopeLabel="Cosecha de control"
                      record={g.registros.cosecha_inmediata}
                    />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Qué poner en cada columna">
          <dl className="grid gap-4 p-5 text-sm md:grid-cols-2">
            <div>
              <dt className="font-medium">Recolección de lunes a viernes</dt>
              <dd className="mt-1 text-muted">Todo lo recogido esos días. Sirve para medir la previsión. Incluye fruta que maduró después de grabar.</dd>
            </div>
            <div>
              <dt className="font-medium">Cosecha de control</dt>
              <dd className="mt-1 text-muted">Lo maduro recogido justo después de grabar, en todo el invernadero. Sirve para medir lo observado. Déjala vacía si no se hizo.</dd>
            </div>
          </dl>
          <p className="border-t border-line px-5 py-3 text-sm text-muted">
            Aún no se comparan con estimaciones reales, porque los vídeos no se analizan todavía. Estos datos quedan guardados para hacerlo.
          </p>
        </Panel>
      </div>
    </>
  );
}
