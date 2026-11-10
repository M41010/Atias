import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import { seeded } from "./world";

/**
 * Texturas dibujadas por código: siempre iguales, sin imágenes externas. Las hojas llevan canal
 * alfa con su silueta (tomate dentado, pepino palmeado, pimiento ovalado) y los nervios marcados.
 */

function canvas(size: number) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  return { c, g: c.getContext("2d") as CanvasRenderingContext2D };
}

function finish(c: HTMLCanvasElement, repeat?: [number, number]) {
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
    t.repeat.set(...repeat);
  }
  t.needsUpdate = true;
  return t;
}

/** Silueta de una hoja de punta (0,-1) a base (0,1), con dientes si se pide. */
function leafPath(g: CanvasRenderingContext2D, s: number, kind: "tomato" | "cucumber" | "pepper") {
  const cx = s / 2;
  g.beginPath();
  if (kind === "cucumber") {
    // Palmeada: cinco lóbulos poco marcados.
    const r = s * 0.46;
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.05) {
      const lobe = 1 - 0.13 * Math.abs(Math.sin(a * 2.5));
      const tooth = 1 - 0.03 * Math.abs(Math.sin(a * 22));
      const x = cx + Math.sin(a) * r * lobe * tooth;
      const y = s * 0.5 - Math.cos(a) * r * lobe * tooth;
      if (a === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
  } else {
    const width = kind === "tomato" ? 0.36 : 0.3;
    const teeth = kind === "tomato" ? 9 : 0;
    const points: [number, number][] = [];
    for (let i = 0; i <= 40; i += 1) {
      const t = i / 40;
      const y = s * (0.04 + t * 0.92);
      const shape = Math.sin(Math.PI * Math.pow(t, kind === "tomato" ? 0.8 : 0.7));
      const tooth = teeth ? 1 + 0.12 * Math.abs(Math.sin(t * Math.PI * teeth)) : 1;
      points.push([s * width * shape * tooth, y]);
    }
    g.moveTo(cx, points[0][1]);
    for (const [w, y] of points) g.lineTo(cx + w, y);
    for (const [w, y] of [...points].reverse()) g.lineTo(cx - w, y);
  }
  g.closePath();
}

export function leafTexture(kind: "tomato" | "cucumber" | "pepper") {
  const s = 256;
  const { c, g } = canvas(s);
  const random = seeded(kind.length * 31);
  leafPath(g, s, kind);
  g.save();
  g.clip();
  const base = { tomato: ["#4f8f3a", "#2f6a27"], cucumber: ["#4c8a37", "#2c5f24"], pepper: ["#4a8c34", "#295a20"] }[kind];
  const grad = g.createLinearGradient(0, 0, s, s);
  grad.addColorStop(0, base[0]);
  grad.addColorStop(1, base[1]);
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  // Manchas suaves: la hoja no es de un color plano.
  for (let i = 0; i < 70; i += 1) {
    g.fillStyle = `rgba(${random() < 0.5 ? "255,255,220" : "0,30,0"},${0.035 + random() * 0.04})`;
    g.beginPath();
    g.arc(random() * s, random() * s, 6 + random() * 20, 0, Math.PI * 2);
    g.fill();
  }
  // Nervios: el central y los laterales.
  g.strokeStyle = "rgba(205,230,170,0.55)";
  g.lineWidth = 3;
  g.beginPath();
  if (kind === "cucumber") {
    for (let a = -1.2; a <= 1.21; a += 0.6) {
      g.moveTo(s / 2, s * 0.92);
      g.lineTo(s / 2 + Math.sin(a) * s * 0.42, s * 0.5 - Math.cos(a) * s * 0.36);
    }
  } else {
    g.moveTo(s / 2, s * 0.05);
    g.lineTo(s / 2, s * 0.96);
    g.lineWidth = 2;
    for (let y = s * 0.2; y < s * 0.85; y += s * 0.1) {
      g.moveTo(s / 2, y + s * 0.06);
      g.lineTo(s / 2 + s * 0.2, y - s * 0.02);
      g.moveTo(s / 2, y + s * 0.06);
      g.lineTo(s / 2 - s * 0.2, y - s * 0.02);
    }
  }
  g.stroke();
  g.restore();
  return finish(c);
}

/** Arena del pasillo con grano y huellas. */
export function soilTexture() {
  const s = 512;
  const { c, g } = canvas(s);
  const random = seeded(7);
  g.fillStyle = "#c8b48a";
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 9000; i += 1) {
    const v = random();
    g.fillStyle = v < 0.5 ? `rgba(120,95,60,${0.15 + random() * 0.2})` : `rgba(240,228,200,${0.15 + random() * 0.25})`;
    g.fillRect(random() * s, random() * s, 1 + random() * 2.5, 1 + random() * 2.5);
  }
  for (let i = 0; i < 40; i += 1) {
    g.fillStyle = `rgba(90,70,45,${0.06 + random() * 0.06})`;
    g.beginPath();
    g.ellipse(random() * s, random() * s, 10 + random() * 30, 6 + random() * 14, random() * 3, 0, Math.PI * 2);
    g.fill();
  }
  return finish(c, [6, 70]);
}

/** Malla blanca de suelo que se pone bajo las hileras. */
export function groundCoverTexture() {
  const s = 256;
  const { c, g } = canvas(s);
  g.fillStyle = "#e7e9e3";
  g.fillRect(0, 0, s, s);
  g.strokeStyle = "rgba(150,155,145,0.35)";
  g.lineWidth = 1;
  for (let i = 0; i < s; i += 6) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i, s);
    g.moveTo(0, i);
    g.lineTo(s, i);
    g.stroke();
  }
  return finish(c, [1, 120]);
}
