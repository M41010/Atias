import { Composition } from "remotion";
import { LOCALES } from "./texts";
import { FPS, HEIGHT, WIDTH } from "./theme";
import { AtiasDuenos, DURATION_DUENOS } from "./Duenos";
import { AtiasVideo, DURATION } from "./Video";

/**
 * Una composición por idioma y formato: Atias-es (horizontal, 1920×1080) y AtiasVertical-es
 * (vertical 9:16, 1080×1920, para móvil y redes). Las escenas leen el tamaño de la composición.
 * Aparte, el vídeo para los dueños de la cooperativa (solo en español): AtiasDuenos y AtiasDuenosVertical.
 */
export function Root() {
  return (
    <>
      {LOCALES.map((locale) => (
        <Composition
          key={locale}
          id={`Atias-${locale}`}
          component={AtiasVideo}
          durationInFrames={DURATION}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ locale }}
        />
      ))}
      {LOCALES.map((locale) => (
        <Composition
          key={`v-${locale}`}
          id={`AtiasVertical-${locale}`}
          component={AtiasVideo}
          durationInFrames={DURATION}
          fps={FPS}
          width={HEIGHT}
          height={WIDTH}
          defaultProps={{ locale }}
        />
      ))}
      <Composition id="AtiasDuenos" component={AtiasDuenos} durationInFrames={DURATION_DUENOS} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ musica: false }} />
      <Composition id="AtiasDuenosVertical" component={AtiasDuenos} durationInFrames={DURATION_DUENOS} fps={FPS} width={HEIGHT} height={WIDTH} defaultProps={{ musica: false }} />
    </>
  );
}
