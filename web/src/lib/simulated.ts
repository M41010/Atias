/**
 * DATOS SIMULADOS. Nada de este archivo procede de un invernadero real: sirven para diseñar
 * la app y se sustituirán por la API de Express. Los nombres de técnicos y agricultores son inventados.
 */

/** Tipo de cultivo que reconoce la visión. */
export type CropId = "tomate_cherry" | "pimiento" | "pepino";

export const CROPS: Record<CropId, { name: string }> = {
  tomate_cherry: { name: "Tomate cherry" },
  pimiento: { name: "Pimiento" },
  pepino: { name: "Pepino" },
};

/** Familia: como llama la empresa al cultivo y la variedad. */
export type FamilyId =
  | "cherry_pera"
  | "cherry_redondo_rojo"
  | "jalapeno"
  | "padron"
  | "snack"
  | "tatayoyo"
  | "cherry_colores"
  | "cherry_rama"
  | "chilis"
  | "katrina"
  | "pepino_holandes"
  | "sweetbites";

export type Family = {
  name: string;
  /** Tipo de cultivo de cada familia, confirmado por la empresa. */
  crop: CropId;
  criterion: "Color" | "Calibre";
  classes: { name: string; share: number }[];
  /** Peso medio por fruto, en gramos. SIMULADO. */
  grams: number;
  /** Kg maduros típicos por tramo. SIMULADO. */
  baseKg: number;
};

const RED = [{ name: "Rojo", share: 1 }];
const MIXED = [
  { name: "Rojo", share: 0.4 },
  { name: "Amarillo", share: 0.3 },
  { name: "Naranja", share: 0.3 },
];
const SIZES = [
  { name: "Comercial", share: 0.8 },
  { name: "Grande", share: 0.2 },
];

export const FAMILIES: Record<FamilyId, Family> = {
  cherry_pera: { name: "Cherry pera", crop: "tomate_cherry", criterion: "Color", classes: RED, grams: 12, baseKg: 38 },
  cherry_redondo_rojo: { name: "Cherry redondo rojo", crop: "tomate_cherry", criterion: "Color", classes: RED, grams: 15, baseKg: 42 },
  jalapeno: { name: "Jalapeño", crop: "pimiento", criterion: "Calibre", classes: SIZES, grams: 25, baseKg: 30 },
  padron: { name: "Padrón", crop: "pimiento", criterion: "Calibre", classes: SIZES, grams: 8, baseKg: 22 },
  snack: { name: "Snack", crop: "pepino", criterion: "Calibre", classes: SIZES, grams: 60, baseKg: 36 },
  tatayoyo: { name: "Tatayoyo", crop: "pimiento", criterion: "Calibre", classes: SIZES, grams: 30, baseKg: 28 },
  cherry_colores: {
    name: "Cherry colores",
    crop: "tomate_cherry",
    criterion: "Color",
    classes: [
      { name: "Rojo", share: 0.4 },
      { name: "Amarillo", share: 0.25 },
      { name: "Naranja", share: 0.2 },
      { name: "Negro", share: 0.15 },
    ],
    grams: 15,
    baseKg: 36,
  },
  cherry_rama: { name: "Cherry rama", crop: "tomate_cherry", criterion: "Color", classes: RED, grams: 14, baseKg: 40 },
  chilis: {
    name: "Chilis",
    crop: "pimiento",
    criterion: "Color",
    classes: [
      { name: "Rojo", share: 0.6 },
      { name: "Verde", share: 0.4 },
    ],
    grams: 6,
    baseKg: 18,
  },
  katrina: { name: "Katrina", crop: "pepino", criterion: "Calibre", classes: SIZES, grams: 150, baseKg: 40 },
  pepino_holandes: {
    name: "Pepino holandés",
    crop: "pepino",
    criterion: "Calibre",
    classes: [
      { name: "Comercial", share: 0.72 },
      { name: "Grande", share: 0.28 },
    ],
    grams: 340,
    baseKg: 44,
  },
  sweetbites: { name: "Sweetbites", crop: "pimiento", criterion: "Color", classes: MIXED, grams: 25, baseKg: 28 },
};

/** Mismo orden que el informe de la empresa. */
export const FAMILY_ORDER = Object.keys(FAMILIES) as FamilyId[];

export type Technician = { id: string; name: string };
export type Grower = { id: string; name: string; technicianId: string };

export const TECHNICIANS: Technician[] = [
  { id: "tec-1", name: "Lucía Ferrer" },
  { id: "tec-2", name: "Javier Ortega" },
  { id: "tec-3", name: "Carmen Rubio" },
];

export const GROWERS: Grower[] = [
  { id: "agr-1", name: "Antonio Gil", technicianId: "tec-1" },
  { id: "agr-2", name: "María Cano", technicianId: "tec-1" },
  { id: "agr-3", name: "José Navarro", technicianId: "tec-2" },
  { id: "agr-4", name: "Rosa Martín", technicianId: "tec-2" },
  { id: "agr-5", name: "Francisco López", technicianId: "tec-3" },
];

/** Localización del invernadero: de ella sale la meteorología (Open-Meteo cuando se conecte). */
export type Location = {
  municipality: string;
  latitude: number;
  longitude: number;
  /** Diferencia SIMULADA de temperatura frente a Motril, en °C. */
  offsetC: number;
};

// Casi todos los invernaderos están en la costa de Granada.
const PLACES: Record<string, Location> = {
  motril: { municipality: "Motril", latitude: 36.745, longitude: -3.52, offsetC: 0 },
  carchuna: { municipality: "Carchuna (Motril)", latitude: 36.7, longitude: -3.443, offsetC: 0.2 },
  castell: { municipality: "Castell de Ferro", latitude: 36.725, longitude: -3.358, offsetC: 0.3 },
  salobrena: { municipality: "Salobreña", latitude: 36.746, longitude: -3.587, offsetC: 0.1 },
  almunecar: { municipality: "Almuñécar", latitude: 36.734, longitude: -3.69, offsetC: 0.5 },
  mamola: { municipality: "La Mamola (Polopos)", latitude: 36.749, longitude: -3.205, offsetC: 0.2 },
};

export type GreenhouseInfo = {
  id: string;
  name: string;
  growerId: string;
  family: FamilyId;
  crop: CropId;
  location: Location;
  hileras: number;
  tramosPorHilera: number;
  /** Si tiene sensor de temperatura dentro. Mientras no, se usa la temperatura exterior. */
  interiorSensor: boolean;
};

function greenhouse(
  n: number,
  growerId: string,
  family: FamilyId,
  place: keyof typeof PLACES,
): GreenhouseInfo {
  return {
    id: `inv-${n}`,
    name: `Invernadero ${n}`,
    growerId,
    family,
    crop: FAMILIES[family].crop,
    location: PLACES[place],
    hileras: 4,
    tramosPorHilera: 8,
    interiorSensor: false,
  };
}

export const GREENHOUSES: GreenhouseInfo[] = [
  greenhouse(1, "agr-1", "cherry_redondo_rojo", "carchuna"),
  greenhouse(2, "agr-1", "padron", "carchuna"),
  greenhouse(3, "agr-2", "pepino_holandes", "motril"),
  greenhouse(4, "agr-2", "cherry_pera", "motril"),
  greenhouse(5, "agr-3", "cherry_colores", "castell"),
  greenhouse(6, "agr-4", "sweetbites", "salobrena"),
  greenhouse(7, "agr-5", "cherry_rama", "mamola"),
  greenhouse(8, "agr-5", "jalapeno", "almunecar"),
];

export type FamilyParams = { ripeningPct: number; kgPerWorkday: number };
export type Params = { days: number; families: Record<FamilyId, FamilyParams> };

const ripening: Record<CropId, number> = { tomate_cherry: 35, pimiento: 30, pepino: 40 };
const workday: Record<CropId, number> = { tomate_cherry: 180, pimiento: 300, pepino: 350 };
const workdayByFamily: Partial<Record<FamilyId, number>> = { padron: 150, chilis: 120 };

export const DEFAULT_PARAMS: Params = {
  days: 5,
  families: Object.fromEntries(
    FAMILY_ORDER.map((id) => [
      id,
      {
        ripeningPct: ripening[FAMILIES[id].crop],
        kgPerWorkday: workdayByFamily[id] ?? workday[FAMILIES[id].crop],
      },
    ]),
  ) as Record<FamilyId, FamilyParams>,
};

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

function seedOf(text: string): number {
  let h = 2166136261;
  for (const char of text) h = Math.imul(h ^ char.charCodeAt(0), 16777619);
  return h >>> 0;
}

// ---- Meteorología ----

/** Dónde se tomó la temperatura. Exterior viene de Open-Meteo; interior, de un sensor cuando lo haya. */
export type ReadingPlace = "exterior" | "interior";

export type DayWeather = {
  date: string;
  /** Temperatura de cada hora, de 00:00 a 23:00 (hora de España). */
  hourlyTempC: number[];
  /** Lo normal en esa fecha y lugar, también por horas (media de años anteriores). */
  normalHourlyTempC: number[];
  precipitationMm: number;
  place: ReadingPlace;
  /** normal: aún no hay previsión para ese día y se usa lo normal. */
  kind: "prevision" | "observado" | "normal";
};

const DAY_MS = 86_400_000;
export const addDays = (isoDate: string, days: number) =>
  new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

const dayOfYear = (isoDate: string) =>
  Math.floor((Date.parse(`${isoDate}T00:00:00Z`) - Date.parse(`${isoDate.slice(0, 4)}-01-01T00:00:00Z`)) / DAY_MS) + 1;

/**
 * Temperatura media normal de la costa de Granada según la época del año. SIMULADA a partir de
 * valores aproximados de Motril: unos 12 °C de media en enero y 25 °C en agosto.
 */
function normalMeanC(isoDate: string, offsetC: number): number {
  return 18.5 + offsetC - 6.5 * Math.cos((2 * Math.PI * (dayOfYear(isoDate) - 20)) / 365);
}

/** Curva del día: lo más frío hacia las 7:00 y lo más cálido hacia las 15:00. */
function dailyCurve(meanC: number, rangeC: number): number[] {
  return Array.from({ length: 24 }, (_, hour) =>
    Math.round((meanC + (rangeC / 2) * Math.cos((2 * Math.PI * (hour - 15)) / 24)) * 10) / 10,
  );
}

/**
 * Temperatura exterior SIMULADA, hora a hora, de sábado a viernes. Cada día se aparta de lo normal
 * un poco al azar; cada lugar tiene su pequeña diferencia (más templado al oeste, en Almuñécar).
 */
export function simulatedWeather(location: Location, monday: string, today: string): DayWeather[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i - 2);
    const random = seeded(seedOf(`${location.municipality}/${date}`));
    const normal = normalMeanC(date, location.offsetC);
    const anomaly = (random() - 0.5) * 5;
    const range = 7 + random() * 4;
    const rain = random();
    return {
      date,
      hourlyTempC: dailyCurve(normal + anomaly, range),
      normalHourlyTempC: dailyCurve(normal, 9),
      precipitationMm: rain > 0.85 ? Math.round(rain * 60) / 10 : 0,
      place: "exterior",
      kind: date < today ? "observado" : "prevision",
    };
  });
}

// ---- Capturas y recolecciones ----

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
  /** Previsión del técnico para cada día, de lunes a viernes, como la mete en su aplicación. */
  technicianKg: number[];
  /** Previsión del agricultor para cada día, de lunes a viernes, dada sin conocer la de Atias. */
  farmerKg: number[];
  /** Kg reales de cada día, de lunes a viernes (vendrán del ERP). Null si aún no se ha recogido. */
  realDailyKg: (number | null)[] | null;
};
export type Harvest = {
  id: string;
  label: string;
  isoWeek: number;
  year: number;
  /** Lunes de la recolección. La captura es el sábado anterior. */
  monday: string;
  /** Última actualización de los datos del ERP. */
  updatedAt: string;
  captures: Capture[];
};

function makeHileras(info: GreenhouseInfo, seed: number, missing: number[] = []): Hilera[] {
  const random = seeded(seed);
  const family = FAMILIES[info.family];
  return Array.from({ length: info.hileras }, (_, h) => {
    const n = h + 1;
    if (missing.includes(n)) return { n, tramos: null };
    const tramos = Array.from({ length: info.tramosPorHilera }, (_, t) => {
      const observedKg = Math.round(family.baseKg * (0.65 + random() * 0.7) * 10) / 10;
      return {
        n: t + 1,
        observedKg,
        immatureKg: Math.round(observedKg * (0.7 + random() * 0.8) * 10) / 10,
        matureFruits: Math.round((observedKg * 1000) / family.grams),
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

/** Kilos "de verdad" de la semana simulada: lo maduro más una parte de lo inmaduro, con ruido. */
function trueWeek(hileras: Hilera[], random: () => number) {
  const tramos = hileras.flatMap((h) => h.tramos ?? []);
  const observed = tramos.reduce((sum, t) => sum + t.observedKg, 0);
  const immature = tramos.reduce((sum, t) => sum + t.immatureKg, 0);
  return { observed, total: observed + immature * (0.25 + random() * 0.2) };
}

/** Reparto típico de una semana: el lunes se recoge lo acumulado del fin de semana. */
const TYPICAL = [0.3, 0.17, 0.17, 0.18, 0.18];

function technicianForecast(total: number, random: () => number): number[] {
  // Los técnicos redondean a decenas y suelen desviarse más que una medida.
  const week = total * (0.82 + random() * 0.36);
  return TYPICAL.map((share) => Math.round((week * share * (0.9 + random() * 0.2)) / 10) * 10);
}

function farmerForecast(total: number, random: () => number): number[] {
  // A ojo: redondea a cincuentenas y se desvía más que el técnico.
  const week = total * (0.75 + random() * 0.55);
  return TYPICAL.map((share) => Math.round((week * share * (0.85 + random() * 0.3)) / 50) * 50);
}

function realDays(total: number, random: () => number): number[] {
  return TYPICAL.map((share) => Math.round(total * share * (0.88 + random() * 0.24)));
}

const LATEST_MONDAY = "2026-11-02";

function buildCaptures(monday: string, seed: number, latest: boolean): Capture[] {
  const saturday = addDays(monday, -2);
  return GREENHOUSES.map((info, i) => {
    const special = latest && info.id === "inv-3" ? [4] : [];
    const hileras = makeHileras(info, seed + i * 7, special);
    const random = seeded(seed * 31 + i);
    const full = special.length > 0 ? makeHileras(info, seed + i * 7) : hileras;
    const week = trueWeek(full, random);
    let videos = allVideos(info);
    let warnings: AppWarning[] = [];
    if (latest && info.id === "inv-2") {
      videos = videos.map((v) =>
        v.hilera === 3 && v.lado === "B" ? { ...v, status: "problema" as const, note: "Imagen demasiado oscura" } : v,
      );
      warnings = [
        {
          severity: "alta",
          message: "Imagen demasiado oscura. Los kg de esta hilera pueden quedar por debajo de lo real.",
          scope: `${info.name} · Hilera 3 · Lado B`,
          greenhouseId: info.id,
          hilera: 3,
          action: "Pide al agricultor que repita la grabación de este lado.",
        },
      ];
    }
    if (special.length > 0) {
      videos = videos.map((v) => (v.hilera === 4 ? { ...v, status: "analizando" as const } : v));
      warnings = [
        {
          severity: "media",
          message: "Falta analizar la hilera 4. Los kg de este invernadero aún son parciales.",
          scope: `${info.name} · Hilera 4`,
          greenhouseId: info.id,
          hilera: 4,
          action: "No hace falta hacer nada: el resultado se actualizará al terminar.",
        },
      ];
    }
    const hour = String(8 + i).padStart(2, "0");
    // Hora de verano hasta el 25 de octubre de 2026.
    const offset = saturday < "2026-10-25" ? "+02:00" : "+01:00";
    return {
      greenhouseId: info.id,
      capturedAt: `${saturday}T${hour}:1${i}:00${offset}`,
      isNew: latest && i < 3,
      hileras,
      videos,
      warnings,
      technicianKg: technicianForecast(week.total, random),
      realDailyKg: latest ? null : realDays(week.total, random),
      // Semilla aparte: añadir al agricultor no cambia las demás cifras simuladas.
      farmerKg: farmerForecast(week.total, seeded(seed * 53 + i + 7)),
    };
  });
}

function harvest(monday: string, isoWeek: number, label: string, seed: number, captures = true): Harvest {
  return {
    id: `2026-W${isoWeek}`,
    label,
    isoWeek,
    year: 2026,
    monday,
    updatedAt: monday === LATEST_MONDAY ? "2026-11-06T14:05:00+01:00" : `${addDays(monday, 4)}T20:00:00+01:00`,
    captures: captures ? buildCaptures(monday, seed, monday === LATEST_MONDAY) : [],
  };
}

export const HARVESTS: Harvest[] = [
  harvest("2026-11-09", 46, "Recolección 9–13 nov", 41, false),
  harvest(LATEST_MONDAY, 45, "Recolección 2–6 nov", 11),
  harvest("2026-10-26", 44, "Recolección 26–30 oct", 21),
  harvest("2026-10-19", 43, "Recolección 19–23 oct", 31),
];

export const LATEST_HARVEST_ID = "2026-W45";
/** "Hoy" para los datos simulados: separa el tiempo observado de la previsión. */
export const SIMULATED_TODAY = "2026-11-06";
