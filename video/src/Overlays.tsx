import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { type Crop, countedUntil, cropAt, LENGTH, poseAt, projector, railZ, T, WORLD } from "./scene";
import type { Texts } from "./texts";
import { C, FONT } from "./theme";

const fmt = (n: number, locale: string) => new Intl.NumberFormat(locale).format(n);

/**
 * Recuadros de detección sobre cada fruto maduro que se acerca. Se proyectan con la misma cámara
 * que la escena 3D, así que quedan pegados al fruto. Los ya contados se ven rellenos.
 */
export function Detections() {
  const frame = useCurrentFrame();
  if (frame < T.enter - 10 || frame >= T.rail) return null;
  const project = projector(frame);
  const camZ = poseAt(frame).pos[2];
  const boxes = WORLD.fruits.flatMap((f) => {
    if (!f.ripe) return [];
    const ahead = camZ - f.pos[2];
    if (ahead < -0.6 || ahead > 6) return [];
    const p = project(f.pos);
    if (!p || p.x < -40 || p.x > 1960 || p.y < -40 || p.y > 1120) return [];
    const half = f.crop === "cucumber" ? f.size * 0.6 : f.size * 1.4;
    const size = Math.max(10, (half / p.depth) * 1100);
    const tall = f.crop === "cucumber" ? 2.2 : 1;
    const appear = interpolate(ahead, [4.5, 6], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const counted = ahead < 1.6;
    return [{ id: f.id, x: p.x, y: p.y, w: size * (f.crop === "cucumber" ? 0.9 : 1), h: size * tall, appear, counted }];
  });
  return (
    <AbsoluteFill>
      <svg width="1920" height="1080" style={{ position: "absolute", inset: 0 }}>
        {boxes.map((b) => (
          <g key={b.id} opacity={b.appear}>
            <rect
              x={b.x - b.w / 2}
              y={b.y - b.h / 2}
              width={b.w}
              height={b.h}
              fill={b.counted ? "rgba(143,209,79,0.28)" : "none"}
              stroke={b.counted ? C.sproutLight : C.white}
              strokeWidth={b.counted ? 3 : 2}
              rx={3}
            />
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
}

const CROP_RULE: Record<Crop, "byColor" | "bySize"> = { tomato: "byColor", cucumber: "bySize", pepper: "byColor" };

/** Marcador de esquina: cultivo actual, cómo se decide la madurez y frutos maduros contados. */
export function CounterHud({ t, locale }: { t: Texts; locale: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < T.enter || frame >= T.rail) return null;
  const crop = cropAt(poseAt(frame).pos[2]);
  const enter = spring({ frame: frame - T.enter, fps, config: { damping: 20 } });
  return (
    <div
      style={{
        position: "absolute",
        top: 56,
        right: 64,
        background: "rgba(15,43,32,0.86)",
        color: C.paper,
        borderRadius: 18,
        padding: "22px 30px",
        fontFamily: FONT,
        minWidth: 330,
        transform: `translateY(${(1 - enter) * -30}px)`,
        opacity: enter,
      }}
    >
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "0.02em" }}>{t.crop[crop]}</div>
      <div style={{ fontSize: 20, opacity: 0.75, marginTop: 2 }}>{t[CROP_RULE[crop]]}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 14 }}>
        <span style={{ fontSize: 72, fontWeight: 850, fontStretch: "75%", fontVariantNumeric: "tabular-nums", lineHeight: 1, color: C.sproutLight }}>
          {fmt(countedUntil(frame), locale)}
        </span>
        <span style={{ fontSize: 24, fontWeight: 600 }}>{t.ripe}</span>
      </div>
    </div>
  );
}

/** «Recreación animada»: la escena no es una grabación real. */
export function RecreationTag({ t }: { t: Texts }) {
  return (
    <div style={{ position: "absolute", top: 60, left: 64, fontFamily: FONT, fontSize: 20, fontWeight: 600, color: C.ink, background: "rgba(241,244,236,0.85)", padding: "6px 14px", borderRadius: 999 }}>
      {t.recreation}
    </div>
  );
}

/** La vista se encoge dentro de un móvil: hoy se graba con el móvil del agricultor. */
export function PhoneFrame({ t }: { t: Texts }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < T.phone - 5 || frame >= T.rail) return null;
  const s = spring({ frame: frame - T.phone, fps, config: { damping: 18, stiffness: 90 } });
  // Del borde de la pantalla al tamaño de un móvil apaisado, centrado.
  const w = interpolate(s, [0, 1], [1920, 1180]);
  const h = interpolate(s, [0, 1], [1080, 620]);
  const r = interpolate(s, [0, 1], [0, 64]);
  const x = (1920 - w) / 2;
  const y = (1080 - h) / 2 - interpolate(s, [0, 1], [0, 40]);
  const blink = Math.floor(frame / 15) % 2 === 0;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: h,
          borderRadius: r,
          boxShadow: `0 0 0 ${interpolate(s, [0, 1], [0, 26])}px #101614, 0 0 0 3000px rgba(15,43,32,${0.92 * s})`,
        }}
      />
      <div style={{ position: "absolute", left: x + 34, top: y + 30, display: "flex", alignItems: "center", gap: 10, fontFamily: FONT, fontSize: 24, fontWeight: 700, color: C.white, opacity: s }}>
        <span style={{ width: 16, height: 16, borderRadius: 999, background: "#e5322b", opacity: blink ? 1 : 0.25 }} />
        {t.rec}
      </div>
    </AbsoluteFill>
  );
}

/** Con el raíl, cada tramo de la hilera recorrido muestra lo que se ha leído en él. */
export function RailLabels({ t, locale }: { t: Texts; locale: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < T.rail || frame >= T.railEnd) return null;
  const project = projector(frame);
  const z = railZ(frame);
  const stretch = LENGTH / 8;
  const labels = Array.from({ length: 8 }, (_, i) => i).flatMap((i) => {
    const center = -(i + 0.5) * stretch;
    if (center < z - 2 || center > -14) return [];
    const p = project([0.85, 2.1, center]);
    if (!p) return [];
    const fruits = WORLD.fruits.filter((f) => f.right && f.ripe && f.pos[2] <= -i * stretch && f.pos[2] > -(i + 1) * stretch).length;
    return [{ i, x: p.x, y: p.y, fruits }];
  });
  const soon = spring({ frame: frame - T.rail, fps, config: { damping: 20 } });
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      {labels.map((l) => (
        <div
          key={l.i}
          style={{
            position: "absolute",
            left: l.x,
            top: l.y,
            transform: "translate(-50%, -100%)",
            background: "rgba(15,43,32,0.88)",
            color: C.paper,
            padding: "8px 14px",
            borderRadius: 10,
            fontSize: 22,
            fontWeight: 700,
            whiteSpace: "nowrap",
            borderLeft: `5px solid ${C.sproutLight}`,
          }}
        >
          T{l.i + 1} · {fmt(l.fruits, locale)} {t.chips[0]}
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          top: 56,
          right: 64,
          background: C.amber,
          color: C.ink,
          padding: "10px 22px",
          borderRadius: 999,
          fontSize: 28,
          fontWeight: 800,
          opacity: soon,
          transform: `scale(${0.8 + 0.2 * soon})`,
        }}
      >
        {t.soon}
      </div>
    </AbsoluteFill>
  );
}
