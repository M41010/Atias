"use client";

/**
 * «Kilos por día» en Previsión diaria: los totales de cada día con los filtros de la pantalla. Recibe
 * los mismos totales que la fila «Total» de la tabla, así que las cifras coinciden siempre.
 */

import { fmtDay } from "@/lib/format";
import { GroupedColumns, Legend } from "./Produccion";
import { Pill } from "@/components/ui";

export type DayTotals = { real: (number | null)[]; technician: (number | null)[]; atias: number[] };

export function KilosPorDia({ dates, totals }: { dates: string[]; totals: DayTotals }) {
  return (
    <div className="grid gap-3 border-b border-line px-5 py-4">
      <Legend ids={["real", "technician", "atias"]} after={{ atias: <Pill tone="warn">Experimental</Pill> }} />
      <GroupedColumns
        label="Kilos por día: real, previsión del técnico y previsión de Atias. Las cifras están también en la tabla."
        height={200}
        categories={dates.map((date) => ({ key: date, label: fmtDay(date), short: fmtDay(date).replace(",", "").replace(/ \S+$/, "") }))}
        series={[
          { id: "real", values: totals.real },
          { id: "technician", values: totals.technician },
          { id: "atias", values: totals.atias },
        ]}
      />
    </div>
  );
}
