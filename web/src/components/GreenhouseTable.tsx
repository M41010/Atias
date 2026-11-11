"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { GreenhouseRow } from "@/lib/api";
import { fmtDate, fmtInt, fmtKg, fmtPct } from "@/lib/format";
import { ForecastHeader, Pill, StatusPill } from "./ui";

export function GreenhouseTable({ rows, harvestId }: { rows: GreenhouseRow[]; harvestId: string }) {
  const hasHarvest = rows.some((g) => g.realKg !== null);
  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Invernadero</th>
            <th scope="col" className="hidden lg:table-cell">Captura</th>
            <th scope="col" className="num">Observado<span className="hidden sm:inline"> (kg)</span></th>
            <th scope="col" className="num"><ForecastHeader /></th>
            {hasHarvest && <th scope="col" className="num">Cosechado (kg)</th>}
            {hasHarvest && <th scope="col" className="num">Error</th>}
            {!hasHarvest && <th scope="col" className="num hidden sm:table-cell">Frutos maduros</th>}
            <th scope="col" className="hidden sm:table-cell">Análisis</th>
            <th scope="col" aria-label="Abrir" className="hidden sm:table-cell" />
          </tr>
        </thead>
        <tbody>
          {rows.map((g) => (
            <tr key={g.info.id} className="row-link">
              <th scope="row">
                <Link
                  href={`/invernaderos/${g.info.id}?recoleccion=${encodeURIComponent(harvestId)}`}
                  className="whitespace-nowrap font-medium text-ink"
                >
                  {g.info.name}
                </Link>
                <span className="block whitespace-nowrap text-xs font-normal text-muted">{g.familyName} · {g.growerName}</span>
                <span className="mt-1 flex flex-wrap items-center gap-1.5 sm:hidden">
                  <StatusPill status={g.status} />
                  {g.isNew && <Pill tone="brand">Nuevo</Pill>}
                </span>
              </th>
              <td className="hidden whitespace-nowrap text-muted lg:table-cell">
                {fmtDate(g.capturedAt)}
                {!g.captureFromRecording && <span className="block text-xs">Llegada: sin fecha de grabación</span>}
              </td>
              <td className="num">
                {fmtKg(g.observed.kg)}
                {g.partial && <span className="block text-xs text-warn-ink">parcial</span>}
              </td>
              <td className="num">
                {fmtKg(g.forecast.kg)}
                {g.partial && <span className="block text-xs text-warn-ink">parcial</span>}
              </td>
              {hasHarvest && <td className="num">{g.realKg === null ? "—" : fmtKg(g.realKg)}</td>}
              {hasHarvest && <td className="num">{g.errorPct === null ? "—" : fmtPct(g.errorPct)}</td>}
              {!hasHarvest && <td className="num hidden sm:table-cell">{fmtInt(g.matureFruits)}</td>}
              <td className="hidden sm:table-cell">
                <span className="flex flex-wrap items-center gap-1.5">
                  <StatusPill status={g.status} />
                  {g.warnedHileras.length > 0 && (
                    <span className="text-xs text-bad-ink">Revisar hilera {g.warnedHileras.join(", ")}</span>
                  )}
                  {g.isNew && <Pill tone="brand">Nuevo</Pill>}
                </span>
              </td>
              <td className="hidden w-8 pl-0! text-muted sm:table-cell">
                <ChevronRight size={16} aria-hidden />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
