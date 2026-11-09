"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Fragment, useState } from "react";
import { EmptyState, ErrorState, HarvestPicker, PageHeader, Panel, Pill, Skeleton } from "@/components/ui";
import {
  FAMILIES,
  FAMILY_ORDER,
  type FamilyId,
  type GreenhouseRow,
  type HarvestReport,
  listReports,
} from "@/lib/api";
import { errorPct } from "@/lib/calc";
import { fmtDate, fmtDay, fmtKg, fmtPct } from "@/lib/format";
import { queryKeys, useDocumentTitle, useReport, useSelectedHarvest } from "@/lib/hooks";
import { useDataMode } from "@/lib/mode";

type Totals = { real: (number | null)[]; technician: (number | null)[]; atias: number[] };

/** Suma por día. El real y el del técnico solo se suman si todos los invernaderos lo tienen. */
function totals(rows: GreenhouseRow[]): Totals {
  return {
    real: [0, 1, 2, 3, 4].map((i) =>
      rows.length > 0 && rows.every((g) => g.daily[i].real !== null)
        ? rows.reduce((sum, g) => sum + (g.daily[i].real as number), 0)
        : null,
    ),
    technician: [0, 1, 2, 3, 4].map((i) =>
      rows.length > 0 && rows.every((g) => g.daily[i].technician !== null)
        ? rows.reduce((sum, g) => sum + (g.daily[i].technician as number), 0)
        : null,
    ),
    atias: [0, 1, 2, 3, 4].map((i) => rows.reduce((sum, g) => sum + g.daily[i].atias, 0)),
  };
}

const add = (values: number[]) => values.reduce((a, b) => a + b, 0);
const addReal = (values: (number | null)[]) =>
  values.some((v) => v === null) ? null : add(values as number[]);
const kg = (value: number | null) => (value === null ? "—" : fmtKg(value));

/** Lista de la URL, por ejemplo ?familia=padron,cherry_pera. Vacía significa todas. */
function useListParam(name: string): [string[], (next: string[]) => void] {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const value = search.get(name)?.split(",").filter(Boolean) ?? [];
  const set = (next: string[]) => {
    const params = new URLSearchParams(search);
    if (next.length === 0) params.delete(name);
    else params.set(name, next.join(","));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  return [value, set];
}

function Chips({
  label,
  allLabel,
  options,
  selected,
  onChange,
}: {
  label: string;
  allLabel: string;
  options: { id: string; name: string; muted?: boolean }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const chip = (active: boolean, muted = false) =>
    `min-h-9 rounded-md border px-3 text-sm transition-colors duration-150 ${
      active
        ? "border-brand bg-brand-soft font-semibold text-brand-ink"
        : `border-line bg-surface hover:border-ink ${muted ? "text-muted" : "text-ink"}`
    }`;
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        <button type="button" aria-pressed={selected.length === 0} onClick={() => onChange([])} className={chip(selected.length === 0)}>
          {allLabel}
        </button>
        {options.map((o) => {
          const active = selected.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? selected.filter((s) => s !== o.id) : [...selected, o.id])}
              className={chip(active, o.muted)}
            >
              {o.name}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function DayCells({ t, strong = false }: { t: Totals; strong?: boolean }) {
  const weight = strong ? "font-semibold" : "";
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <Fragment key={i}>
          <td className={`num border-l border-line ${weight}`}>{kg(t.real[i])}</td>
          <td className={`num ${weight}`}>{kg(t.technician[i])}</td>
          <td className={`num ${weight}`}>{fmtKg(t.atias[i])}</td>
        </Fragment>
      ))}
      <td className="num border-l border-line font-semibold">{kg(addReal(t.real))}</td>
      <td className="num font-semibold">{kg(addReal(t.technician))}</td>
      <td className="num font-semibold">{fmtKg(add(t.atias))}</td>
    </>
  );
}

function FamilyRows({ family, rows, harvestId }: { family: FamilyId; rows: GreenhouseRow[]; harvestId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr>
        <th scope="row">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="-mx-1 flex min-h-8 items-center gap-1.5 whitespace-nowrap rounded px-1 font-medium transition-colors duration-150 hover:text-brand-ink"
          >
            <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.15 }} className="flex">
              <ChevronRight size={15} aria-hidden />
            </motion.span>
            {FAMILIES[family].name}
          </button>
          {rows.some((g) => g.partial) && <span className="block pl-6 text-xs font-normal text-warn-ink">Atias parcial</span>}
        </th>
        <DayCells t={totals(rows)} />
      </tr>
      {open &&
        rows.map((g) => (
          <tr key={g.info.id} className="bg-canvas text-[0.8125rem]">
            <th scope="row" className="pl-11! font-normal!">
              <Link
                href={`/invernaderos/${g.info.id}?recoleccion=${encodeURIComponent(harvestId)}`}
                className="whitespace-nowrap font-medium text-ink underline-offset-3 hover:underline"
              >
                {g.info.name}
              </Link>
              <span className="block whitespace-nowrap text-xs text-muted">{g.growerName} · {g.technicianName}</span>
            </th>
            <DayCells t={totals([g])} />
          </tr>
        ))}
    </>
  );
}

function DailyTable({ report, rows }: { report: HarvestReport; rows: GreenhouseRow[] }) {
  const families = FAMILY_ORDER.filter((f) => rows.some((g) => g.info.family === f));
  return (
    <div className="overflow-x-auto">
      <table className="data-table compact">
        <thead>
          <tr>
            <th scope="col" rowSpan={2} className="align-bottom">Familia</th>
            {report.dates.map((date) => (
              <th key={date} scope="colgroup" colSpan={3} className="border-l border-line text-center! whitespace-nowrap">
                {fmtDay(date)}
              </th>
            ))}
            <th scope="colgroup" colSpan={3} className="border-l border-line text-center!">Semana</th>
          </tr>
          <tr>
            {[...report.dates, "total"].map((date) => (
              <Fragment key={date}>
                <th scope="col" className="num border-l border-line" title="Real, del ERP">R</th>
                <th scope="col" className="num" title="Previsión del técnico">Téc.</th>
                <th scope="col" className="num" title="Previsión experimental de Atias">Atias</th>
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {families.map((family) => (
            <FamilyRows
              key={family}
              family={family}
              rows={rows.filter((g) => g.info.family === family)}
              harvestId={report.id}
            />
          ))}
          <tr className="bg-canvas">
            <th scope="row" className="font-semibold">Total</th>
            <DayCells t={totals(rows)} strong />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/** Semana a semana, con los mismos filtros: qué previsión se acercó más a lo recogido. */
function History({ reports, keep }: { reports: HarvestReport[]; keep: (g: GreenhouseRow) => boolean }) {
  const weeks = reports.flatMap((r) => {
    const rows = r.greenhouses.filter(keep);
    const real = rows.length > 0 && rows.every((g) => g.realKg !== null)
      ? rows.reduce((sum, g) => sum + (g.realKg as number), 0)
      : null;
    if (real === null) return [];
    const technician = rows.every((g) => g.technicianKg !== null)
      ? rows.reduce((sum, g) => sum + (g.technicianKg as number), 0)
      : null;
    const atias = rows.reduce((sum, g) => sum + g.forecast.kg, 0);
    return [{ id: r.id, week: r.isoWeek, label: r.label, real, technician, atias }];
  });
  if (weeks.length === 0) {
    return <p className="px-5 py-4 text-sm text-muted">Todavía no hay semanas recogidas con esta selección.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Semana</th>
            <th scope="col" className="num">Real (kg)</th>
            <th scope="col" className="num">Técnico (kg)</th>
            <th scope="col" className="num">Error técnico</th>
            <th scope="col" className="num">Atias (kg)</th>
            <th scope="col" className="num">Error Atias</th>
            <th scope="col">Más cerca</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => {
            const tech = w.technician === null ? null : (errorPct(w.technician, w.real) as number);
            const atias = errorPct(w.atias, w.real) as number;
            return (
              <tr key={w.id}>
                <th scope="row" className="whitespace-nowrap">
                  Semana {w.week}
                  <span className="block text-xs font-normal text-muted">{w.label.replace("Recolección ", "")}</span>
                </th>
                <td className="num">{fmtKg(w.real)}</td>
                <td className="num">{w.technician === null ? "—" : fmtKg(w.technician)}</td>
                <td className="num">{tech === null ? "—" : fmtPct(tech)}</td>
                <td className="num">{fmtKg(w.atias)}</td>
                <td className="num">{fmtPct(atias)}</td>
                <td>
                  {tech === null
                    ? <span className="text-muted">—</span>
                    : Math.abs(tech - atias) < 0.05
                    ? <Pill tone="neutral">Igual</Pill>
                    : atias < tech ? <Pill tone="brand">Atias</Pill> : <Pill tone="neutral">Técnico</Pill>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function PrevisionPage() {
  useDocumentTitle("Previsión diaria");
  const harvestId = useSelectedHarvest();
  const report = useReport(harvestId);
  const mode = useDataMode();
  const history = useQuery({ queryKey: queryKeys.reports(mode), queryFn: listReports });
  const [families, setFamilies] = useListParam("familia");
  const [technicians, setTechnicians] = useListParam("tecnico");

  const data = report.data;
  const header = (
    <PageHeader
      title="Previsión diaria"
      description={data
        ? <>Semana {data.isoWeek} de {data.year}. Kilos reales frente a la previsión del técnico y la de Atias. La del agricultor se compara en Precisión. Última actualización: {fmtDate(data.updatedAt)}.</>
        : undefined}
      actions={<HarvestPicker selected={harvestId} />}
    />
  );

  if (report.isPending) return <>{header}<Skeleton /></>;
  if (report.isError) return <>{header}<ErrorState message={report.error.message} onRetry={report.refetch} /></>;
  if (!data) return <>{header}<EmptyState title="Recolección no encontrada">Elige otra semana en el selector.</EmptyState></>;

  const present = new Set(data.greenhouses.map((g) => g.info.family));
  const keep = (g: GreenhouseRow) =>
    (families.length === 0 || families.includes(g.info.family)) &&
    (technicians.length === 0 || technicians.includes(g.technicianId));
  const rows = data.greenhouses.filter(keep);

  return (
    <>
      {header}
      <div className="grid gap-5">
        <Panel>
          <div className="grid gap-5 p-5">
            <Chips
              label="Familia"
              allLabel="Todas"
              options={FAMILY_ORDER.map((id) => ({ id, name: FAMILIES[id].name, muted: !present.has(id) }))}
              selected={families}
              onChange={setFamilies}
            />
            <Chips
              label="Técnico"
              allLabel="Todos"
              options={[...new Map(
                data.greenhouses.filter((g) => g.technicianId).map((g) => [g.technicianId, { id: g.technicianId, name: g.technicianName }]),
              ).values()]}
              selected={technicians}
              onChange={setTechnicians}
            />
          </div>
        </Panel>

        {data.empty ? (
          <EmptyState title="Todavía no hay capturas">
            La previsión de Atias aparecerá cuando los agricultores suban los vídeos del sábado.
          </EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState title="Nada con estos filtros">Ningún invernadero de esta semana coincide con la familia y el técnico elegidos.</EmptyState>
        ) : (
          <Panel
            title="Kilos por día"
            description="R: real, del ERP. Téc.: previsión del técnico. Atias: previsión experimental, sin validar. Abre una familia para ver sus invernaderos."
            actions={<Pill tone="warn">Simulado</Pill>}
          >
            <DailyTable report={data} rows={rows} />
          </Panel>
        )}

        <Panel
          title="¿Qué previsión se acercó más?"
          description="Error de la semana entera frente a lo recogido, con los mismos filtros. Datos simulados: sirve para probar la comparación, no para juzgar a nadie."
        >
          {history.isError ? (
            <p role="alert" className="px-5 py-4 text-sm text-bad-ink">No se ha podido cargar el historial.</p>
          ) : history.data ? (
            <History reports={history.data} keep={keep} />
          ) : (
            <div className="m-5 h-20 animate-pulse rounded bg-sunken motion-reduce:animate-none" />
          )}
        </Panel>
      </div>
    </>
  );
}
