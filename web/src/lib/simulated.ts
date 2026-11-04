/**
 * DATOS SIMULADOS. Nada de este archivo procede de un invernadero real: sirven para diseñar
 * la app y se sustituirán por la API de Express.
 */

export type CropId = "tomate_cherry" | "pimiento" | "pepino";

export type Tramo = { n: number; observedKg: number; immatureKg: number; matureFruits: number };
export type VideoStatus = "analizado" | "analizando" | "problema";
export type Video = {
  hilera: number;
  lado: "A" | "B";
  status: VideoStatus;
  note?: string;
};
export type Hilera = { n: number; tramos: Tramo[] | null };
export type AppWarning = {
  severity: "alta" | "media";
  message: string;
  scope: string;
  greenhouseId: string;
  hilera: number;
  action: string;
};
export type Capture = {
  greenhouseId: string;
  capturedAt: string;
  isNew: boolean;
  hileras: Hilera[];
  videos: Video[];
  warnings: AppWarning[];
  /** Kg pesados en la recolección de esa semana. Null si todavía no se ha recogido. */
  realKg: number | null;
};
export type Harvest = {
  id: string;
  label: string;
  isoWeek: number;
  captures: Capture[];
};

export const CROPS: Record<
  CropId,
  { name: string; criterion: "Color" | "Calibre"; classes: { name: string; share: number }[] }
> = {
  tomate_cherry: {
    name: "Tomate cherry",
    criterion: "Color",
    classes: [{ name: "Rojo", share: 1 }],
  },
  pimiento: {
    name: "Pimiento",
    criterion: "Color",
    classes: [
      { name: "Rojo", share: 0.62 },
      { name: "Amarillo", share: 0.38 },
    ],
  },
  pepino: {
    name: "Pepino",
    criterion: "Calibre",
    classes: [
      { name: "Comercial", share: 0.72 },
      { name: "Grande", share: 0.28 },
    ],
  },
};

export type GreenhouseInfo = {
  id: string;
  name: string;
  crop: CropId;
  hileras: number;
  tramosPorHilera: number;
  temperaturaC: number;
  humedadPct: number;
};

export const GREENHOUSES: GreenhouseInfo[] = [
  { id: "inv-1", name: "Invernadero 1", crop: "tomate_cherry", hileras: 4, tramosPorHilera: 8, temperaturaC: 24, humedadPct: 68 },
  { id: "inv-2", name: "Invernadero 2", crop: "pimiento", hileras: 4, tramosPorHilera: 8, temperaturaC: 23, humedadPct: 71 },
  { id: "inv-3", name: "Invernadero 3", crop: "pepino", hileras: 4, tramosPorHilera: 8, temperaturaC: 26, humedadPct: 74 },
];

export type Params = {
  days: number;
  crops: Record<CropId, { variety: string; ripeningPct: number; kgPerWorkday: number }>;
};

export const DEFAULT_PARAMS: Params = {
  days: 4,
  crops: {
    tomate_cherry: { variety: "Variedad de ejemplo A", ripeningPct: 35, kgPerWorkday: 180 },
    pimiento: { variety: "Variedad de ejemplo B", ripeningPct: 30, kgPerWorkday: 300 },
    pepino: { variety: "Variedad de ejemplo C", ripeningPct: 40, kgPerWorkday: 350 },
  },
};

const GRAMS: Record<CropId, number> = { tomate_cherry: 15, pimiento: 185, pepino: 340 };
const BASE_KG: Record<CropId, number> = { tomate_cherry: 42, pimiento: 39, pepino: 44 };

/** Generador pseudoaleatorio con semilla: mismos datos en cada carga. */
function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeHileras(info: GreenhouseInfo, seed: number, missing: number[] = []): Hilera[] {
  const random = seeded(seed);
  return Array.from({ length: info.hileras }, (_, h) => {
    const n = h + 1;
    if (missing.includes(n)) return { n, tramos: null };
    const tramos = Array.from({ length: info.tramosPorHilera }, (_, t) => {
      const observedKg = Math.round(BASE_KG[info.crop] * (0.65 + random() * 0.7) * 10) / 10;
      return {
        n: t + 1,
        observedKg,
        immatureKg: Math.round(observedKg * (0.7 + random() * 0.8) * 10) / 10,
        matureFruits: Math.round((observedKg * 1000) / GRAMS[info.crop]),
      };
    });
    return { n, tramos };
  });
}

function allVideos(info: GreenhouseInfo): Video[] {
  return Array.from({ length: info.hileras }, (_, h) =>
    (["A", "B"] as const).map((lado) => ({ hilera: h + 1, lado, status: "analizado" as const })),
  ).flat();
}

const [inv1, inv2, inv3] = GREENHOUSES;

const current: Harvest = {
  id: "2026-W45",
  label: "Recolección 2–5 nov",
  isoWeek: 45,
  captures: [
    {
      greenhouseId: inv1.id,
      capturedAt: "2026-10-31T08:12:00+01:00",
      isNew: true,
      hileras: makeHileras(inv1, 11),
      videos: allVideos(inv1),
      warnings: [],
      realKg: null,
    },
    {
      greenhouseId: inv2.id,
      capturedAt: "2026-10-31T10:40:00+01:00",
      isNew: true,
      hileras: makeHileras(inv2, 12),
      videos: allVideos(inv2).map((v) =>
        v.hilera === 3 && v.lado === "B"
          ? { ...v, status: "problema" as const, note: "Imagen demasiado oscura" }
          : v,
      ),
      warnings: [
        {
          severity: "alta",
          message: "Imagen demasiado oscura. Los kg de esta hilera pueden quedar por debajo de lo real.",
          scope: "Invernadero 2 · Hilera 3 · Lado B",
          greenhouseId: inv2.id,
          hilera: 3,
          action: "Pide al agricultor que repita la grabación de este lado.",
        },
      ],
      realKg: null,
    },
    {
      greenhouseId: inv3.id,
      capturedAt: "2026-10-31T17:05:00+01:00",
      isNew: false,
      hileras: makeHileras(inv3, 13, [4]),
      videos: allVideos(inv3).map((v) =>
        v.hilera === 4 ? { ...v, status: "analizando" as const } : v,
      ),
      warnings: [
        {
          severity: "media",
          message: "Falta analizar la hilera 4. Los kg de este invernadero aún son parciales.",
          scope: "Invernadero 3 · Hilera 4",
          greenhouseId: inv3.id,
          hilera: 4,
          action: "No hace falta hacer nada: el resultado se actualizará al terminar.",
        },
      ],
      realKg: null,
    },
  ],
};

function pastHarvest(
  id: string,
  label: string,
  isoWeek: number,
  date: string,
  seed: number,
  realKg: [number, number, number],
): Harvest {
  return {
    id,
    label,
    isoWeek,
    captures: GREENHOUSES.map((info, i) => ({
      greenhouseId: info.id,
      capturedAt: `${date}T09:0${i}:00+02:00`,
      isNew: false,
      hileras: makeHileras(info, seed + i),
      videos: allVideos(info),
      warnings: [],
      realKg: realKg[i],
    })),
  };
}

export const HARVESTS: Harvest[] = [
  { id: "2026-W46", label: "Recolección 9–12 nov", isoWeek: 46, captures: [] },
  current,
  pastHarvest("2026-W44", "Recolección 26–29 oct", 44, "2026-10-24", 21, [1975, 1870, 2290]),
  pastHarvest("2026-W43", "Recolección 19–22 oct", 43, "2026-10-17", 31, [2110, 1745, 2455]),
];

export const LATEST_HARVEST_ID = current.id;

/** Enlaces personales de ejemplo. Los reales los generará la cooperativa. */
export const UPLOAD_LINKS: Record<string, { greenhouseId: string; harvestId: string }> = {
  "demo-invernadero-1": { greenhouseId: inv1.id, harvestId: "2026-W46" },
  "demo-invernadero-2": { greenhouseId: inv2.id, harvestId: "2026-W46" },
  "demo-invernadero-3": { greenhouseId: inv3.id, harvestId: "2026-W46" },
};
