import { PerspectiveCamera, Vector3 } from "three";
import { C, HEIGHT, seeded, WIDTH } from "./theme";

/**
 * El invernadero: un multitúnel de tres naves (como el logo) de 78 m. Se entra por la nave central,
 * con una hilera a cada lado del pasillo. La hilera cambia de cultivo a lo largo del recorrido:
 * tomate cherry, pepino y pimiento.
 */

export const LENGTH = 78;
export const SPAN = 4;
export const WALL = 2.2;
export const ROW_X = 0.85;

// ---- Calendario del vídeo (fotogramas a 30 fps) ----
export const T = {
  enter: 120, // fin del acercamiento desde fuera
  cucumber: 390,
  pepper: 570,
  phone: 750,
  rail: 840,
  railEnd: 1020,
};
const SPEED = 0.09; // metros por fotograma dentro del invernadero

export type Crop = "tomato" | "cucumber" | "pepper";

/** Dónde empieza cada cultivo a lo largo de la hilera (z negativa hacia el fondo). */
export const CROP_Z: Record<Crop, [number, number]> = {
  tomato: [0, -(T.cucumber - T.enter) * SPEED - 3],
  cucumber: [-(T.cucumber - T.enter) * SPEED - 3, -(T.pepper - T.enter) * SPEED - 3],
  pepper: [-(T.pepper - T.enter) * SPEED - 3, -LENGTH],
};

export const cropAt = (z: number): Crop =>
  z > CROP_Z.tomato[1] ? "tomato" : z > CROP_Z.cucumber[1] ? "cucumber" : "pepper";

const ease = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export type Pose = { pos: [number, number, number]; target: [number, number, number]; fov: number };

/** Posición y mirada de la cámara en cada fotograma. */
export function poseAt(frame: number): Pose {
  if (frame < T.enter) {
    const t = ease(frame / T.enter);
    return {
      pos: [mix(3.2, 0.05, t), mix(2.6, 1.35, t), mix(24, 0.5, t)],
      target: [mix(0, 0.35, t), mix(1.8, 1.15, t), mix(-4, -3.5, t)],
      fov: 52,
    };
  }
  if (frame < T.rail) {
    const z = 0.5 - (frame - T.enter) * SPEED;
    // Un leve balanceo, como al andar.
    const bob = Math.sin(frame * 0.35) * 0.015 + Math.sin(frame * 0.071) * 0.01;
    const sway = Math.sin(frame * 0.047) * 0.04 + Math.sin(frame * 0.13) * 0.012;
    return { pos: [0.05, 1.35 + bob, z], target: [0.35 + sway, 1.15 + bob * 0.5, z - 3.5], fov: 52 };
  }
  // El raíl: vista desde arriba del pasillo, la cámara del raíl avanza por encima de la hilera.
  const t = (frame - T.rail) / (T.railEnd - T.rail);
  return {
    pos: [-0.9, 3.0, mix(-18, -23, t)],
    target: [0.7, 1.2, mix(-28, -33, t)],
    fov: 50,
  };
}

/** Posición de la cámara del raíl a lo largo de la hilera. */
export const railZ = (frame: number) => mix(-23, -40, ease((frame - T.rail) / (T.railEnd - T.rail)));

// ---- Plantas y frutos ----

export type Fruit = {
  id: number;
  crop: Crop;
  pos: [number, number, number];
  color: string;
  ripe: boolean;
  /** Tamaño en metros (radio para tomate y pimiento, largo para pepino). */
  size: number;
  /** Fruta de la hilera derecha, la que mira la cámara. */
  right: boolean;
};

/** Una hoja (o foliolo): posición, giro y tamaño en metros. */
export type Leaf = { pos: [number, number, number]; rot: [number, number, number]; size: number; shade: number };
export type Plant = { pos: [number, number, number]; crop: Crop; height: number; leaves: Leaf[]; side: boolean };

/** Las hojas no invaden el pasillo central más allá de este margen. */
const AISLE_EDGE = 0.42;

/**
 * Hojas de una planta. Tomate: hojas compuestas de foliolos a lo largo del tallo. Pepino: hojas
 * grandes palmeadas con peciolo. Pimiento: mata baja y tupida de hojas ovaladas.
 */
function leavesOf(crop: Crop, x: number, z: number, height: number, side: number, random: () => number, dense = 1): Leaf[] {
  const leaves: Leaf[] = [];
  const clampX = (value: number) => (side > 0 ? Math.max(AISLE_EDGE, value) : Math.min(-AISLE_EDGE, value));
  const push = (lx: number, ly: number, lz: number, yaw: number, size: number) =>
    leaves.push({
      pos: [clampX(lx), ly, lz],
      // Casi horizontales, algo caídas, giradas hacia donde crece el peciolo.
      // Unas casi horizontales y otras de canto: así cubren como una mata de verdad.
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
        push(x + Math.cos(yaw) * d - Math.sin(yaw) * off, y - d * 0.3, z + Math.sin(yaw) * d + Math.cos(yaw) * off, yaw, 0.11 + random() * 0.07);
      }
    }
  } else if (crop === "cucumber") {
    for (let y = 0.3; y < height + 0.1; y += 0.09 / dense) {
      const yaw = random() * Math.PI * 2;
      const d = 0.08 + random() * 0.16;
      push(x + Math.cos(yaw) * d, y - 0.04, z + Math.sin(yaw) * d, yaw, 0.2 + random() * 0.12);
    }
  } else {
    for (let i = 0; i < 95 * dense; i += 1) {
      const yaw = random() * Math.PI * 2;
      const y = 0.2 + random() * (height - 0.15);
      const d = random() * 0.32 * (1 - (y / height) * 0.3);
      push(x + Math.cos(yaw) * d, y, z + Math.sin(yaw) * d, yaw, 0.09 + random() * 0.05);
    }
  }
  return leaves;
}

const SPACING = 0.5;

function build() {
  const random = seeded(46);
  const plants: Plant[] = [];
  const fruits: Fruit[] = [];
  let id = 0;
  for (const side of [1, -1]) {
    for (let z = -0.6; z > -LENGTH + 0.5; z -= SPACING) {
      const crop = cropAt(z);
      const x = side * ROW_X;
      const height = crop === "pepper" ? 1.45 + random() * 0.25 : 2.0 + random() * 0.3;
      const leaves = leavesOf(crop, x, z, height, side, random);
      plants.push({ pos: [x, 0, z], crop, height, leaves, side: false });
      // Los frutos asoman hacia el pasillo.
      const face = x - side * 0.2;
      if (crop === "tomato") {
        for (let truss = 0; truss < 2; truss += 1) {
          const ty = 0.65 + truss * 0.55 + random() * 0.2;
          const ripeTruss = truss === 0 ? random() < 0.85 : random() < 0.45;
          for (let k = 0; k < 12; k += 1) {
            const ripe = ripeTruss && random() < 0.85;
            const turning = !ripe && random() < 0.3;
            // El racimo cuelga en zigzag.
            fruits.push({
              id: id++,
              crop,
              pos: [face + (random() - 0.5) * 0.07, ty - k * 0.03 + random() * 0.012, z + (k % 2 ? 0.025 : -0.025) + (random() - 0.5) * 0.03],
              color: ripe ? C.tomatoRipe : turning ? C.tomatoTurning : C.tomatoGreen,
              ripe,
              size: 0.015 + random() * 0.004,
              right: side === 1,
            });
          }
        }
      } else if (crop === "cucumber") {
        for (let k = 0; k < 3; k += 1) {
          const ripe = random() < 0.5;
          fruits.push({
            id: id++,
            crop,
            pos: [face + (random() - 0.5) * 0.1, 0.7 + random() * 1.0, z + (random() - 0.5) * 0.3],
            color: ripe ? C.cucumber : C.cucumberSmall,
            ripe,
            size: ripe ? 0.26 + random() * 0.06 : 0.1 + random() * 0.06,
            right: side === 1,
          });
        }
      } else {
        for (let k = 0; k < 3; k += 1) {
          const r = random();
          const ripe = r < 0.55;
          fruits.push({
            id: id++,
            crop,
            pos: [face + (random() - 0.5) * 0.1, 0.45 + random() * 0.8, z + (random() - 0.5) * 0.3],
            color: ripe ? (random() < 0.6 ? C.pepperRed : C.pepperYellow) : C.pepperGreen,
            ripe,
            size: 0.055 + random() * 0.015,
            right: side === 1,
          });
        }
      }
    }
  }
  // Hileras de las naves laterales: solo hojas, se ven desde fuera y a través del plástico.
  for (const x of [-SPAN - ROW_X, -SPAN + ROW_X, SPAN - ROW_X, SPAN + ROW_X]) {
    for (let z = -0.6; z > -LENGTH + 0.5; z -= SPACING * 1.4) {
      const crop = cropAt(z);
      const height = crop === "pepper" ? 1.5 : 2.0 + random() * 0.3;
      // Las naves laterales se ven de lejos: menos hojas y más grandes.
      const leaves = leavesOf(crop, x, z, height, x > 0 ? 1 : -1, random, 0.6).map((l) => ({ ...l, size: l.size * 1.5 }));
      plants.push({ pos: [x, 0, z], crop, height, leaves, side: true });
    }
  }
  return { plants, fruits };
}

export const WORLD = build();

/** Frutos maduros que la cámara ya ha dejado atrás: los contados. */
export function countedUntil(frame: number): number {
  const z = poseAt(Math.min(frame, T.rail - 1)).pos[2];
  if (frame < T.enter) return 0;
  return WORLD.fruits.filter((f) => f.ripe && f.pos[2] > z - 0.9).length;
}

// ---- Proyección a la pantalla, para dibujar los recuadros encima de la escena ----

const camera = new PerspectiveCamera(52, WIDTH / HEIGHT, 0.05, 200);
const v = new Vector3();

/**
 * Ángulo vertical de la cámara según el formato. En vertical (9:16) se abre para que la hilera no
 * quede como una rendija: 75° en vertical equivalen a unos 47° en horizontal.
 */
export const fovFor = (fov: number, width: number, height: number) => (height > width ? 75 : fov);

/** Distancia focal en píxeles: convierte un tamaño en metros a píxeles en pantalla. */
export const focalFor = (frame: number, width: number, height: number) =>
  height / 2 / Math.tan((fovFor(poseAt(frame).fov, width, height) * Math.PI) / 360);

export function projector(frame: number, width = WIDTH, height = HEIGHT) {
  const pose = poseAt(frame);
  camera.fov = fovFor(pose.fov, width, height);
  camera.aspect = width / height;
  camera.position.set(...pose.pos);
  camera.lookAt(...pose.target);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return (p: [number, number, number]): { x: number; y: number; depth: number } | null => {
    v.set(...p).applyMatrix4(camera.matrixWorldInverse);
    const depth = -v.z;
    if (depth < 0.2) return null;
    v.set(...p).project(camera);
    return { x: ((v.x + 1) / 2) * width, y: ((1 - v.y) / 2) * height, depth };
  };
}
