"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, RefreshCw, Upload as UploadIcon, WifiOff, X } from "lucide-react";
import { type DragEvent, useCallback, useMemo, useRef, useState } from "react";
import { EmptyState, ErrorState, PageHeader, Panel, Pill, Skeleton } from "@/components/ui";
import { type BatchRow, greenhouseNumber, problemText, type RowProblem, rowProblems, rowsFromFiles } from "@/lib/batchUpload";
import { fmtDay, fmtKg } from "@/lib/format";
import { useDocumentTitle, useReport } from "@/lib/hooks";
import { harvestForecast } from "@/lib/uploadForecast";
import { fetchUploadHarvests, fetchUploadTargets, type UploadTargets } from "@/lib/serverApi";
import { CROPS } from "@/lib/simulated";
import { formatSize, type Side, type Upload, uploadKey } from "@/lib/upload";
import { type BatchTarget, useBatchUpload } from "@/lib/useBatchUpload";

type Row = BatchRow & { file: File };
type Greenhouse = UploadTargets["invernaderos"][number];

const ACCEPT = "video/*,.mp4,.m4v,.mov,.webm,.3gp,.mkv";
const SIDES: Side[] = ["A", "B"];

/** Sin hilera o lado reconocidos van primero: son los que hay que mirar. */
const byPosition = (a: Row, b: Row) =>
  (a.hilera ?? 0) - (b.hilera ?? 0) || (a.lado ?? "").localeCompare(b.lado ?? "") || a.file.name.localeCompare(b.file.name);

function DropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setOver(false);
    onFiles([...event.dataTransfer.files]);
  };
  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={`rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors duration-150 ${
        over ? "border-brand bg-brand-soft" : "border-line-strong bg-surface"
      }`}
    >
      <UploadIcon size={22} className="mx-auto text-muted" aria-hidden />
      <p className="mt-2 font-medium">Arrastra aquí los vídeos de este invernadero</p>
      <p className="mt-1 text-sm text-muted">
        La hilera y el lado se leen del nombre del archivo (inv1-h3-A). Lo que no se reconozca se elige a mano.
      </p>
      <button type="button" className="btn-secondary mt-4" onClick={() => input.current?.click()}>
        Elegir vídeos
      </button>
      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          onFiles([...(event.target.files ?? [])]);
          event.target.value = "";
        }}
      />
    </div>
  );
}

function ReviewTable({
  rows,
  problems,
  greenhouse,
  onChange,
  onRemove,
}: {
  rows: Row[];
  problems: Record<string, RowProblem[]>;
  greenhouse: Greenhouse;
  onChange: (id: string, change: Partial<Row>) => void;
  onRemove: (id: string) => void;
}) {
  const current = new Map(greenhouse.videos.map((v) => [uploadKey(v.hilera, v.lado), v]));
  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Archivo</th>
            <th scope="col">Hilera</th>
            <th scope="col">Lado</th>
            <th scope="col">Revisión</th>
            <th scope="col" className="num"><span className="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const list = problems[row.id] ?? [];
            const replaces = row.hilera !== null && row.lado !== null ? current.get(uploadKey(row.hilera, row.lado)) : undefined;
            const label = row.file.name;
            return (
              <tr key={row.id} className={list.length ? "bg-bad-soft/40" : undefined}>
                <th scope="row" className="max-w-64">
                  <span className="block truncate" title={label}>{label}</span>
                  <span className="block text-xs font-normal text-muted">{formatSize(row.file.size)}</span>
                </th>
                <td>
                  <select
                    aria-label={`Hilera de ${label}`}
                    value={row.hilera ?? ""}
                    onChange={(e) => onChange(row.id, { hilera: e.target.value ? Number(e.target.value) : null })}
                    className="input min-h-10 tabular-nums"
                  >
                    <option value="">—</option>
                    {/* Una hilera leída que no existe se muestra para que se vea el error. */}
                    {row.hilera !== null && row.hilera > greenhouse.hileras && <option value={row.hilera}>{row.hilera}</option>}
                    {Array.from({ length: greenhouse.hileras }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </td>
                <td>
                  <select
                    aria-label={`Lado de ${label}`}
                    value={row.lado ?? ""}
                    onChange={(e) => onChange(row.id, { lado: (e.target.value || null) as Side | null })}
                    className="input min-h-10"
                  >
                    <option value="">—</option>
                    {SIDES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="text-sm">
                  {list.map((problem) => (
                    <span key={problem.kind} className="flex items-center gap-1 font-medium text-bad-ink">
                      <AlertTriangle size={13} className="shrink-0" aria-hidden />
                      {problemText(problem)}
                      {problem.kind === "otro_invernadero" && (
                        <button
                          type="button"
                          className="ml-1 font-medium text-ink underline underline-offset-3"
                          onClick={() => onChange(row.id, { confirmedGreenhouse: true })}
                        >
                          Es de {greenhouse.nombre}
                        </button>
                      )}
                    </span>
                  ))}
                  {!list.length && replaces && (
                    <span className="text-warn-ink">Sustituirá al recibido ({replaces.fileName})</span>
                  )}
                  {!list.length && !replaces && <span className="text-ok-ink">Listo</span>}
                </td>
                <td className="text-right">
                  <button type="button" className="btn-secondary" aria-label={`Quitar ${label}`} onClick={() => onRemove(row.id)}>
                    <X size={15} aria-hidden />
                    Quitar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function UploadLine({ upload, target, onCancel, onRetry }: {
  upload: Upload;
  target: BatchTarget;
  onCancel: () => void;
  onRetry: () => void;
}) {
  const percent = Math.round(upload.progress * 100);
  const running = upload.status === "subiendo" || upload.status === "en_cola";
  const context = `${target.greenhouseName}, hilera ${upload.hilera}, lado ${upload.lado}`;
  return (
    <li className="border-b border-line px-5 py-3 last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">{target.greenhouseName} · Hilera {upload.hilera} · Lado {upload.lado}</p>
          <p className="truncate text-xs text-muted">{upload.fileName} · {formatSize(upload.sizeBytes)}</p>
        </div>
        <span className="flex items-center gap-2">
          {upload.status === "recibido" && <Pill tone="ok"><CheckCircle2 size={12} aria-hidden />Recibido</Pill>}
          {upload.status === "en_cola" && <Pill tone="neutral">En cola</Pill>}
          {upload.status === "subiendo" && (
            <Pill tone={upload.reconnecting ? "warn" : "brand"}>{upload.reconnecting ? "Reconectando…" : `${percent} %`}</Pill>
          )}
          {upload.status === "error" && (
            <button type="button" className="btn-secondary" onClick={onRetry}>
              <RefreshCw size={15} aria-hidden />
              Reintentar
            </button>
          )}
          {(running || upload.status === "error") && (
            <button type="button" className="btn-secondary" aria-label={`Cancelar la subida de ${context}`} onClick={onCancel}>
              <X size={15} aria-hidden />
              Cancelar
            </button>
          )}
        </span>
      </div>
      {upload.status === "subiendo" && (
        <div
          role="progressbar"
          aria-label={`Subida de ${context}`}
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-sunken"
        >
          <div
            className={`h-full rounded-full transition-[width] duration-200 ${upload.reconnecting ? "bg-warn-ink" : "bg-brand"}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
      {upload.errorMessage && <p role="alert" className="mt-2 text-sm text-bad-ink">{upload.errorMessage}</p>}
    </li>
  );
}

/** Lo que ya prevé Atias para los días de la recolección elegida, con los vídeos analizados hasta ahora. */
function HarvestForecastNote({ harvestId }: { harvestId: string }) {
  const report = useReport(harvestId);
  if (report.isPending) return <p className="text-xs text-muted sm:col-span-2">Cargando la previsión de esta recolección…</p>;
  if (report.isError) return null;
  const forecast = harvestForecast(report.data);
  if (!forecast) {
    return (
      <p className="text-sm text-muted sm:col-span-2">
        Previsión estimada: todavía no hay vídeos analizados de esta recolección.
      </p>
    );
  }
  return (
    <div className="text-sm sm:col-span-2">
      <p className="font-medium">
        Previsión estimada de Atias: <span className="tabular-nums">{fmtKg(forecast.totalKg)} kg</span> de lunes a viernes
      </p>
      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-muted tabular-nums">
        {forecast.days.map((d) => (
          <li key={d.date}><span className="capitalize">{fmtDay(d.date)}</span>: {fmtKg(d.kg)} kg</li>
        ))}
      </ul>
      <p className="mt-1 text-xs text-muted">
        Con los vídeos analizados hasta ahora ({forecast.greenhouses} {forecast.greenhouses === 1 ? "invernadero" : "invernaderos"})
        {forecast.partial ? "; faltan hileras, así que cambiará al llegar más." : "."}
      </p>
    </div>
  );
}

export default function SubirVideosPage() {
  useDocumentTitle("Subir vídeos");
  const client = useQueryClient();
  const harvests = useQuery({ queryKey: ["subidas"], queryFn: fetchUploadHarvests });
  const [chosenHarvest, setChosenHarvest] = useState<string | null>(null);
  const harvestId = chosenHarvest ?? harvests.data?.propuesta ?? null;
  const targets = useQuery({
    queryKey: ["subidas", harvestId],
    queryFn: () => fetchUploadTargets(harvestId as string),
    enabled: harvestId !== null,
  });
  const [chosenGreenhouse, setChosenGreenhouse] = useState<string | null>(null);
  const greenhouse = targets.data?.invernaderos.find((g) => g.id === chosenGreenhouse) ?? targets.data?.invernaderos[0];

  const [rows, setRows] = useState<Row[]>([]);
  const nextId = useRef(0);

  const onReceived = useCallback((target: BatchTarget) => {
    void client.invalidateQueries({ queryKey: ["subidas", target.harvestId] });
    void client.invalidateQueries({ queryKey: ["videos-recibidos", target.harvestId] });
    void client.invalidateQueries({ queryKey: ["recolecciones-reales"] });
  }, [client]);
  const batch = useBatchUpload(onReceived);

  // Lados de este invernadero que ya están en la cola o subiendo.
  const queued = useMemo(() => new Set(
    Object.entries(batch.uploads)
      .filter(([key, u]) => (u.status === "en_cola" || u.status === "subiendo" || u.status === "error")
        && batch.targets[key]?.greenhouseId === greenhouse?.id && batch.targets[key]?.harvestId === harvestId)
      .map(([, u]) => uploadKey(u.hilera, u.lado)),
  ), [batch.uploads, batch.targets, greenhouse?.id, harvestId]);

  const problems = greenhouse
    ? rowProblems(rows, { hileras: greenhouse.hileras, greenhouseNumber: greenhouseNumber(greenhouse.nombre), queued })
    : {};
  const blocked = rows.filter((r) => (problems[r.id] ?? []).length > 0).length;

  const addFiles = (files: File[]) => {
    if (!files.length) return;
    const added = rowsFromFiles(files, () => `v${++nextId.current}`);
    setRows((value) => [...value, ...added].sort(byPosition));
  };

  const startUploads = () => {
    if (!greenhouse || !harvestId || blocked || !rows.length) return;
    const target = { harvestId, greenhouseId: greenhouse.id, greenhouseName: greenhouse.nombre };
    batch.add(rows.map((row) => ({ id: row.id, file: row.file, hilera: row.hilera as number, lado: row.lado as Side, target })));
    setRows([]);
  };

  const uploadList = Object.entries(batch.uploads);
  const receivedCount = uploadList.filter(([, u]) => u.status === "recibido").length;
  // Mientras se sube, no se cambia de invernadero: lo que se revisa debe ser del que se ve.
  const locked = rows.length > 0;

  const header = (
    <PageHeader
      title="Subir vídeos"
      description="Los vídeos que te mandan los agricultores. Llegan al mismo sitio que los de su enlace y no dependen de él: se pueden subir aunque haya caducado."
    />
  );

  if (harvests.isError) return <>{header}<ErrorState message={harvests.error.message} onRetry={harvests.refetch} /></>;
  if (targets.isError) return <>{header}<ErrorState message={targets.error.message} onRetry={targets.refetch} /></>;
  if (!harvests.data || !targets.data) return <>{header}<Skeleton /></>;

  return (
    <>
      {header}
      <div className="grid gap-5">
        <Panel>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium">Recolección</span>
              <select
                value={harvestId ?? ""}
                disabled={locked}
                onChange={(e) => {
                  setChosenHarvest(e.target.value);
                  setChosenGreenhouse(null);
                }}
                className="input min-h-10 w-full disabled:opacity-55"
              >
                {harvests.data.recolecciones.map((h) => (
                  <option key={h.id} value={h.id}>{h.etiqueta.replace("Recolección ", "")}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Invernadero</span>
              <select
                value={greenhouse?.id ?? ""}
                disabled={locked || !greenhouse}
                onChange={(e) => setChosenGreenhouse(e.target.value)}
                className="input min-h-10 w-full disabled:opacity-55"
              >
                {targets.data.invernaderos.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nombre} · {CROPS[g.cultivo]?.name ?? g.cultivo} · {g.hileras} hileras · {g.videos.length} de {g.hileras * 2} vídeos
                  </option>
                ))}
              </select>
            </label>
            {harvestId && <HarvestForecastNote harvestId={harvestId} />}
            {locked && (
              <p className="text-xs text-muted sm:col-span-2">
                Para cambiar de recolección o invernadero, sube o quita antes los vídeos en revisión.
              </p>
            )}
          </div>
        </Panel>

        {!greenhouse ? (
          <EmptyState title="Todavía no hay invernaderos">Añádelos en Enlaces para poder subir sus vídeos.</EmptyState>
        ) : (
          <>
            <DropZone onFiles={addFiles} />

            {rows.length > 0 && (
              <Panel
                title={`Revisar ${rows.length} ${rows.length === 1 ? "vídeo" : "vídeos"} de ${greenhouse.nombre}`}
                description="Comprueba cada hilera y lado con el folio del principio del vídeo. Si ya hay un vídeo recibido en ese lado, se sustituye al terminar de subir el nuevo."
              >
                <ReviewTable
                  rows={rows}
                  problems={problems}
                  greenhouse={greenhouse}
                  onChange={(id, change) => setRows((value) => value.map((r) => (r.id === id ? { ...r, ...change } : r)))}
                  onRemove={(id) => setRows((value) => value.filter((r) => r.id !== id))}
                />
                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line px-5 py-3.5">
                  {blocked > 0 && (
                    <p className="text-sm text-bad-ink">
                      {blocked === 1 ? "Falta corregir 1 vídeo." : `Faltan por corregir ${blocked} vídeos.`}
                    </p>
                  )}
                  <button type="button" className="btn-secondary" onClick={() => setRows([])}>Quitar todos</button>
                  <button type="button" disabled={blocked > 0} className="btn-primary disabled:cursor-not-allowed disabled:opacity-55" onClick={startUploads}>
                    <UploadIcon size={15} aria-hidden />
                    Subir {rows.length} {rows.length === 1 ? "vídeo" : "vídeos"}
                  </button>
                </div>
              </Panel>
            )}
          </>
        )}

        {uploadList.length > 0 && (
          <Panel
            title={`Subidas: ${receivedCount} de ${uploadList.length} recibidos`}
            description="Se suben de una en una. Si se corta la conexión, siguen solas al volver. Si cierras la página, vuelve a elegir los mismos archivos: seguirán por donde iban."
            actions={receivedCount > 0 ? (
              <button type="button" className="btn-secondary" onClick={batch.clearReceived}>Quitar recibidos de la lista</button>
            ) : undefined}
          >
            {!batch.online && (
              <p role="status" className="flex items-center gap-2 border-b border-line bg-sunken px-5 py-2.5 text-sm">
                <WifiOff size={15} aria-hidden />
                Sin conexión: las subidas siguen al volver.
              </p>
            )}
            <ul>
              {uploadList.map(([key, upload]) => (
                <UploadLine
                  key={key}
                  upload={upload}
                  target={batch.targets[key]}
                  onCancel={() => batch.cancel(key)}
                  onRetry={() => batch.retry(key)}
                />
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </>
  );
}
