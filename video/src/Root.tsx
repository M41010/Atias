import { Composition } from "remotion";
import { LOCALES } from "./texts";
import { FPS, HEIGHT, WIDTH } from "./theme";
import { AtiasVideo, DURATION } from "./Video";

/**
 * Una composición por idioma y formato: Atias-es (horizontal, 1920×1080) y AtiasVertical-es
 * (vertical 9:16, 1080×1920, para móvil y redes). Las escenas leen el tamaño de la composición.
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
    </>
  );
}
