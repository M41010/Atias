"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Camera, CheckCircle2, ChevronDown, FolderOpen, Info, RefreshCw, Trash2, Undo2, WifiOff, X } from "lucide-react";
import { type ChangeEvent, useId, useState } from "react";
import { Panel, Pill } from "@/components/ui";
import { useDocumentTitle } from "@/lib/hooks";
import { qualityMessages } from "@/lib/quality";
import type { LinkInfo } from "@/lib/serverApi";
import { CROPS } from "@/lib/simulated";
import {
  type FarmerData,
  formatSize,
  highestHileraWithVideo,
  missingData,
  nextPending,
  type Side,
  type Upload,
  uploadKey,
} from "@/lib/upload";
import { type SaveState, useUploadSession } from "@/lib/useUploadSession";

function FileButton({
  label,
  icon,
  capture,
  primary,
  onFile,
  context,
}: {
  label: string;
  icon?: "camera" | "folder";
  capture?: boolean;
  primary?: boolean;
  onFile: (file: File | undefined) => void;
  context: string;
}) {
  const Icon = icon === "camera" ? Camera : FolderOpen;
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFile(event.target.files?.[0]);
    event.target.value = "";
  };
  return (
    <label className={`${primary ? "btn-primary" : "btn-secondary"} relative min-h-11 cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand`}>
      {icon && <Icon size={16} aria-hidden />}
      {label}
      <span className="sr-only"> {context}</span>
      <input
        type="file"
        accept="video/*"
        capture={capture ? "environment" : undefined}
        onChange={onChange}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  );
}

function IconButton({ label, onClick, icon: Icon }: { label: string; onClick: () => void; icon: typeof X }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="btn-secondary min-h-11 min-w-11 justify-center px-0!">
      <Icon size={16} aria-hidden />
    </button>
  );
}

function VideoRow({
  hilera,
  lado,
  upload,
  removed,
  error,
  online,
  isNext,
  onFile,
  onCancel,
  onRemove,
  onUndo,
  onRetry,
}: {
  hilera: number;
  lado: Side;
  upload?: Upload;
  removed: boolean;
  error?: string;
  online: boolean;
  isNext: boolean;
  onFile: (file: File | undefined) => void;
  onCancel: () => void;
  onRemove: () => void;
  onUndo: () => void;
  onRetry: () => void;
}) {
  const context = `para hilera ${hilera}, lado ${lado}`;
  const status = upload?.status;
  const active = status === "subiendo" || status === "en_cola";
  const percent = Math.round((upload?.progress ?? 0) * 100);
  const paused = active && (!online || Boolean(upload?.reconnecting));

  return (
    <li className="px-5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1 basis-24">
          <p className="text-sm font-semibold">Lado {lado}</p>
          {status === "recibido" && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-ok-ink">
              <CheckCircle2 size={16} className="shrink-0" aria-hidden />
              Recibido
            </p>
          )}
          {status === "recibido" && upload?.calidad?.estado === "pendiente" && (
            <p className="text-xs text-muted">Revisando la imagen…</p>
          )}
          {status === "recibido" && qualityMessages(upload?.calidad).map((message) => (
            <p key={message} className="flex items-center gap-1.5 text-sm font-medium text-warn-ink">
              <AlertTriangle size={15} className="shrink-0" aria-hidden />
              {message}
            </p>
          ))}
          {status === "recibido" && upload?.calidad?.estado === "avisos" && (
            <p className="text-xs text-warn-ink">Si puedes, repítelo con «Cambiar».</p>
          )}
          {!upload && !removed && <p className="text-sm text-muted">Pendiente</p>}
          {!upload && removed && (
            <p className="text-sm text-muted">
              Quitado.{" "}
              <button type="button" onClick={onUndo} className="inline-flex min-h-6 items-center gap-1 font-medium text-brand-ink underline underline-offset-3">
                <Undo2 size={14} aria-hidden />
                Deshacer<span className="sr-only"> {context}</span>
              </button>
            </p>
          )}
          {status === "interrumpido" && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-warn-ink">
              <AlertTriangle size={15} className="shrink-0" aria-hidden />
              Vuelve a elegirlo
            </p>
          )}
          {status === "error" && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-bad-ink">
              <AlertTriangle size={15} className="shrink-0" aria-hidden />
              No se ha subido
            </p>
          )}
          {paused && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-warn-ink tabular-nums">
              <WifiOff size={15} className="shrink-0" aria-hidden />
              {online ? "Reconectando" : "En pausa"} · {percent} %
            </p>
          )}
          {active && !paused && (
            <p className="text-sm font-medium tabular-nums">
              {status === "en_cola" ? "En cola" : `Subiendo · ${percent} %`}
            </p>
          )}
          {upload && (
            <p className="truncate text-xs text-muted">
              {upload.fileName} · {formatSize(upload.sizeBytes)}
              {status === "interrumpido" && " · Elige el mismo archivo para continuar"}
            </p>
          )}
        </div>
        {active ? (
          <IconButton label={`Cancelar la subida ${context}`} icon={X} onClick={onCancel} />
        ) : status === "error" ? (
          <span className="flex gap-2">
            <button type="button" onClick={onRetry} className="btn-primary min-h-11">
              <RefreshCw size={16} aria-hidden />
              Reintentar<span className="sr-only"> {context}</span>
            </button>
            <IconButton label={`Cancelar la subida ${context}`} icon={X} onClick={onCancel} />
          </span>
        ) : status === "recibido" ? (
          <span className="flex gap-2">
            <FileButton label="Cambiar" context={context} onFile={onFile} />
            <IconButton label={`Quitar el vídeo ${context}`} icon={Trash2} onClick={onRemove} />
          </span>
        ) : (
          <span className="flex gap-2">
            <FileButton label="Grabar" icon="camera" capture primary={isNext} context={context} onFile={onFile} />
            <FileButton label="Elegir" icon="folder" context={context} onFile={onFile} />
            {status === "interrumpido" && <IconButton label={`Quitar el vídeo ${context}`} icon={Trash2} onClick={onRemove} />}
          </span>
        )}
      </div>
      {active && (
        <div
          role="progressbar"
          aria-label={`Subida ${context}`}
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-sunken"
        >
          <motion.div
            className={`h-full rounded-full ${paused ? "bg-warn-ink" : "bg-brand"}`}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.25, ease: "linear" }}
          />
        </div>
      )}
      {(error || upload?.errorMessage) && <p role="alert" className="mt-2 text-sm text-bad-ink">{error ?? upload?.errorMessage}</p>}
    </li>
  );
}

function DataField({
  label,
  value,
  unit,
  min,
  max,
  required,
  integer,
  belowMinNote,
  onChange,
  onValidity,
}: {
  label: string;
  value: number | null;
  unit?: string;
  min: number;
  max: number;
  required?: boolean;
  integer?: boolean;
  belowMinNote?: string;
  onChange: (value: number | null) => void;
  onValidity: (valid: boolean) => void;
}) {
  const id = useId();
  const [text, setText] = useState(value === null ? "" : String(value));
  const inRange = (n: number) => Number.isFinite(n) && n >= min && n <= max && (!integer || Number.isInteger(n));
  const check = (raw: string) => (raw.trim() === "" ? !required : inRange(Number(raw.trim().replace(",", "."))));
  const empty = text.trim() === "";
  const valid = check(text);
  const parsed = Number(text.trim().replace(",", "."));
  const kept = value === null ? "" : ` Se mantiene ${String(value).replace(".", ",")}.`;
  const problem = empty
    ? `Este dato es necesario.${kept}`
    : belowMinNote && parsed < min
      ? `${belowMinNote}${kept}`
      : `${integer ? "Debe ser un número entero" : "Debe estar"} entre ${min} y ${max}.${kept}`;

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">{label}</label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          inputMode="decimal"
          value={text}
          aria-invalid={!valid}
          aria-describedby={valid ? undefined : `${id}-error`}
          onChange={(event) => {
            const next = event.target.value;
            setText(next);
            const ok = check(next);
            onValidity(ok);
            if (!ok) return;
            onChange(next.trim() === "" ? null : Number(next.trim().replace(",", ".")));
          }}
          className={`input min-h-11 w-full text-right tabular-nums ${valid ? "" : "border-bad-ink!"}`}
        />
        <span className="w-6 shrink-0 text-sm text-muted">{unit}</span>
      </div>
      {!valid && <p id={`${id}-error`} className="mt-1 text-xs text-bad-ink">{problem}</p>}
    </div>
  );
}

function DataPanel({
  data,
  minHileras,
  invalid,
  missing,
  saveState,
  onRetrySave,
  onChange,
  onValidity,
}: {
  data: FarmerData;
  minHileras: number;
  invalid: number;
  missing: number;
  saveState: SaveState;
  onRetrySave: () => void;
  onChange: (data: FarmerData) => void;
  onValidity: (field: string, valid: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const varietyId = useId();
  return (
    <section className="relative overflow-hidden rounded-lg border border-line bg-surface">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex min-h-14 w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors duration-150 hover:bg-canvas"
      >
        <span className="font-semibold">Datos de la semana</span>
        <span className="flex items-center gap-2">
          {invalid > 0 ? (
            <Pill tone="bad">Revisar {invalid}</Pill>
          ) : missing > 0 ? (
            <Pill tone="warn">Faltan {missing}</Pill>
          ) : (
            <Pill tone="ok">Completos</Pill>
          )}
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }} className="flex">
            <ChevronDown size={18} aria-hidden />
          </motion.span>
        </span>
      </button>
      {/* Se oculta sin desmontar: cerrar el panel no debe borrar lo que se estaba escribiendo. */}
      <div hidden={!open}>
        <div className="grid gap-4 border-t border-line p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor={varietyId} className="mb-1 block text-sm font-medium">Variedad</label>
            <input
              id={varietyId}
              className="input min-h-11 w-full"
              value={data.variety}
              onChange={(event) => onChange({ ...data, variety: event.target.value })}
            />
          </div>
          <DataField
            label="Número de hileras"
            required
            integer
            belowMinNote={minHileras > 1 ? `Ya hay vídeos en la hilera ${minHileras}. Quítalos o indica ${minHileras} o más.` : undefined}
            value={data.hileras}
            min={Math.max(1, minHileras)}
            max={200}
            onChange={(hileras) => onChange({ ...data, hileras })}
            onValidity={(ok) => onValidity("hileras", ok)}
          />
          <DataField label="Longitud de la hilera" unit="m" value={data.longitudM} min={1} max={1000} onChange={(longitudM) => onChange({ ...data, longitudM })} onValidity={(ok) => onValidity("longitudM", ok)} />
          <DataField label="Temperatura interior media" unit="°C" value={data.temperaturaC} min={-10} max={60} onChange={(temperaturaC) => onChange({ ...data, temperaturaC })} onValidity={(ok) => onValidity("temperaturaC", ok)} />
          <DataField label="Humedad interior media" unit="%" value={data.humedadPct} min={0} max={100} onChange={(humedadPct) => onChange({ ...data, humedadPct })} onValidity={(ok) => onValidity("humedadPct", ok)} />
          <div className="sm:col-span-2">
            <DataField label="Kilos recogidos la semana pasada" unit="kg" value={data.kilosSemanaPasada} min={0} max={10000000} onChange={(kilosSemanaPasada) => onChange({ ...data, kilosSemanaPasada })} onValidity={(ok) => onValidity("kilosSemanaPasada", ok)} />
            <p className="mt-1 text-xs text-muted">Pon 0 si no hubo recolección.</p>
          </div>
          <p role="status" className="text-sm sm:col-span-2">
            {saveState === "guardando" && <span className="text-muted">Guardando…</span>}
            {saveState === "guardado" && <span className="text-muted">Guardado</span>}
            {saveState === "error" && (
              <span className="text-bad-ink">
                No se ha podido guardar. Se reintentará al volver la conexión.{" "}
                <button type="button" onClick={onRetrySave} className="font-medium underline underline-offset-3">Reintentar ahora</button>
              </span>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}

export function UploadScreen({ token, link }: { token: string; link: LinkInfo }) {
  useDocumentTitle("Subir vídeos");
  const session = useUploadSession(token, link);
  const { uploads, removed, data, errors, online, summary } = session;
  const [invalidFields, setInvalidFields] = useState<Record<string, boolean>>({});
  const invalid = Object.values(invalidFields).filter(Boolean).length;
  const hilerasCount = data.hileras ?? 0;
  const hileras = Array.from({ length: hilerasCount }, (_, i) => i + 1);
  const percent = summary.total > 0 ? (summary.received / summary.total) * 100 : 0;
  // Un campo inválido se cuenta como «por revisar», no además como «falta».
  const invalidKeys = Object.keys(invalidFields).filter((key) => invalidFields[key]);
  const missing = missingData({ ...data, ...Object.fromEntries(invalidKeys.map((key) => [key, 0])) });
  const pendingData = missing + invalid;
  const next = nextPending(uploads, hilerasCount);
  const interrupted = Object.values(uploads).some((u) => u.status === "interrumpido");

  return (
    <div className="grid gap-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Vídeos de la semana</h1>
        <p className="mt-1 text-sm text-muted">
          {link.invernadero.nombre} · {CROPS[link.invernadero.cultivo]?.name ?? link.invernadero.cultivo} · {link.recoleccion.etiqueta}
        </p>
      </header>

      <Panel>
        <div className="p-5" aria-live="polite">
          <p className="text-lg font-semibold tabular-nums">
            {summary.received} de {summary.total} vídeos recibidos
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-sunken" aria-hidden>
            <motion.div className="h-full rounded-full bg-brand" animate={{ width: `${percent}%` }} transition={{ duration: 0.25 }} />
          </div>
          {summary.complete && pendingData === 0 ? (
            <p className="mt-3 flex gap-2 text-sm text-ok-ink">
              <CheckCircle2 size={17} className="mt-0.5 shrink-0" aria-hidden />
              Todo recibido. No tienes que hacer nada más esta semana.
            </p>
          ) : summary.complete ? (
            <p className="mt-3 text-sm">
              Vídeos recibidos. Queda{pendingData === 1 ? "" : "n"} {pendingData} {pendingData === 1 ? "dato" : "datos"} de la semana por completar o corregir.
            </p>
          ) : (
            <p className="mt-3 flex gap-2 text-sm text-muted">
              <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
              Graba el viernes o el sábado un vídeo por cada lado. Recorre toda la hilera a paso lento, sin volver atrás.
            </p>
          )}
          {interrupted && (
            <p className="mt-3 flex gap-2 rounded-md bg-warn-soft p-3 text-sm text-warn-ink">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
              Algún vídeo no se terminó de subir. Elige el mismo archivo y continuará por donde iba.
            </p>
          )}
        </div>
      </Panel>

      <DataPanel
        data={data}
        minHileras={highestHileraWithVideo(uploads)}
        invalid={invalid}
        missing={missing}
        saveState={session.saveState}
        onRetrySave={session.retrySave}
        onChange={session.setData}
        onValidity={(field, valid) => setInvalidFields((current) => ({ ...current, [field]: !valid }))}
      />

      {hileras.map((hilera) => (
        <Panel key={hilera} title={`Hilera ${hilera}`}>
          <ul className="divide-y divide-line">
            {(["A", "B"] as const).map((lado) => {
              const key = uploadKey(hilera, lado);
              return (
                <VideoRow
                  key={lado}
                  hilera={hilera}
                  lado={lado}
                  upload={uploads[key]}
                  removed={Boolean(removed[key])}
                  error={errors[key]}
                  online={online}
                  isNext={next === key}
                  onFile={(file) => session.choose(hilera, lado, file)}
                  onCancel={() => session.cancel(hilera, lado)}
                  onRemove={() => session.remove(hilera, lado)}
                  onUndo={() => session.undoRemove(hilera, lado)}
                  onRetry={() => session.retry(hilera, lado)}
                />
              );
            })}
          </ul>
        </Panel>
      ))}

      {(summary.active > 0 || !online) && (
        <p role="status" className="sticky bottom-3 flex items-center gap-2 rounded-md border border-line-strong bg-sunken px-4 py-3 text-sm font-medium shadow-[0_2px_8px_rgb(20_30_24/0.12)]">
          {online ? (
            "Subiendo. No cierres esta página."
          ) : (
            <>
              <WifiOff size={16} className="shrink-0" aria-hidden />
              Sin conexión: seguirá sola al volver. No cierres esta página.
            </>
          )}
        </p>
      )}
    </div>
  );
}
