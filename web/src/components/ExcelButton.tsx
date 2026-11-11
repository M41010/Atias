"use client";

import { FileSpreadsheet, LoaderCircle } from "lucide-react";
import { useState } from "react";
import type { XlsSheet } from "@/lib/excelExport";

/** Escribe las hojas en un .xlsx y lo descarga. La librería se carga solo al pulsar el botón. */
async function downloadXlsx(sheets: XlsSheet[], fileName: string) {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  await writeXlsxFile(
    sheets.map((sheet) => ({
      sheet: sheet.name.slice(0, 31),
      columns: sheet.widths.map((width) => ({ width })),
      data: sheet.rows.map((row, index) => {
        const bold = sheet.boldRows.includes(index);
        return row.map((cell) =>
          cell === null
            ? null
            : typeof cell === "number"
              ? { value: cell, type: Number, format: "#,##0", ...(bold ? { fontWeight: "bold" as const } : {}) }
              : { value: cell, type: String, ...(bold ? { fontWeight: "bold" as const } : {}) },
        );
      }),
    })),
  ).toFile(fileName);
}

/**
 * Botón «Descargar Excel». Las hojas se construyen al pulsar (con los filtros del momento), no al
 * pintar la pantalla, para no gastar nada si no se usa.
 */
export function ExcelButton({ build, fileName, label = "Descargar Excel" }: { build: () => XlsSheet[]; fileName: string; label?: string }) {
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const onClick = async () => {
    setState("busy");
    try {
      await downloadXlsx(build(), fileName);
      setState("idle");
    } catch {
      setState("error");
    }
  };
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={() => void onClick()} disabled={state === "busy"} className="btn-secondary">
        {state === "busy" ? <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden /> : <FileSpreadsheet size={16} aria-hidden />}
        {state === "busy" ? "Preparando…" : label}
      </button>
      {state === "error" && (
        <span role="alert" className="text-xs text-bad-ink">
          No se ha podido generar el Excel. Vuelve a intentarlo.
        </span>
      )}
    </span>
  );
}
