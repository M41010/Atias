/**
 * Lectura de hojas de cálculo para importar kilos: la primera hoja de un .xlsx (con read-excel-file)
 * y los .csv. Devuelve celdas sueltas: texto, número o vacío. Las celdas de fecha de Excel llegan
 * como texto «aaaa-mm-dd», que kilosImport lee igual que cualquier otra fecha.
 */

export type SheetCell = string | number | null;

/** Una celda tal como la da read-excel-file, pasada a texto, número o vacío. */
export function toSheetCell(value: unknown): SheetCell {
  if (value === null || value === undefined) return null;
  // Excel guarda los días a medianoche UTC: basta con la fecha, sin la hora.
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

/**
 * Celdas de la primera hoja de un .xlsx. La librería se carga solo al importar. Respeta las filas
 * vacías de arriba para que el número de fila coincida con el de Excel.
 */
export async function readXlsx(input: Blob | ArrayBuffer): Promise<SheetCell[][]> {
  const { readSheet } = await import("read-excel-file/universal");
  try {
    const rows = await readSheet(input);
    return rows.map((row) => row.map(toSheetCell));
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === "XLS_FILE_NOT_SUPPORTED") throw new Error("es un .xls antiguo; ábrelo en Excel y guárdalo como .xlsx o .csv");
    if (code === "NO_DATA") throw new Error("el fichero está vacío");
    throw new Error("no es un .xlsx válido");
  }
}

// ---- CSV ----

/** Separador más probable: punto y coma (Excel en español), tabulador o coma. */
function guessDelimiter(text: string): string {
  const sample = text.split(/\r?\n/).filter((l) => l.trim()).slice(0, 10).join("\n").replace(/"[^"]*"/g, "");
  const count = (c: string) => sample.split(c).length - 1;
  const best = [";", "\t", ","].map((c) => [c, count(c)] as const).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : ";";
}

/** CSV con comillas a la manera de Excel. Los números se dejan como texto: los lee kilosImport. */
export function parseCsv(text: string): SheetCell[][] {
  const delimiter = guessDelimiter(text);
  const rows: SheetCell[][] = [];
  let row: SheetCell[] = [];
  let cell = "";
  let quoted = false;
  const push = () => {
    row.push(cell.trim() === "" ? null : cell.trim());
    cell = "";
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"' && cell.trim() === "") {
      cell = "";
      quoted = true;
    } else if (c === delimiter) push();
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      push();
      rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell !== "" || row.length > 0) {
    push();
    rows.push(row);
  }
  return rows;
}

/** Texto de un fichero: UTF-8 si lo es; si no, el de Windows en español (como guarda Excel el CSV). */
export function decodeText(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer).replace(/^﻿/, "");
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

/** Celdas de un fichero subido, según su extensión. */
export async function readSpreadsheet(file: { name: string; arrayBuffer: () => Promise<ArrayBuffer> }): Promise<SheetCell[][]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xls") || name.endsWith(".ods")) throw new Error("Ese formato no se puede leer: ábrelo en Excel y guárdalo como .xlsx o .csv.");
  const buffer = await file.arrayBuffer();
  if (name.endsWith(".xlsx")) return readXlsx(buffer);
  if (name.endsWith(".csv") || name.endsWith(".txt")) return parseCsv(decodeText(buffer));
  throw new Error("Sube un .xlsx o un .csv.");
}
