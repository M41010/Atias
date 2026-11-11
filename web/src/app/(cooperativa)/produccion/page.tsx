"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Fragment, useState } from "react";
import { FamilyBars, GroupedColumns, Legend, type SeriesId } from "@/components/charts/Produccion";
import { ExcelButton } from "@/components/ExcelButton";
import { EmptyState, ErrorState, PageHeader, Panel, Pill, Skeleton } from "@/components/ui";
import { FAMILIES, type FamilyId, listReports } from "@/lib/api";
import { fmtKg, fmtPct } from "@/lib/format";
import { queryKeys, useDocumentTitle } from "@/lib/hooks";
import { useDataMode } from "@/lib/mode";
import {
  atiasDeviation,
  type Granularity,
  type Kilos,
  type Period,
  presentFamilies,
  productionPeriods,
  productionSheets,
  realIncomplete,
} from "@/lib/produccion";

const GRANULARITIES: { id: Granularity; name: string; plural: string }[] = [
  { id: "semana", name: "Semana", plural: "semanas" },
  { id: "mes", name: "Mes", plural: "meses" },
  { id: "año", name: "Año", plural: "años" },
];

/** Lo que falta en una cifra, dicho en una frase corta (tarjeta, tabla y barras por familia). */
function notesOf(k: Kilos): string[] {
  return [
    ...(k.real === null
      ? ["Aún sin cosecha pesada."]
      : realIncomplete(k)
        ? [`Recogido de ${k.realWeeks} de ${k.weeks} semanas; en ellas Atias preveía ${fmtKg(k.atiasMatched)} kg.`]
        : []),
    ...(k.atiasPartial ? ["Previsión parcial: faltan hileras por contar."] : []),
  ];
}

const kgOrDash = (value: number | null) => (value === null ? "—" : fmtKg(value));

/** Periodo y familias van en la URL, para compartir la vista y recuperarla al recargar. */
function useFilters(): { granularity: Granularity; families: FamilyId[]; set: (name: string, value: string | null) => void } {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = search.get("periodo");
  const granularity = GRANULARITIES.some((g) => g.id === raw) ? (raw as Granularity) : "semana";
  const families = (search.get("familia")?.split(",").filter((f) => f in FAMILIES) ?? []) as FamilyId[];
  const set = (name: string, value: string | null) => {
    const params = new URLSearchParams(search);
    if (value) params.set(name, value);
    else params.delete(name);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  return { granularity, families, set };
}

const chip = (active: boolean, muted = false) =>
  `min-h-9 rounded-md border px-3 text-sm transition-colors duration-150 ${
    active ? "border-brand bg-brand-soft font-semibold text-brand-ink" : `border-line bg-surface hover:border-ink ${muted ? "text-muted" : "text-ink"}`
  }`;

function Filters({ granularity, families, present, set }: {
  granularity: Granularity;
  families: FamilyId[];
  present: FamilyId[];
  set: (name: string, value: string | null) => void;
}) {
  const toggle = (id: FamilyId) => {
    const next = families.includes(id) ? families.filter((f) => f !== id) : [...families, id];
    set("familia", next.length ? next.join(",") : null);
  };
  return (
    <Panel>
      <div className="grid gap-5 p-5">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Sumar por</legend>
          <div className="flex flex-wrap gap-1.5">
            {GRANULARITIES.map((g) => (
              <button
                key={g.id}
                type="button"
                aria-pressed={granularity === g.id}
                onClick={() => set("periodo", g.id === "semana" ? null : g.id)}
                className={chip(granularity === g.id)}
              >
                {g.name}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Familia</legend>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" aria-pressed={families.length === 0} onClick={() => set("familia", null)} className={chip(families.length === 0)}>
              Todas
            </button>
            {present.map((id) => (
              <button key={id} type="button" aria-pressed={families.includes(id)} onClick={() => toggle(id)} className={chip(families.includes(id))}>
                {FAMILIES[id].name}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    </Panel>
  );
}

/** Con un solo periodo no hay evolución que dibujar: las tres cifras, y por qué no hay gráfico. */
function FewData({ period, weeks, plural }: { period: Period; weeks: Period[]; plural: string }) {
  const k = period.total;
  const span = weeks.length === 1 ? weeks[0].label : `de la ${weeks[0].label.toLowerCase()} a la ${weeks[weeks.length - 1].label.toLowerCase()}`;
  return (
    <>
      <p className="border-b border-line px-5 py-4 text-sm text-muted">
        Solo hay {weeks.length === 1 ? "una semana" : `${weeks.length} semanas`} con capturas ({span}). Para comparar {plural} hacen falta
        al menos dos; mientras tanto, estas son las cifras de {period.label.startsWith("Semana") ? "esa semana" : period.label.toLowerCase()}.
      </p>
      <dl className="grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="p-5">
          <dt className="text-sm text-muted">Recogido</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums">{k.real === null ? "—" : `${fmtKg(k.real)} kg`}</dd>
        </div>
        <div className="p-5">
          <dt className="flex flex-wrap items-center gap-1.5 text-sm text-muted">Previsto por Atias <Pill tone="warn">Experimental</Pill></dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums">{fmtKg(k.atias)} kg</dd>
        </div>
        <div className="p-5">
          <dt className="text-sm text-muted">Previsión del técnico</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums">{k.technician === null ? "—" : `${fmtKg(k.technician)} kg`}</dd>
        </div>
      </dl>
      {notesOf(k).length > 0 && <p className="border-t border-line px-5 py-3 text-xs text-warn-ink">{notesOf(k).join(" ")}</p>}
    </>
  );
}

function ProductionTable({ periods, name }: { periods: Period[]; name: string }) {
  const caption = (k: Kilos) => {
    const notes = notesOf(k);
    return notes.length > 0 ? <span className="block text-xs font-normal text-warn-ink">{notes.join(" ")}</span> : null;
  };
  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">{name} y familia</th>
            <th scope="col" className="num">Recogido<span className="hidden sm:inline"> (kg)</span></th>
            <th scope="col" className="num">
              <span className="inline-flex items-center gap-1.5">Atias<span className="hidden sm:inline"> (kg)</span>
                <abbr title="Experimental, sin validar" className="rounded-full bg-warn-soft px-1.5 text-[0.6875rem] font-medium text-warn-ink no-underline">Exp.</abbr>
              </span>
            </th>
            <th scope="col" className="num hidden sm:table-cell">Técnico (kg)</th>
            <th scope="col" className="num" title="Diferencia entre lo previsto por Atias y lo recogido, en las semanas con lo recogido">Desviación</th>
          </tr>
        </thead>
        <tbody>
          {periods.map((p) => (
            <Fragment key={p.key}>
              <tr className="bg-canvas">
                <th scope="row" className="font-semibold">
                  {p.label}
                  {caption(p.total)}
                </th>
                <td className="num font-semibold">{kgOrDash(p.total.real)}</td>
                <td className="num font-semibold">{fmtKg(p.total.atias)}</td>
                <td className="num hidden font-semibold sm:table-cell">{kgOrDash(p.total.technician)}</td>
                <td className="num font-semibold">{atiasDeviation(p.total) === null ? "—" : fmtPct(atiasDeviation(p.total) as number)}</td>
              </tr>
              {p.families.map((f) => (
                <tr key={f.family}>
                  <th scope="row" className="pl-8! font-normal!">
                    {f.name}
                    {caption(f.kilos)}
                  </th>
                  <td className="num">{kgOrDash(f.kilos.real)}</td>
                  <td className="num">{fmtKg(f.kilos.atias)}</td>
                  <td className="num hidden sm:table-cell">{kgOrDash(f.kilos.technician)}</td>
                  <td className="num">{atiasDeviation(f.kilos) === null ? "—" : fmtPct(atiasDeviation(f.kilos) as number)}</td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ProduccionPage() {
  useDocumentTitle("Producción");
  const mode = useDataMode();
  // La misma consulta que el historial de Previsión diaria: se piden todas las semanas en paralelo una vez.
  const { data: reports, isPending, isError, error, refetch } = useQuery({ queryKey: queryKeys.reports(mode), queryFn: listReports });
  const { granularity, families, set } = useFilters();
  const [picked, setPicked] = useState<string | null>(null);
  const meta = GRANULARITIES.find((g) => g.id === granularity)!;

  const periods = reports ? productionPeriods(reports, granularity, families) : [];
  const weeks = reports ? productionPeriods(reports, "semana", families) : [];
  const simulated = reports?.[0]?.simulated ?? false;

  const header = (
    <PageHeader
      title="Producción"
      description="Kilos de cada familia por semana, mes y año: lo recogido frente a lo previsto. Cada semana cuenta en el mes y el año de su lunes."
      actions={periods.length > 0 ? (
        <ExcelButton
          build={() => productionSheets(periods, granularity, { simulated, families })}
          fileName={`atias-produccion-${granularity === "año" ? "ano" : granularity}${simulated ? "-datos-simulados" : ""}.xlsx`}
        />
      ) : undefined}
    />
  );

  if (isPending) return <>{header}<Skeleton /></>;
  if (isError) return <>{header}<ErrorState message={error.message} onRetry={refetch} /></>;

  const present = presentFamilies(reports);
  if (present.length === 0) {
    return (
      <>
        {header}
        <EmptyState title="Todavía no hay semanas con capturas">
          Los kilos aparecerán aquí cuando los agricultores suban los vídeos del sábado y la cooperativa apunte lo recogido.
        </EmptyState>
      </>
    );
  }

  const withTechnician = periods.some((p) => p.total.technician !== null);
  const ids: SeriesId[] = withTechnician ? ["real", "technician", "atias"] : ["real", "atias"];
  const value = (k: Kilos, id: SeriesId) => (id === "real" ? k.real : id === "technician" ? k.technician : k.atias);
  // Por familia: el periodo elegido o, si no, el último con cosecha pesada.
  const fallback = [...periods].reverse().find((p) => p.total.real !== null) ?? periods[periods.length - 1];
  const focus = periods.find((p) => p.key === picked) ?? fallback;
  const status = simulated ? <Pill tone="warn">Simulado</Pill> : null;

  return (
    <>
      {header}
      <div className="grid gap-5">
        <Filters granularity={granularity} families={families} present={present} set={set} />

        {periods.length === 0 ? (
          <EmptyState title="Nada con estos filtros">Ninguna semana tiene invernaderos de las familias elegidas.</EmptyState>
        ) : (
          <>
            <Panel
              title={`Kilos por ${meta.name.toLowerCase()}`}
              description={withTechnician
                ? "Todas las familias elegidas juntas. Lo recogido y lo del técnico solo cuentan las semanas con el dato de todos los invernaderos."
                : "Todas las familias elegidas juntas. Todavía no hay previsiones del técnico con estos filtros."}
              actions={status}
            >
              {periods.length < 2 ? (
                <FewData period={periods[0]} weeks={weeks} plural={meta.plural} />
              ) : (
                <div className="grid gap-3 px-5 py-4">
                  <Legend ids={ids} after={{ atias: <Pill tone="warn">Experimental</Pill> }} />
                  <GroupedColumns
                    label={`Kilos por ${meta.name.toLowerCase()}. Las cifras están también en la tabla de abajo.`}
                    categories={periods.map((p) => ({ key: p.key, label: p.label, short: p.short, notes: notesOf(p.total) }))}
                    series={ids.map((id) => ({ id, values: periods.map((p) => value(p.total, id)) }))}
                  />
                  {periods.some((p) => notesOf(p.total).length > 0) && (
                    <p className="text-xs text-muted">Pasa el puntero o el foco por un periodo para ver sus cifras y lo que falta en él.</p>
                  )}
                </div>
              )}
            </Panel>

            <Panel
              title="Por familia"
              description="Ordenadas de más a menos kilos. Cifra en la punta de cada barra."
              actions={
                <label className="flex items-center gap-2 text-sm text-muted">
                  <span className="sr-only sm:not-sr-only">{meta.name}</span>
                  <select
                    value={focus.key}
                    onChange={(event) => setPicked(event.target.value)}
                    className="min-h-10 rounded-md border border-control bg-surface px-3 text-sm font-medium text-ink transition-colors duration-150 hover:border-ink"
                  >
                    {periods.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                  </select>
                </label>
              }
            >
              <div className="grid gap-4 px-5 py-4">
                <Legend ids={["real", "technician", "atias"]} after={{ atias: <Pill tone="warn">Experimental</Pill> }} />
                <FamilyBars
                  rows={[...focus.families]
                    .sort((a, b) => (b.kilos.real ?? b.kilos.atias) - (a.kilos.real ?? a.kilos.atias))
                    .map((f) => ({
                      key: f.family,
                      name: f.name,
                      values: { real: f.kilos.real, technician: f.kilos.technician, atias: f.kilos.atias },
                      note: notesOf(f.kilos).join(" ") || undefined,
                    }))}
                />
              </div>
            </Panel>

            <Panel
              title="Tabla"
              description="Las mismas cifras que los gráficos. Desviación: diferencia entre lo previsto por Atias y lo recogido, solo en las semanas con lo recogido."
            >
              <ProductionTable periods={periods} name={meta.name} />
            </Panel>
          </>
        )}
      </div>
    </>
  );
}
