import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  CapsuleGeometry,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Euler,
  Fog,
  HemisphereLight,
  InstancedMesh,
  LatheGeometry,
  type Material,
  Matrix4,
  Mesh,
  MeshDepthMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  RGBADepthPacking,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  type Texture,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { groundCoverTexture, leafTexture, soilTexture } from "./textures";
import { buildWorld, type Crop, LENGTH, poseAt, ROW_X, SPAN, WALL, walkZ, WALK } from "./world";

/**
 * Motor del recorrido: dibuja el invernadero con three.js y mueve la cámara según el avance del
 * scroll. Solo dibuja cuando el avance cambia (no gasta batería si no se mueve) y, en móvil, con
 * menos hojas, sin sombras y a menor resolución.
 */
export type TourOptions = {
  canvas: HTMLCanvasElement;
  /** Lienzo 2D encima, para los recuadros de detección. */
  overlay: HTMLCanvasElement;
  lite: boolean;
  onCount: (counted: number) => void;
};

export type Tour = { setProgress: (progress: number) => void; resize: () => void; dispose: () => void };

type Instance = { pos: [number, number, number]; scale: [number, number, number]; rot?: [number, number, number]; tint?: string };

const LEAF_TINTS = ["#ffffff", "#e8f2dc", "#d5e6c4", "#f3f7e9", "#c9dcb5"];
const DETECT = "#8fd14f";

export function createTour({ canvas, overlay, lite, onCount }: TourOptions): Tour {
  const renderer = new WebGLRenderer({ canvas, antialias: !lite, powerPreference: "high-performance" });
  renderer.outputColorSpace = SRGBColorSpace;
  let pixelRatio = Math.min(window.devicePixelRatio, lite ? 1.25 : 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.shadowMap.enabled = !lite;
  renderer.shadowMap.type = PCFSoftShadowMap;

  const scene = new Scene();
  scene.background = new Color("#e6eef1");
  const FOG_END = lite ? 34 : 48;
  scene.fog = new Fog("#e8eff1", 12, FOG_END);
  // Más allá de la niebla no se ve nada: tampoco se dibuja.
  const camera = new PerspectiveCamera(52, 16 / 9, 0.05, FOG_END + 2);

  scene.add(new HemisphereLight("#f6fafb", "#b8a27a", 1.35));
  scene.add(new AmbientLight("#ffffff", 0.25));
  const sun = new DirectionalLight("#fff6e6", 2.4);
  sun.castShadow = !lite;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 12, bottom: -12, near: 1, far: 40 });
  scene.add(sun, sun.target);

  const disposables: { dispose: () => void }[] = [];
  const keep = <T extends { dispose: () => void }>(item: T) => {
    disposables.push(item);
    return item;
  };

  const world = buildWorld({ dense: lite ? 0.5 : 1, sideNaves: !lite });

  // ---- Piezas repetidas: una sola llamada de dibujo para miles de hojas ----
  const m = new Matrix4();
  const q = new Quaternion();
  const e = new Euler();
  const v = new Vector3();
  const s = new Vector3();
  const tint = new Color();
  // Una sola malla por tipo de pieza: en el móvil cuesta más cada llamada de dibujo que cada hoja.
  // (Probado: repartirla en tramos de la hilera para descartar los que no se ven iba más lento.)
  const instances = (geometry: BufferGeometry, material: Material, items: Instance[], shadows = true) => {
    const mesh = new InstancedMesh(keep(geometry), keep(material), items.length);
    items.forEach((it, i) => {
      e.set(...(it.rot ?? [0, 0, 0]), "YXZ");
      q.setFromEuler(e);
      m.compose(v.set(...it.pos), q, s.set(...it.scale));
      mesh.setMatrixAt(i, m);
      if (it.tint) mesh.setColorAt(i, tint.set(it.tint));
    });
    mesh.castShadow = shadows && !lite;
    mesh.receiveShadow = !lite;
    scene.add(mesh);
    return [mesh];
  };

  // Plantas: tallos, hilos de entutorado y hojas recortadas (también en la sombra).
  const leaves: Record<Crop, Instance[]> = { tomato: [], cucumber: [], pepper: [] };
  const stems: Instance[] = [];
  const twine: Instance[] = [];
  for (const p of world.plants) {
    for (const l of p.leaves) {
      leaves[p.crop].push({ pos: l.pos, rot: l.rot, scale: [l.size, l.size, l.size], tint: LEAF_TINTS[Math.floor(l.shade * LEAF_TINTS.length)] });
    }
    if (p.side) continue;
    stems.push({ pos: [p.pos[0], p.height / 2, p.pos[2]], scale: [1, p.height, 1] });
    if (p.crop !== "pepper") twine.push({ pos: [p.pos[0], 1.18, p.pos[2]], scale: [1, 2.35, 1] });
  }
  instances(new CylinderGeometry(0.009, 0.014, 1, 6), new MeshStandardMaterial({ color: "#5d7a3a", roughness: 0.8 }), stems);
  instances(new CylinderGeometry(0.0025, 0.0025, 1, 3), new MeshStandardMaterial({ color: "#d8cfb4", roughness: 0.9 }), twine, false);
  for (const crop of Object.keys(leaves) as Crop[]) {
    const map: Texture = keep(leafTexture(crop));
    const meshes = instances(
      new PlaneGeometry(1, 1),
      new MeshStandardMaterial({ map, alphaTest: 0.5, side: DoubleSide, roughness: 0.75, metalness: 0 }),
      leaves[crop],
    );
    const depth = keep(new MeshDepthMaterial({ depthPacking: RGBADepthPacking, map, alphaTest: 0.5 }));
    for (const mesh of meshes) mesh.customDepthMaterial = depth;
  }

  // Frutos: tomate en esfera, pepino en cápsula y pimiento en campana; piel brillante salvo el pepino.
  const pepper = new LatheGeometry(
    [[0, -1.1], [0.45, -1.0], [0.75, -0.7], [0.9, -0.2], [0.95, 0.35], [0.9, 0.75], [0.6, 0.98], [0.2, 1.02], [0, 1]].map(([x, y]) => new Vector2(x, y)),
    lite ? 10 : 18,
  );
  const groups = new Map<string, { crop: Crop; color: string; items: Instance[] }>();
  const calyx: Instance[] = [];
  world.fruits.forEach((f, id) => {
    const key = `${f.crop}-${f.color}`;
    if (!groups.has(key)) groups.set(key, { crop: f.crop, color: f.color, items: [] });
    const scale: [number, number, number] =
      f.crop === "tomato" ? [f.size, f.size * 0.88, f.size] : f.crop === "cucumber" ? [0.028, f.size / 2.25, 0.028] : [f.size * 0.85, f.size, f.size * 0.85];
    groups.get(key)?.items.push({ pos: f.pos, scale, rot: [0, id % 7, f.crop === "cucumber" ? 0.12 : (id % 5) * 0.08] });
    if (f.crop === "tomato") calyx.push({ pos: [f.pos[0], f.pos[1] + f.size * 0.86, f.pos[2]], scale: [f.size * 0.75, f.size * 0.25, f.size * 0.75], rot: [0, id, 0] });
  });
  for (const g of groups.values()) {
    const geometry =
      g.crop === "tomato" ? new SphereGeometry(1, lite ? 10 : 16, lite ? 8 : 12) : g.crop === "cucumber" ? new CapsuleGeometry(1, 0.25, 6, 10) : pepper.clone();
    const material = lite
      ? new MeshStandardMaterial({ color: g.color, roughness: g.crop === "cucumber" ? 0.6 : 0.3 })
      : new MeshPhysicalMaterial({ color: g.color, roughness: g.crop === "cucumber" ? 0.6 : 0.28, clearcoat: g.crop === "cucumber" ? 0 : 0.7, clearcoatRoughness: 0.25 });
    instances(geometry, material, g.items);
  }
  pepper.dispose();
  instances(new ConeGeometry(1, 1, 5), new MeshStandardMaterial({ color: "#3d6f2a", roughness: 0.8 }), calyx, false);

  // Estructura: suelo enarenado, malla y goteros, cubierta de plástico, arcos, pilares y alambres.
  const add = (geometry: BufferGeometry, material: Material, pos: [number, number, number], rot: [number, number, number] = [0, 0, 0], shadow = false) => {
    const mesh = new Mesh(keep(geometry), keep(material));
    mesh.position.set(...pos);
    mesh.rotation.set(...rot);
    mesh.receiveShadow = !lite;
    mesh.castShadow = shadow && !lite;
    scene.add(mesh);
    return mesh;
  };
  const soil = keep(soilTexture());
  soil.repeat.set(6, 55);
  const cover = keep(groundCoverTexture());
  cover.repeat.set(1, 90);
  add(new PlaneGeometry(80, LENGTH + 80), new MeshStandardMaterial({ map: soil, roughness: 1 }), [0, 0, -LENGTH / 2 + 10], [-Math.PI / 2, 0, 0]);
  const rowsX = lite ? [-ROW_X, ROW_X] : [-SPAN - ROW_X, -SPAN + ROW_X, -ROW_X, ROW_X, SPAN - ROW_X, SPAN + ROW_X];
  const coverMaterial = new MeshStandardMaterial({ map: cover, roughness: 0.95 });
  const dripMaterial = new MeshStandardMaterial({ color: "#1b1d1c", roughness: 0.5 });
  for (const x of rowsX) {
    add(new PlaneGeometry(0.7, LENGTH), coverMaterial, [x, 0.004, -LENGTH / 2], [-Math.PI / 2, 0, 0]);
    add(new CylinderGeometry(0.008, 0.008, LENGTH, 6), dripMaterial, [x + (x > 0 ? -0.12 : 0.12), 0.012, -LENGTH / 2], [Math.PI / 2, 0, 0]);
  }
  const plastic = new MeshStandardMaterial({ color: "#f4f7f4", transparent: true, opacity: 0.42, side: DoubleSide, depthWrite: false, roughness: 0.4 });
  for (const x of [-SPAN, 0, SPAN]) {
    add(new CylinderGeometry(SPAN / 2, SPAN / 2, LENGTH, 32, 1, true, -Math.PI / 2, Math.PI), plastic, [x, WALL, -LENGTH / 2], [Math.PI / 2, 0, 0]);
  }
  for (const x of [-SPAN * 1.5, SPAN * 1.5]) add(new PlaneGeometry(LENGTH, WALL), plastic, [x, WALL / 2, -LENGTH / 2], [0, Math.PI / 2, 0]);
  const steel = new MeshStandardMaterial({ color: "#c7cdd0", metalness: 0.6, roughness: 0.35 });
  const rib = new TorusGeometry(SPAN / 2, 0.022, 6, 32, Math.PI);
  const post = new CylinderGeometry(0.035, 0.035, WALL, 8);
  keep(rib);
  keep(post);
  keep(steel);
  for (let z = 0; z > -LENGTH; z -= 3) {
    for (const x of [-SPAN, 0, SPAN]) {
      const mesh = new Mesh(rib, steel);
      mesh.position.set(x, WALL, z);
      mesh.castShadow = !lite;
      scene.add(mesh);
    }
    for (const x of [-SPAN * 1.5, -SPAN / 2, SPAN / 2, SPAN * 1.5]) {
      const mesh = new Mesh(post, steel);
      mesh.position.set(x, WALL / 2, z);
      mesh.castShadow = !lite;
      scene.add(mesh);
    }
  }
  const wire = new MeshStandardMaterial({ color: "#8a9396", metalness: 0.5 });
  for (const x of [-ROW_X, ROW_X]) add(new CylinderGeometry(0.004, 0.004, LENGTH, 4), wire, [x, 2.35, -LENGTH / 2], [Math.PI / 2, 0, 0]);
  // Puerta de la nave central.
  const frame = new MeshStandardMaterial({ color: "#9aa3a6", metalness: 0.5, roughness: 0.4 });
  for (const x of [-0.6, 0.6]) add(new BoxGeometry(0.06, WALL, 0.06), frame, [x, WALL / 2, 0.01]);
  for (const x of [-SPAN, 0, SPAN]) add(new CircleGeometry(SPAN / 2, 32, 0, Math.PI), plastic, [x, WALL, 0]);

  // ---- Dibujo ----
  const ctx = overlay.getContext("2d");
  let width = 1;
  let height = 1;
  let ratio = 1;
  let shown = -1;
  let counted = -1;
  // Frutos maduros ordenados por su posición en la hilera: en cada fotograma solo se miran los
  // cercanos a la cámara (búsqueda binaria), no los miles del invernadero.
  const ripe = world.fruits.filter((f) => f.ripe).sort((a, b) => a.pos[2] - b.pos[2]);
  const ripeZ = ripe.map((f) => f.pos[2]);
  /** Primer índice con z >= valor. */
  const firstAtLeast = (value: number) => {
    let lo = 0;
    let hi = ripeZ.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (ripeZ[mid] < value) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  /** Igual que countedAt(world, progress), sin recorrer todos los frutos. */
  const countedNow = (progress: number) => (progress <= 0 ? 0 : ripeZ.length - firstAtLeast(walkZ(progress) - 0.9 + 1e-9));
  const p = new Vector3();

  function drawDetections(progress: number) {
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    // Fuera de la hilera (vista de arriba) se apagan los recuadros.
    const fade = progress <= WALK ? 1 : Math.max(0, 1 - (progress - WALK) / 0.06);
    if (fade <= 0) return;
    const camZ = walkZ(progress);
    const focal = height / 2 / Math.tan((camera.fov * Math.PI) / 360);
    ctx.lineWidth = 2;
    // Solo los que están entre 6 m por delante y 0,6 m por detrás de la cámara.
    const end = firstAtLeast(camZ + 0.6 + 1e-9);
    for (let i = firstAtLeast(camZ - 6); i < end; i++) {
      const f = ripe[i];
      const ahead = camZ - f.pos[2];
      if (ahead < -0.6 || ahead > 6) continue;
      p.set(...f.pos).applyMatrix4(camera.matrixWorldInverse);
      const depth = -p.z;
      if (depth < 0.2) continue;
      p.set(...f.pos).project(camera);
      const x = ((p.x + 1) / 2) * width;
      const y = ((1 - p.y) / 2) * height;
      if (x < -40 || x > width + 40 || y < -40 || y > height + 40) continue;
      const half = f.crop === "cucumber" ? f.size * 0.6 : f.size * 1.4;
      const size = Math.max(6, (half / depth) * focal);
      const w = size * (f.crop === "cucumber" ? 0.9 : 1);
      const h = size * (f.crop === "cucumber" ? 2.2 : 1);
      const appear = Math.min(1, Math.max(0, (6 - ahead) / 1.5)) * fade;
      ctx.globalAlpha = appear;
      ctx.strokeStyle = ahead < 1.6 ? DETECT : "#ffffff";
      ctx.strokeRect(x - w / 2, y - h / 2, w, h);
      if (ahead < 1.6) {
        ctx.globalAlpha = appear * 0.28;
        ctx.fillStyle = DETECT;
        ctx.fillRect(x - w / 2, y - h / 2, w, h);
      }
    }
    ctx.globalAlpha = 1;
  }

  function render(progress: number) {
    const pose = poseAt(progress);
    camera.position.set(...pose.pos);
    camera.lookAt(...pose.target);
    camera.updateMatrixWorld();
    sun.position.set(7, 11, pose.pos[2] + 4);
    sun.target.position.set(0, 0, pose.pos[2] - 6);
    sun.target.updateMatrixWorld();
    renderer.render(scene, camera);
    drawDetections(progress);
    const n = countedNow(Math.min(progress, WALK));
    if (n !== counted) {
      counted = n;
      onCount(n);
    }
  }

  // El avance se suaviza hacia el del scroll y se deja de dibujar cuando llega.
  let target = 0;
  let current = 0;
  let frameId = 0;
  // Resolución adaptable: se mide el tiempo entre fotogramas mientras se mueve. Si la media pasa
  // de ~30 ms (menos de 33 imágenes por segundo), se baja un escalón la resolución, hasta 0,6.
  let lastFrame = 0;
  let slowSum = 0;
  let slowCount = 0;
  const adapt = (now: number) => {
    if (lastFrame && now - lastFrame < 200) {
      slowSum += now - lastFrame;
      slowCount += 1;
      if (slowCount >= 24) {
        if (slowSum / slowCount > 30 && pixelRatio > 0.6) {
          pixelRatio = Math.max(0.6, pixelRatio * 0.8);
          renderer.setPixelRatio(pixelRatio);
          renderer.setSize(width, height, false);
        }
        slowSum = 0;
        slowCount = 0;
      }
    }
    lastFrame = now;
  };
  const tick = (now: number) => {
    frameId = 0;
    adapt(now);
    const delta = target - current;
    current = Math.abs(delta) < 0.0004 ? target : current + delta * 0.14;
    if (current !== shown) {
      shown = current;
      render(current);
    }
    if (current !== target) frameId = requestAnimationFrame(tick);
  };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // En vertical se abre el ángulo para que quepa la hilera.
    camera.fov = width / height < 1 ? 68 : 52;
    camera.updateProjectionMatrix();
    ratio = Math.min(window.devicePixelRatio, lite ? 1.5 : 2);
    overlay.width = Math.round(width * ratio);
    overlay.height = Math.round(height * ratio);
    shown = -1;
    render(current);
  }

  resize();

  return {
    setProgress(progress: number) {
      target = Math.min(1, Math.max(0, progress));
      if (!frameId) frameId = requestAnimationFrame(tick);
    },
    resize,
    dispose() {
      if (frameId) cancelAnimationFrame(frameId);
      for (const item of disposables) item.dispose();
      renderer.dispose();
    },
  };
}
