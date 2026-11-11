/**
 * Lectura mínima de hojas de cálculo para importar kilos: la primera hoja de un .xlsx y los .csv.
 * La web solo lleva una librería para escribir Excel; para leer basta con abrir el .xlsx (un zip
 * con XML) con lo que ya trae el navegador. Devuelve celdas sueltas: texto, número o vacío.
 * Las fechas que Excel guarda como fecha llegan como número de serie; las interpreta kilosImport.
 */

export type SheetCell = string | number | null;

// ---- Zip ----

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Ficheros de un zip, por nombre. No admite zip64 (un .xlsx de kilos nunca llega a 4 GB). */
async function unzip(buffer: ArrayBuffer, wanted: (name: string) => boolean): Promise<Map<string, string>> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65_535); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new Error("no es un .xlsx");
  const count = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true);
  const decoder = new TextDecoder("utf-8");
  const files = new Map<string, string>();
  for (let n = 0; n < count; n++) {
    if (view.getUint32(offset, true) !== 0x02014b50) throw new Error("zip dañado");
    const method = view.getUint16(offset + 10, true);
    const size = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const local = view.getUint32(offset + 42, true);
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    offset += 46 + nameLength + extraLength + commentLength;
    if (!wanted(name)) continue;
    const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
    const raw = bytes.subarray(start, start + size);
    if (method !== 0 && method !== 8) throw new Error("compresión no admitida");
    files.set(name, decoder.decode(method === 0 ? raw : await inflate(raw)));
  }
  return files;
}

// ---- XML del libro ----

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

const decodeXml = (text: string) =>
  text.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (whole, code: string) => {
    if (code[0] === "#") return String.fromCodePoint(code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : Number(code.slice(1)));
    return ENTITIES[code] ?? whole;
  });

/** Texto de un <si> o un <is>: todos sus <t>, que en texto con formato vienen troceados. */
const joinTexts = (xml: string) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => decodeXml(m[1])).join("");

const attribute = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

/** «AB12» → columna 27 (empezando en 0). */
function columnIndex(ref: string): number {
  const letters = ref.match(/^[A-Z]+/)?.[0] ?? "A";
  return [...letters].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
}

/** Ruta de la primera hoja según el libro; si algo no cuadra, la habitual. */
function firstSheetPath(files: Map<string, string>): string {
  const workbook = files.get("xl/workbook.xml") ?? "";
  const rels = files.get("xl/_rels/workbook.xml.rels") ?? "";
  const sheetTag = workbook.match(/<sheet\s[^>]*>/)?.[0];
  const relId = sheetTag && (attribute(sheetTag, "r:id") ?? attribute(sheetTag, "[a-zA-Z0-9]+:id"));
  const rel = relId && [...rels.matchAll(/<Relationship\s[^>]*>/g)].map((m) => m[0]).find((r) => attribute(r, "Id") === relId);
  const target = rel ? attribute(rel, "Target") : undefined;
  if (!target) return "xl/worksheets/sheet1.xml";
  return target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\.\//, "")}`;
}

export function sheetRows(sheetXml: string, shared: string[]): SheetCell[][] {
  const rows: SheetCell[][] = [];
  let nextRow = 0;
  for (const rowMatch of sheetXml.matchAll(/<row(\s[^>]*)?>([\s\S]*?)<\/row>|<row(\s[^>]*)?\/>/g)) {
    const rowTag = rowMatch[1] ?? rowMatch[3] ?? "";
    const rowNumber = Number(attribute(rowTag, "r")) || nextRow + 1;
    nextRow = rowNumber;
    const cells: SheetCell[] = [];
    let nextColumn = 0;
    for (const cellMatch of (rowMatch[2] ?? "").matchAll(/<c(\s[^>]*?)?(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const tag = cellMatch[1] ?? "";
      const body = cellMatch[2] ?? "";
      const ref = attribute(tag, "r");
      const column = ref ? columnIndex(ref) : nextColumn;
      nextColumn = column + 1;
      const type = attribute(tag, "t");
      const v = body.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      let value: SheetCell = null;
      if (type === "s") value = v === undefined ? null : (shared[Number(v)] ?? null);
      else if (type === "inlineStr") value = joinTexts(body);
      else if (type === "str") value = v === undefined ? null : decodeXml(v);
      else if (type === "b" || type === "e") value = v === undefined ? null : decodeXml(v);
      else if (v !== undefined && v !== "") value = Number.isFinite(Number(v)) ? Number(v) : decodeXml(v);
      if (typeof value === "string" && value.trim() === "") value = null;
      while (cells.length < column) cells.push(null);
      cells[column] = value;
    }
    while (rows.length < rowNumber - 1) rows.push([]);
    rows[rowNumber - 1] = cells;
  }
  return rows;
}

/** Celdas de la primera hoja de un .xlsx. */
export async function readXlsx(buffer: ArrayBuffer): Promise<SheetCell[][]> {
  const files = await unzip(buffer, (name) => (name.startsWith("xl/") && name.endsWith(".xml")) || name.endsWith(".rels"));
  const path = firstSheetPath(files);
  const sheet = files.get(path);
  if (!sheet) throw new Error("no se encuentra la primera hoja");
  const shared = [...(files.get("xl/sharedStrings.xml") ?? "").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => joinTexts(m[1]));
  return sheetRows(sheet, shared);
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
  const buffer = await file.arrayBuffer();
  if (name.endsWith(".xlsx")) return readXlsx(buffer);
  if (name.endsWith(".csv") || name.endsWith(".txt")) return parseCsv(decodeText(buffer));
  if (name.endsWith(".xls") || name.endsWith(".ods")) throw new Error("Ese formato no se puede leer: ábrelo en Excel y guárdalo como .xlsx o .csv.");
  throw new Error("Sube un .xlsx o un .csv.");
}
