"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Play, X } from "lucide-react";
import { useState } from "react";
import { EmptyState, ErrorState, PageHeader, Panel, Pill, Skeleton } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { useDocumentTitle } from "@/lib/hooks";
import { fetchHarvestList, fetchHarvestOverview, type HarvestOverview } from "@/lib/serverApi";
import { CROPS } from "@/lib/simulated";
import { formatSize, missingData, type ServerVideo, type Side } from "@/lib/upload";

const REFRESH_MS = 15_000;
const SIDES: Side[] = ["A", "B"];

function VideoPlayer({ video, hilera, onClose }: { video: ServerVideo; hilera: number; onClose: () => void }) {
  const [failed, setFailed] = useState(false);
  const src = `/api/cooperativa/videos/${encodeURIComponent(video.id)}/contenido`;
  return (
    <div className="border-t border-line px-5 py-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Hilera {hilera} · Lado {video.lado} · {video.fileName}</p>
        <button type="button" className="btn-secondary" onClick={onClose}>
          <X size={15} aria-hidden />
          Cerrar
        </button>
      </div>
      {failed ? (
        <p role="alert" className="text-sm text-warn-ink">
          Este navegador no puede reproducir el formato de este vídeo.{" "}
          <a href={src} download={video.fileName} className="font-medium underline underline-offset-3">Descargarlo</a>
        </p>
      ) : (
        <video
          key={video.id}
          controls
          preload="metadata"
          src={src}
          onError={() => setFailed(true)}
          aria-label={`Vídeo de la hilera ${hilera}, lado ${video.lado}`}
          className="max-h-[28rem] w-full rounded-md bg-ink"
        />
      )}
    </div>
  );
}

function SideCell({ video, onPlay }: { video?: ServerVideo; onPlay: (video: ServerVideo) => void }) {
  if (!video) return <td className="text-muted">Pendiente</td>;
  return (
    <td>
      <span className="flex items-center gap-1.5 font-medium text-ok-ink">
        <CheckCircle2 size={15} className="shrink-0" aria-hidden />
        Recibido
      </span>
      <span className="block max-w-56 truncate text-xs text-muted">
        {video.fileName} · {formatSize(video.sizeBytes)}
      </span>
      {video.receivedAt && <span className="block text-xs text-muted">{fmtDate(video.receivedAt)}</span>}
      <button
        type="button"
        onClick={() => onPlay(video)}
        aria-label={`Ver vídeo de la hilera ${video.hilera}, lado ${video.lado}`}
        className="mt-1 inline-flex min-h-7 items-center gap-1 text-sm font-medium text-brand-ink underline-offset-3 hover:underline"
      >
        <Play size={14} aria-hidden />
        Ver
      </button>
    </td>
  );
}

function fmtValue(value: number | null, unit: string): string {
  return value === null ? "Sin indicar" : `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(value)} ${unit}`;
}

function GreenhousePanel({ greenhouse }: { greenhouse: HarvestOverview["invernaderos"][number] }) {
  const { datos, videos } = greenhouse;
  const hileras = datos.hileras ?? 0;
  const total = hileras * 2;
  const missing = missingData(datos);
  const [playing, setPlaying] = useState<ServerVideo | null>(null);
  return (
    <Panel
      title={greenhouse.nombre}
      description={`${CROPS[greenhouse.cultivo]?.name ?? greenhouse.cultivo}${datos.variety ? ` · ${datos.variety}` : ""}`}
      actions={
        <span className="flex flex-wrap items-center gap-1.5">
          <Pill tone={videos.length === total ? "ok" : videos.length > 0 ? "warn" : "neutral"}>
            {videos.length} de {total} vídeos
          </Pill>
          <Pill tone={missing === 0 ? "ok" : "warn"}>
            {missing === 0 ? "Datos completos" : `Faltan ${missing} datos`}
          </Pill>
        </span>
      }
    >
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Hilera</th>
              <th scope="col">Lado A</th>
              <th scope="col">Lado B</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: hileras }, (_, i) => i + 1).map((hilera) => (
              <tr key={hilera}>
                <th scope="row" className="whitespace-nowrap">Hilera {hilera}</th>
                {SIDES.map((lado) => (
                  <SideCell key={lado} video={videos.find((v) => v.hilera === hilera && v.lado === lado)} onPlay={setPlaying} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {playing && <VideoPlayer key={playing.id} video={playing} hilera={playing.hilera} onClose={() => setPlaying(null)} />}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-line px-5 py-4 text-sm lg:grid-cols-4">
        <div>
          <dt className="text-muted">Longitud de hilera</dt>
          <dd className="font-medium tabular-nums">{fmtValue(datos.longitudM, "m")}</dd>
        </div>
        <div>
          <dt className="text-muted">Temperatura interior</dt>
          <dd className="font-medium tabular-nums">{fmtValue(datos.temperaturaC, "°C")}</dd>
        </div>
        <div>
          <dt className="text-muted">Humedad interior</dt>
          <dd className="font-medium tabular-nums">{fmtValue(datos.humedadPct, "%")}</dd>
        </div>
        <div>
          <dt className="text-muted">Kilos semana pasada</dt>
          <dd className="font-medium tabular-nums">{fmtValue(datos.kilosSemanaPasada, "kg")}</dd>
        </div>
      </dl>
    </Panel>
  );
}

export default function VideosPage() {
  useDocumentTitle("Vídeos recibidos");
  const harvests = useQuery({ queryKey: ["recolecciones-reales"], queryFn: fetchHarvestList });
  const [selected, setSelected] = useState<string | null>(null);
  const harvestId = selected ?? harvests.data?.[0]?.id ?? null;
  const overview = useQuery({
    queryKey: ["videos-recibidos", harvestId],
    queryFn: () => fetchHarvestOverview(harvestId as string),
    enabled: harvestId !== null,
    refetchInterval: REFRESH_MS,
  });

  const header = (
    <PageHeader
      title="Vídeos recibidos"
      description="Lo que ha enviado cada agricultor. Se actualiza solo. Aún no se analizan: los kilos del resto de la app siguen simulados."
      actions={harvests.data && harvests.data.length > 0 ? (
        <label className="flex items-center gap-2 text-sm text-muted">
          <span className="sr-only md:not-sr-only">Recolección</span>
          <select
            value={harvestId ?? ""}
            onChange={(event) => setSelected(event.target.value)}
            className="min-h-10 rounded-md border border-control bg-surface px-3 text-sm font-medium text-ink"
          >
            {harvests.data.map((h) => (
              <option key={h.id} value={h.id}>{h.etiqueta.replace("Recolección ", "")}</option>
            ))}
          </select>
        </label>
      ) : undefined}
    />
  );

  if (harvests.isError) return <>{header}<ErrorState message={harvests.error.message} onRetry={harvests.refetch} /></>;
  if (overview.isError && !overview.data) {
    return <>{header}<ErrorState message={overview.error.message} onRetry={overview.refetch} /></>;
  }
  if (harvests.data?.length === 0) {
    return <>{header}<EmptyState title="Todavía no hay recolecciones">Aparecerán aquí cuando se creen los enlaces para los agricultores.</EmptyState></>;
  }
  if (!overview.data) return <>{header}<Skeleton /></>;

  return (
    <>
      {header}
      {overview.isError && (
        <p role="status" className="mb-4 text-sm text-warn-ink">
          No se ha podido actualizar. Se muestra la última información recibida.
        </p>
      )}
      <div className="grid gap-5">
        {overview.data.invernaderos.map((greenhouse) => (
          <GreenhousePanel key={greenhouse.id} greenhouse={greenhouse} />
        ))}
      </div>
    </>
  );
}
