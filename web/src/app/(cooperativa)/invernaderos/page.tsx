"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GreenhouseTable } from "@/components/GreenhouseTable";
import { EmptyState, ErrorState, HarvestPicker, PageHeader, Panel, Skeleton } from "@/components/ui";
import { useDocumentTitle, useReport, useSelectedHarvest } from "@/lib/hooks";

export default function InvernaderosPage() {
  useDocumentTitle("Invernaderos");
  const harvestId = useSelectedHarvest();
  const crop = useSearchParams().get("cultivo");
  const { data: report, isPending, isError, error, refetch } = useReport(harvestId);
  const header = <PageHeader title="Invernaderos" description={report?.label} actions={<HarvestPicker selected={harvestId} />} />;

  if (isPending) return <>{header}<Skeleton /></>;
  if (isError) return <>{header}<ErrorState message={error.message} onRetry={refetch} /></>;
  if (!report || report.empty) {
    return (
      <>
        {header}
        <EmptyState title="Todavía no hay capturas">
          Cada invernadero aparecerá aquí cuando el agricultor suba sus vídeos.
        </EmptyState>
      </>
    );
  }

  const rows = crop ? report.greenhouses.filter((g) => g.info.crop === crop) : report.greenhouses;
  const cropName = report.crops.find((c) => c.crop === crop)?.name;

  return (
    <>
      {header}
      {cropName && (
        <p className="mb-3 flex items-center gap-2 text-sm">
          Solo {cropName.toLowerCase()}
          <Link
            href={`/invernaderos?recoleccion=${encodeURIComponent(harvestId)}`}
            className="inline-flex items-center gap-1 font-medium text-brand-ink underline-offset-3 hover:underline"
          >
            <X size={14} aria-hidden />
            Quitar filtro
          </Link>
        </p>
      )}
      <Panel>
        {rows.length > 0 ? (
          <GreenhouseTable rows={rows} harvestId={harvestId} />
        ) : (
          <p className="px-5 py-4 text-sm text-muted">Ningún invernadero con este cultivo en esta recolección.</p>
        )}
      </Panel>
    </>
  );
}
