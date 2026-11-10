import { continueRender, delayRender, staticFile } from "remotion";

/** Paleta Hoja de la marca y colores de la escena. */
export const C = {
  ink: "#0f2b20",
  inkSoft: "#3a5446",
  paper: "#f1f4ec",
  sprout: "#3f8f2a",
  sproutLight: "#8fd14f",
  white: "#ffffff",
  amber: "#e39b12",
  sky: "#dbe7ec",
  soil: "#cdb88f",
  aisle: "#bfa77a",
  leaf: "#3f7a34",
  leafDark: "#2c5a26",
  stem: "#5d7a3a",
  plastic: "#f4f7f4",
  tomatoRipe: "#d6322b",
  tomatoTurning: "#e8812d",
  tomatoGreen: "#7fae3c",
  cucumber: "#2f6b2a",
  cucumberSmall: "#6ea33f",
  pepperRed: "#cf2a1f",
  pepperYellow: "#efc22a",
  pepperGreen: "#3d8a2e",
};

export const FONT = "Archivo, 'Arial Narrow', Arial, sans-serif";
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

let loaded = false;

/** Archivo variable (con eje de anchura), la misma tipografía que la web. */
export function loadFonts(): void {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const handle = delayRender("Cargando Archivo");
  const faces = [
    new FontFace("Archivo", `url(${staticFile("fonts/archivo-latin.woff2")}) format("woff2")`, {
      weight: "100 900",
      stretch: "62% 125%",
      unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2212",
    }),
    new FontFace("Archivo", `url(${staticFile("fonts/archivo-latin-ext.woff2")}) format("woff2")`, {
      weight: "100 900",
      stretch: "62% 125%",
      unicodeRange: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1E9F, U+2020, U+20A0-20AB, U+20AD-20C4",
    }),
  ];
  Promise.all(faces.map((f) => f.load()))
    .then((ready) => {
      ready.forEach((f) => (document.fonts as unknown as { add: (face: FontFace) => void }).add(f));
      continueRender(handle);
    })
    .catch(() => continueRender(handle));
}

/** Generador con semilla: el mismo invernadero en cada fotograma y cada render. */
export function seeded(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
