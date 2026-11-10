import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Texts } from "./texts";
import { C, FONT } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Rótulo inferior: entra y sale con suavidad dentro de su intervalo. */
export function Caption({ text, from, to, dark = false }: { text: string; from: number; to: number; dark?: boolean }) {
  const frame = useCurrentFrame();
  if (frame < from || frame >= to) return null;
  const opacity = interpolate(frame, [from, from + 10, to - 10, to], [0, 1, 1, 0], clamp);
  const lift = interpolate(frame, [from, from + 14], [24, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 72,
        display: "flex",
        justifyContent: "center",
        opacity,
        transform: `translateY(${lift}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontSize: 52,
          fontWeight: 800,
          fontStretch: "80%",
          letterSpacing: "-0.005em",
          lineHeight: 1.1,
          maxWidth: 1500,
          textAlign: "center",
          color: dark ? C.paper : C.ink,
          background: dark ? "rgba(15,43,32,0.0)" : "rgba(241,244,236,0.92)",
          padding: dark ? 0 : "18px 34px",
          borderRadius: 18,
          textWrap: "balance",
        }}
      >
        {text}
      </div>
    </div>
  );
}

// ---- Logo ----

const ARCHES = "M3 33A7 12 0 0 1 17 33A7 12 0 0 1 31 33A7 12 0 0 1 45 33";
const BASE = "M1.5 33H46.5M3 33v9M17 33v9M31 33v9M45 33v9";

/** El símbolo de la Nave dibujándose: arcos, suelo y marcas, y el punto de medida al final. */
export function NaveDraw({ progress, dot, size = 360 }: { progress: number; dot: number; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 6.5 48 48" fill="none">
      <path d={ARCHES} stroke={C.paper} strokeWidth={3} strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, progress * 1.4)} />
      <path d={BASE} stroke={C.paper} strokeWidth={3} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.max(0, Math.min(1, (progress - 0.45) / 0.55))} />
      <circle cx={24} cy={27.3} r={3.2 * dot} fill={C.sproutLight} />
    </svg>
  );
}

/** Logotipo: la nave central hace de A delante de «TIAS». */
function Wordmark({ size }: { size: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", fontFamily: FONT, fontSize: size, fontWeight: 800, fontStretch: "88%", letterSpacing: "0.06em", color: C.paper, lineHeight: 1 }}>
      <svg viewBox="15.5 19.5 17 13.5" style={{ height: "0.715em", width: "auto", marginRight: "0.06em" }} fill="none">
        <path d="M17 33A7 12 0 0 1 31 33" stroke={C.paper} strokeWidth={3} />
        <circle cx={24} cy={27.3} r={3.2} fill={C.sproutLight} />
      </svg>
      <span>TIAS</span>
    </span>
  );
}

export function LogoEnd({ t, from }: { t: Texts; from: number }) {
  const frame = useCurrentFrame() - from;
  const { fps } = useVideoConfig();
  const progress = interpolate(frame, [6, 60], [0, 1], clamp);
  const dot = spring({ frame: frame - 58, fps, config: { damping: 9, stiffness: 140 } });
  const word = spring({ frame: frame - 70, fps, config: { damping: 18 } });
  const tag = interpolate(frame, [95, 115], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: C.ink, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 18 }}>
      <NaveDraw progress={progress} dot={dot} size={300} />
      <div style={{ opacity: word, transform: `translateY(${(1 - word) * 20}px)` }}>
        <Wordmark size={120} />
      </div>
      <div style={{ opacity: tag, fontFamily: FONT, fontSize: 40, fontWeight: 500, color: C.paper, letterSpacing: "0.01em" }}>{t.tagline}</div>
    </AbsoluteFill>
  );
}

// ---- La app ----

export type Screen = { file: string; caption: string; focus: { x: number; y: number; zoom: number }[] };

/** Ventana de navegador con capturas reales de la app, recorridas con un zoom lento. */
export function AppShowcase({ screens, t, from, each }: { screens: Screen[]; t: Texts; from: number; each: number }) {
  const frame = useCurrentFrame() - from;
  const { fps } = useVideoConfig();
  const index = Math.min(screens.length - 1, Math.floor(frame / each));
  const open = spring({ frame, fps, config: { damping: 20 } });
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <div
        style={{
          position: "absolute",
          left: 110,
          right: 110,
          top: 64,
          bottom: 210,
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(15,43,32,0.28)",
          background: C.white,
          transform: `scale(${0.92 + 0.08 * open})`,
          opacity: open,
        }}
      >
        <div style={{ height: 52, background: "#e6eae4", display: "flex", alignItems: "center", gap: 10, padding: "0 22px" }}>
          {["#e0675d", "#e9b54a", "#6cb35a"].map((c) => <span key={c} style={{ width: 14, height: 14, borderRadius: 999, background: c }} />)}
          <span style={{ marginLeft: 22, fontFamily: FONT, fontSize: 20, color: C.inkSoft, background: C.white, borderRadius: 8, padding: "6px 18px" }}>
            app.atias · {t.sample}
          </span>
        </div>
        <div style={{ position: "absolute", top: 52, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
          {screens.map((s, i) => {
            if (Math.abs(i - index) > 1) return null;
            const start = i * each;
            const opacity = interpolate(frame, [start - 8, start + 8, start + each - 8, start + each + 8], [0, 1, 1, i === screens.length - 1 ? 1 : 0], clamp);
            const p = interpolate(frame, [start, start + each], [0, 1], clamp);
            const [a, b] = [s.focus[0], s.focus[s.focus.length - 1]];
            const zoom = a.zoom + (b.zoom - a.zoom) * p;
            const x = a.x + (b.x - a.x) * p;
            const y = a.y + (b.y - a.y) * p;
            return (
              <Img
                key={s.file}
                src={staticFile(`app/${s.file}`)}
                style={{
                  position: "absolute",
                  width: "100%",
                  top: 0,
                  left: 0,
                  opacity,
                  transformOrigin: "0 0",
                  transform: `scale(${zoom}) translate(${-x}%, ${-y}%)`,
                }}
              />
            );
          })}
        </div>
      </div>
      <Caption text={screens[index].caption} from={from + index * each + 4} to={from + (index + 1) * each - 2} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 40, textAlign: "center", fontFamily: FONT, fontSize: 18, color: C.inkSoft, opacity: 0.8 }}>
        {t.sample}
      </div>
    </AbsoluteFill>
  );
}

// ---- Transición: los datos del invernadero viajan a la app ----

export function ToApp({ t, from, locale }: { t: Texts; from: number; locale: string }) {
  const frame = useCurrentFrame() - from;
  const { fps } = useVideoConfig();
  const values = ["4.589", "486 kg", "T3 · 52 kg", "14"];
  const fmtLocale = (v: string) => (locale === "en" ? v.replace(".", ",") : v);
  const target = { x: 960, y: 520 };
  const screen = spring({ frame: frame - 20, fps, config: { damping: 18 } });
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      {/* Pantalla de la cooperativa que recibe los datos */}
      <div
        style={{
          position: "absolute",
          left: target.x - 360 * screen,
          top: target.y - 210 * screen,
          width: 720 * screen,
          height: 420 * screen,
          borderRadius: 18,
          background: C.paper,
          opacity: screen,
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          overflow: "hidden",
        }}
      >
        <Img src={staticFile("app/resumen.png")} style={{ width: "100%", opacity: interpolate(frame, [40, 80], [0, 0.55], clamp) }} />
      </div>
      {values.map((v, i) => {
        const start = 6 + i * 9;
        const p = interpolate(frame, [start, start + 55], [0, 1], { ...clamp, easing: (x) => 1 - (1 - x) ** 3 });
        const sx = [260, 1660, 380, 1540][i];
        const sy = [250, 300, 820, 840][i];
        // Cada dato aterriza en una esquina de la pantalla de la cooperativa y se queda.
        const tx = target.x + [-200, 200, -200, 200][i];
        const ty = target.y + [-110, -110, 110, 110][i];
        const x = sx + (tx - sx) * p;
        const y = sy + (ty - sy) * p;
        const opacity = interpolate(frame, [start, start + 8, 150, 175], [0, 1, 1, 0], clamp);
        return (
          <div
            key={v}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `translate(-50%, -50%) scale(${1 - 0.3 * p})`,
              opacity,
              fontFamily: FONT,
              background: C.ink,
              border: `2px solid ${C.sproutLight}`,
              color: C.paper,
              borderRadius: 14,
              padding: "14px 24px",
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ fontSize: 48, fontWeight: 850, fontStretch: "78%", color: C.sproutLight, lineHeight: 1 }}>{fmtLocale(v)}</div>
            <div style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>{t.chips[i]}</div>
          </div>
        );
      })}
      <Caption text={t.toApp} from={from + 4} to={from + 178} dark />
    </AbsoluteFill>
  );
}
