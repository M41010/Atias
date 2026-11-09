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
    const bob = Math.sin(frame * 0.35) * 0.015;
    return { pos: [0.05, 1.35 + bob, z], target: [0.35, 1.15, z - 3.5], fov: 52 };
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

export type Plant = { pos: [number, number, number]; crop: Crop; height: number; leaves: [number, number, number, number][] };

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
      const height = 2.0 + random() * 0.3;
      const leaves: Plant["leaves"] = [];
      const leafCount = crop === "cucumber" ? 12 : 11;
      for (let i = 0; i < leafCount; i += 1) {
        const y = 0.35 + (i / leafCount) * (height - 0.3);
        leaves.push([
          // Las hojas se quedan en la hilera y no invaden el pasillo.
          x + (random() - 0.5) * 0.3 + side * 0.05,
          y,
          z + (random() - 0.5) * 0.45,
          (crop === "pepper" ? 0.15 : 0.13) + random() * 0.05,
        ]);
      }
      plants.push({ pos: [x, 0, z], crop, height, leaves });
      // Los frutos asoman hacia el pasillo.
      const face = x - side * 0.2;
      if (crop === "tomato") {
        for (let truss = 0; truss < 2; truss += 1) {
          const ty = 0.65 + truss * 0.55 + random() * 0.2;
          const ripeTruss = truss === 0 ? random() < 0.85 : random() < 0.45;
          for (let k = 0; k < 7; k += 1) {
            const ripe = ripeTruss && random() < 0.85;
            const turning = !ripe && random() < 0.3;
            fruits.push({
              id: id++,
              crop,
              pos: [face + (random() - 0.5) * 0.12, ty - k * 0.045 + random() * 0.03, z + (random() - 0.5) * 0.2],
              color: ripe ? C.tomatoRipe : turning ? C.tomatoTurning : C.tomatoGreen,
              ripe,
              size: 0.028 + random() * 0.008,
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
            pos: [face + (random() - 0.5) * 0.1, 0.6 + random() * 0.9, z + (random() - 0.5) * 0.3],
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
      const height = 1.9 + random() * 0.3;
      const leaves: Plant["leaves"] = [];
      for (let i = 0; i < 5; i += 1) {
        leaves.push([x + (random() - 0.5) * 0.4, 0.4 + (i / 5) * (height - 0.3), z + (random() - 0.5) * 0.5, 0.22 + random() * 0.08]);
      }
      plants.push({ pos: [x, 0, z], crop: cropAt(z), height, leaves });
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

export function projector(frame: number) {
  const pose = poseAt(frame);
  camera.fov = pose.fov;
  camera.position.set(...pose.pos);
  camera.lookAt(...pose.target);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return (p: [number, number, number]): { x: number; y: number; depth: number } | null => {
    v.set(...p).applyMatrix4(camera.matrixWorldInverse);
    const depth = -v.z;
    if (depth < 0.2) return null;
    v.set(...p).project(camera);
    return { x: ((v.x + 1) / 2) * WIDTH, y: ((1 - v.y) / 2) * HEIGHT, depth };
  };
}
