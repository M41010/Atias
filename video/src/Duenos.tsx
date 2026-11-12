import { ThreeCanvas } from "@remotion/three";
import {
  AbsoluteFill,
  Easing,
  Html5Audio,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Greenhouse } from "./Greenhouse";
import { Detections, RecreationTag } from "./Overlays";
import { NaveDraw, Wordmark } from "./Parts";
import { countedUntil, cropAt, poseAt } from "./scene";
import { TEXTS } from "./texts";
import { C, FONT, loadFonts } from "./theme";

loadFonts();

/**
 * Vídeo para los dueños de la cooperativa: unos 86 s, solo en español, sin voz (rótulos grandes).
 * Pregunta de cada semana → el invernadero 3D del vídeo de presentación → las dos cifras que
 * importan → la app pantalla a pantalla (modo demostración) → logo.
 */

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const t = TEXTS.es;

// ---- Calendario, en fotogramas a 30 fps ----
const QUESTION = 0; // 0–8 s
const GREENHOUSE = 240; // 8–20 s
const VALUE = 600; // 20–30 s
const APP = 900; // 30–80 s
/** Fotograma del vídeo de presentación en el que empieza el tramo reutilizado (dentro de la hilera). */
const SOURCE_FROM = 120;
/** Dentro del tramo 3D: hasta aquí, solo se graba con el móvil; después, Atias cuenta. */
const COUNT_FROM = 150;

/** Valores de la pantalla Resumen en modo demostración (recolección 2–6 nov). */
const DEMO = { kilos: 11975, kilosMin: 9842, kilosMax: 14108, workers: 14, workersMax: 18 };

const LABEL = "Datos de prueba";

/** Un plano de la app: captura, encuadre inicial y final, y rótulo. Coordenadas sobre 2000×1125. */
type Rect = [number, number, number, number];
type Shot = { file: string; frames: number; caption: string; h: [Rect, Rect]; v: [Rect, Rect]; label?: string };

const PAGE: Rect = [0, 0, 2000, 1125];

const SHOTS: Shot[] = [
  {
    file: "resumen.png",
    frames: 180,
    caption: "Resumen: kilos para vender y temporeros, con su margen.",
    h: [PAGE, [530, 200, 1690, 445]],
    v: [[520, 60, 1700, 450], [530, 200, 1005, 445]],
  },
  {
    file: "resumen.png",
    frames: 180,
    caption: "La temporada, semana a semana: recogido frente a previsto.",
    h: [[530, 200, 1690, 445], [530, 700, 1690, 1040]],
    v: [[530, 200, 1005, 445], [530, 700, 1300, 1040]],
  },
  {
    file: "prevision.png",
    frames: 210,
    caption: "Kilos de cada día, junto a la previsión del técnico.",
    h: [[520, 60, 1700, 840], [530, 465, 1690, 830]],
    v: [[530, 465, 1690, 830], [530, 465, 1180, 830]],
  },
  {
    file: "invernadero-kilos.png",
    frames: 180,
    caption: "Cada invernadero: kilos por día, con su margen.",
    h: [[530, 60, 1700, 770], [540, 365, 1695, 765]],
    v: [[540, 365, 1695, 765], [540, 365, 1190, 765]],
  },
  {
    file: "invernadero-mapa.png",
    frames: 180,
    caption: "Mapa del invernadero: kilos por hilera y tramo.",
    h: [[540, 40, 1695, 670], [540, 40, 1695, 370]],
    v: [[540, 40, 1695, 370], [540, 40, 1170, 370]],
  },
  {
    file: "invernadero-tiempo.png",
    frames: 180,
    caption: "El tiempo de cada día ajusta la maduración.",
    h: [[540, 40, 1695, 830], [540, 40, 1695, 410]],
    v: [[540, 40, 1150, 410], [1150, 150, 1695, 410]],
  },
  {
    file: "produccion.png",
    frames: 180,
    caption: "Producción: kilos por semana y por mes, por variedad.",
    h: [[520, 60, 1700, 780], [530, 370, 1690, 780]],
    v: [[530, 370, 1690, 780], [530, 370, 1150, 780]],
  },
  {
    file: "precision.png",
    frames: 210,
    caption: "Precisión: el error semanal, frente al agricultor y al técnico.",
    h: [[530, 40, 1690, 830], [530, 40, 1690, 460]],
    v: [[540, 110, 1690, 450], [540, 110, 1200, 440]],
    label: "Datos de prueba: no indican la precisión real",
  },
];

const APP_FRAMES = SHOTS.reduce((sum, s) => sum + s.frames, 0); // 50 s
const LOGO = APP + APP_FRAMES; // 80 s
export const DURATION_DUENOS = LOGO + 180; // 86 s

const es = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export type DuenosProps = { musica: boolean };

export function AtiasDuenos({ musica }: DuenosProps) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      {musica && (
        <Html5Audio
          src={staticFile("musica/cancion.mp3")}
          volume={(f) => interpolate(f, [0, 30, DURATION_DUENOS - 80, DURATION_DUENOS - 5], [0, 0.6, 0.6, 0], clamp)}
        />
      )}
      <Sequence from={QUESTION} durationInFrames={GREENHOUSE - QUESTION} layout="none">
        <Question />
      </Sequence>
      <Sequence from={GREENHOUSE} durationInFrames={VALUE - GREENHOUSE} layout="none">
        <Recording />
      </Sequence>
      <Sequence from={VALUE} durationInFrames={APP - VALUE} layout="none">
        <Value />
      </Sequence>
      <Sequence from={APP} durationInFrames={LOGO - APP} layout="none">
        <AppTour />
      </Sequence>
      <Sequence from={LOGO} layout="none">
        <Logo />
      </Sequence>
      {/* Fundidos entre escenas */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: C.ink,
          opacity: Math.max(
            interpolate(frame, [GREENHOUSE - 12, GREENHOUSE, GREENHOUSE + 14], [0, 1, 0], clamp),
            interpolate(frame, [LOGO - 14, LOGO, LOGO + 4], [0, 1, 0], clamp),
          ),
        }}
      />
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: C.paper,
          opacity: Math.max(
            interpolate(frame, [VALUE - 12, VALUE, VALUE + 12], [0, 1, 0], clamp),
            interpolate(frame, [APP - 10, APP, APP + 10], [0, 1, 0], clamp),
          ),
        }}
      />
    </AbsoluteFill>
  );
}

const useVertical = () => {
  const { width, height } = useVideoConfig();
  return height > width;
};

/** Rótulo grande que entra y sale dentro de su intervalo. */
function Title({ text, from, to, size, color = C.ink, style }: { text: string; from: number; to: number; size: number; color?: string; style?: React.CSSProperties }) {
  const frame = useCurrentFrame();
  if (frame < from - 1 || frame >= to) return null;
  const opacity = interpolate(frame, [from, from + 12, to - 10, to], [0, 1, 1, 0], clamp);
  const lift = interpolate(frame, [from, from + 16], [22, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: size,
        fontWeight: 800,
        fontStretch: "80%",
        lineHeight: 1.08,
        letterSpacing: "-0.005em",
        color,
        textAlign: "center",
        textWrap: "balance",
        opacity,
        transform: `translateY(${lift}px)`,
        ...style,
      }}
    >
      {text}
    </div>
  );
}

/** Etiqueta honesta de las escenas con cifras: la app funciona con datos simulados. */
function TestLabel({ text = LABEL, style }: { text?: string; style?: React.CSSProperties }) {
  const vertical = useVertical();
  return (
    <div
      style={{
        position: "absolute",
        fontFamily: FONT,
        fontSize: vertical ? 30 : 24,
        fontWeight: 700,
        color: "#6b4e00",
        background: "#f8e7b0",
        padding: vertical ? "8px 20px" : "6px 16px",
        borderRadius: 999,
        ...style,
      }}
    >
      {text}
    </div>
  );
}

// ---- 1. La pregunta de cada semana ----

function Question() {
  const frame = useCurrentFrame();
  const vertical = useVertical();
  const size = vertical ? 96 : 92;
  const lines = [
    { text: "Cada semana:", at: 8, color: C.sproutLight, size: size * 0.7 },
    { text: "¿Cuántos kilos vamos a vender?", at: 34, color: C.paper, size },
    { text: "¿A cuántos temporeros llamamos?", at: 96, color: C.paper, size },
  ];
  const out = interpolate(frame, [214, 236], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: C.ink, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: vertical ? 56 : 34, padding: vertical ? 70 : 120, opacity: out }}>
      {lines.map((l) => {
        const p = interpolate(frame, [l.at, l.at + 18], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        return (
          <div
            key={l.text}
            style={{
              fontFamily: FONT,
              fontSize: l.size,
              fontWeight: 800,
              fontStretch: "80%",
              lineHeight: 1.06,
              color: l.color,
              textAlign: "center",
              textWrap: "balance",
              opacity: p,
              transform: `translateY(${(1 - p) * 26}px)`,
            }}
          >
            {l.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

// ---- 2. El invernadero: se graba con el móvil y Atias cuenta ----

function Recording() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  return (
    <AbsoluteFill>
      {/* La escena 3D del vídeo de presentación, desde dentro de la hilera */}
      <Sequence from={-SOURCE_FROM} layout="none">
        <ThreeCanvas width={width} height={height} shadows gl={{ antialias: true, preserveDrawingBuffer: true }}>
          <Greenhouse />
        </ThreeCanvas>
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(10,25,18,0.38) 100%)" }} />
        <AbsoluteFill style={{ opacity: interpolate(frame, [COUNT_FROM, COUNT_FROM + 15], [0, 1], clamp) }}>
          <Detections />
        </AbsoluteFill>
      </Sequence>
      <PhoneMask />
      <Counter />
      <RecreationTag t={t} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: vertical ? 250 : 64, display: "flex", justifyContent: "center", padding: "0 50px" }}>
        <Title text="El agricultor graba cada hilera con el móvil." from={12} to={COUNT_FROM - 4} size={vertical ? 76 : 60} color={C.paper} style={{ maxWidth: vertical ? 960 : 1500 }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: vertical ? 250 : 64, display: "flex", justifyContent: "center", padding: "0 50px" }}>
        <Title
          text="Atias cuenta la fruta madura."
          from={COUNT_FROM + 12}
          to={354}
          size={vertical ? 76 : 60}
          style={{ background: "rgba(241,244,236,0.93)", padding: vertical ? "22px 36px" : "16px 36px", borderRadius: 18, maxWidth: vertical ? 960 : 1500 }}
        />
      </div>
    </AbsoluteFill>
  );
}

/** Primero, la vista dentro de un móvil grabando; luego se abre a pantalla completa. */
function PhoneMask() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const vertical = height > width;
  const open = spring({ frame: frame - COUNT_FROM + 12, fps, config: { damping: 18, stiffness: 80 } });
  const w = interpolate(open, [0, 1], [width * (vertical ? 0.74 : 0.6), width]);
  const h = interpolate(open, [0, 1], [height * (vertical ? 0.6 : 0.6), height]);
  const r = interpolate(open, [0, 1], [64, 0]);
  const x = (width - w) / 2;
  const y = (height - h) / 2 - interpolate(open, [0, 1], [height * (vertical ? 0.06 : 0.07), 0]);
  const bezel = interpolate(open, [0, 1], [24, 0]);
  const blink = Math.floor(frame / 15) % 2 === 0;
  if (open > 0.995) return null;
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
          boxShadow: `0 0 0 ${bezel}px #101614, 0 0 0 3000px rgba(15,43,32,${0.94 * (1 - open)})`,
        }}
      />
      <div style={{ position: "absolute", left: x + 40, top: y + 32, display: "flex", alignItems: "center", gap: 12, fontFamily: FONT, fontSize: vertical ? 34 : 28, fontWeight: 700, color: C.white, opacity: 1 - open }}>
        <span style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(16,22,20,0.72)", padding: "8px 18px", borderRadius: 999 }}>
          <span style={{ width: 18, height: 18, borderRadius: 999, background: "#e5322b", opacity: blink ? 1 : 0.25 }} />
          {t.rec}
        </span>
      </div>
    </AbsoluteFill>
  );
}

/** Contador de frutos maduros: empieza en cero cuando Atias empieza a contar. */
function Counter() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const vertical = height > width;
  if (frame < COUNT_FROM) return null;
  const source = frame + SOURCE_FROM;
  const count = countedUntil(source) - countedUntil(COUNT_FROM + SOURCE_FROM);
  const crop = cropAt(poseAt(source).pos[2]);
  const enter = spring({ frame: frame - COUNT_FROM - 6, fps, config: { damping: 20 } });
  return (
    <div
      style={{
        position: "absolute",
        top: vertical ? 150 : 56,
        right: vertical ? 50 : 64,
        background: "rgba(15,43,32,0.88)",
        color: C.paper,
        borderRadius: 20,
        padding: vertical ? "26px 36px" : "22px 30px",
        fontFamily: FONT,
        minWidth: vertical ? 400 : 330,
        opacity: enter,
        transform: `translateY(${(1 - enter) * -30}px)`,
      }}
    >
      <div style={{ fontSize: vertical ? 34 : 26, fontWeight: 700 }}>{t.crop[crop]}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 10 }}>
        <span style={{ fontSize: vertical ? 96 : 76, fontWeight: 850, fontStretch: "75%", fontVariantNumeric: "tabular-nums", lineHeight: 1, color: C.sproutLight }}>{es(count)}</span>
        <span style={{ fontSize: vertical ? 30 : 24, fontWeight: 600 }}>{t.ripe}</span>
      </div>
    </div>
  );
}

// ---- 3. Las dos cifras de la semana, con su margen ----

function Value() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const vertical = useVertical();
  const cards = [
    { label: "Previsión para vender", value: DEMO.kilos, unit: "kg", note: `Entre ${es(DEMO.kilosMin)} y ${es(DEMO.kilosMax)} kg`, range: true },
    { label: "Temporeros necesarios", value: DEMO.workers, unit: "", note: `Hasta ${DEMO.workersMax} en el extremo alto del margen`, range: false },
  ];
  return (
    <AbsoluteFill style={{ background: C.paper, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: vertical ? 70 : 64, padding: vertical ? "0 50px" : "0 120px" }}>
      <Title text="Dos cifras para la semana, cada una con su margen." from={6} to={296} size={vertical ? 74 : 62} style={{ maxWidth: vertical ? 960 : 1400 }} />
      <div style={{ display: "flex", flexDirection: vertical ? "column" : "row", gap: vertical ? 44 : 48 }}>
        {cards.map((c, i) => {
          const at = 40 + i * 30;
          const enter = spring({ frame: frame - at, fps, config: { damping: 20 } });
          const count = interpolate(frame, [at, at + 50], [0, c.value], { ...clamp, easing: Easing.out(Easing.cubic) });
          const band = interpolate(frame, [at + 40, at + 70], [0, 1], clamp);
          return (
            <div
              key={c.label}
              style={{
                width: vertical ? 940 : 760,
                background: C.white,
                borderRadius: 24,
                padding: vertical ? "44px 52px" : "40px 48px",
                boxShadow: "0 24px 60px rgba(15,43,32,0.14)",
                fontFamily: FONT,
                color: C.ink,
                opacity: enter,
                transform: `translateY(${(1 - enter) * 30}px)`,
              }}
            >
              <div style={{ fontSize: vertical ? 42 : 36, fontWeight: 700 }}>{c.label}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 8 }}>
                <span style={{ fontSize: vertical ? 170 : 150, fontWeight: 850, fontStretch: "78%", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{es(count)}</span>
                {c.unit && <span style={{ fontSize: vertical ? 56 : 48, fontWeight: 600, color: C.inkSoft }}>{c.unit}</span>}
              </div>
              {c.range ? (
                <div style={{ position: "relative", height: 14, borderRadius: 99, background: "#e3e8df", marginTop: 26 }}>
                  <div style={{ position: "absolute", left: "45%", width: `${45 * band}%`, top: 0, bottom: 0, borderRadius: 99, background: "#e2c98f" }} />
                  <div style={{ position: "absolute", left: "70%", top: -7, width: 5, height: 28, borderRadius: 3, background: "#7a5a00", opacity: band }} />
                </div>
              ) : (
                <div style={{ position: "relative", height: 14, borderRadius: 99, background: "#e3e8df", marginTop: 26 }}>
                  <div style={{ position: "absolute", left: 0, width: `${(14 / 18) * 100 * band}%`, top: 0, bottom: 0, borderRadius: 99, background: C.sprout }} />
                  <div style={{ position: "absolute", left: `${(14 / 18) * 100 * band}%`, width: `${(4 / 18) * 100 * band}%`, top: 0, bottom: 0, borderRadius: 99, background: "#b9dc93" }} />
                </div>
              )}
              <div style={{ fontSize: vertical ? 36 : 30, marginTop: 20, color: C.inkSoft, opacity: band }}>{c.note}</div>
            </div>
          );
        })}
      </div>
      <TestLabel style={vertical ? { bottom: 150, left: "50%", transform: "translateX(-50%)" } : { top: 48, left: 60 }} />
    </AbsoluteFill>
  );
}

// ---- 4. La app, pantalla a pantalla ----

const ease = Easing.inOut(Easing.cubic);

function AppTour() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  const box = vertical ? { left: 30, top: 560, width: width - 60, height: 1020 } : { left: 100, top: 96, width: width - 200, height: 740 };
  let start = 0;
  const timeline = SHOTS.map((s) => {
    const item = { ...s, start };
    start += s.frames;
    return item;
  });
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <div
        style={{
          position: "absolute",
          ...box,
          borderRadius: 22,
          overflow: "hidden",
          background: "#f1f3ec",
          boxShadow: "0 30px 80px rgba(15,43,32,0.25)",
        }}
      >
        {timeline.map((s, i) => {
          const fade = i > 0 && s.file === timeline[i - 1].file ? 0 : 12;
          if (frame < s.start - fade || frame >= s.start + s.frames + 12) return null;
          const [a, b] = vertical ? s.v : s.h;
          const p = interpolate(frame, [s.start + s.frames * 0.08, s.start + s.frames * 0.62], [0, 1], { ...clamp, easing: ease });
          const rect = a.map((value, k) => value + (b[k] - value) * p) as Rect;
          const pad = 1.04;
          const rw = (rect[2] - rect[0]) * pad;
          const rh = (rect[3] - rect[1]) * pad;
          const scale = Math.min(box.width / rw, box.height / rh);
          const cx = (rect[0] + rect[2]) / 2;
          const cy = (rect[1] + rect[3]) / 2;
          const opacity = fade ? interpolate(frame, [s.start - fade, s.start], [0, 1], clamp) : 1;
          return (
            <Img
              key={`${s.file}-${i}`}
              src={staticFile(`app-duenos/${s.file}`)}
              style={{
                position: "absolute",
                width: 2000 * scale,
                height: 1125 * scale,
                left: box.width / 2 - cx * scale,
                top: box.height / 2 - cy * scale,
                maxWidth: "none",
                opacity,
              }}
            />
          );
        })}
      </div>
      <TestLabel
        text={[...timeline].reverse().find((s) => frame >= s.start - 6)?.label}
        style={vertical ? { top: 1608, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" } : { top: 36, left: 100 }}
      />
      {timeline.map((s) => (
        <div
          key={s.caption}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            ...(vertical ? { top: 130, height: 400, alignItems: "center" } : { top: 850, height: 200, alignItems: "center" }),
            display: "flex",
            justifyContent: "center",
            padding: vertical ? "0 56px" : "0 120px",
          }}
        >
          <Title text={s.caption} from={s.start + 6} to={s.start + s.frames - 2} size={vertical ? 78 : 58} style={{ maxWidth: vertical ? 960 : 1600 }} />
        </div>
      ))}
    </AbsoluteFill>
  );
}

// ---- 5. Logo ----

function Logo() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = interpolate(frame, [6, 60], [0, 1], clamp);
  const dot = spring({ frame: frame - 58, fps, config: { damping: 9, stiffness: 140 } });
  const word = spring({ frame: frame - 70, fps, config: { damping: 18 } });
  return (
    <AbsoluteFill style={{ background: C.ink, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 18 }}>
      <NaveDraw progress={progress} dot={dot} size={300} />
      <div style={{ opacity: word, transform: `translateY(${(1 - word) * 20}px)` }}>
        <Wordmark size={130} />
      </div>
    </AbsoluteFill>
  );
}
