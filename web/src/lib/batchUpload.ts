/** Subida de muchos vídeos a la vez desde la cooperativa: lectura del nombre y revisión, sin red. */

import { type Side, uploadKey, validateVideo } from "./upload";

export type ParsedName = {
  hilera: number | null;
  lado: Side | null;
  /** Número de invernadero que dice el nombre (inv1), si lo dice. */
  invernadero: number | null;
};

const SEP = "[\\s._-]*";
const END = "(?![a-z0-9])";

/**
 * Hilera y lado a partir del nombre del archivo. Admite inv1-h3-A, h3a, H03-B, hilera3_ladoB,
 * «Hilera 3 Lado A», inv1-3-A… sin distinguir mayúsculas. Lo que no está claro queda en null:
 * es preferible preguntar a adivinar.
 */
export function parseVideoName(name: string): ParsedName {
  let text = name
    .replace(/\.[a-z0-9]{2,4}$/i, "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

  const unique = <T,>(values: T[]): T | null => (new Set(values).size === 1 ? values[0] : null);

  const greenhouses: number[] = [];
  text = text.replace(new RegExp(`(?:invernadero|inv|nave)${SEP}0*(\\d{1,3})(?!\\d)`, "g"), (_, n: string) => {
    greenhouses.push(Number(n));
    return " ";
  });

  // Hilera con su marca: hilera3, hil-3, fila 3, h03. La letra pegada detrás es el lado (h3a).
  const marked = [...text.matchAll(new RegExp(`(?:^|[^a-z])(?:hilera|hil|fila|h)${SEP}0*(\\d{1,3})(?:${SEP}([ab])${END})?`, "g"))];
  let hilera = marked.length ? unique(marked.map((m) => Number(m[1]))) : null;
  const sides: string[] = marked.flatMap((m) => (m[2] ? [m[2]] : []));

  for (const m of text.matchAll(new RegExp(`lado${SEP}([ab])${END}`, "g"))) sides.push(m[1]);

  // Sin marca: un número seguido del lado (3-A, 03b), solo si no hay ningún otro candidato.
  if (!marked.length) {
    const bare = [...text.matchAll(new RegExp(`(?:^|[^a-z0-9])0*(\\d{1,3})${SEP}([ab])${END}`, "g"))];
    if (bare.length === 1) {
      hilera = Number(bare[0][1]);
      sides.push(bare[0][2]);
    }
  }

  // Una letra suelta entre separadores: «h3 a», «inv1-h3-B».
  if (!sides.length && hilera !== null) {
    const loose = [...text.matchAll(new RegExp(`(?:^|[^a-z0-9])([ab])${END}`, "g"))];
    sides.push(...loose.map((m) => m[1]));
  }

  const side = sides.length ? unique(sides) : null;
  return {
    hilera: hilera !== null && hilera > 0 ? hilera : null,
    lado: side ? (side.toUpperCase() as Side) : null,
    invernadero: unique(greenhouses),
  };
}

/** Número del invernadero en su nombre («Invernadero 1» → 1), para contrastar con «inv1». */
export function greenhouseNumber(name: string): number | null {
  const numbers = name.match(/\d+/g);
  return numbers && numbers.length === 1 ? Number(numbers[0]) : null;
}

export type BatchRow = {
  id: string;
  file: { name: string; size: number; type: string };
  hilera: number | null;
  lado: Side | null;
  /** Número de invernadero leído del nombre. */
  invernadero: number | null;
  /** La persona ha confirmado que es de este invernadero aunque el nombre diga otro. */
  confirmedGreenhouse: boolean;
};

export type RowProblem =
  | { kind: "formato"; message: string }
  | { kind: "sin_datos" }
  | { kind: "fuera"; hileras: number }
  | { kind: "repetido" }
  | { kind: "en_cola" }
  | { kind: "otro_invernadero"; invernadero: number };

/** Lo que impide subir cada fila. Vacío si se puede subir. */
export function rowProblems(
  rows: BatchRow[],
  { hileras, greenhouseNumber: expected, queued = new Set() }: {
    hileras: number;
    greenhouseNumber: number | null;
    /** Lados de este invernadero que ya esperan o están subiendo (claves de `uploadKey`). */
    queued?: Set<string>;
  },
): Record<string, RowProblem[]> {
  const slots = new Map<string, number>();
  for (const row of rows) {
    if (row.hilera !== null && row.lado !== null) {
      const key = uploadKey(row.hilera, row.lado);
      slots.set(key, (slots.get(key) ?? 0) + 1);
    }
  }
  const result: Record<string, RowProblem[]> = {};
  for (const row of rows) {
    const problems: RowProblem[] = [];
    const format = validateVideo(row.file);
    if (format) problems.push({ kind: "formato", message: format });
    if (row.hilera === null || row.lado === null) problems.push({ kind: "sin_datos" });
    else if (row.hilera > hileras) problems.push({ kind: "fuera", hileras });
    else if ((slots.get(uploadKey(row.hilera, row.lado)) ?? 0) > 1) problems.push({ kind: "repetido" });
    else if (queued.has(uploadKey(row.hilera, row.lado))) problems.push({ kind: "en_cola" });
    if (expected !== null && row.invernadero !== null && row.invernadero !== expected && !row.confirmedGreenhouse) {
      problems.push({ kind: "otro_invernadero", invernadero: row.invernadero });
    }
    result[row.id] = problems;
  }
  return result;
}

export function problemText(problem: RowProblem): string {
  switch (problem.kind) {
    case "formato":
      return problem.message;
    case "sin_datos":
      return "No se reconoce en el nombre: elige hilera y lado.";
    case "fuera":
      return `Este invernadero tiene ${problem.hileras} hileras.`;
    case "repetido":
      return "Otro vídeo tiene la misma hilera y lado.";
    case "en_cola":
      return "Ya se está subiendo un vídeo de esta hilera y lado.";
    case "otro_invernadero":
      return `El nombre dice invernadero ${problem.invernadero}.`;
  }
}

/** Filas nuevas a partir de los archivos elegidos, con hilera y lado propuestos por el nombre. */
export function rowsFromFiles<F extends { name: string; size: number; type: string }>(
  files: F[],
  nextId: () => string,
): (BatchRow & { file: F })[] {
  return files.map((file) => {
    const parsed = parseVideoName(file.name);
    return { id: nextId(), file, ...parsed, confirmedGreenhouse: false };
  });
}
