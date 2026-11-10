import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { Greenhouse } from "./Greenhouse";
import { CounterHud, Detections, PhoneFrame, RailLabels, RecreationTag } from "./Overlays";
import { AppShowcase, Caption, LogoEnd, type Screen, ToApp } from "./Parts";
import { T } from "./scene";
import { type Locale, TEXTS } from "./texts";
import { HEIGHT, loadFonts, WIDTH } from "./theme";

loadFonts();

/** Calendario completo, en fotogramas a 30 fps: 60 s. */
export const DURATION = 1800;
const TO_APP = T.railEnd; // 34 s
const APP = TO_APP + 180; // 40 s
const APP_EACH = 84; // cinco pantallas en 14 s
const LOGO = APP + APP_EACH * 5; // 54 s

const NUMBER_LOCALE: Record<Locale, string> = { es: "es-ES", en: "en-GB", fr: "fr-FR", nl: "nl-NL", it: "it-IT", pt: "pt-PT" };

export function AtiasVideo({ locale }: { locale: Locale }) {
  const t = TEXTS[locale];
  const frame = useCurrentFrame();
  const numbers = NUMBER_LOCALE[locale];
  const screens: Screen[] = [
    { file: "resumen.png", caption: t.app.resumen, focus: [{ x: 0, y: 0, zoom: 1.02 }, { x: 8, y: 3, zoom: 1.16 }] },
    { file: "prevision.png", caption: t.app.prevision, focus: [{ x: 8, y: 2, zoom: 1.08 }, { x: 10, y: 6, zoom: 1.16 }] },
    { file: "invernadero.png", caption: t.app.invernadero, focus: [{ x: 8, y: 2, zoom: 1.08 }, { x: 10, y: 8, zoom: 1.16 }] },
    { file: "temporeros.png", caption: t.app.temporeros, focus: [{ x: 8, y: 0, zoom: 1.08 }, { x: 10, y: 5, zoom: 1.16 }] },
    { file: "precision.png", caption: t.app.precision, focus: [{ x: 8, y: 0, zoom: 1.1 }, { x: 10, y: 4, zoom: 1.18 }] },
  ];
  // Un fundido corto al cambiar de cultivo y al pasar al raíl.
  const dip = Math.max(
    ...[T.cucumber, T.pepper, T.rail].map((at) => interpolate(frame, [at - 8, at, at + 8], [0, 0.55, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })),
  );
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={WIDTH} height={HEIGHT} durationInFrames={TO_APP} shadows gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <Greenhouse />
      </ThreeCanvas>
      <Sequence durationInFrames={TO_APP} layout="none">
        {/* Viñeta suave, como la de una lente */}
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(10,25,18,0.38) 100%)" }} />
        <Detections />
        <CounterHud t={t} locale={numbers} />
        <PhoneFrame t={t} />
        <RailLabels t={t} locale={numbers} />
        {frame < TO_APP && <RecreationTag t={t} />}
        <AbsoluteFill style={{ background: "#fff", opacity: dip, pointerEvents: "none" }} />
        <Caption text={t.intro} from={10} to={T.enter} />
        <Caption text={t.tomato} from={T.enter + 10} to={T.cucumber} />
        <Caption text={t.cucumber} from={T.cucumber + 6} to={T.pepper} />
        <Caption text={t.pepper} from={T.pepper + 6} to={T.phone} />
        <Caption text={t.phone} from={T.phone + 10} to={T.rail} dark />
        <Caption text={t.rail} from={T.rail + 8} to={T.railEnd} />
      </Sequence>
      <Sequence from={TO_APP} durationInFrames={APP - TO_APP} layout="none">
        <ToApp t={t} from={0} locale={locale} />
      </Sequence>
      <Sequence from={APP} durationInFrames={LOGO - APP} layout="none">
        <AppShowcase screens={screens} t={t} from={0} each={APP_EACH} />
      </Sequence>
      <Sequence from={LOGO} durationInFrames={DURATION - LOGO} layout="none">
        <LogoEnd t={t} from={0} />
      </Sequence>
    </AbsoluteFill>
  );
}
