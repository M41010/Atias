/**
 * Modelo del contador de la portada. Datos inventados para mostrar el método, siempre iguales:
 * un invernadero de ejemplo recorrido de punta a punta, dibujado con celdas de la cuadrícula.
 */

export const ROW = {
  /** Lado de cada celda del dibujo. */
  cell: 12,
  /** Columnas y filas de celdas de la tira completa. */
  cols: 240,
  cellRows: 13,
  /** Hileras del invernadero de ejemplo que se recorren. */
  rows: 12,
  /** Parte de la tira que se ve a la vez. */
  window: 0.25,
  /** Frutos maduros que representa cada marca del recuento. */
  fruitsPerMark: 500,
  /** Peso medio de un tomate cherry, en kg. */
  fruitKg: 0.016,
  /** Lo que madura durante la semana frente a lo ya maduro al grabar (ejemplo). */
  ripeningFactor: 2.2,
  /** Margen del ejemplo: ±12 %. */
  margin: 0.12,
  /** Kg que recoge una persona por jornal y días de recolección. */
  kgPerWorkday: 180,
  days: 5,
} as const;

const LEAVES = ["#2f5a2a", "#3d6b31", "#4d7a3a", "#284d24", "#56853f"];

type Leaf = { id: number; x: number; y: number; fill: string };
type Fruit = { id: number; x: number; y: number; ripe: boolean; position: number };
export type Row = { width: number; height: number; leaves: Leaf[]; fruits: Fruit[]; ripeTotal: number };

/** Generador con semilla: el mismo dibujo en el servidor y en el navegador. */
function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildRow(seed = 46): Row {
  const random = seeded(seed);
  const { cell, cols, cellRows } = ROW;
  const width = cols * cell;
  const height = cellRows * cell;
  const leaves: Leaf[] = [];
  const fruits: Fruit[] = [];
  const stemEvery = 10;

  for (let col = 0; col < cols; col++) {
    const toStem = Math.abs(((col + stemEvery / 2) % stemEvery) - stemEvery / 2);
    for (let r = 0; r < cellRows; r++) {
      const density = toStem === 0 ? 0.95 : 0.78 - toStem * 0.1;
      if (random() < density) {
        leaves.push({
          id: leaves.length,
          x: col * cell,
          y: r * cell,
          fill: LEAVES[Math.floor(random() * LEAVES.length)],
        });
      }
    }
  }

  for (let stem = stemEvery / 2; stem < cols; stem += stemEvery) {
    const count = 6 + Math.floor(random() * 4);
    for (let i = 0; i < count; i++) {
      const col = stem + Math.round((random() - 0.5) * 6);
      const r = 2 + Math.floor(random() * (cellRows - 4));
      const x = col * cell + cell / 2;
      fruits.push({
        id: fruits.length,
        x,
        y: r * cell + cell / 2,
        ripe: random() < 0.58,
        position: x / width,
      });
    }
  }

  return { width, height, leaves, fruits, ripeTotal: fruits.filter((f) => f.ripe).length };
}

/** Dónde está la línea de lectura, en fracción de la tira, para un avance de 0 a 1. */
export const scanAt = (progress: number) => progress * (1 - ROW.window) + ROW.window / 2;

/** Frutos maduros que ya han cruzado la línea de lectura. Al final cuenta todos. */
export function countAt(row: Row, progress: number): number {
  if (progress >= 1) return row.ripeTotal;
  const scan = scanAt(progress);
  return row.fruits.filter((f) => f.ripe && f.position <= scan).length;
}

/** De marcas contadas a frutos, kilos con su margen y temporeros, con la escala de la banda. */
export function estimate(marks: number, totalMarks: number = marks) {
  const fruits = marks * ROW.fruitsPerMark;
  const kg = Math.round(fruits * ROW.fruitKg * ROW.ripeningFactor);
  const min = Math.round(kg * (1 - ROW.margin));
  const max = Math.round(kg * (1 + ROW.margin));
  const workers = kg === 0 ? 0 : Math.ceil(kg / (ROW.kgPerWorkday * ROW.days));
  const scale = Math.max(1, totalMarks * ROW.fruitsPerMark * ROW.fruitKg * ROW.ripeningFactor * (1 + ROW.margin) * 1.04);
  return {
    fruits,
    kg,
    min,
    max,
    workers,
    bandLeft: min / scale,
    bandRight: max / scale,
    bandMid: kg / scale,
  };
}
