/**
 * Ensayo de punta a punta del agricultor, como el 14 de noviembre, contra la pila del ensayo:
 *
 * 1. Abre su enlace en un móvil y sube la hilera 1, lado A, con una conexión lenta.
 * 2. A mitad de la subida se corta la conexión; al volver, debe seguir por donde iba.
 * 3. Sube el lado B, cierra la página a medias y, al volver a elegir el archivo, debe continuar.
 * 4. Sube la hilera 2, lado A, y la red falla sin que el móvil lo note: debe reintentar sola.
 * 5. Espera la revisión de la imagen y el conteo, y mide cuánto tardan.
 * 6. Entra como cooperativa y comprueba que los tres vídeos y su conteo le llegan.
 *
 * Los tiempos se guardan en resultados/tiempos.json.
 */
import { type Browser, type BrowserContext, type CDPSession, devices, expect, type Locator, type Page, test } from "@playwright/test";
import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const TOKEN = process.env.ENSAYO_ENLACE ?? "demo-invernadero-1";
const GREENHOUSE = "inv-1";
const HARVEST = "2026-W46";
const VIDEO = resolve(process.env.ENSAYO_VIDEO ?? "../../sitio/public/video/atias-es.mp4");
/** Velocidad de subida simulada, en megabits por segundo. Una wifi o un 4G modestos en el campo. */
const MBPS = Number(process.env.ENSAYO_SUBIDA_MBPS ?? 8);
const EMAIL = process.env.ENSAYO_CORREO ?? "";
const PASSWORD = process.env.ENSAYO_CONTRASENA ?? "";
const OFFLINE_MS = 5000;
/** Copia como la que llega por WhatsApp; la prepara ejecutar.mjs. Sin ella se sube el original. */
const LOW_RES = resolve(process.env.ENSAYO_VIDEO_BAJA ?? "resultados/baja-resolucion.mp4");
/** Subida desde el ordenador del dueño (fibra o ADSL), en megabits por segundo. */
const DESKTOP_MBPS = Number(process.env.ENSAYO_SUBIDA_ESCRITORIO_MBPS ?? 20);

const SIZE = statSync(VIDEO).size;
const UPLOAD_BYTES_PER_S = (MBPS * 1_000_000) / 8;
/** Lo que debería tardar la subida a esa velocidad, con margen. */
const UPLOAD_TIMEOUT_MS = (SIZE / UPLOAD_BYTES_PER_S) * 1000 * 3 + 60_000;

const timings: Record<string, number | string | boolean | null> = {
  video: basename(VIDEO),
  tamanoMB: Math.round(SIZE / 1e5) / 10,
  subidaMbps: MBPS,
};

type TusEvent = { at: number; kind: "request" | "response" | "failed"; method: string; url: string; offset: number | null; status?: number };

/** Registra las peticiones del protocolo de subida (tus) de una página. */
function trackTus(page: Page, events: TusEvent[]) {
  const isTus = (url: string) => new URL(url).pathname.startsWith("/api/subidas");
  const offsetOf = (value: string | undefined) => (value === undefined ? null : Number(value));
  page.on("request", (request) => {
    if (!isTus(request.url())) return;
    events.push({ at: Date.now(), kind: "request", method: request.method(), url: request.url(), offset: offsetOf(request.headers()["upload-offset"]) });
  });
  page.on("response", (response) => {
    const request = response.request();
    if (!isTus(request.url())) return;
    events.push({
      at: Date.now(), kind: "response", method: request.method(), url: request.url(),
      offset: offsetOf(response.headers()["upload-offset"]), status: response.status(),
    });
  });
  page.on("requestfailed", (request) => {
    if (!isTus(request.url())) return;
    events.push({ at: Date.now(), kind: "failed", method: request.method(), url: request.url(), offset: null });
  });
}

/** Simula la red: velocidad de subida limitada, o sin conexión. */
async function setNetwork(cdp: CDPSession, offline: boolean, bytesPerS = UPLOAD_BYTES_PER_S) {
  await cdp.send("Network.emulateNetworkConditions", {
    offline,
    latency: 80,
    uploadThroughput: bytesPerS,
    downloadThroughput: bytesPerS * 4,
  });
}

async function phone(context: BrowserContext, events: TusEvent[], bytesPerS = UPLOAD_BYTES_PER_S) {
  const page = await context.newPage();
  trackTus(page, events);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await setNetwork(cdp, false, bytesPerS);
  return { page, cdp };
}

type FieldVideo = {
  hilera: number;
  lado: string;
  fileName: string;
  calidad: { estado: string; avisos: string[] };
  conteo: { estado: string; resultado: { maduros: number; avisos: string[] } | null };
};
const sideName = (v: { hilera: number; lado: string }) => `${v.hilera}${v.lado}`;

/** Entra como cooperativa en un navegador de escritorio. */
async function cooperative(browser: Browser) {
  const coop = await browser.newContext({ ...devices["Desktop Chrome"], locale: "es-ES", timezoneId: "Europe/Madrid" });
  const desk = await coop.newPage();
  await desk.goto("/acceder");
  await desk.getByLabel("Correo").fill(EMAIL);
  await desk.getByLabel("Contraseña").fill(PASSWORD);
  await desk.getByRole("button", { name: "Entrar" }).click();
  await desk.waitForURL((url) => !url.pathname.startsWith("/acceder"));
  const fieldVideos = async (greenhouse: string): Promise<FieldVideo[]> => {
    const response = await coop.request.get(`/api/cooperativa/recolecciones/${HARVEST}/campo`);
    expect(response.ok()).toBe(true);
    const body = (await response.json()) as { invernaderos: { id: string; videos: FieldVideo[] }[] };
    return body.invernaderos.find((g) => g.id === greenhouse)?.videos ?? [];
  };
  /** Espera a que el análisis cuente todos los vídeos y devuelve cuándo terminó cada uno. */
  const waitForCounts = async (greenhouse: string, sides: string[]) => {
    const done: Record<string, number> = {};
    const deadline = Date.now() + 25 * 60 * 1000;
    let videos: FieldVideo[] = [];
    while (Date.now() < deadline) {
      videos = await fieldVideos(greenhouse);
      for (const v of videos) if (v.conteo.estado !== "pendiente" && !done[sideName(v)]) done[sideName(v)] = Date.now();
      if (sides.every((s) => done[s])) break;
      await desk.waitForTimeout(2000);
    }
    expect(Object.keys(done).sort(), "el conteo de todos los vídeos debe terminar").toEqual([...sides].sort());
    for (const v of videos) expect(v.conteo.estado, `conteo de ${sideName(v)}`).toBe("ok");
    return { done, videos };
  };
  return { coop, desk, fieldVideos, waitForCounts };
}

/** La fila de un lado de hilera, sea cual sea su estado. */
const sideRow = (page: Page, hilera: number, lado: string): Locator => {
  const context = `para hilera ${hilera}, lado ${lado}`;
  return page.locator("li").filter({ has: page.locator(`[aria-label$="${context}"], label:has-text("${context}")`) });
};

const fileInput = (page: Page, button: "Grabar" | "Elegir", hilera: number, lado: string): Locator =>
  page.locator("label").filter({ hasText: `${button} para hilera ${hilera}, lado ${lado}` }).locator('input[type="file"]');

const waitFor = async (condition: () => boolean, timeout: number, what: string) => {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) throw new Error(`No ha llegado a tiempo: ${what}`);
    await new Promise((r) => setTimeout(r, 100));
  }
};

const seconds = (ms: number) => Math.round(ms / 100) / 10;

test.afterAll(() => {
  mkdirSync("resultados", { recursive: true });
  writeFileSync("resultados/tiempos.json", `${JSON.stringify(timings, null, 2)}\n`);
  console.log("\nTiempos del ensayo:");
  console.table(timings);
});

test("el agricultor sube sus vídeos y la cooperativa los ve contados", async ({ browser }) => {
  const testStart = Date.now();
  expect(EMAIL && PASSWORD, "Faltan ENSAYO_CORREO y ENSAYO_CONTRASENA: arranca con npm run ensayo").toBeTruthy();
  const farmer = await browser.newContext();
  const events: TusEvent[] = [];
  let { page, cdp } = await phone(farmer, events);
  const since = (from: number) => events.filter((e) => e.at >= from);

  await test.step("abre su enlace", async () => {
    const start = Date.now();
    await page.goto(`/subir/${TOKEN}`);
    await expect(page.getByRole("heading", { name: "Vídeos de la semana" })).toBeVisible();
    await expect(page.getByText(/de \d+ vídeos recibidos/)).toBeVisible();
    timings.abrirEnlaceS = seconds(Date.now() - start);
  });

  let receivedA = 0;
  await test.step("hilera 1, lado A: se corta la conexión y sigue por donde iba", async () => {
    const start = Date.now();
    await fileInput(page, "Grabar", 1, "A").setInputFiles(VIDEO);
    const row = sideRow(page, 1, "A");
    await expect(row.getByText(/Subiendo · \d+ %/)).toBeVisible();

    // Espera a que llegue al menos un trozo completo y a que empiece el siguiente.
    await waitFor(() => since(start).some((e) => e.kind === "response" && e.method === "PATCH" && e.status === 204), UPLOAD_TIMEOUT_MS, "primer trozo");
    const confirmed = Math.max(...since(start).filter((e) => e.kind === "response" && e.method === "PATCH").map((e) => e.offset ?? 0));
    if (confirmed < SIZE) {
      await waitFor(() => since(start).filter((e) => e.kind === "request" && e.method === "PATCH").length >= 2, 30_000, "segundo trozo");
      await page.waitForTimeout(1500);
    }

    const dropAt = Date.now();
    await setNetwork(cdp, true);
    await expect(row.getByText(/En pausa · \d+ %/)).toBeVisible();
    await page.waitForTimeout(OFFLINE_MS);
    const okWhileOffline = since(dropAt).filter((e) => e.kind === "response" && e.status && e.status < 400 && e.at > dropAt + 500);
    expect(okWhileOffline, "sin conexión no debe completarse ninguna petición").toHaveLength(0);
    const before = Math.max(...since(start).filter((e) => e.kind === "response" && e.method === "PATCH").map((e) => e.offset ?? 0));

    const backAt = Date.now();
    await setNetwork(cdp, false);
    await expect(row.getByText("Recibido", { exact: true })).toBeVisible({ timeout: UPLOAD_TIMEOUT_MS });
    receivedA = Date.now();

    const posts = since(start).filter((e) => e.kind === "request" && e.method === "POST");
    expect(posts, "una sola subida creada: no ha empezado de cero").toHaveLength(1);
    const resumed = since(backAt).find((e) => e.kind === "request" && e.method === "PATCH");
    expect(resumed?.offset ?? 0, "al volver sigue desde lo ya recibido").toBeGreaterThanOrEqual(before);
    expect(resumed?.offset ?? 0).toBeGreaterThan(0);
    const last = since(backAt).filter((e) => e.kind === "response" && e.method === "PATCH").pop();
    expect(last?.offset).toBe(SIZE);

    timings.ladoA_subidaS = seconds(receivedA - start - (backAt - dropAt));
    timings.ladoA_cortadoEnMB = Math.round(before / 1e5) / 10;
    timings.ladoA_reanudaDesdeMB = Math.round((resumed?.offset ?? 0) / 1e5) / 10;
    timings.ladoA_reanuda = true;
  });

  await test.step("revisión de la imagen del lado A", async () => {
    const row = sideRow(page, 1, "A");
    await expect(row.getByText("Revisando la imagen…")).toBeHidden({ timeout: 10 * 60 * 1000 });
    timings.calidadS = seconds(Date.now() - receivedA);
    const warnings = await row.locator(".text-warn-ink").allInnerTexts();
    timings.calidadAvisos = warnings.join(" | ") || "ninguno";
  });

  let receivedB = 0;
  await test.step("hilera 1, lado B: cierra la página a medias y continúa al volver a elegirlo", async () => {
    const start = Date.now();
    await fileInput(page, "Elegir", 1, "B").setInputFiles(VIDEO);
    await waitFor(() => since(start).some((e) => e.kind === "response" && e.method === "PATCH" && e.status === 204), UPLOAD_TIMEOUT_MS, "primer trozo del lado B");
    const before = Math.max(...since(start).filter((e) => e.kind === "response" && e.method === "PATCH").map((e) => e.offset ?? 0));
    const uploadUrl = since(start).find((e) => e.kind === "request" && e.method === "PATCH")?.url;
    expect(before, "el vídeo debe ocupar más de un trozo para probar esto").toBeLessThan(SIZE);
    const closedAt = Date.now();
    await page.close();

    ({ page, cdp } = await phone(farmer, events));
    const reopenAt = Date.now();
    await page.goto(`/subir/${TOKEN}`);
    const row = sideRow(page, 1, "B");
    await expect(row.getByText("Vuelve a elegirlo")).toBeVisible();
    await fileInput(page, "Elegir", 1, "B").setInputFiles(VIDEO);
    await expect(row.getByText("Recibido", { exact: true })).toBeVisible({ timeout: UPLOAD_TIMEOUT_MS });
    receivedB = Date.now();

    expect(since(reopenAt).filter((e) => e.kind === "request" && e.method === "POST"), "no crea otra subida").toHaveLength(0);
    const resumed = since(reopenAt).find((e) => e.kind === "request" && e.method === "PATCH");
    expect(resumed?.offset ?? 0, "continúa desde lo ya recibido").toBeGreaterThanOrEqual(before);
    expect(resumed?.url, "la misma subida de antes").toBe(uploadUrl);
    timings.ladoB_subidaS = seconds(receivedB - start - (reopenAt - closedAt));
    timings.ladoB_reanudaDesdeMB = Math.round((resumed?.offset ?? 0) / 1e5) / 10;
    timings.ladoB_reanuda = true;
    await expect(page.getByText(/^2 de \d+ vídeos recibidos$/)).toBeVisible();
  });

  let receivedC = 0;
  await test.step("hilera 2, lado A: la red falla sin que el móvil se dé cuenta y se reintenta sola", async () => {
    const start = Date.now();
    await fileInput(page, "Grabar", 2, "A").setInputFiles(VIDEO);
    const row = sideRow(page, 2, "A");
    await waitFor(() => since(start).some((e) => e.kind === "response" && e.method === "PATCH" && e.status === 204), UPLOAD_TIMEOUT_MS, "primer trozo de la hilera 2");
    const before = Math.max(...since(start).filter((e) => e.kind === "response" && e.method === "PATCH").map((e) => e.offset ?? 0));
    expect(before).toBeLessThan(SIZE);

    // El móvil sigue «con conexión», pero cada petición nueva se corta (wifi sin salida, poca cobertura).
    const failAt = Date.now();
    await page.route("**/api/subidas/**", (route) => route.abort("connectionreset"));
    await expect(row.getByText(/Reconectando · \d+ %/)).toBeVisible({ timeout: UPLOAD_TIMEOUT_MS });
    await page.waitForTimeout(OFFLINE_MS);
    const backAt = Date.now();
    await page.unroute("**/api/subidas/**");
    await expect(row.getByText("Recibido", { exact: true })).toBeVisible({ timeout: UPLOAD_TIMEOUT_MS });
    receivedC = Date.now();

    expect(since(start).filter((e) => e.kind === "request" && e.method === "POST"), "una sola subida creada").toHaveLength(1);
    const resumed = since(backAt).find((e) => e.kind === "request" && e.method === "PATCH");
    expect(resumed?.offset ?? 0, "sigue desde lo ya recibido").toBeGreaterThanOrEqual(before);
    timings.hilera2_subidaS = seconds(receivedC - start - (backAt - failAt));
    timings.hilera2_reanudaDesdeMB = Math.round((resumed?.offset ?? 0) / 1e5) / 10;
    timings.hilera2_reanuda = true;
    await expect(page.getByText(/^3 de \d+ vídeos recibidos$/)).toBeVisible();
  });

  await test.step("la cooperativa recibe los vídeos y su conteo", async () => {
    const { coop, desk, fieldVideos, waitForCounts } = await cooperative(browser);
    expect((await fieldVideos(GREENHOUSE)).map(sideName).sort()).toEqual(["1A", "1B", "2A"]);

    // El conteo pasa cada 30 s y cuenta los vídeos de uno en uno.
    const received: Record<string, number> = { "1A": receivedA, "1B": receivedB, "2A": receivedC };
    const { done: countDone, videos } = await waitForCounts(GREENHOUSE, Object.keys(received));
    for (const key of Object.keys(received)) timings[`conteo${key}_desdeRecibidoS`] = seconds(countDone[key] - received[key]);
    timings.conteoMaduros = videos.map((v) => `${sideName(v)}: ${v.conteo.resultado?.maduros}`).join(", ");
    timings.conteoAvisos = [...new Set(videos.flatMap((v) => v.conteo.resultado?.avisos ?? []))].join(", ");

    await desk.goto("/videos");
    const panel = desk.locator("section").filter({ hasText: "Invernadero 1" }).first();
    await expect(panel.getByText("3 de 8 vídeos")).toBeVisible();
    await expect(panel.getByText(/frutos? maduros?/).first()).toBeVisible();

    await desk.goto("/");
    await expect(desk.getByText("Invernadero 1").first()).toBeVisible();
    mkdirSync("resultados", { recursive: true });
    await desk.screenshot({ path: "resultados/resumen.png", fullPage: true });
    await coop.close();
  });

  await farmer.close();
  timings.ensayoCompletoS = seconds(Date.now() - testStart);
});

/**
 * Plan del 14-11: los agricultores mandan los vídeos al dueño, y él los sube desde su ordenador
 * (Chrome de escritorio) con el enlace de cada invernadero y el botón «Elegir», uno tras otro.
 */
test("el dueño sube desde el ordenador varios vídeos seguidos con «Elegir»", async ({ browser }) => {
  expect(EMAIL && PASSWORD, "Faltan ENSAYO_CORREO y ENSAYO_CONTRASENA: arranca con npm run ensayo").toBeTruthy();
  const lowRes = existsSync(LOW_RES) ? LOW_RES : VIDEO;
  const plan = [
    { hilera: 1, lado: "A", file: VIDEO },
    { hilera: 1, lado: "B", file: lowRes },
    { hilera: 2, lado: "A", file: VIDEO },
    { hilera: 2, lado: "B", file: lowRes },
  ];
  const key = (s: { hilera: number; lado: string }) => `${s.hilera}${s.lado}`;
  const desktopBytesPerS = (DESKTOP_MBPS * 1_000_000) / 8;
  timings.escritorio_subidaMbps = DESKTOP_MBPS;
  timings.escritorio_videoBaja = lowRes === VIDEO
    ? "no generado: se sube el original"
    : `${basename(lowRes)} (${Math.round(statSync(lowRes).size / 1e5) / 10} MB)`;

  const desktop = await browser.newContext({ ...devices["Desktop Chrome"], locale: "es-ES", timezoneId: "Europe/Madrid" });
  const events: TusEvent[] = [];
  const { page } = await phone(desktop, events, desktopBytesPerS);
  await page.goto("/subir/demo-invernadero-2");
  await expect(page.getByRole("heading", { name: "Vídeos de la semana" })).toBeVisible();

  const started: Record<string, number> = {};
  const received: Record<string, number> = {};
  const reviewed: Record<string, number> = {};
  const chosenAt = Date.now();
  await test.step("elige los cuatro vídeos seguidos, sin esperar ni recargar", async () => {
    for (const side of plan) await fileInput(page, "Elegir", side.hilera, side.lado).setInputFiles(side.file);
    // Solo sube uno cada vez; el resto espera en cola.
    await expect(page.getByText("En cola", { exact: true })).toHaveCount(3);
  });

  await test.step("se suben uno tras otro y se revisa su imagen", async () => {
    const biggest = Math.max(...plan.map((s) => statSync(s.file).size));
    const deadline = Date.now() + ((biggest / desktopBytesPerS) * 3000 + 60_000) * plan.length + 10 * 60 * 1000;
    while (plan.some((s) => !reviewed[key(s)])) {
      if (Date.now() > deadline) throw new Error(`No han terminado: ${plan.filter((s) => !reviewed[key(s)]).map(key).join(", ")}`);
      for (const side of plan) {
        const row = sideRow(page, side.hilera, side.lado);
        const k = key(side);
        if (!started[k] && await row.getByText(/Subiendo · \d+ %/).isVisible()) started[k] = Date.now();
        if (!received[k] && await row.getByText("Recibido", { exact: true }).isVisible()) received[k] = Date.now();
        if (received[k] && !reviewed[k] && !(await row.getByText("Revisando la imagen…").isVisible())) reviewed[k] = Date.now();
      }
      await page.waitForTimeout(250);
    }
    expect(events.filter((e) => e.kind === "request" && e.method === "POST"), "una subida por vídeo").toHaveLength(plan.length);
    await expect(page.getByText(/^4 de 8 vídeos recibidos$/)).toBeVisible();
    for (const side of plan) {
      const k = key(side);
      timings[`escritorio_${k}_subidaS`] = seconds(received[k] - (started[k] ?? chosenAt));
      timings[`escritorio_${k}_calidadS`] = seconds(reviewed[k] - received[k]);
      const warnings = await sideRow(page, side.hilera, side.lado).locator(".text-warn-ink").allInnerTexts();
      timings[`escritorio_${k}_avisos`] = warnings.join(" | ") || "ninguno";
    }
    timings.escritorio_todoSubidoS = seconds(Math.max(...Object.values(received)) - chosenAt);
    // Una copia de WhatsApp debe avisar de que hace falta el original.
    if (lowRes !== VIDEO) await expect(sideRow(page, 1, "B").getByText(/Resolución baja/)).toBeVisible();
  });

  await test.step("la cooperativa los ve contados", async () => {
    const { coop, fieldVideos, waitForCounts } = await cooperative(browser);
    expect((await fieldVideos("inv-2")).map(sideName).sort()).toEqual(plan.map(key).sort());
    const { done, videos } = await waitForCounts("inv-2", plan.map(key));
    for (const side of plan) timings[`escritorio_${key(side)}_conteoDesdeRecibidoS`] = seconds(done[key(side)] - received[key(side)]);
    timings.escritorio_conteoMaduros = videos.map((v) => `${sideName(v)}: ${v.conteo.resultado?.maduros}`).join(", ");
    timings.escritorio_todoContadoS = seconds(Math.max(...Object.values(done)) - chosenAt);
    await coop.close();
  });
  await desktop.close();
});
