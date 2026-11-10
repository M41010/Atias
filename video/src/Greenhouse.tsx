import { useThree } from "@react-three/fiber";
import { type ReactNode, useLayoutEffect, useMemo, useRef } from "react";
import { useCurrentFrame } from "remotion";
import {
  CapsuleGeometry,
  Color,
  type DirectionalLight,
  DoubleSide,
  Euler,
  type InstancedMesh,
  LatheGeometry,
  Matrix4,
  type PerspectiveCamera,
  Quaternion,
  RGBADepthPacking,
  type Texture,
  Vector2,
  Vector3,
} from "three";
import { type Crop, LENGTH, poseAt, railZ, ROW_X, SPAN, T, WALL, WORLD } from "./scene";
import { groundCoverTexture, leafTexture, soilTexture } from "./textures";
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

/** El sol entra de lado por el plástico; su caja de sombras acompaña a la cámara. */
function Sun() {
  const frame = useCurrentFrame();
  const ref = useRef<DirectionalLight>(null);
  const z = poseAt(frame).pos[2];
  useLayoutEffect(() => {
    const light = ref.current;
    if (!light) return;
    light.position.set(7, 11, z + 4);
    light.target.position.set(0, 0, z - 6);
    light.target.updateMatrixWorld();
    const cam = light.shadow.camera;
    cam.left = -9;
    cam.right = 9;
    cam.top = 12;
    cam.bottom = -12;
    cam.near = 1;
    cam.far = 40;
    cam.updateProjectionMatrix();
  });
  return (
    <directionalLight
      ref={ref}
      intensity={2.4}
      color="#fff6e6"
      castShadow
      shadow-mapSize={new Vector2(2048, 2048)}
      shadow-bias={-0.0004}
      shadow-normalBias={0.02}
    />
  );
}

type Instance = { pos: [number, number, number]; scale: [number, number, number]; rot?: [number, number, number]; tint?: string };

/** Muchas piezas iguales en una sola llamada de dibujo: imprescindible para miles de hojas. */
function Instances({ items, children, shadows = true }: { items: Instance[]; children: ReactNode; shadows?: boolean }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new Matrix4();
    const q = new Quaternion();
    const e = new Euler();
    const color = new Color();
    items.forEach((it, i) => {
      e.set(...(it.rot ?? [0, 0, 0]), "YXZ");
      q.setFromEuler(e);
      m.compose(new Vector3(...it.pos), q, new Vector3(...it.scale));
      mesh.setMatrixAt(i, m);
      if (it.tint) mesh.setColorAt(i, color.set(it.tint));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [items]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, items.length]} frustumCulled={false} castShadow={shadows} receiveShadow>
      {children}
    </instancedMesh>
  );
}

/** Material de hoja: silueta recortada, también en la sombra (si no, las sombras serían cuadradas). */
function LeafMaterial({ map }: { map: Texture }) {
  return (
    <>
      <meshStandardMaterial map={map} alphaTest={0.5} side={DoubleSide} roughness={0.75} metalness={0} />
      <meshDepthMaterial attach="customDepthMaterial" depthPacking={RGBADepthPacking} map={map} alphaTest={0.5} />
    </>
  );
}

const LEAF_TINTS = ["#ffffff", "#e8f2dc", "#d5e6c4", "#f3f7e9", "#c9dcb5"];

function Plants() {
  const textures = useMemo(
    () => ({ tomato: leafTexture("tomato"), cucumber: leafTexture("cucumber"), pepper: leafTexture("pepper") }),
    [],
  );
  const groups = useMemo(() => {
    const leaves: Record<Crop, Instance[]> = { tomato: [], cucumber: [], pepper: [] };
    const stems: Instance[] = [];
    const twine: Instance[] = [];
    for (const p of WORLD.plants) {
      p.leaves.forEach((l) =>
        leaves[p.crop].push({
          pos: l.pos,
          rot: l.rot,
          scale: [l.size, l.size, l.size],
          tint: LEAF_TINTS[Math.floor(l.shade * LEAF_TINTS.length)],
        }),
      );
      if (p.side) continue;
      stems.push({ pos: [p.pos[0], p.height / 2, p.pos[2]], scale: [1, p.height, 1] });
      // Hilo de entutorado del alambre al pie de la planta (tomate y pepino).
      if (p.crop !== "pepper") twine.push({ pos: [p.pos[0], 1.18, p.pos[2]], scale: [1, 2.35, 1] });
    }
    return { leaves, stems, twine };
  }, []);
  return (
    <>
      <Instances items={groups.stems}>
        <cylinderGeometry args={[0.009, 0.014, 1, 6]} />
        <meshStandardMaterial color={C.stem} roughness={0.8} />
      </Instances>
      <Instances items={groups.twine} shadows={false}>
        <cylinderGeometry args={[0.0025, 0.0025, 1, 3]} />
        <meshStandardMaterial color="#d8cfb4" roughness={0.9} />
      </Instances>
      {(Object.keys(groups.leaves) as Crop[]).map((crop) => (
        <Instances key={crop} items={groups.leaves[crop]}>
          <planeGeometry args={[1, 1]} />
          <LeafMaterial map={textures[crop]} />
        </Instances>
      ))}
    </>
  );
}

/** Pimiento: perfil de campana girado (más ancho arriba, con hombros). */
function pepperGeometry() {
  const profile = [
    [0.0, -1.1], [0.45, -1.0], [0.75, -0.7], [0.9, -0.2], [0.95, 0.35], [0.9, 0.75], [0.6, 0.98], [0.2, 1.02], [0.0, 1.0],
  ].map(([x, y]) => new Vector2(x, y));
  return new LatheGeometry(profile, 18);
}

function Fruits() {
  const shapes = useMemo(
    () => ({
      cucumber: new CapsuleGeometry(1, 0.25, 6, 10),
      pepper: pepperGeometry(),
    }),
    [],
  );
  const groups = useMemo(() => {
    const byKey = new Map<string, { color: string; kind: "tomato" | "cucumber" | "pepper"; items: Instance[] }>();
    const calyx: Instance[] = [];
    for (const f of WORLD.fruits) {
      const kind = f.crop;
      const key = `${kind}-${f.color}`;
      if (!byKey.has(key)) byKey.set(key, { color: f.color, kind, items: [] });
      const scale: [number, number, number] =
        kind === "tomato" ? [f.size, f.size * 0.88, f.size]
          : kind === "cucumber" ? [0.028, f.size / 2.25, 0.028]
            : [f.size * 0.85, f.size, f.size * 0.85];
      byKey.get(key)?.items.push({ pos: f.pos, scale, rot: [0, f.id % 7, kind === "cucumber" ? 0.12 : (f.id % 5) * 0.08] });
      if (kind === "tomato") calyx.push({ pos: [f.pos[0], f.pos[1] + f.size * 0.86, f.pos[2]], scale: [f.size * 0.75, f.size * 0.25, f.size * 0.75], rot: [0, f.id, 0] });
    }
    return { fruits: [...byKey.values()], calyx };
  }, []);
  return (
    <>
      {groups.fruits.map((g) => (
        <Instances key={`${g.kind}-${g.color}`} items={g.items}>
          {g.kind === "tomato" ? <sphereGeometry args={[1, 16, 12]} /> : <primitive object={shapes[g.kind]} attach="geometry" />}
          {/* La piel de tomate y pimiento brilla; la del pepino es mate. */}
          <meshPhysicalMaterial
            color={g.color}
            roughness={g.kind === "cucumber" ? 0.6 : 0.28}
            clearcoat={g.kind === "cucumber" ? 0 : 0.7}
            clearcoatRoughness={0.25}
          />
        </Instances>
      ))}
      <Instances items={groups.calyx} shadows={false}>
        <coneGeometry args={[1, 1, 5]} />
        <meshStandardMaterial color="#3d6f2a" roughness={0.8} />
      </Instances>
    </>
  );
}

/** El invernadero: tres naves de plástico, arcos, pilares, suelo enarenado, malla y goteros. */
function Structure() {
  const ribs = useMemo(() => Array.from({ length: Math.floor(LENGTH / 3) + 1 }, (_, i) => -i * 3), []);
  const soil = useMemo(() => soilTexture(), []);
  const cover = useMemo(() => groundCoverTexture(), []);
  const plastic = { color: C.plastic, transparent: true, opacity: 0.42, side: DoubleSide, depthWrite: false, roughness: 0.4 };
  const rowsX = [-SPAN - ROW_X, -SPAN + ROW_X, -ROW_X, ROW_X, SPAN - ROW_X, SPAN + ROW_X];
  return (
    <>
      {/* Suelo enarenado */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -LENGTH / 2 + 10]} receiveShadow>
        <planeGeometry args={[80, LENGTH + 80]} />
        <meshStandardMaterial map={soil} roughness={1} />
      </mesh>
      {/* Malla blanca bajo cada hilera y gotero negro a lo largo */}
      {rowsX.map((x) => (
        <group key={`row-${x}`}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.004, -LENGTH / 2]} receiveShadow>
            <planeGeometry args={[0.7, LENGTH]} />
            <meshStandardMaterial map={cover} roughness={0.95} />
          </mesh>
          <mesh position={[x + (x > 0 ? -0.12 : 0.12), 0.012, -LENGTH / 2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.008, 0.008, LENGTH, 6]} />
            <meshStandardMaterial color="#1b1d1c" roughness={0.5} />
          </mesh>
        </group>
      ))}
      {/* Cubierta: medio cilindro por nave */}
      {[-SPAN, 0, SPAN].map((x) => (
        <mesh key={`roof-${x}`} position={[x, WALL, -LENGTH / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[SPAN / 2, SPAN / 2, LENGTH, 32, 1, true, -Math.PI / 2, Math.PI]} />
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
          <circleGeometry args={[SPAN / 2, 32, 0, Math.PI]} />
          <meshStandardMaterial {...plastic} />
        </mesh>
      ))}
      {/* Arcos galvanizados y pilares cada 3 m */}
      {ribs.map((z) =>
        [-SPAN, 0, SPAN].map((x) => (
          <mesh key={`rib-${z}-${x}`} position={[x, WALL, z]} castShadow>
            <torusGeometry args={[SPAN / 2, 0.022, 6, 32, Math.PI]} />
            <meshStandardMaterial color="#c7cdd0" metalness={0.6} roughness={0.35} />
          </mesh>
        )),
      )}
      {ribs.map((z) =>
        [-SPAN * 1.5, -SPAN / 2, SPAN / 2, SPAN * 1.5].map((x) => (
          <mesh key={`post-${z}-${x}`} position={[x, WALL / 2, z]} castShadow>
            <cylinderGeometry args={[0.035, 0.035, WALL, 8]} />
            <meshStandardMaterial color="#b9c0c3" metalness={0.6} roughness={0.35} />
          </mesh>
        )),
      )}
      {/* Marco de la puerta */}
      {[-0.6, 0.6].map((x) => (
        <mesh key={`door-${x}`} position={[x, WALL / 2, 0.01]}>
          <boxGeometry args={[0.06, WALL, 0.06]} />
          <meshStandardMaterial color="#9aa3a6" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      {/* Alambres de entutorado sobre las hileras del pasillo central */}
      {[-ROW_X, ROW_X].map((x) => (
        <mesh key={`wire-${x}`} position={[x, 2.35, -LENGTH / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.004, 0.004, LENGTH, 4]} />
          <meshStandardMaterial color="#8a9396" metalness={0.5} />
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
      <mesh position={[0.25, 2.62, -LENGTH / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <boxGeometry args={[0.07, LENGTH, 0.05]} />
        <meshStandardMaterial color="#9ea6a9" metalness={0.7} roughness={0.3} />
      </mesh>
      <group position={[0.25, 2.45, z]} scale={2.4}>
        <mesh castShadow>
          <boxGeometry args={[0.22, 0.16, 0.3]} />
          <meshStandardMaterial color="#e9ece6" roughness={0.4} />
        </mesh>
        <mesh position={[0.05, -0.2, 0]} castShadow>
          <boxGeometry args={[0.16, 0.2, 0.16]} />
          <meshStandardMaterial color={C.ink} roughness={0.5} />
        </mesh>
        <mesh position={[0.15, -0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.045, 0.045, 0.06, 20]} />
          <meshStandardMaterial color="#111" metalness={0.4} roughness={0.2} />
        </mesh>
        <mesh position={[0.185, -0.22, 0]} rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[0.03, 20]} />
          <meshBasicMaterial color={C.sproutLight} />
        </mesh>
      </group>
      {/* Lo ya recorrido por el raíl queda «leído»: una franja verde sobre la malla */}
      <mesh position={[ROW_X - 0.2, 0.02, (z + -20) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, Math.max(0.01, -20 - z)]} />
        <meshBasicMaterial color={C.sproutLight} transparent opacity={0.55} />
      </mesh>
    </>
  );
}

export function Greenhouse() {
  const background = useMemo(() => new Color("#e6eef1"), []);
  return (
    <>
      <primitive object={background} attach="background" />
      <fog attach="fog" args={["#e8eff1", 16, 62]} />
      <CameraRig />
      {/* Luz difusa del plástico: mucha luz de cielo y algo de rebote cálido del suelo */}
      <hemisphereLight args={["#f6fafb", "#b8a27a", 1.35]} />
      <ambientLight intensity={0.25} />
      <Sun />
      <Structure />
      <Plants />
      <Fruits />
      <Rail />
    </>
  );
}
