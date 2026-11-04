"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Plus } from "lucide-react";
import { type FormEvent, useState } from "react";
import { EmptyState, ErrorState, PageHeader, Panel, Pill, Skeleton } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { useDocumentTitle } from "@/lib/hooks";
import {
  ApiError,
  createGreenhouse,
  createLink,
  fetchLinks,
  fetchUpcomingHarvests,
  type LinkRow,
  revokeLink,
} from "@/lib/serverApi";
import { CROPS, type CropId } from "@/lib/simulated";

const errorText = (error: unknown) =>
  error instanceof ApiError ? error.message : "No se ha podido conectar. Comprueba la conexión.";

/** Enlace recién creado. Es la única vez que se puede ver. */
function NewLink({ greenhouse, url, onClose }: { greenhouse: string; url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  return (
    <div role="status" className="rounded-lg border border-line-strong bg-surface p-5">
      <p className="font-semibold">Enlace para {greenhouse}</p>
      <p className="mt-1 text-sm text-muted">
        Cópialo y envíalo al agricultor ahora: por seguridad, no se podrá volver a ver.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          readOnly
          aria-label={`Enlace para ${greenhouse}`}
          value={url}
          onFocus={(event) => event.target.select()}
          className="input min-h-10 min-w-0 flex-1 basis-64 text-sm"
        />
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            navigator.clipboard?.writeText(url)
              .then(() => {
                setCopied(true);
                setCopyFailed(false);
              })
              .catch(() => setCopyFailed(true));
            // Sin HTTPS el navegador no ofrece el portapapeles.
            if (!navigator.clipboard) setCopyFailed(true);
          }}
        >
          {copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
          {copied ? "Copiado" : "Copiar"}
        </button>
        <button type="button" className="btn-secondary" onClick={onClose}>Cerrar</button>
      </div>
      {copyFailed && <p className="mt-2 text-sm text-warn-ink">No se ha podido copiar solo: selecciona el enlace y cópialo a mano.</p>}
    </div>
  );
}

function LinkActions({ row, busy, onCreate, onRevoke }: { row: LinkRow; busy: boolean; onCreate: () => void; onRevoke: () => void }) {
  const [confirming, setConfirming] = useState<"nuevo" | "revocar" | null>(null);
  if (!row.enlace) {
    return <button type="button" disabled={busy} className="btn-primary whitespace-nowrap disabled:opacity-55" onClick={onCreate}>Crear enlace</button>;
  }
  if (confirming) {
    return (
      <span className="flex flex-wrap items-center justify-end gap-2">
        <span className="text-sm">{confirming === "nuevo" ? "El actual dejará de funcionar." : "Dejará de funcionar."}</span>
        <button
          type="button"
          disabled={busy}
          className="btn-primary disabled:opacity-55"
          onClick={() => {
            setConfirming(null);
            if (confirming === "nuevo") onCreate();
            else onRevoke();
          }}
        >
          Confirmar
        </button>
        <button type="button" className="btn-secondary" onClick={() => setConfirming(null)}>Cancelar</button>
      </span>
    );
  }
  return (
    <span className="flex flex-wrap justify-end gap-2">
      <button type="button" className="btn-secondary whitespace-nowrap" onClick={() => setConfirming("nuevo")}>Crear otro</button>
      <button type="button" className="btn-secondary" onClick={() => setConfirming("revocar")}>Revocar</button>
    </span>
  );
}

function AddGreenhouse({ onAdded }: { onAdded: () => void }) {
  const [nombre, setNombre] = useState("");
  const [cultivo, setCultivo] = useState<CropId>("tomate_cherry");
  const [hileras, setHileras] = useState("4");
  const parsed = Number(hileras);
  const validRows = Number.isInteger(parsed) && parsed >= 1 && parsed <= 200;
  const add = useMutation({
    mutationFn: () => createGreenhouse(nombre.trim(), cultivo, parsed),
    onSuccess: () => {
      setNombre("");
      onAdded();
    },
  });
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (validRows && nombre.trim() && !add.isPending) add.mutate();
  };
  return (
    <Panel title="Añadir invernadero" description="Las hileras son una primera estimación: el agricultor puede corregirlas.">
      <form onSubmit={onSubmit} className="grid items-end gap-4 p-5 sm:grid-cols-[1fr_12rem_7rem_auto]">
        <div>
          <label htmlFor="inv-nombre" className="mb-1 block text-sm font-medium">Nombre</label>
          <input id="inv-nombre" required maxLength={100} value={nombre} onChange={(e) => { setNombre(e.target.value); add.reset(); }} className="input min-h-10 w-full" />
        </div>
        <div>
          <label htmlFor="inv-cultivo" className="mb-1 block text-sm font-medium">Cultivo</label>
          <select id="inv-cultivo" value={cultivo} onChange={(e) => setCultivo(e.target.value as CropId)} className="input min-h-10 w-full">
            {(Object.keys(CROPS) as CropId[]).map((id) => <option key={id} value={id}>{CROPS[id].name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="inv-hileras" className="mb-1 block text-sm font-medium">Hileras</label>
          <input
            id="inv-hileras"
            inputMode="numeric"
            value={hileras}
            aria-invalid={!validRows}
            onChange={(e) => setHileras(e.target.value)}
            className={`input min-h-10 w-full text-right tabular-nums ${validRows ? "" : "border-bad-ink!"}`}
          />
        </div>
        <button type="submit" disabled={add.isPending || !validRows || !nombre.trim()} className="btn-secondary disabled:cursor-not-allowed disabled:opacity-55">
          <Plus size={15} aria-hidden />
          Añadir
        </button>
        {!validRows && <p className="text-xs text-bad-ink sm:col-span-4">Las hileras deben ser un número entero entre 1 y 200.</p>}
        {add.error && <p role="alert" className="text-sm text-bad-ink sm:col-span-4">{errorText(add.error)}</p>}
      </form>
    </Panel>
  );
}

export default function EnlacesPage() {
  useDocumentTitle("Enlaces");
  const client = useQueryClient();
  const upcoming = useQuery({ queryKey: ["proximas-recolecciones"], queryFn: fetchUpcomingHarvests });
  const [selected, setSelected] = useState<string | null>(null);
  const inicio = selected ?? upcoming.data?.[0]?.inicio ?? null;
  const links = useQuery({
    queryKey: ["enlaces", inicio],
    queryFn: () => fetchLinks(inicio as string),
    enabled: inicio !== null,
  });
  const [fresh, setFresh] = useState<{ greenhouse: string; url: string } | null>(null);
  const refresh = () => client.invalidateQueries({ queryKey: ["enlaces"] });

  const create = useMutation({
    mutationFn: (row: LinkRow) => createLink(row.id, inicio as string),
    onSuccess: ({ token }, row) => {
      setFresh({ greenhouse: row.nombre, url: `${window.location.origin}/subir/${token}` });
      // Otra pantalla de la cooperativa lista estas recolecciones.
      void client.invalidateQueries({ queryKey: ["recolecciones-reales"] });
      void refresh();
    },
  });
  const revoke = useMutation({
    mutationFn: (id: string) => revokeLink(id),
    onSuccess: () => void refresh(),
  });
  const busy = create.isPending || revoke.isPending;
  const actionError = create.error ?? revoke.error;

  const header = (
    <PageHeader
      title="Enlaces de los agricultores"
      description="Un enlace por invernadero y recolección. Caduca al empezar la recolección, a las 00:00 del lunes."
      actions={upcoming.data ? (
        <label className="flex items-center gap-2 text-sm text-muted">
          <span className="sr-only md:not-sr-only">Recolección</span>
          <select
            value={inicio ?? ""}
            onChange={(event) => {
              setSelected(event.target.value);
              setFresh(null);
            }}
            className="min-h-10 rounded-md border border-control bg-surface px-3 text-sm font-medium text-ink"
          >
            {upcoming.data.map((h) => <option key={h.inicio} value={h.inicio}>{h.etiqueta.replace("Recolección ", "")}</option>)}
          </select>
        </label>
      ) : undefined}
    />
  );

  if (upcoming.isError) return <>{header}<ErrorState message={upcoming.error.message} onRetry={upcoming.refetch} /></>;
  if (links.isError) return <>{header}<ErrorState message={links.error.message} onRetry={links.refetch} /></>;
  if (!links.data) return <>{header}<Skeleton /></>;

  const rows = links.data.invernaderos;
  return (
    <>
      {header}
      <div className="grid gap-5">
        {fresh && <NewLink greenhouse={fresh.greenhouse} url={fresh.url} onClose={() => setFresh(null)} />}
        {actionError && <p role="alert" className="text-sm text-bad-ink">{errorText(actionError)}</p>}
        {rows.length === 0 ? (
          <EmptyState title="Todavía no hay invernaderos">Añade el primero aquí abajo para poder crear su enlace.</EmptyState>
        ) : (
          <Panel title={links.data.recoleccion.etiqueta}>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Invernadero</th>
                    <th scope="col">Enlace</th>
                    <th scope="col" className="hidden md:table-cell">Creado</th>
                    <th scope="col" className="num"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <th scope="row" className="whitespace-nowrap">
                        {row.nombre}
                        <span className="block text-xs font-normal text-muted">{CROPS[row.cultivo]?.name ?? row.cultivo}</span>
                      </th>
                      <td>
                        {row.enlace ? <Pill tone="ok">Activo</Pill> : <Pill tone="neutral">Sin enlace</Pill>}
                        {row.enlace && (
                          <span className="block pt-0.5 text-xs text-muted">
                            {row.enlace.caducaEn ? `Hasta ${fmtDate(row.enlace.caducaEn)}` : "De prueba, sin caducidad"}
                          </span>
                        )}
                      </td>
                      <td className="hidden whitespace-nowrap text-muted md:table-cell">
                        {row.enlace ? fmtDate(row.enlace.creadoEn) : "—"}
                      </td>
                      <td className="text-right">
                        <LinkActions
                          row={row}
                          busy={busy}
                          onCreate={() => create.mutate(row)}
                          onRevoke={() => row.enlace && revoke.mutate(row.enlace.id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
        <AddGreenhouse onAdded={() => void refresh()} />
      </div>
    </>
  );
}
