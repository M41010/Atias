"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardPaste, Plus, Trash2 } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { KilosImportPanel, PasteKilos } from "@/components/KilosImport";
import { EmptyState, ErrorState, PageHeader, Panel, Skeleton } from "@/components/ui";
import { fmtDay, fmtInt } from "@/lib/format";
import { useDocumentTitle } from "@/lib/hooks";
import { harvestListQuery } from "@/lib/offlineCopy";
import {
  type ControlCount,
  type ControlWithAtias,
  type DayValues,
  fetchFamilies,
  fetchFieldData,
  type FieldData,
  type FieldGreenhouse,
  saveControls,
  saveDailyHarvest,
  saveFieldSheet,
  saveForecast,
} from "@/lib/serverApi";
import { CROPS } from "@/lib/simulated";

// ---- Lectura de números escritos a mano (admite coma decimal) ----

const INVALID = Symbol("invalid");
type Parsed = number | null | typeof INVALID;

function parseNumber(text: string, { integer = false, min = 0, max = 10_000_000 } = {}): Parsed {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(value) || value < min || value > max) return INVALID;
  if (integer && !Number.isInteger(value)) return INVALID;
  return value;
}

const toText = (value: number | null | undefined) => (value === null || value === undefined ? "" : String(value).replace(".", ","));

function useFieldSave<T>(harvestId: string, save: (value: T) => Promise<void>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: save,
    onSuccess: () => Promise.all([
      client.invalidateQueries({ queryKey: ["campo", harvestId] }),
      client.invalidateQueries({ queryKey: ["informe"] }),
    ]),
  });
}

function SaveBar({ onSave, pending, error, done, problem }: {
  onSave: () => void;
  pending: boolean;
  error: Error | null;
  done: boolean;
  problem: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-3">
      <button type="button" className="btn-primary" onClick={onSave} disabled={pending}>
        {pending ? "Guardando…" : "Guardar"}
      </button>
      <span role="status" className="text-sm">
        {problem && <span className="text-bad-ink">{problem}</span>}
        {!problem && error && <span className="text-bad-ink">No se ha guardado: {error.message}</span>}
        {!problem && !error && done && <span className="text-muted">Guardado.</span>}
      </span>
    </div>
  );
}

function Labeled({ label, hint, children }: { label: string; hint?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      {children(id)}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

// ---- Ficha: familia, ubicación, hileras, longitud y peso de muestra ----

function SheetPanel({ harvestId, g }: { harvestId: string; g: FieldGreenhouse }) {
  const families = useQuery({ queryKey: ["familias"], queryFn: fetchFamilies, staleTime: Infinity });
  const [family, setFamily] = useState(g.familia?.id ?? "");
  const [place, setPlace] = useState(g.ubicacion?.municipio ?? "");
  const [lat, setLat] = useState(toText(g.ubicacion?.latitud));
  const [lon, setLon] = useState(toText(g.ubicacion?.longitud));
  const [rows, setRows] = useState(toText(g.hileras));
  const [length, setLength] = useState(toText(g.longitudHileraM));
  const [sampleFruits, setSampleFruits] = useState(toText(g.muestra?.frutos));
  const [sampleGrams, setSampleGrams] = useState(toText(g.muestra?.gramos));
  const [problem, setProblem] = useState<string | null>(null);
  const save = useFieldSave(harvestId, (sheet: Parameters<typeof saveFieldSheet>[2]) => saveFieldSheet(harvestId, g.id, sheet));

  const submit = () => {
    const latitude = parseNumber(lat, { min: -90, max: 90 });
    const longitude = parseNumber(lon, { min: -180, max: 180 });
    const hileras = parseNumber(rows, { integer: true, min: 1, max: 200 });
    const rowLength = parseNumber(length, { min: 0.1, max: 2000 });
    const fruits = parseNumber(sampleFruits, { integer: true, min: 1 });
    const grams = parseNumber(sampleGrams, { min: 0.1 });
    if (latitude === INVALID || longitude === INVALID || (latitude === null) !== (longitude === null)) {
      return setProblem("Indica latitud y longitud con números (por ejemplo 36,745 y −3,520), o deja las dos vacías.");
    }
    if (hileras === INVALID || hileras === null) return setProblem("Indica el número de hileras, entre 1 y 200.");
    if (rowLength === INVALID) return setProblem("La longitud de la hilera debe ser un número de metros.");
    if (fruits === INVALID || grams === INVALID || (fruits === null) !== (grams === null)) {
      return setProblem("Para la muestra, indica cuántos frutos y cuánto pesaron en total, o deja las dos vacías.");
    }
    setProblem(null);
    save.mutate({
      familia: family || null,
      municipio: place.trim() || null,
      latitud: latitude,
      longitud: longitude,
      hileras,
      longitudHileraM: rowLength,
      muestra: fruits === null || grams === null ? null : { frutos: fruits, gramos: grams },
    });
  };

  const options = (families.data ?? []).filter((f) => f.cultivo === g.cultivo);
  return (
    <Panel title="Ficha del invernadero" description="Familia y ubicación valen para todas las semanas. Hileras, longitud y muestra son de esta recolección.">
      <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Labeled label="Familia">
          {(id) => (
            <select id={id} value={family} onChange={(e) => setFamily(e.target.value)} className="input">
              <option value="">Sin indicar</option>
              {options.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
            </select>
          )}
        </Labeled>
        <Labeled label="Municipio">{(id) => <input id={id} value={place} onChange={(e) => setPlace(e.target.value)} className="input" />}</Labeled>
        <Labeled label="Latitud" hint="Del punto en Google Maps">
          {(id) => <input id={id} inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} className="input tabular-nums" />}
        </Labeled>
        <Labeled label="Longitud">
          {(id) => <input id={id} inputMode="decimal" value={lon} onChange={(e) => setLon(e.target.value)} className="input tabular-nums" />}
        </Labeled>
        <Labeled label="Hileras">
          {(id) => <input id={id} inputMode="numeric" value={rows} onChange={(e) => setRows(e.target.value)} className="input tabular-nums" />}
        </Labeled>
        <Labeled label="Longitud de la hilera (m)" hint="Hace falta para situar los tramos de control">
          {(id) => <input id={id} inputMode="decimal" value={length} onChange={(e) => setLength(e.target.value)} className="input tabular-nums" />}
        </Labeled>
        <Labeled label="Muestra: frutos pesados" hint="Por ejemplo, 50 frutos maduros de plantas distintas">
          {(id) => <input id={id} inputMode="numeric" value={sampleFruits} onChange={(e) => setSampleFruits(e.target.value)} className="input tabular-nums" />}
        </Labeled>
        <Labeled label="Muestra: peso total (g)">
          {(id) => <input id={id} inputMode="decimal" value={sampleGrams} onChange={(e) => setSampleGrams(e.target.value)} className="input tabular-nums" />}
        </Labeled>
      </div>
      <SaveBar onSave={submit} pending={save.isPending} error={save.error} done={save.isSuccess} problem={problem} />
    </Panel>
  );
}

// ---- Previsiones humanas y cosecha real, día a día ----

const SERIES = [
  { key: "agricultor", label: "Previsión del agricultor" },
  { key: "tecnico", label: "Previsión del técnico" },
  { key: "real", label: "Recogido de verdad" },
] as const;
type SeriesKey = (typeof SERIES)[number]["key"];

function DaysPanel({ harvestId, days, g }: { harvestId: string; days: string[]; g: FieldGreenhouse }) {
  const initial: Record<SeriesKey, string[]> = {
    agricultor: g.previsiones.agricultor.map(toText),
    tecnico: g.previsiones.tecnico.map(toText),
    real: g.real.map(toText),
  };
  const [values, setValues] = useState(initial);
  const [problem, setProblem] = useState<string | null>(null);
  const [paste, setPaste] = useState<{ text: string; series: SeriesKey; day: number } | null>(null);
  const [pasted, setPasted] = useState<number | null>(null);
  // Lo que llegó del ERP no se cambia a mano: la API no lo pisa, y la tabla no deja escribirlo.
  const erpDays = days.map((_, i) => g.realOrigen?.[i] === "erp");
  const save = useFieldSave(harvestId, async (all: Record<SeriesKey, DayValues>) => {
    await saveForecast(harvestId, g.id, "agricultor", all.agricultor);
    await saveForecast(harvestId, g.id, "tecnico", all.tecnico);
    await saveDailyHarvest(harvestId, g.id, all.real);
  });

  const submit = () => {
    const parsed = {} as Record<SeriesKey, DayValues>;
    for (const { key, label } of SERIES) {
      const series = values[key].map((text) => parseNumber(text));
      if (series.includes(INVALID)) return setProblem(`${label}: indica kilos con números, sin negativos.`);
      parsed[key] = series as DayValues;
    }
    setProblem(null);
    setPasted(null);
    save.mutate(parsed);
  };

  const total = (key: SeriesKey) => {
    const numbers = values[key].map((t) => parseNumber(t));
    return numbers.every((n) => typeof n === "number") ? fmtInt(Math.round((numbers as number[]).reduce((a, b) => a + b, 0))) : "—";
  };

  return (
    <Panel
      title="Previsiones y cosecha por día"
      description="Kilos de lunes a viernes. La previsión del agricultor tiene que darse sin conocer la de Atias. Deja vacío lo que no se sepa."
      actions={
        <button type="button" className="btn-secondary" onClick={() => setPaste({ text: "", series: "agricultor", day: 0 })} disabled={paste !== null}>
          <ClipboardPaste size={16} aria-hidden /> Pegar desde Excel
        </button>
      }
    >
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Kilos</th>
              {days.map((d) => <th key={d} scope="col" className="num whitespace-nowrap">{fmtDay(d)}</th>)}
              <th scope="col" className="num">Semana</th>
            </tr>
          </thead>
          <tbody>
            {SERIES.map(({ key, label }) => (
              <tr key={key}>
                <th scope="row" className="whitespace-nowrap">{label}</th>
                {days.map((d, i) => {
                  const fromErp = key === "real" && erpDays[i];
                  return (
                    <td key={d} className="num">
                      <input
                        aria-label={`${label}, ${fmtDay(d)}, en kilos${fromErp ? ", llegó del ERP" : ""}`}
                        inputMode="decimal"
                        value={values[key][i]}
                        readOnly={fromErp}
                        title={fromErp ? "Llegó del ERP: no se cambia a mano" : undefined}
                        onChange={(e) => setValues((v) => ({ ...v, [key]: v[key].map((t, j) => (j === i ? e.target.value : t)) }))}
                        onPaste={(e) => {
                          // Un bloque de varias celdas (con tabuladores o saltos de línea) se revisa antes de ponerlo.
                          const text = e.clipboardData.getData("text/plain");
                          if (!/[\t\n]/.test(text.replace(/\r?\n$/, ""))) return;
                          e.preventDefault();
                          setPaste({ text, series: key, day: i });
                        }}
                        className={`input w-24 text-right tabular-nums ${fromErp ? "bg-sunken text-muted" : ""}`}
                      />
                      {fromErp && <span className="mt-0.5 block text-xs text-muted">ERP</span>}
                    </td>
                  );
                })}
                <td className="num font-semibold">{total(key)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {paste && (
        <PasteKilos
          // Cada pegado nuevo empieza con su texto.
          key={`${paste.series}-${paste.day}-${paste.text}`}
          days={days}
          values={values}
          erpDays={erpDays}
          initialText={paste.text}
          initialStart={{ series: paste.series, day: paste.day }}
          onApply={(next, changed) => {
            setValues(next);
            setPaste(null);
            setPasted(changed);
          }}
          onClose={() => setPaste(null)}
        />
      )}
      {pasted !== null && (
        <p role="status" className="border-t border-line px-5 py-2 text-sm text-warn-ink">
          {pasted === 1 ? "1 valor puesto" : `${pasted} valores puestos`} en la tabla. Aún no está guardado: revísalo y pulsa Guardar.
        </p>
      )}
      <SaveBar onSave={submit} pending={save.isPending} error={save.error} done={save.isSuccess} problem={problem} />
    </Panel>
  );
}

// ---- Tramos de control contados a mano ----

type ControlText = Record<"etiqueta" | "hilera" | "lado" | "inicioM" | "finM" | "visibles" | "total" | "recogidos" | "pesoG" | "nota", string>;

const emptyControl = (n: number): ControlText => ({
  etiqueta: `T${n}`, hilera: "", lado: "A", inicioM: "", finM: "", visibles: "", total: "", recogidos: "", pesoG: "", nota: "",
});

const controlText = (c: ControlWithAtias): ControlText => ({
  etiqueta: c.etiqueta,
  hilera: toText(c.hilera),
  lado: c.lado,
  inicioM: toText(c.inicioM),
  finM: toText(c.finM),
  visibles: toText(c.visibles),
  total: toText(c.total),
  recogidos: toText(c.recogidos),
  pesoG: toText(c.pesoG),
  nota: c.nota,
});

const MOTIVES: Record<string, string> = {
  sin_video: "Aún no hay vídeo de esa hilera y lado.",
  sin_contar: "El vídeo aún no está contado.",
  sin_longitud: "Falta la longitud de la hilera en la ficha.",
  sin_posiciones: "Contado antes de guardar posiciones: hay que volver a contarlo.",
  fuera_de_hilera: "El tramo acaba más allá del final de la hilera: revisa los metros.",
};

function parseControl(c: ControlText): ControlCount | string {
  const name = c.etiqueta.trim() || "Tramo";
  const hilera = parseNumber(c.hilera, { integer: true, min: 1, max: 200 });
  const from = parseNumber(c.inicioM, { max: 2000 });
  const to = parseNumber(c.finM, { max: 2000 });
  const visible = parseNumber(c.visibles, { integer: true });
  const total = parseNumber(c.total, { integer: true });
  const picked = parseNumber(c.recogidos, { integer: true });
  const grams = parseNumber(c.pesoG);
  if (hilera === null || hilera === INVALID) return `${name}: indica la hilera.`;
  if (from === null || from === INVALID || to === null || to === INVALID || to <= from) {
    return `${name}: indica dónde empieza y acaba la cinta, en metros desde la cabecera.`;
  }
  if (visible === null || visible === INVALID) return `${name}: indica los maduros visibles.`;
  if (total === INVALID || picked === INVALID || grams === INVALID) return `${name}: revisa los números.`;
  if (total !== null && total < visible) return `${name}: el total no puede ser menor que los visibles.`;
  return {
    etiqueta: name, hilera, lado: c.lado === "B" ? "B" : "A", inicioM: from, finM: to, visibles: visible,
    total, recogidos: picked, pesoG: grams, nota: c.nota.trim(),
  };
}

function ControlsPanel({ harvestId, g }: { harvestId: string; g: FieldGreenhouse }) {
  const [rows, setRows] = useState<ControlText[]>(
    g.controles.length > 0 ? g.controles.map(controlText) : [1, 2, 3, 4].map(emptyControl),
  );
  const [problem, setProblem] = useState<string | null>(null);
  const save = useFieldSave(harvestId, (controls: ControlCount[]) => saveControls(harvestId, g.id, controls));
  const set = (i: number, key: keyof ControlText, value: string) =>
    setRows((list) => list.map((row, j) => (j === i ? { ...row, [key]: value } : row)));

  const submit = () => {
    // Las filas sin hilera ni visibles se ignoran: son las vacías de la plantilla.
    const filled = rows.filter((r) => r.hilera.trim() || r.visibles.trim() || r.inicioM.trim());
    const parsed = filled.map(parseControl);
    const error = parsed.find((p): p is string => typeof p === "string");
    if (error) return setProblem(error);
    setProblem(null);
    save.mutate(parsed as ControlCount[]);
  };

  const columns: { key: keyof ControlText; label: string; width: string; numeric?: boolean }[] = [
    { key: "etiqueta", label: "Tramo", width: "w-16" },
    { key: "hilera", label: "Hilera", width: "w-16", numeric: true },
    { key: "inicioM", label: "Desde (m)", width: "w-20", numeric: true },
    { key: "finM", label: "Hasta (m)", width: "w-20", numeric: true },
    { key: "visibles", label: "Maduros visibles", width: "w-20", numeric: true },
    { key: "total", label: "Maduros en total", width: "w-20", numeric: true },
    { key: "recogidos", label: "Recogidos", width: "w-20", numeric: true },
    { key: "pesoG", label: "Peso (g)", width: "w-20", numeric: true },
  ];

  return (
    <Panel
      title="Tramos de control"
      description="Lo contado a mano justo después de grabar, por el mismo lado. «Desde» y «Hasta» son los metros desde la cabecera hasta cada cinta."
      actions={
        <button type="button" className="btn-secondary" onClick={() => setRows((list) => [...list, emptyControl(list.length + 1)])} disabled={rows.length >= 20}>
          <Plus size={16} aria-hidden /> Añadir tramo
        </button>
      }
    >
      <div className="overflow-x-auto">
        <table className="data-table compact">
          <thead>
            <tr>
              {columns.slice(0, 2).map((c) => <th key={c.key} scope="col">{c.label}</th>)}
              <th scope="col">Lado</th>
              {columns.slice(2).map((c) => <th key={c.key} scope="col" className="num">{c.label}</th>)}
              <th scope="col" className="num">Atias contó</th>
              <th scope="col">Nota</th>
              <th scope="col"><span className="sr-only">Quitar</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const saved = g.controles.find((c) => c.etiqueta === row.etiqueta.trim());
              const cell = (c: (typeof columns)[number]) => (
                <td key={c.key} className={c.numeric && c.key !== "hilera" ? "num" : undefined}>
                  <input
                    aria-label={`${c.label}, fila ${i + 1}`}
                    inputMode={c.numeric ? "decimal" : undefined}
                    value={row[c.key]}
                    onChange={(e) => set(i, c.key, e.target.value)}
                    className={`input ${c.width} ${c.numeric ? "text-right tabular-nums" : ""}`}
                  />
                </td>
              );
              return (
                <tr key={i}>
                  {columns.slice(0, 2).map(cell)}
                  <td>
                    <select aria-label={`Lado, fila ${i + 1}`} value={row.lado} onChange={(e) => set(i, "lado", e.target.value)} className="input w-16">
                      <option value="A">A</option>
                      <option value="B">B</option>
                    </select>
                  </td>
                  {columns.slice(2).map(cell)}
                  <td className="num">
                    {saved?.atias.frutos !== undefined && saved.atias.frutos !== null
                      ? <span className="font-semibold">{fmtInt(saved.atias.frutos)}</span>
                      : <span className="block max-w-48 text-left text-xs text-muted">{saved?.atias.motivo ? MOTIVES[saved.atias.motivo] : "—"}</span>}
                  </td>
                  <td>
                    <input aria-label={`Nota, fila ${i + 1}`} value={row.nota} onChange={(e) => set(i, "nota", e.target.value)} className="input w-40" />
                  </td>
                  <td>
                    <button
                      type="button"
                      aria-label={`Quitar ${row.etiqueta || `fila ${i + 1}`}`}
                      onClick={() => setRows((list) => list.filter((_, j) => j !== i))}
                      className="flex min-h-10 min-w-10 items-center justify-center rounded-md text-muted hover:bg-sunken hover:text-ink"
                    >
                      <Trash2 size={16} aria-hidden />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <SaveBar onSave={submit} pending={save.isPending} error={save.error} done={save.isSuccess} problem={problem} />
    </Panel>
  );
}

// ---- Página ----

function GreenhouseForms({ field, g }: { field: FieldData; g: FieldGreenhouse }) {
  // La clave fuerza a rellenar de nuevo los formularios al cambiar de semana o invernadero.
  const key = `${field.id}-${g.id}`;
  return (
    <div className="grid gap-5">
      <SheetPanel key={`ficha-${key}`} harvestId={field.id} g={g} />
      {/* Si los kilos guardados cambian (por ejemplo, al importar un Excel), la tabla se rellena de nuevo
          para que Guardar no devuelva los valores de antes. */}
      <DaysPanel key={`dias-${key}-${JSON.stringify([g.previsiones, g.real, g.realOrigen])}`} harvestId={field.id} days={field.dias} g={g} />
      <ControlsPanel key={`ctl-${key}`} harvestId={field.id} g={g} />
    </div>
  );
}

export default function CampoPage() {
  useDocumentTitle("Datos de campo");
  const harvests = useQuery(harvestListQuery());
  const [selected, setSelected] = useState<string | null>(null);
  const [greenhouse, setGreenhouse] = useState<string | null>(null);
  const harvestId = selected ?? harvests.data?.[0]?.id ?? null;
  const field = useQuery({
    queryKey: ["campo", harvestId],
    queryFn: () => fetchFieldData(harvestId as string),
    enabled: harvestId !== null,
  });
  const current = field.data?.invernaderos.find((g) => g.id === greenhouse) ?? field.data?.invernaderos[0];

  const header = (
    <PageHeader
      title="Datos de campo"
      description="Lo que se apunta en la hoja de campo. Con ello se mide cuánto acierta Atias, en Precisión."
      actions={harvests.data && harvests.data.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-sm text-muted">
            <span className="sr-only md:not-sr-only">Recolección</span>
            <select value={harvestId ?? ""} onChange={(e) => setSelected(e.target.value)} className="min-h-10 rounded-md border border-control bg-surface px-3 text-sm font-medium text-ink">
              {harvests.data.map((h) => <option key={h.id} value={h.id}>{h.etiqueta.replace("Recolección ", "")}</option>)}
            </select>
          </label>
          {field.data && field.data.invernaderos.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-muted">
              <span className="sr-only md:not-sr-only">Invernadero</span>
              <select value={current?.id ?? ""} onChange={(e) => setGreenhouse(e.target.value)} className="min-h-10 rounded-md border border-control bg-surface px-3 text-sm font-medium text-ink">
                {field.data.invernaderos.map((g) => <option key={g.id} value={g.id}>{g.nombre} · {CROPS[g.cultivo]?.name ?? g.cultivo}</option>)}
              </select>
            </label>
          )}
        </div>
      ) : undefined}
    />
  );

  if (harvests.isError && !harvests.data) return <>{header}<ErrorState message={harvests.error.message} onRetry={harvests.refetch} /></>;
  if (harvests.data?.length === 0) {
    return <>{header}<EmptyState title="Todavía no hay recolecciones">Aparecerán aquí cuando crees el primer enlace para un agricultor.</EmptyState></>;
  }
  if (field.isError) return <>{header}<ErrorState message={field.error.message} onRetry={field.refetch} /></>;
  if (!field.data) return <>{header}<Skeleton /></>;
  if (!current) return <>{header}<EmptyState title="No hay invernaderos">Da de alta uno en Invernaderos.</EmptyState></>;

  return (
    <>
      {header}
      <div className="grid gap-5">
        <KilosImportPanel key={`importar-${field.data.id}`} field={field.data} />
        <GreenhouseForms field={field.data} g={current} />
      </div>
    </>
  );
}
