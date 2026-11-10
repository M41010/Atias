import { Composition } from "remotion";
import { LOCALES } from "./texts";
import { FPS, HEIGHT, WIDTH } from "./theme";
import { AtiasVideo, DURATION } from "./Video";

/** Una composición por idioma: Atias-es, Atias-en… */
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
    </>
  );
}
