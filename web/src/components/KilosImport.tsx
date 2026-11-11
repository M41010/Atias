"use client";

import { useQueryClient } from "@tanstack/react-query";
import { FileUp } from "lucide-react";
import { useId, useState } from "react";
import { ExcelButton } from "@/components/ExcelButton";
import { Panel, Pill } from "@/components/ui";
import { fmtDay } from "@/lib/format";
import {
  buildWrites,
  countStatuses,
  type Entry,
  fmtKgText,
  GRID_ORDER,
  parseKg,
  parsePaste,
  planImport,
  planPaste,
  planSignature,
  type PlanRow,
  readTable,
  type Series,
  SERIES_NAMES,
  type Status,
  templateSheets,
  verifyWrites,
  type Write,
} from "@/lib/kilosImport";
import { fetchFieldData, type FieldData, saveDailyHarvest, saveForecast } from "@/lib/serverApi";
import { readSpreadsheet } from "@/lib/xlsxRead";

const STATUS: Record<Status, { label: string; tone: "ok" | "warn" | "bad" | "neutral" | "brand" }> = {
  nuevo: { label: "Nuevo", tone: "ok" },
  cambia: { label: "Cambiaría", tone: "warn" },
  igual: { label: "Igual", tone: "neutral" },
  erp: { label: "Del ERP", tone: "neutral" },
  error: { label: "Error", tone: "bad" },
};

// ---- Pegar en la tabla de un invernadero ----

const toText = (value: number | null) => (value === null ? "" : String(value).replace(".", ","));

/**
 * Pegar un bloque copiado de Excel en la tabla diaria. No guarda: enseña qué cambiaría, lo pone en
 * la tabla y luego se pulsa Guardar como siempre.
 */
export function PasteKilos({ days, values, erpDays, initialText, initialStart, onApply, onClose }: {
  days: string[];
  values: Record<Series, string[]>;
  erpDays: boolean[];
  initialText: string;
  initialStart: { series: Series; day: number };
  onApply: (next: Record<Series, string[]>, changed: number) => void;
  onClose: () => void;
}) {
  const id = useId();
  const [text, setText] = useState(initialText);
  const [start, setStart] = useState<Series>(initialStart.series);
  const [startDay] = useState(initialStart.day);
  const current = Object.fromEntries(
    GRID_ORDER.map((s) => [s, values[s].map((t) => {
      const kg = parseKg(t);
      return kg.ok ? kg.value : null;
    })]),
  ) as Record<Series, (number | null)[]>;

  const read = text.trim() === "" ? null : parsePaste(text, startDay);
  const plan = read?.ok ? planPaste(read.rows, start, current, erpDays) : null;
  const problem = read && !read.ok ? read.error : plan && !plan.ok ? plan.error : null;
  const cells = plan?.ok ? plan.cells : [];
  const errors = cells.filter((c) => c.status === "error").length;
  const changes = cells.filter((c) => c.status === "nuevo" || c.status === "cambia");
  const overwrites = changes.filter((c) => c.status === "cambia").length;
  const erp = cells.filter((c) => c.status === "erp").length;

  const apply = () => {
    const next = Object.fromEntries(GRID_ORDER.map((s) => [s, [...values[s]]])) as Record<Series, string[]>;
    for (const c of changes) next[c.series][c.index] = toText(c.after);
    onApply(next, changes.length);
  };

  return (
    <div className="grid gap-3 border-t border-line bg-sunken/40 px-5 py-4">
      <div className="grid gap-1">
        <label htmlFor={id} className="text-sm font-medium">Pega aquí lo copiado de Excel</label>
        <textarea
          id={id}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder={"Por ejemplo, las celdas de lunes a viernes de una fila, o de las tres"}
          className="input min-h-20 w-full max-w-2xl font-mono text-sm"
        />
        <span className="text-xs text-muted">
          Hasta 3 filas de lunes a viernes. Vale la coma decimal y el punto de miles. Una celda vacía deja lo que hubiera.
        </span>
      </div>
      <label className="flex flex-wrap items-center gap-2 text-sm">
        <span>Empieza en la fila</span>
        <select value={start} onChange={(e) => setStart(e.target.value as Series)} className="input w-auto">
          {GRID_ORDER.map((s) => <option key={s} value={s}>{SERIES_NAMES[s]}</option>)}
        </select>
        <span className="text-xs text-muted">Si lo copiado trae el nombre de la fila, manda ese nombre.</span>
      </label>

      {problem && <p role="alert" className="text-sm text-bad-ink">{problem}</p>}

      {plan?.ok && (
        <div className="overflow-x-auto">
          <table className="data-table compact">
            <caption className="sr-only">Lo que cambiaría en la tabla</caption>
            <thead>
              <tr>
                <th scope="col">Fila</th>
                {days.map((d) => <th key={d} scope="col" className="num whitespace-nowrap">{fmtDay(d)}</th>)}
              </tr>
            </thead>
            <tbody>
              {plan.targets.map((series) => (
                <tr key={series}>
                  <th scope="row" className="whitespace-nowrap">{SERIES_NAMES[series]}</th>
                  {days.map((d, index) => {
                    const c = cells.find((x) => x.series === series && x.index === index);
                    if (!c || c.status === "vacio" || c.status === "igual") {
                      return <td key={d} className="num text-muted">{fmtKgText(c?.before ?? null)}</td>;
                    }
                    if (c.status === "error") return <td key={d} className="num text-bad-ink">Error: {c.reason}</td>;
                    if (c.status === "erp") return <td key={d} className="num text-muted">{fmtKgText(c.before)} (ERP, no cambia)</td>;
                    return (
                      <td key={d} className="num font-semibold">
                        {c.status === "cambia" && <span className="font-normal text-warn-ink line-through">{fmtKgText(c.before)}</span>}{" "}
                        {fmtKgText(c.after)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {plan?.ok && (
        <p className="text-sm">
          {errors > 0
            ? <span className="text-bad-ink">Hay {errors} {errors === 1 ? "celda que no es un número válido" : "celdas que no son números válidos"} (sin negativos). Corrígelas y vuelve a pegar.</span>
            : changes.length === 0
              ? <span className="text-muted">No cambia nada.</span>
              : <span>{changes.length} {changes.length === 1 ? "valor" : "valores"}{overwrites > 0 && <>, de ellos <strong className="text-warn-ink">{overwrites} {overwrites === 1 ? "sustituye" : "sustituyen"} a lo que había</strong></>}.</span>}
          {erp > 0 && <span className="text-muted"> {erp} del recogido {erp === 1 ? "llegó" : "llegaron"} del ERP y no se {erp === 1 ? "cambia" : "cambian"}.</span>}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn-primary" onClick={apply} disabled={!plan?.ok || errors > 0 || changes.length === 0}>
          Poner en la tabla
        </button>
        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
}

// ---- Importar un Excel o CSV con varios invernaderos ----

type Preview = { fileName: string; format: "filas" | "columnas"; ignored: string[]; entries: Entry[]; rows: PlanRow[]; stale: boolean };
type Report = { saved: number; greenhouses: number; problems: string[]; skipped: string[] };

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function PreviewTable({ rows, days, showAll }: { rows: PlanRow[]; days: string[]; showAll: boolean }) {
  const visible = showAll ? rows : rows.filter((r) => r.status !== "igual");
  return (
    <div className="max-h-[28rem] overflow-auto border-y border-line">
      <table className="data-table compact">
        <caption className="sr-only">Vista previa de la importación</caption>
        <thead>
          <tr>
            <th scope="col" className="num">Fila</th>
            <th scope="col">Invernadero</th>
            <th scope="col">Día</th>
            <th scope="col">Dato</th>
            <th scope="col" className="num">Había</th>
            <th scope="col" className="num">Fichero</th>
            <th scope="col">Qué pasará</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((r, i) => (
            <tr key={`${r.lines.join("-")}-${r.series}-${i}`}>
              <td className="num text-muted">{r.lines.join(", ")}</td>
              <td className="whitespace-nowrap">
                {r.greenhouse ? r.greenhouse.nombre : <span className="text-bad-ink">{r.greenhouseText || "—"}</span>}
                {r.greenhouse && r.greenhouseText && r.greenhouseText !== r.greenhouse.nombre && <span className="block text-xs text-muted">«{r.greenhouseText}»</span>}
              </td>
              <td className="whitespace-nowrap">{r.dayIndex !== null ? fmtDay(days[r.dayIndex]) : r.dayText || "—"}</td>
              <td className="whitespace-nowrap">{r.series ? SERIES_NAMES[r.series] : "—"}</td>
              <td className="num text-muted">{r.series ? fmtKgText(r.before) : ""}</td>
              <td className="num font-semibold">{r.kg !== null ? fmtKgText(r.kg) : ""}</td>
              <td>
                <span className="flex flex-wrap items-center gap-2">
                  <Pill tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Pill>
                  <span className="text-xs text-muted">{r.message}</span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function KilosImportPanel({ field }: { field: FieldData }) {
  const client = useQueryClient();
  const inputId = useId();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState<"leyendo" | "guardando" | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [report, setReport] = useState<Report | null>(null);

  const fresh = () => client.fetchQuery({ queryKey: ["campo", field.id], queryFn: () => fetchFieldData(field.id), staleTime: 0 });

  const onFile = async (file: File) => {
    setBusy("leyendo");
    setProblem(null);
    setReport(null);
    setPreview(null);
    setOverwrite(false);
    try {
      const cells = await readSpreadsheet(file);
      const table = readTable(cells, field.dias);
      if (!table.ok) return setProblem(table.error);
      const current = await fresh();
      const rows = planImport(table.entries, current);
      if (rows.length === 0) return setProblem("El fichero no trae ningún kilo: todas las celdas de kilos están vacías.");
      setPreview({ fileName: file.name, format: table.format, ignored: table.ignored, entries: table.entries, rows, stale: false });
    } catch (error) {
      setProblem(`No se ha podido leer «${file.name}»: ${error instanceof Error ? error.message : "formato desconocido"}.`);
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    if (!preview) return;
    setBusy("guardando");
    setProblem(null);
    try {
      // Se compara otra vez con lo guardado ahora mismo: si algo cambió mientras se revisaba, se enseña de nuevo.
      const before = await fresh();
      const rows = planImport(preview.entries, before);
      if (planSignature(rows) !== planSignature(preview.rows)) {
        setPreview({ ...preview, rows, stale: true });
        setOverwrite(false);
        return;
      }
      const writes = buildWrites(rows, before, overwrite);
      const failed: { write: Write; message: string }[] = [];
      for (const write of writes) {
        try {
          if (write.series === "real") await saveDailyHarvest(field.id, write.greenhouseId, write.days);
          else await saveForecast(field.id, write.greenhouseId, write.series, write.days);
        } catch (error) {
          failed.push({ write, message: error instanceof Error ? error.message : "error desconocido" });
        }
      }
      await client.invalidateQueries({ queryKey: ["informe"] });
      const after = await fresh();
      const check = verifyWrites(writes, after);
      const counts = countStatuses(rows);
      const skipped = [
        !overwrite && counts.cambia > 0 ? `${plural(counts.cambia, "valor que ya tenía otro dato", "valores que ya tenían otro dato")} (no marcaste cambiarlos)` : null,
        counts.erp > 0 ? `${plural(counts.erp, "día de recogido que llegó del ERP", "días de recogido que llegaron del ERP")}` : null,
        counts.error > 0 ? `${plural(counts.error, "fila con error", "filas con error")}` : null,
        counts.igual > 0 ? `${plural(counts.igual, "valor que ya estaba igual", "valores que ya estaban iguales")}` : null,
      ].filter((s): s is string => s !== null);
      setReport({
        saved: check.saved,
        greenhouses: new Set(writes.filter((w) => w.cells.length > 0).map((w) => w.greenhouseId)).size,
        problems: [
          ...failed.map((f) => `${f.write.nombre}, ${SERIES_NAMES[f.write.series].toLowerCase()}: ${f.message}`),
          ...check.missing
            .filter((m) => !failed.some((f) => f.write.nombre === m.nombre && f.write.series === m.series))
            .map((m) => `${m.nombre}, ${SERIES_NAMES[m.series].toLowerCase()}, ${fmtDay(field.dias[m.index])}: se envió ${fmtKgText(m.kg)} y ahora hay ${fmtKgText(m.now)}`),
        ],
        skipped,
      });
      setPreview(null);
    } catch (error) {
      setProblem(`No se ha guardado: ${error instanceof Error ? error.message : "error desconocido"}`);
    } finally {
      setBusy(null);
    }
  };

  const counts = preview ? countStatuses(preview.rows) : null;
  const toSave = counts ? counts.nuevo + (overwrite ? counts.cambia : 0) : 0;

  return (
    <Panel
      title="Importar kilos de varios invernaderos"
      description="Un Excel o CSV con una fila por invernadero y día: recogido en báscula y previsiones. Antes de guardar se enseña qué es nuevo, qué cambiaría y qué tiene errores."
      actions={
        <div className="flex flex-wrap items-start gap-2">
          <ExcelButton build={() => templateSheets(field)} fileName={`atias-plantilla-kilos-${field.id}.xlsx`} label="Descargar plantilla" />
          <label htmlFor={inputId} className={`btn-secondary cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`}>
            <FileUp size={16} aria-hidden /> {busy === "leyendo" ? "Leyendo…" : "Importar Excel"}
          </label>
          <input
            id={inputId}
            type="file"
            accept=".xlsx,.csv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            className="sr-only"
            disabled={busy !== null}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void onFile(file);
            }}
          />
        </div>
      }
    >
      <div role="status" className="grid gap-2 px-5 py-3 text-sm empty:hidden">
        {problem && <p className="text-bad-ink">{problem}</p>}
        {report && (
          <>
            <p className={report.problems.length > 0 ? "text-bad-ink" : undefined}>
              <strong>{report.saved === 0 ? "No se ha guardado ningún valor." : `Guardados ${plural(report.saved, "valor", "valores")} en ${plural(report.greenhouses, "invernadero", "invernaderos")}`}</strong>
              {report.saved > 0 && " (comprobado leyendo de nuevo lo guardado)."}
            </p>
            {report.problems.length > 0 && (
              <ul className="list-disc pl-5 text-bad-ink">
                {report.problems.map((p) => <li key={p}>No se ha guardado: {p}</li>)}
              </ul>
            )}
            {report.skipped.length > 0 && <p className="text-muted">Sin guardar a propósito: {report.skipped.join("; ")}.</p>}
          </>
        )}
        {!problem && !report && !preview && (
          <p className="text-muted">
            Recolección {field.etiqueta.replace("Recolección ", "")}: del {fmtDay(field.dias[0])} al {fmtDay(field.dias[field.dias.length - 1])}. Las fechas de otra semana se señalan y no se guardan.
          </p>
        )}
      </div>

      {preview && counts && (
        <div className="grid gap-3 pb-4">
          <div className="grid gap-1 px-5 text-sm">
            <p>
              <strong>{preview.fileName}</strong>: {plural(counts.nuevo, "valor nuevo", "valores nuevos")}, {plural(counts.cambia, "cambiaría", "cambiarían")} lo que había,{" "}
              {plural(counts.igual, "igual", "iguales")}, {plural(counts.erp, "del ERP", "del ERP")} y {plural(counts.error, "error", "errores")}.
            </p>
            {preview.ignored.length > 0 && <p className="text-muted">Columnas que no se usan: {preview.ignored.join(", ")}.</p>}
            {preview.stale && <p className="text-warn-ink">Los datos guardados cambiaron mientras revisabas. Esta es la comparación nueva: revísala antes de guardar.</p>}
            {counts.error > 0 && <p className="text-bad-ink">Las filas con error no se guardan. Corrígelas en el fichero y vuelve a importarlo.</p>}
          </div>
          <PreviewTable rows={preview.rows} days={field.dias} showAll={showAll} />
          <div className="grid gap-3 px-5">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
              Ver también los valores que no cambian
            </label>
            {counts.cambia > 0 && (
              <label className="flex items-center gap-2 text-sm font-medium text-warn-ink">
                <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
                Cambiar también {plural(counts.cambia, "valor que ya tenía otro dato", "valores que ya tenían otro dato")}
              </label>
            )}
            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn-primary" onClick={() => void save()} disabled={busy !== null || toSave === 0}>
                {busy === "guardando" ? "Guardando…" : toSave === 0 ? "Nada que guardar" : `Guardar ${plural(toSave, "valor", "valores")}`}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setPreview(null)} disabled={busy !== null}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}
