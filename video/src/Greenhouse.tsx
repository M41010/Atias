import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useCurrentFrame } from "remotion";
import {
  CapsuleGeometry,
  Color,
  DoubleSide,
  type InstancedMesh,
  Matrix4,
  type PerspectiveCamera,
  Quaternion,
  Vector3,
} from "three";
import { LENGTH, poseAt, railZ, ROW_X, SPAN, T, WALL, WORLD } from "./scene";
import { C } from "./theme";

/** La cámara de la escena sigue exactamente la pose calculada para cada fotograma. */
function CameraRig() {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const pose = poseAt(frame);
  camera.fov = pose.fov;
  camera.position.set(...pose.pos);
  camera.lookAt(...pose.target);
  camera.updateProjectionMatrix();
  return null;
}

type Instance = { pos: [number, number, number]; scale: [number, number, number]; rot?: [number, number, number] };

/** Muchas piezas iguales en una sola llamada de dibujo: imprescindible para cientos de plantas. */
function Instances({ items, color, children }: { items: Instance[]; color: string; children: React.ReactNode }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new Matrix4();
    const q = new Quaternion();
    items.forEach((it, i) => {
      q.setFromAxisAngle(new Vector3(0, 0, 1), it.rot?.[2] ?? 0);
      m.compose(new Vector3(...it.pos), q, new Vector3(...it.scale));
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [items]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, items.length]} frustumCulled={false}>
      {children}
      <meshLambertMaterial color={color} />
    </instancedMesh>
  );
}

function Plants() {
  const groups = useMemo(() => {
    const leaves: Instance[] = [];
    const leavesDark: Instance[] = [];
    const stems: Instance[] = [];
    WORLD.plants.forEach((p, i) => {
      stems.push({ pos: [p.pos[0], p.height / 2, p.pos[2]], scale: [1, p.height, 1] });
      p.leaves.forEach(([x, y, z, r], k) =>
        ((i + k) % 3 === 0 ? leavesDark : leaves).push({ pos: [x, y, z], scale: [r * 1.3, r * 0.75, r] }),
      );
    });
    return { leaves, leavesDark, stems };
  }, []);
  return (
    <>
      <Instances items={groups.stems} color={C.stem}>
        <cylinderGeometry args={[0.015, 0.02, 1, 5]} />
      </Instances>
      <Instances items={groups.leaves} color={C.leaf}>
        <icosahedronGeometry args={[1, 0]} />
      </Instances>
      <Instances items={groups.leavesDark} color={C.leafDark}>
        <icosahedronGeometry args={[1, 0]} />
      </Instances>
    </>
  );
}

function Fruits() {
  const groups = useMemo(() => {
    const byKey = new Map<string, { color: string; kind: "sphere" | "cucumber" | "pepper"; items: Instance[] }>();
    for (const f of WORLD.fruits) {
      const kind = f.crop === "tomato" ? "sphere" : f.crop === "cucumber" ? "cucumber" : "pepper";
      const key = `${kind}-${f.color}`;
      if (!byKey.has(key)) byKey.set(key, { color: f.color, kind, items: [] });
      const scale: [number, number, number] =
        kind === "sphere" ? [f.size, f.size, f.size]
          : kind === "cucumber" ? [0.03, f.size / 2.25, 0.03]
            : [f.size, f.size * 1.1, f.size];
      byKey.get(key)?.items.push({ pos: f.pos, scale, rot: [0, 0, kind === "cucumber" ? 0.08 : 0] });
    }
    return [...byKey.values()];
  }, []);
  const cucumber = useMemo(() => new CapsuleGeometry(1, 0.25, 4, 8), []);
  const pepper = useMemo(() => new CapsuleGeometry(0.85, 0.7, 4, 8), []);
  return (
    <>
      {groups.map((g) => (
        <FruitGroup key={`${g.kind}-${g.color}`} g={g} cucumber={cucumber} pepper={pepper} />
      ))}
    </>
  );
}

/** Un grupo de frutos del mismo tipo y color. */
function FruitGroup({ g, cucumber, pepper }: {
  g: { color: string; kind: "sphere" | "cucumber" | "pepper"; items: Instance[] };
  cucumber: CapsuleGeometry;
  pepper: CapsuleGeometry;
}) {
  if (g.kind === "sphere") {
    return (
      <Instances items={g.items} color={g.color}>
        <sphereGeometry args={[1, 10, 8]} />
      </Instances>
    );
  }
  return (
    <Instances items={g.items} color={g.color}>
      <primitive object={g.kind === "cucumber" ? cucumber : pepper} attach="geometry" />
    </Instances>
  );
}

/** El invernadero: tres naves de plástico, arcos, pilares, suelo enarenado y pasillos. */
function Structure() {
  const ribs = useMemo(() => Array.from({ length: Math.floor(LENGTH / 3) + 1 }, (_, i) => -i * 3), []);
  const plastic = { color: C.plastic, transparent: true, opacity: 0.42, side: DoubleSide, depthWrite: false };
  return (
    <>
      {/* Suelo y pasillos */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -LENGTH / 2 + 10]}>
        <planeGeometry args={[80, LENGTH + 80]} />
        <meshLambertMaterial color={C.soil} />
      </mesh>
      {[-SPAN, 0, SPAN].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.005, -LENGTH / 2]}>
          <planeGeometry args={[0.9, LENGTH]} />
          <meshLambertMaterial color={C.aisle} />
        </mesh>
      ))}
      {/* Cubierta: medio cilindro por nave */}
      {[-SPAN, 0, SPAN].map((x) => (
        <mesh key={`roof-${x}`} position={[x, WALL, -LENGTH / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[SPAN / 2, SPAN / 2, LENGTH, 28, 1, true, -Math.PI / 2, Math.PI]} />
          <meshStandardMaterial {...plastic} />
        </mesh>
      ))}
      {/* Paredes laterales */}
      {[-SPAN * 1.5, SPAN * 1.5].map((x) => (
        <mesh key={`wall-${x}`} position={[x, WALL / 2, -LENGTH / 2]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[LENGTH, WALL]} />
          <meshStandardMaterial {...plastic} />
        </mesh>
      ))}
      {/* Fachada con la puerta en la nave central */}
      {[-SPAN, SPAN].map((x) => (
        <mesh key={`front-${x}`} position={[x, WALL / 2, 0]}>
          <planeGeometry args={[SPAN, WALL]} />
          <meshStandardMaterial {...plastic} />
        </mesh>
      ))}
      {[-1.3, 1.3].map((x) => (
        <mesh key={`frontc-${x}`} position={[x, WALL / 2, 0]}>
          <planeGeometry args={[1.4, WALL]} />
          <meshStandardMaterial {...plastic} />
        </mesh>
      ))}
      {[-SPAN, 0, SPAN].map((x) => (
        <mesh key={`gable-${x}`} position={[x, WALL, 0]}>
          <circleGeometry args={[SPAN / 2, 28, 0, Math.PI]} />
          <meshStandardMaterial {...plastic} />
        </mesh>
      ))}
      {/* Arcos y pilares cada 3 m */}
      {ribs.map((z) =>
        [-SPAN, 0, SPAN].map((x) => (
          <mesh key={`rib-${z}-${x}`} position={[x, WALL, z]}>
            <torusGeometry args={[SPAN / 2, 0.025, 4, 24, Math.PI]} />
            <meshLambertMaterial color="#c9cfd1" />
          </mesh>
        )),
      )}
      {ribs.map((z) =>
        [-SPAN * 1.5, -SPAN / 2, SPAN / 2, SPAN * 1.5].map((x) => (
          <mesh key={`post-${z}-${x}`} position={[x, WALL / 2, z]}>
            <cylinderGeometry args={[0.035, 0.035, WALL, 6]} />
            <meshLambertMaterial color="#b9c0c2" />
          </mesh>
        )),
      )}
      {/* Marco de la puerta */}
      {[-0.6, 0.6].map((x) => (
        <mesh key={`door-${x}`} position={[x, WALL / 2, 0.01]}>
          <boxGeometry args={[0.06, WALL, 0.06]} />
          <meshLambertMaterial color="#9aa3a6" />
        </mesh>
      ))}
      {/* Alambres de entutorado sobre las hileras del pasillo central */}
      {[-ROW_X, ROW_X].map((x) => (
        <mesh key={`wire-${x}`} position={[x, 2.35, -LENGTH / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.006, 0.006, LENGTH, 4]} />
          <meshLambertMaterial color="#8a9396" />
        </mesh>
      ))}
    </>
  );
}

/** Raíl sobre el pasillo con la cámara que recorre la hilera sola (fase siguiente). */
function Rail() {
  const frame = useCurrentFrame();
  if (frame < T.rail) return null;
  const z = railZ(frame);
  return (
    <>
      <mesh position={[0.25, 2.62, -LENGTH / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.07, LENGTH, 0.05]} />
        <meshLambertMaterial color="#5e676a" />
      </mesh>
      <group position={[0.25, 2.45, z]} scale={2.4}>
        <mesh>
          <boxGeometry args={[0.22, 0.16, 0.3]} />
          <meshLambertMaterial color={C.ink} />
        </mesh>
        <mesh position={[0.05, -0.2, 0]}>
          <boxGeometry args={[0.16, 0.2, 0.16]} />
          <meshLambertMaterial color="#1d3a2e" />
        </mesh>
        <mesh position={[0.15, -0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.045, 0.045, 0.06, 16]} />
          <meshLambertMaterial color="#111" />
        </mesh>
        <mesh position={[0.185, -0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
          <circleGeometry args={[0.03, 16]} />
          <meshBasicMaterial color={C.sproutLight} />
        </mesh>
      </group>
      {/* Lo ya recorrido por el raíl queda «leído»: una franja verde sobre la hilera */}
      <mesh position={[ROW_X - 0.2, 0.02, (z + -20) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, Math.max(0.01, -20 - z)]} />
        <meshBasicMaterial color={C.sproutLight} transparent opacity={0.55} />
      </mesh>
    </>
  );
}

export function Greenhouse() {
  const background = useMemo(() => new Color(C.sky), []);
  return (
    <>
      <primitive object={background} attach="background" />
      <fog attach="fog" args={[C.sky, 14, 60]} />
      <CameraRig />
      <hemisphereLight args={["#f3f7f8", "#b59f74", 1.25]} />
      <directionalLight position={[6, 12, 8]} intensity={1.5} />
      <Structure />
      <Plants />
      <Fruits />
      <Rail />
    </>
  );
}
