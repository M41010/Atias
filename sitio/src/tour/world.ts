/**
 * El invernadero del recorrido: un multitúnel de tres naves. Se entra por la nave central, con una
 * hilera a cada lado del pasillo, y la hilera cambia de cultivo: tomate cherry, pepino y pimiento.
 * Adaptado de la escena del vídeo de presentación (video/src/scene.ts) para dibujarse en tiempo real.
 * Todo sale de una semilla fija: el mismo invernadero en cada visita.
 */

export const LENGTH = 60;
export const SPAN = 4;
export const WALL = 2.2;
export const ROW_X = 0.85;

export type Crop = "tomato" | "cucumber" | "pepper";

/** Dónde empieza y acaba cada cultivo a lo largo de la hilera (z negativa hacia el fondo). */
export const CROP_Z: Record<Crop, [number, number]> = {
  tomato: [0, -20],
  cucumber: [-20, -40],
  pepper: [-40, -LENGTH],
};

export const cropAt = (z: number): Crop => (z > -20 ? "tomato" : z > -40 ? "cucumber" : "pepper");

export const COLORS = {
  tomatoRipe: "#d6322b",
  tomatoTurning: "#e8812d",
  tomatoGreen: "#7fae3c",
  cucumber: "#2f6b2a",
  cucumberSmall: "#6ea33f",
  pepperRed: "#cf2a1f",
  pepperYellow: "#efc22a",
  pepperGreen: "#3d8a2e",
};

export type Fruit = {
  crop: Crop;
  pos: [number, number, number];
  color: string;
  ripe: boolean;
  /** Radio para tomate y pimiento, largo para pepino, en metros. */
  size: number;
};

export type Leaf = { pos: [number, number, number]; rot: [number, number, number]; size: number; shade: number };
export type Plant = { pos: [number, number, number]; crop: Crop; height: number; leaves: Leaf[]; side: boolean };

/** Generador con semilla. */
export function seeded(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const AISLE_EDGE = 0.42;

function leavesOf(crop: Crop, x: number, z: number, height: number, side: number, random: () => number, dense: number): Leaf[] {
  const leaves: Leaf[] = [];
  const clampX = (value: number) => (side > 0 ? Math.max(AISLE_EDGE, value) : Math.min(-AISLE_EDGE, value));
  const push = (lx: number, ly: number, lz: number, yaw: number, size: number) =>
    leaves.push({
      pos: [clampX(lx), ly, lz],
      rot: [-Math.PI / 2 + 0.2 + random() * 1.1, yaw, (random() - 0.5) * 0.9],
      size,
      shade: random(),
    });
  if (crop === "tomato") {
    for (let y = 0.25; y < height + 0.1; y += 0.1 / dense) {
      const yaw = random() * Math.PI * 2;
      const reach = 0.18 + random() * 0.22;
      for (let k = 1; k <= 7; k += 1) {
        const d = (k / 7) * reach;
        const off = (k % 2 ? 1 : -1) * 0.05;
        push(x + Math.cos(yaw) * d - Math.sin(yaw) * off, y - d * 0.3, z + Math.sin(yaw) * d + Math.cos(yaw) * off, yaw, (0.11 + random() * 0.07) / Math.sqrt(dense));
      }
    }
  } else if (crop === "cucumber") {
    for (let y = 0.3; y < height + 0.1; y += 0.09 / dense) {
      const yaw = random() * Math.PI * 2;
      const d = 0.08 + random() * 0.16;
      push(x + Math.cos(yaw) * d, y - 0.04, z + Math.sin(yaw) * d, yaw, (0.2 + random() * 0.12) / Math.sqrt(dense));
    }
  } else {
    for (let i = 0; i < 95 * dense; i += 1) {
      const yaw = random() * Math.PI * 2;
      const y = 0.2 + random() * (height - 0.15);
      const d = random() * 0.32 * (1 - (y / height) * 0.3);
      push(x + Math.cos(yaw) * d, y, z + Math.sin(yaw) * d, yaw, (0.09 + random() * 0.05) / Math.sqrt(dense));
    }
  }
  return leaves;
}

/**
 * Construye plantas y frutos. `dense` baja el número de hojas (en móvil 0,5) agrandándolas para
 * que la hilera siga tapada; `sideNaves` añade las naves laterales, que solo se ven a través del
 * plástico.
 */
export function buildWorld({ dense = 1, sideNaves = true }: { dense?: number; sideNaves?: boolean } = {}) {
  const random = seeded(46);
  const plants: Plant[] = [];
  const fruits: Fruit[] = [];
  const spacing = 0.5;
  for (const side of [1, -1]) {
    for (let z = -0.6; z > -LENGTH + 0.5; z -= spacing) {
      const crop = cropAt(z);
      const x = side * ROW_X;
      const height = crop === "pepper" ? 1.45 + random() * 0.25 : 2.0 + random() * 0.3;
      plants.push({ pos: [x, 0, z], crop, height, leaves: leavesOf(crop, x, z, height, side, random, dense), side: false });
      const face = x - side * 0.2;
      if (crop === "tomato") {
        for (let truss = 0; truss < 2; truss += 1) {
          const ty = 0.65 + truss * 0.55 + random() * 0.2;
          const ripeTruss = truss === 0 ? random() < 0.85 : random() < 0.45;
          for (let k = 0; k < 12; k += 1) {
            const ripe = ripeTruss && random() < 0.85;
            const turning = !ripe && random() < 0.3;
            fruits.push({
              crop,
              pos: [face + (random() - 0.5) * 0.07, ty - k * 0.03 + random() * 0.012, z + (k % 2 ? 0.025 : -0.025) + (random() - 0.5) * 0.03],
              color: ripe ? COLORS.tomatoRipe : turning ? COLORS.tomatoTurning : COLORS.tomatoGreen,
              ripe,
              size: 0.015 + random() * 0.004,
            });
          }
        }
      } else if (crop === "cucumber") {
        for (let k = 0; k < 3; k += 1) {
          const ripe = random() < 0.5;
          fruits.push({
            crop,
            pos: [face + (random() - 0.5) * 0.1, 0.7 + random() * 1.0, z + (random() - 0.5) * 0.3],
            color: ripe ? COLORS.cucumber : COLORS.cucumberSmall,
            ripe,
            size: ripe ? 0.26 + random() * 0.06 : 0.1 + random() * 0.06,
          });
        }
      } else {
        for (let k = 0; k < 3; k += 1) {
          const ripe = random() < 0.55;
          fruits.push({
            crop,
            pos: [face + (random() - 0.5) * 0.1, 0.45 + random() * 0.8, z + (random() - 0.5) * 0.3],
            color: ripe ? (random() < 0.6 ? COLORS.pepperRed : COLORS.pepperYellow) : COLORS.pepperGreen,
            ripe,
            size: 0.055 + random() * 0.015,
          });
        }
      }
    }
  }
  if (sideNaves) {
    for (const x of [-SPAN - ROW_X, -SPAN + ROW_X, SPAN - ROW_X, SPAN + ROW_X]) {
      for (let z = -0.6; z > -LENGTH + 0.5; z -= spacing * 1.4) {
        const crop = cropAt(z);
        const height = crop === "pepper" ? 1.5 : 2.0 + random() * 0.3;
        const leaves = leavesOf(crop, x, z, height, x > 0 ? 1 : -1, random, 0.5 * dense).map((l) => ({ ...l, size: l.size * 1.3 }));
        plants.push({ pos: [x, 0, z], crop, height, leaves, side: true });
      }
    }
  }
  return { plants, fruits };
}

export type World = ReturnType<typeof buildWorld>;

// ---- Recorrido de la cámara según el avance del scroll (0 a 1) ----

export type Pose = { pos: [number, number, number]; target: [number, number, number] };

const ease = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Parte del avance que se pasa andando por la hilera; el resto es la vista de arriba. */
export const WALK = 0.74;
const START_Z = 0.5;
const END_Z = -LENGTH + 4;

/** Posición de la cámara a lo largo del pasillo para un avance dado. */
export const walkZ = (progress: number) => mix(START_Z, END_Z, Math.min(1, progress / WALK));

/** Pose de la cámara: andando por el pasillo y, al final, elevándose para ver todo el invernadero. */
export function poseAt(progress: number): Pose {
  const z = walkZ(progress);
  const bob = Math.sin(z * 2.6) * 0.012;
  const sway = Math.sin(z * 0.55) * 0.05;
  const walking: Pose = { pos: [0.05, 1.35 + bob, z], target: [0.35 + sway, 1.15, z - 3.5] };
  if (progress <= WALK) return walking;
  const t = ease((progress - WALK) / (1 - WALK));
  const above: Pose = { pos: [-1.4, 7.5, END_Z - 3], target: [0.4, 0.2, END_Z + 16] };
  return {
    pos: [mix(walking.pos[0], above.pos[0], t), mix(walking.pos[1], above.pos[1], t), mix(walking.pos[2], above.pos[2], t)],
    target: [mix(walking.target[0], above.target[0], t), mix(walking.target[1], above.target[1], t), mix(walking.target[2], above.target[2], t)],
  };
}

/** Frutos maduros que la cámara ya ha dejado atrás: los contados. */
export function countedAt(world: World, progress: number): number {
  const z = walkZ(progress);
  if (progress <= 0) return 0;
  let n = 0;
  for (const f of world.fruits) if (f.ripe && f.pos[2] > z - 0.9) n += 1;
  return n;
}
