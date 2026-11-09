/**
 * Pruebas de integración contra una PostgreSQL real. Se ejecutan con:
 *   docker compose -f compose.test.yaml run --rm --build api-test
 */
import assert from "node:assert/strict";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, beforeEach, describe, it } from "node:test";
import type { FileStore } from "@tus/file-store";
import { createApp } from "./app.js";
import { disableUser, LoginLimiter, setUserPassword } from "./auth.js";
import { createPool, hashToken, migrate, type Pool, removeDemoLinks, seedDemo } from "./db.js";
import { harvestWeek, upcomingHarvests } from "./harvests.js";
import { countPendingVideos } from "./counting.js";
import { createQualityRunner, reviewPendingVideos } from "./quality.js";
import { createVideoStore, purgeExpired } from "./uploads.js";
import { localDateHour, localMidnight } from "./weather.js";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) throw new Error("Falta TEST_DATABASE_URL: usa compose.test.yaml");

const TOKEN = "demo-invernadero-1";
const OTHER_TOKEN = "demo-invernadero-2";
const HARVEST = "2026-W46";
const EMAIL = "ana@cooperativa.test";
const PASSWORD = "contrasena-de-prueba-1";

function listen(server: Server): Promise<string> {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(`http://127.0.0.1:${(server.address() as AddressInfo).port}`));
  });
}
const close = (server: Server) => new Promise<void>((resolve) => server.close(() => resolve()));
const b64 = (value: string) => Buffer.from(value).toString("base64");

describe("API", () => {
  let pool: Pool;
  let store: FileStore;
  let videoDir: string;
  let analysisStatus = 200;
  let analysisBody = JSON.stringify({ medidas: {}, avisos: [] });
  let analysisCalls: string[] = [];
  let analysisUrl = "";
  // Open-Meteo falso: el histórico da la hora del día como temperatura; la previsión, 20 °C y 0,1 mm/h.
  let meteoDown = false;
  let meteoCalls: string[] = [];
  let weatherNow = Date.parse("2026-11-11T12:00:00Z");
  let meteoUrl = "";
  const meteo = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://meteo");
    const start = url.searchParams.get("start_date") as string;
    const end = url.searchParams.get("end_date") as string;
    meteoCalls.push(`${url.pathname} ${start} ${end}`);
    if (meteoDown) {
      res.statusCode = 500;
      res.end("{}");
      return;
    }
    const archive = url.pathname === "/v1/archive";
    const endMs = localMidnight(new Date(Date.parse(`${end}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10));
    const time: number[] = [];
    for (let t = localMidnight(start); t < endMs; t += 3_600_000) time.push(t / 1000);
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({
      hourly: {
        time,
        temperature_2m: time.map((t) => (archive ? localDateHour(t * 1000).hour : 20)),
        precipitation: time.map(() => 0.1),
      },
    }));
  });

  // Conteo: cada prueba decide la respuesta según el cultivo pedido.
  type CountRequest = { video: string; cultivo: string; tramos: number };
  let countCalls: CountRequest[] = [];
  let countReply: (request: CountRequest) => { status: number; body: unknown } = () => ({ status: 200, body: {} });
  const analysis = createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      if (req.url === "/conteo") {
        const request = JSON.parse(body) as CountRequest;
        countCalls.push(request);
        const reply = countReply(request);
        res.statusCode = reply.status;
        res.end(JSON.stringify(reply.body));
        return;
      }
      if (req.url === "/calidad") analysisCalls.push(JSON.parse(body).video);
      res.statusCode = analysisStatus;
      res.end(analysisBody);
    });
  });
  let apiServer: Server;
  let api: string;
  let cookie: string;
  let now = 0;
  const limiter = new LoginLimiter(() => now);

  let freeSpace = Number.MAX_SAFE_INTEGER;
  const MIN_FREE = 1000;

  /** `ip` simula la dirección del cliente que la web reenvía en X-Forwarded-For. */
  const login = (correo = EMAIL, contrasena = PASSWORD, ip?: string) =>
    fetch(`${api}/api/auth/entrar`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(ip ? { "x-forwarded-for": ip } : {}) },
      body: JSON.stringify({ correo, contrasena }),
    });

  /** Petición autenticada a la cooperativa. */
  const coop = (path: string, init: RequestInit = {}) =>
    fetch(`${api}/api/cooperativa${path}`, {
      ...init,
      headers: { cookie, "content-type": "application/json", ...init.headers },
    });

  const link = (path: string, init: RequestInit = {}, token = TOKEN) =>
    fetch(`${api}/api/enlace${path}`, {
      ...init,
      headers: { "x-atias-enlace": token, "content-type": "application/json", ...init.headers },
    });

  function tusHeaders(token = TOKEN) {
    return { "x-atias-enlace": token, "tus-resumable": "1.0.0" };
  }

  async function createUpload(
    { hilera = 1, lado = "A", size = 10, filetype = "video/mp4", filename = "a.mp4", token = TOKEN } = {},
  ) {
    return fetch(`${api}/api/subidas`, {
      method: "POST",
      headers: {
        ...tusHeaders(token),
        "upload-length": String(size),
        "upload-metadata": `filename ${b64(filename)},filetype ${b64(filetype)},hilera ${b64(String(hilera))},lado ${b64(lado)}`,
      },
    });
  }

  const patch = (location: string, body: Buffer, offset: number, token = TOKEN) =>
    fetch(`${api}${location}`, {
      method: "PATCH",
      headers: { ...tusHeaders(token), "upload-offset": String(offset), "content-type": "application/offset+octet-stream" },
      body: new Uint8Array(body),
    });

  async function uploadComplete(options: Parameters<typeof createUpload>[0] = {}) {
    const size = options.size ?? 10;
    const created = await createUpload({ ...options, size });
    assert.equal(created.status, 201);
    const location = created.headers.get("location") as string;
    const done = await patch(location, Buffer.alloc(size, 1), 0, options.token ?? TOKEN);
    assert.equal(done.status, 204);
    return location.split("/").at(-1) as string;
  }

  const received = async () =>
    (await (await link("")).json() as { videos: { id: string; status: string; hilera: number; lado: string; fileName: string }[] }).videos;

  before(async () => {
    pool = createPool(databaseUrl);
    await migrate(pool);
    await migrate(pool); // Aplicarlas dos veces no debe fallar.
    await seedDemo(pool);
    await seedDemo(pool);
    videoDir = await mkdtemp(join(tmpdir(), "atias-videos-"));
    store = createVideoStore(videoDir);
    analysisUrl = await listen(analysis);
    meteoUrl = await listen(meteo);
    apiServer = createServer(createApp({
      analysisUrl, pool, store, limiter, trustedProxy: true,
      uploadLimits: { minFreeBytes: MIN_FREE, freeSpace: async () => freeSpace },
      weather: {
        forecastUrl: `${meteoUrl}/v1/forecast`,
        archiveUrl: `${meteoUrl}/v1/archive`,
        normalsYears: 1,
        now: () => weatherNow,
      },
    }));
    api = await listen(apiServer);
  });

  beforeEach(async () => {
    analysisStatus = 200;
    analysisBody = JSON.stringify({ medidas: {}, avisos: [] });
    analysisCalls = [];
    freeSpace = Number.MAX_SAFE_INTEGER;
    await pool.query("DELETE FROM videos; DELETE FROM weekly_data; DELETE FROM harvest_records;");
    await pool.query("DELETE FROM upload_links WHERE created_by IS NOT NULL OR expires_at IS NOT NULL");
    await pool.query("DELETE FROM sessions; DELETE FROM users;");
    await pool.query("DELETE FROM greenhouses WHERE id NOT IN ('inv-1', 'inv-2', 'inv-3')");
    await pool.query("DELETE FROM harvests WHERE id <> $1", [HARVEST]);
    await pool.query("UPDATE upload_links SET expires_at = NULL, revoked_at = NULL");
    now += 3_600_000; // Deja atrás cualquier bloqueo de la prueba anterior.
    await setUserPassword(pool, EMAIL, "Ana", PASSWORD);
    const response = await login();
    cookie = (response.headers.get("set-cookie") as string).split(";")[0];
  });

  after(async () => {
    await Promise.all([close(apiServer), close(analysis), close(meteo)]);
    await pool.end();
    await rm(videoDir, { recursive: true, force: true });
  });

  describe("estado", () => {
    it("/salud y /listo responden si todo funciona", async () => {
      assert.equal((await fetch(`${api}/salud`)).status, 200);
      const ready = await fetch(`${api}/listo`);
      assert.equal(ready.status, 200);
      assert.deepEqual(await ready.json(), { estado: "listo", analisis: "ok", baseDeDatos: "ok" });
    });

    it("/listo responde 503 si falla el análisis", async () => {
      analysisStatus = 500;
      const ready = await fetch(`${api}/listo`);
      assert.equal(ready.status, 503);
      assert.equal((await ready.json() as { analisis: string }).analisis, "no_disponible");
    });

    it("no anuncia la tecnología y responde 404 en JSON", async () => {
      const response = await fetch(`${api}/otra`);
      assert.equal(response.status, 404);
      assert.equal(response.headers.get("x-powered-by"), null);
    });
  });

  describe("enlaces", () => {
    it("un enlace válido da su invernadero y sus datos", async () => {
      const body = await (await link("")).json() as { invernadero: { id: string }; recoleccion: { id: string }; datos: { hileras: number } };
      assert.equal(body.invernadero.id, "inv-1");
      assert.equal(body.recoleccion.id, HARVEST);
      assert.equal(body.datos.hileras, 4);
    });

    it("rechaza enlaces falsos, ausentes, caducados y revocados", async () => {
      assert.equal((await link("", {}, "falso")).status, 404);
      assert.equal((await fetch(`${api}/api/enlace`)).status, 404);
      await pool.query("UPDATE upload_links SET expires_at = now() - interval '1 day' WHERE token_sha256 = $1", [hashToken(TOKEN)]);
      assert.equal((await link("")).status, 404);
      await pool.query("UPDATE upload_links SET expires_at = NULL, revoked_at = now() WHERE token_sha256 = $1", [hashToken(TOKEN)]);
      assert.equal((await link("")).status, 404);
    });

    it("no guarda los enlaces en claro", async () => {
      const { rows } = await pool.query("SELECT token_sha256 FROM upload_links");
      assert.ok(rows.every((r) => !r.token_sha256.includes("demo")));
    });

    it("sin datos de prueba, los enlaces de prueba dejan de valer", async () => {
      assert.equal(await removeDemoLinks(pool), 3);
      assert.equal((await link("")).status, 404);
      await seedDemo(pool);
      assert.equal((await link("")).status, 200);
    });
  });

  describe("subida", () => {
    it("recibe un vídeo por partes y lo marca como recibido", async () => {
      const created = await createUpload({ size: 10 });
      const location = created.headers.get("location") as string;
      assert.ok(location.startsWith("/api/subidas/"));
      assert.equal((await received())[0].status, "subiendo");

      const first = await patch(location, Buffer.alloc(4, 1), 0);
      assert.equal(first.headers.get("upload-offset"), "4");

      // Reanudar: el servidor dice por dónde iba.
      const head = await fetch(`${api}${location}`, { method: "HEAD", headers: tusHeaders() });
      assert.equal(head.headers.get("upload-offset"), "4");

      await patch(location, Buffer.alloc(6, 1), 4);
      const videos = await received();
      assert.equal(videos.length, 1);
      assert.equal(videos[0].status, "recibido");
      assert.equal(videos[0].fileName, "a.mp4");
    });

    it("rechaza sin enlace, archivos que no son vídeo, y lado o hilera inválidos", async () => {
      assert.equal((await createUpload({ token: "falso" })).status, 403);
      assert.equal((await createUpload({ filetype: "image/jpeg" })).status, 415);
      assert.equal((await createUpload({ lado: "C" })).status, 400);
      assert.equal((await createUpload({ hilera: 5 })).status, 400);
      assert.equal((await createUpload({ hilera: 0 })).status, 400);
      assert.deepEqual(await received(), []);
    });

    it("rechaza vídeos de más de 8 GB", async () => {
      const response = await createUpload({ size: 8 * 1024 ** 3 + 1 });
      assert.equal(response.status, 413);
    });

    it("solo admite tipos de vídeo concretos, aunque el tipo empiece por video/", async () => {
      for (const filetype of ["video/mp4,text/html", "video/html", "video/mp4; text/html", "text/html", ""]) {
        assert.equal((await createUpload({ filetype })).status, 415, filetype);
      }
      assert.equal((await createUpload({ filetype: "video/quicktime" })).status, 201);
    });

    it("guarda el tipo normalizado", async () => {
      const id = await uploadComplete({ filetype: " Video/MP4 " });
      const { rows } = await pool.query("SELECT mime_type FROM videos WHERE id = $1", [id]);
      assert.equal(rows[0].mime_type, "video/mp4");
    });

    it("limita cuántas versiones se guardan por invernadero y recolección", async () => {
      // El invernadero de prueba tiene 4 hileras: 4 x 2 lados x 4 versiones.
      await pool.query(
        `INSERT INTO videos (id, greenhouse_id, harvest_id, hilera, lado, file_name, mime_type, size_bytes, status)
         SELECT gen_random_uuid(), 'inv-1', $1, 1, 'A', 'v.mp4', 'video/mp4', 10, 'sustituido'
         FROM generate_series(1, 32)`,
        [HARVEST],
      );
      assert.equal((await createUpload()).status, 429);
      // Otro invernadero no se ve afectado.
      assert.equal((await createUpload({ token: OTHER_TOKEN })).status, 201);
    });

    it("no acepta un vídeo que dejaría el disco sin el espacio mínimo", async () => {
      freeSpace = MIN_FREE + 50;
      assert.equal((await createUpload({ size: 51 })).status, 507);
      assert.equal((await createUpload({ size: 50 })).status, 201);
    });

    it("otro enlace no puede ver ni continuar la subida", async () => {
      const created = await createUpload({ size: 10 });
      const location = created.headers.get("location") as string;
      const head = await fetch(`${api}${location}`, { method: "HEAD", headers: tusHeaders(OTHER_TOKEN) });
      assert.equal(head.status, 404);
      assert.equal((await patch(location, Buffer.alloc(10, 1), 0, OTHER_TOKEN)).status, 404);
    });

    it("no permite descargar ni borrar por la ruta de subidas", async () => {
      const id = await uploadComplete();
      const url = `${api}/api/subidas/${id}`;
      assert.equal((await fetch(url, { headers: tusHeaders() })).status, 405);
      assert.equal((await fetch(url, { method: "DELETE", headers: tusHeaders() })).status, 405);
    });

    it("un nombre de archivo malicioso no afecta a dónde se guarda", async () => {
      const id = await uploadComplete({ filename: "../../etc/passwd\u0000" });
      assert.ok((await readdir(videoDir)).includes(id));
      assert.equal((await received())[0].fileName, "../../etc/passwd");
    });
  });

  describe("sustituir, quitar y restaurar", () => {
    it("el vídeo anterior sigue vigente hasta que el nuevo llega completo", async () => {
      const first = await uploadComplete({ filename: "viejo.mp4" });
      const created = await createUpload({ filename: "nuevo.mp4", size: 10 });
      const location = created.headers.get("location") as string;

      let videos = await received();
      assert.equal(videos.find((v) => v.status === "recibido")?.id, first);

      await patch(location, Buffer.alloc(10, 1), 0);
      videos = await received();
      assert.equal(videos.length, 1);
      assert.equal(videos[0].fileName, "nuevo.mp4");

      const { rows } = await pool.query("SELECT status, delete_after FROM videos WHERE id = $1", [first]);
      assert.equal(rows[0].status, "sustituido");
      assert.ok(rows[0].delete_after > new Date(Date.now() + 6 * 86400000));
    });

    it("quitar oculta 7 días y restaurar lo devuelve", async () => {
      const id = await uploadComplete();
      assert.equal((await link(`/videos/${id}`, { method: "DELETE" })).status, 204);
      assert.deepEqual(await received(), []);
      const restored = await link(`/videos/${id}/restaurar`, { method: "POST" });
      assert.equal(restored.status, 200);
      assert.equal((await received())[0].id, id);
    });

    it("no restaura si ya hay otro vídeo en ese lado", async () => {
      const id = await uploadComplete();
      await link(`/videos/${id}`, { method: "DELETE" });
      await uploadComplete({ filename: "otro.mp4" });
      assert.equal((await link(`/videos/${id}/restaurar`, { method: "POST" })).status, 409);
    });

    it("otro enlace no puede quitar ni restaurar", async () => {
      const id = await uploadComplete();
      assert.equal((await link(`/videos/${id}`, { method: "DELETE" }, OTHER_TOKEN)).status, 404);
      assert.equal((await received()).length, 1);
    });

    it("responde 404 con un identificador mal formado", async () => {
      assert.equal((await link("/videos/no-es-uuid", { method: "DELETE" })).status, 404);
    });

    it("una subida nueva descarta la anterior sin terminar del mismo lado", async () => {
      await createUpload({ filename: "a.mp4" });
      await createUpload({ filename: "b.mp4" });
      const videos = await received();
      assert.equal(videos.length, 1);
      assert.equal(videos[0].fileName, "b.mp4");
    });
  });

  describe("limpieza", () => {
    it("borra archivo y fila cuando vence el plazo, y conserva lo vigente", async () => {
      const kept = await uploadComplete({ hilera: 1 });
      const gone = await uploadComplete({ hilera: 2 });
      await link(`/videos/${gone}`, { method: "DELETE" });
      assert.equal(await purgeExpired(pool, store), 0, "dentro del plazo no se borra");

      await pool.query("UPDATE videos SET delete_after = now() - interval '1 minute' WHERE id = $1", [gone]);
      assert.equal(await purgeExpired(pool, store), 1);
      const files = await readdir(videoDir);
      assert.ok(!files.includes(gone));
      assert.ok(files.includes(kept));
      assert.equal((await link(`/videos/${gone}/restaurar`, { method: "POST" })).status, 404);
    });

    it("borra subidas abandonadas de más de 7 días", async () => {
      const created = await createUpload();
      const id = (created.headers.get("location") as string).split("/").at(-1);
      await pool.query("UPDATE videos SET created_at = now() - interval '8 days' WHERE id = $1", [id]);
      assert.equal(await purgeExpired(pool, store), 1);
    });

    it("elimina la fila aunque el archivo ya no exista", async () => {
      const id = await uploadComplete();
      await rm(join(videoDir, id), { force: true });
      await pool.query("UPDATE videos SET delete_after = now() - interval '1 minute' WHERE id = $1", [id]);
      assert.equal(await purgeExpired(pool, store), 1);
    });
  });

  describe("datos de la semana", () => {
    const valid = { variety: "X", hileras: 3, longitudM: 50, temperaturaC: 24.5, humedadPct: 70, kilosSemanaPasada: 0 };
    const put = (body: unknown, token = TOKEN) => link("/datos", { method: "PUT", body: JSON.stringify(body) }, token);

    it("guarda y devuelve los datos, incluido el cero", async () => {
      assert.equal((await put(valid)).status, 204);
      const { datos } = await (await link("")).json() as { datos: unknown };
      assert.deepEqual(datos, valid);
    });

    it("rechaza valores fuera de rango o de tipo incorrecto", async () => {
      for (const bad of [{ humedadPct: 150 }, { hileras: 2.5 }, { hileras: 0 }, { hileras: null }, { temperaturaC: "24" }, { variety: 3 }]) {
        assert.equal((await put({ ...valid, ...bad })).status, 400, JSON.stringify(bad));
      }
    });

    it("no deja bajar las hileras por debajo de un vídeo existente", async () => {
      await uploadComplete({ hilera: 3 });
      assert.equal((await put({ ...valid, hileras: 2 })).status, 409);
      assert.equal((await put({ ...valid, hileras: 3 })).status, 204);
    });

    it("el JSON mal formado da 400 sin detalles internos", async () => {
      const response = await link("/datos", { method: "PUT", body: "{no" });
      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { error: "Petición no válida" });
    });

    it("cada enlace escribe solo en su invernadero", async () => {
      await put({ ...valid, variety: "De otro" }, OTHER_TOKEN);
      const { datos } = await (await link("")).json() as { datos: { variety: string } };
      assert.equal(datos.variety, "");
    });
  });

  describe("acceso", () => {
    it("entra con correo sin distinguir mayúsculas y da una cookie protegida", async () => {
      const response = await login(EMAIL.toUpperCase());
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { nombre: "Ana", correo: EMAIL });
      const header = response.headers.get("set-cookie") as string;
      assert.match(header, /HttpOnly/);
      assert.match(header, /SameSite=Lax/);
    });

    it("no revela si falla el correo o la contraseña, ni guarda la contraseña en claro", async () => {
      const wrongPassword = await login(EMAIL, "incorrecta-de-verdad");
      const wrongEmail = await login("nadie@cooperativa.test", PASSWORD);
      assert.equal(wrongPassword.status, 401);
      assert.equal(wrongEmail.status, 401);
      assert.deepEqual(await wrongPassword.json(), await wrongEmail.json());
      const { rows } = await pool.query("SELECT password_hash FROM users");
      assert.ok(!rows[0].password_hash.includes(PASSWORD));
    });

    it("bloquea tras 5 fallos, incluso con la contraseña correcta, y desbloquea con el tiempo", async () => {
      for (let i = 0; i < 5; i++) assert.equal((await login(EMAIL, "mal-mal-mal-mal")).status, 401);
      assert.equal((await login()).status, 429);
      now += 16 * 60 * 1000;
      assert.equal((await login()).status, 200);
    });

    it("un acierto reinicia el contador de fallos", async () => {
      for (let i = 0; i < 4; i++) await login(EMAIL, "mal-mal-mal-mal");
      assert.equal((await login()).status, 200);
      await login(EMAIL, "mal-mal-mal-mal");
      assert.equal((await login()).status, 200);
    });

    it("rechaza peticiones mal formadas o contraseñas enormes", async () => {
      const response = await fetch(`${api}/api/auth/entrar`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ correo: EMAIL }),
      });
      assert.equal(response.status, 400);
      assert.equal((await login(EMAIL, "x".repeat(201))).status, 400);
    });

    it("quien prueba contraseñas desde un equipo no bloquea a la persona desde el suyo", async () => {
      for (let i = 0; i < 5; i++) await login(EMAIL, "mal-mal-mal-mal", "203.0.113.1");
      assert.equal((await login(EMAIL, PASSWORD, "203.0.113.1")).status, 429);
      assert.equal((await login(EMAIL, PASSWORD, "198.51.100.7")).status, 200);
    });

    it("bloquea un equipo que prueba muchos correos distintos", async () => {
      for (let i = 0; i < 20; i++) await login(`persona${i}@cooperativa.test`, "mal-mal-mal-mal", "203.0.113.2");
      assert.equal((await login(EMAIL, PASSWORD, "203.0.113.2")).status, 429);
      assert.equal((await login(EMAIL, PASSWORD, "198.51.100.8")).status, 200);
    });

    it("bloquea una cuenta atacada desde muchos equipos", async () => {
      for (let i = 0; i < 50; i++) await login(EMAIL, "mal-mal-mal-mal", `203.0.113.${100 + i}`);
      assert.equal((await login(EMAIL, PASSWORD, "198.51.100.9")).status, 429);
      now += 16 * 60 * 1000;
      assert.equal((await login(EMAIL, PASSWORD, "198.51.100.9")).status, 200);
    });

    it("sin proxy de confianza no cree la dirección que dice el cliente", async () => {
      const server = createServer(createApp({ analysisUrl, pool, store, limiter: new LoginLimiter(() => now) }));
      const url = await listen(server);
      try {
        const attempt = (contrasena: string, ip: string) =>
          fetch(`${url}/api/auth/entrar`, {
            method: "POST",
            headers: { "content-type": "application/json", "x-forwarded-for": ip },
            body: JSON.stringify({ correo: EMAIL, contrasena }),
          });
        for (let i = 0; i < 5; i++) await attempt("mal-mal-mal-mal", `203.0.113.${i}`);
        // Cambiar la dirección inventada no salta el bloqueo.
        assert.equal((await attempt(PASSWORD, "198.51.100.10")).status, 429);
      } finally {
        await close(server);
      }
    });

    it("no acepta peticiones que cambian algo enviadas desde otra web", async () => {
      const post = (headers: Record<string, string>) =>
        fetch(`${api}/api/auth/entrar`, {
          method: "POST",
          headers: { "content-type": "application/json", ...headers },
          body: JSON.stringify({ correo: EMAIL, contrasena: PASSWORD }),
        });
      assert.equal((await post({ origin: "https://malicioso.test" })).status, 403);
      assert.equal((await post({ origin: "null" })).status, 403);
      assert.equal((await post({ "sec-fetch-site": "cross-site" })).status, 403);
      assert.equal((await post({ "sec-fetch-site": "same-site" })).status, 403);
      assert.equal((await post({ origin: api, "sec-fetch-site": "same-origin" })).status, 200);
      // Detrás de la web, el origen se compara con el dominio que pidió el navegador.
      assert.equal((await post({ origin: "http://atias.test", "x-forwarded-host": "atias.test" })).status, 200);
      const subida = await fetch(`${api}/api/subidas`, {
        method: "POST",
        headers: { ...tusHeaders(), origin: "https://malicioso.test", "upload-length": "10" },
      });
      assert.equal(subida.status, 403);
    });

    it("/yo identifica la sesión y salir la invalida en el servidor", async () => {
      const me = await fetch(`${api}/api/auth/yo`, { headers: { cookie } });
      assert.deepEqual(await me.json(), { nombre: "Ana", correo: EMAIL });
      assert.equal((await fetch(`${api}/api/auth/salir`, { method: "POST", headers: { cookie } })).status, 204);
      assert.equal((await fetch(`${api}/api/auth/yo`, { headers: { cookie } })).status, 401);
      assert.equal((await coop("/invernaderos")).status, 401);
    });

    it("no guarda el token de sesión en claro", async () => {
      const token = cookie.split("=")[1];
      const { rows } = await pool.query("SELECT token_sha256 FROM sessions");
      assert.ok(rows.every((r) => r.token_sha256 !== token));
    });

    it("una sesión caducada deja de valer", async () => {
      await pool.query("UPDATE sessions SET expires_at = now() - interval '1 minute'");
      assert.equal((await coop("/invernaderos")).status, 401);
    });

    it("retirar el acceso cierra la sesión y cambiar la contraseña también", async () => {
      assert.ok(await disableUser(pool, EMAIL));
      assert.equal((await coop("/invernaderos")).status, 401);
      assert.equal((await login()).status, 401);

      await setUserPassword(pool, EMAIL, "Ana", "otra-contrasena-larga");
      assert.equal((await login(EMAIL, "otra-contrasena-larga")).status, 200);
    });

    it("exige contraseñas largas al crear cuentas", async () => {
      await assert.rejects(setUserPassword(pool, "b@c.test", "B", "corta"), /12 caracteres/);
    });

    it("todas las rutas de la cooperativa exigen sesión", async () => {
      for (const [method, path] of [
        ["GET", "/recolecciones"], ["GET", `/recolecciones/${HARVEST}`], ["GET", "/invernaderos"],
        ["POST", "/invernaderos"], ["GET", "/proximas-recolecciones"], ["GET", "/enlaces"],
        ["POST", "/enlaces"], ["POST", "/enlaces/x/revocar"],
        ["GET", "/videos/00000000-0000-0000-0000-000000000000/contenido"],
        ["GET", `/recolecciones/${HARVEST}/cosecha`], ["PUT", `/recolecciones/${HARVEST}/cosecha/inv-1/lunes_viernes`],
      ]) {
        const response = await fetch(`${api}/api/cooperativa${path}`, { method });
        assert.equal(response.status, 401, `${method} ${path}`);
      }
    });

    it("el enlace del agricultor no da acceso a la cooperativa", async () => {
      const response = await fetch(`${api}/api/cooperativa/invernaderos`, { headers: { "x-atias-enlace": TOKEN } });
      assert.equal(response.status, 401);
    });
  });

  describe("cosecha real", () => {
    const put = (scope: string, kg: unknown, greenhouse = "inv-1", harvest = HARVEST) =>
      coop(`/recolecciones/${harvest}/cosecha/${greenhouse}/${scope}`, { method: "PUT", body: JSON.stringify({ kg }) });
    const read = async () => (await (await coop(`/recolecciones/${HARVEST}/cosecha`)).json()) as {
      invernaderos: { id: string; registros: Record<string, { kg: number; registradoPor: string } | null> }[];
    };
    const inv1 = async () => (await read()).invernaderos.find((g) => g.id === "inv-1")?.registros;

    it("guarda cada tipo de cosecha por separado y dice quién la registró", async () => {
      assert.equal((await put("lunes_viernes", 1234.5)).status, 204);
      const records = await inv1();
      assert.equal(records?.lunes_viernes?.kg, 1234.5);
      assert.equal(records?.lunes_viernes?.registradoPor, "Ana");
      assert.equal(records?.cosecha_inmediata, null);
    });

    it("cero kilos es un dato válido y sustituir actualiza el valor", async () => {
      await put("lunes_viernes", 100);
      await put("lunes_viernes", 0);
      assert.equal((await inv1())?.lunes_viernes?.kg, 0);
    });

    it("kg nulo borra el dato", async () => {
      await put("cosecha_inmediata", 50);
      assert.equal((await put("cosecha_inmediata", null)).status, 204);
      assert.equal((await inv1())?.cosecha_inmediata, null);
    });

    it("rechaza valores y tipos de cosecha inválidos", async () => {
      for (const bad of [-1, "100", 10_000_001, undefined]) {
        assert.equal((await put("lunes_viernes", bad)).status, 400, String(bad));
      }
      assert.equal((await put("otra", 10)).status, 400);
    });

    it("responde 404 si no existe la recolección o el invernadero", async () => {
      assert.equal((await put("lunes_viernes", 10, "nada")).status, 404);
      assert.equal((await put("lunes_viernes", 10, "inv-1", "2000-W01")).status, 404);
      assert.equal((await coop("/recolecciones/nada/cosecha")).status, 404);
    });

    it("el enlace del agricultor no puede registrar cosecha", async () => {
      const response = await fetch(`${api}/api/cooperativa/recolecciones/${HARVEST}/cosecha/inv-1/lunes_viernes`, {
        method: "PUT",
        headers: { "x-atias-enlace": TOKEN, "content-type": "application/json" },
        body: JSON.stringify({ kg: 1 }),
      });
      assert.equal(response.status, 401);
    });
  });

  describe("técnicos, familias y datos diarios", () => {
    it("carga las doce familias de la empresa con su tipo de cultivo", async () => {
      const { rows } = await pool.query("SELECT crop, count(*)::int AS n FROM families GROUP BY crop ORDER BY crop");
      assert.deepEqual(rows, [{ crop: "pepino", n: 3 }, { crop: "pimiento", n: 5 }, { crop: "tomate_cherry", n: 4 }]);
    });

    it("cada invernadero de prueba tiene agricultor, técnico, familia y localización", async () => {
      const { rows } = await pool.query(
        `SELECT g.id, t.name AS technician, g.family_id, g.latitude, g.longitude FROM greenhouses g
         JOIN growers a ON a.id = g.grower_id JOIN technicians t ON t.id = a.technician_id ORDER BY g.id`,
      );
      assert.equal(rows.length, 3);
      for (const row of rows) {
        assert.ok(row.family_id && row.technician && row.latitude !== null && row.longitude !== null, row.id);
      }
    });

    it("solo admite días de lunes a viernes en previsiones y cosecha diaria", async () => {
      await pool.query("DELETE FROM daily_forecasts; DELETE FROM daily_harvests");
      await pool.query("INSERT INTO daily_forecasts VALUES ('inv-1', '2026-11-13', 'tecnico', 300)");
      await pool.query("INSERT INTO daily_forecasts VALUES ('inv-1', '2026-11-13', 'atias', 280)");
      await assert.rejects(pool.query("INSERT INTO daily_forecasts VALUES ('inv-1', '2026-11-14', 'tecnico', 300)"));
      await assert.rejects(pool.query("INSERT INTO daily_harvests VALUES ('inv-1', '2026-11-15', 300, 'erp')"));
      await assert.rejects(pool.query("INSERT INTO daily_forecasts VALUES ('inv-1', '2026-11-12', 'otra', 300)"));
      await pool.query("DELETE FROM daily_forecasts");
    });

    it("guarda la temperatura por hora, de fuera o de dentro, y rechaza lecturas imposibles", async () => {
      await pool.query("DELETE FROM hourly_weather");
      const insert = (at: string, place: string, temp: number, source = "simulado") =>
        pool.query(
          "INSERT INTO hourly_weather (greenhouse_id, measured_at, place, kind, temp_c, source) VALUES ('inv-1', $1, $2, 'observado', $3, $4)",
          [at, place, temp, source],
        );
      await insert("2026-11-07T14:00:00+01:00", "exterior", 21.4, "open-meteo");
      await insert("2026-11-07T14:00:00+01:00", "interior", 27.9, "sensor");
      await assert.rejects(insert("2026-11-07T14:30:00+01:00", "exterior", 21));
      await assert.rejects(insert("2026-11-07T15:00:00+01:00", "exterior", 90));
      await assert.rejects(insert("2026-11-07T15:00:00+01:00", "tejado", 20));
      await pool.query("DELETE FROM hourly_weather");
    });

    it("ya no acepta el alcance antiguo de lunes a jueves", async () => {
      assert.equal(
        (await coop(`/recolecciones/${HARVEST}/cosecha/inv-1/lunes_jueves`, { method: "PUT", body: JSON.stringify({ kg: 1 }) })).status,
        400,
      );
    });
  });

  describe("revisión de calidad", () => {
    const quality = async () =>
      ((await (await link("")).json()) as { videos: { id: string; calidad: { estado: string; avisos: string[] } }[] }).videos[0].calidad;

    it("un vídeo recién recibido queda pendiente y pasa a correcto", async () => {
      const id = await uploadComplete();
      assert.deepEqual(await quality(), { estado: "pendiente", avisos: [] });
      assert.equal(await reviewPendingVideos(pool, analysisUrl), 1);
      assert.deepEqual(analysisCalls, [id]);
      assert.deepEqual(await quality(), { estado: "ok", avisos: [] });
    });

    it("guarda los avisos y no vuelve a revisar lo ya revisado", async () => {
      await uploadComplete();
      analysisBody = JSON.stringify({ medidas: { brillo: 3 }, avisos: ["POCA_LUZ"] });
      await reviewPendingVideos(pool, analysisUrl);
      assert.deepEqual(await quality(), { estado: "avisos", avisos: ["POCA_LUZ"] });
      assert.equal(await reviewPendingVideos(pool, analysisUrl), 0);
      assert.equal(analysisCalls.length, 1);
    });

    it("la cooperativa ve el mismo resultado", async () => {
      await uploadComplete();
      analysisBody = JSON.stringify({ medidas: {}, avisos: ["DESENFOCADO"] });
      await reviewPendingVideos(pool, analysisUrl);
      const body = await (await coop(`/recolecciones/${HARVEST}`)).json() as { invernaderos: { id: string; videos: { calidad: unknown }[] }[] };
      assert.deepEqual(body.invernaderos.find((g) => g.id === "inv-1")?.videos[0].calidad, { estado: "avisos", avisos: ["DESENFOCADO"] });
    });

    it("no revisa subidas a medias ni vídeos retirados", async () => {
      await createUpload();
      const id = await uploadComplete({ lado: "B" });
      await link(`/videos/${id}`, { method: "DELETE" });
      assert.equal(await reviewPendingVideos(pool, analysisUrl), 0);
      assert.deepEqual(analysisCalls, []);
    });

    it("con el servicio caído sigue pendiente, sin gastar intentos", async () => {
      await uploadComplete();
      assert.equal(await reviewPendingVideos(pool, "http://127.0.0.1:1"), 0);
      assert.equal((await quality()).estado, "pendiente");
      const { rows } = await pool.query("SELECT quality_attempts FROM videos");
      assert.equal(rows[0].quality_attempts, 0);
    });

    it("tras 3 errores del servicio se rinde y no bloquea a los siguientes", async () => {
      await uploadComplete({ lado: "A" });
      await uploadComplete({ lado: "B" });
      analysisStatus = 500;
      await reviewPendingVideos(pool, analysisUrl);
      const { rows } = await pool.query("SELECT quality_status, quality_attempts FROM videos");
      assert.ok(rows.every((r) => r.quality_status === "error" && r.quality_attempts === 3));
      assert.equal((await quality()).estado, "error");
    });

    it("no solapa dos revisiones a la vez", async () => {
      await uploadComplete();
      const run = createQualityRunner(pool, analysisUrl);
      await Promise.all([run(), run(), run()]);
      assert.equal(analysisCalls.length, 1);
    });
  });

  describe("ver vídeos", () => {
    const content = (id: string, headers: Record<string, string> = {}) =>
      coop(`/videos/${id}/contenido`, { headers });

    it("sirve el vídeo recibido con su tipo y sin dejar que el navegador lo reinterprete", async () => {
      const id = await uploadComplete({ size: 100 });
      const response = await content(id);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("content-type"), "video/mp4");
      assert.equal(response.headers.get("x-content-type-options"), "nosniff");
      assert.match(response.headers.get("content-security-policy") ?? "", /sandbox/);
      assert.equal((await response.arrayBuffer()).byteLength, 100);
    });

    it("un tipo no admitido guardado antes se sirve como descarga, no como página", async () => {
      const id = await uploadComplete({ size: 10 });
      await pool.query("UPDATE videos SET mime_type = 'video/mp4,text/html' WHERE id = $1", [id]);
      const response = await content(id);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("content-type"), "application/octet-stream");
    });

    it("admite peticiones parciales para avanzar en el vídeo", async () => {
      const id = await uploadComplete({ size: 100 });
      const response = await content(id, { range: "bytes=10-19" });
      assert.equal(response.status, 206);
      assert.equal(response.headers.get("content-range"), "bytes 10-19/100");
      assert.equal((await response.arrayBuffer()).byteLength, 10);
    });

    it("no sirve subidas a medias, vídeos quitados ni identificadores inválidos", async () => {
      const created = await createUpload();
      assert.equal((await content((created.headers.get("location") as string).split("/").at(-1) as string)).status, 404);
      const id = await uploadComplete({ lado: "B" });
      await link(`/videos/${id}`, { method: "DELETE" });
      assert.equal((await content(id)).status, 404);
      assert.equal((await content("..%2F..%2Fetc%2Fpasswd")).status, 404);
    });

    it("responde 404 si falta el archivo, sin detalles internos", async () => {
      const id = await uploadComplete();
      await rm(join(videoDir, id), { force: true });
      const response = await content(id);
      assert.equal(response.status, 404);
      assert.deepEqual(await response.json(), { error: "Archivo no encontrado" });
    });

    it("el enlace del agricultor no permite ver vídeos", async () => {
      const id = await uploadComplete();
      const response = await fetch(`${api}/api/cooperativa/videos/${id}/contenido`, { headers: { "x-atias-enlace": TOKEN } });
      assert.equal(response.status, 401);
    });
  });

  describe("gestión de enlaces", () => {
    const next = () => upcomingHarvests()[0];
    const create = async (invernaderoId = "inv-1", inicio = next().inicio) =>
      coop("/enlaces", { method: "POST", body: JSON.stringify({ invernaderoId, inicio }) });

    it("crea un enlace que funciona, ligado a su recolección, y solo guarda el hash", async () => {
      const response = await create();
      assert.equal(response.status, 201);
      const { token } = await response.json() as { token: string };
      assert.ok(token.length >= 30);
      const info = await (await link("", {}, token)).json() as { invernadero: { id: string }; recoleccion: { id: string; etiqueta: string } };
      assert.equal(info.invernadero.id, "inv-1");
      assert.equal(info.recoleccion.id, next().id);
      assert.equal(info.recoleccion.etiqueta, next().etiqueta);
      const { rows } = await pool.query("SELECT 1 FROM upload_links WHERE token_sha256 = $1", [token]);
      assert.equal(rows.length, 0);
    });

    it("caduca a las 00:00 del lunes en España", async () => {
      const { caducaEn } = await (await create()).json() as { caducaEn: string };
      const local = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid", dateStyle: "short", timeStyle: "short" }).format(new Date(caducaEn));
      assert.equal(local, `${next().inicio} 00:00`);
    });

    it("el enlace deja de valer al caducar", async () => {
      const { token, id } = await (await create()).json() as { token: string; id: string };
      await pool.query("UPDATE upload_links SET expires_at = now() - interval '1 minute' WHERE id = $1", [id]);
      assert.equal((await link("", {}, token)).status, 404);
      assert.equal((await createUpload({ token })).status, 403);
    });

    it("crear otro sustituye al vigente", async () => {
      const first = await (await create()).json() as { token: string };
      const second = await (await create()).json() as { token: string };
      assert.equal((await link("", {}, first.token)).status, 404);
      assert.equal((await link("", {}, second.token)).status, 200);
    });

    it("revocar deja el enlace sin efecto, y las subidas en curso también", async () => {
      const { token, id } = await (await create()).json() as { token: string; id: string };
      const created = await createUpload({ token });
      const location = created.headers.get("location") as string;
      assert.equal((await coop(`/enlaces/${id}/revocar`, { method: "POST" })).status, 204);
      assert.equal((await link("", {}, token)).status, 404);
      assert.equal((await patch(location, Buffer.alloc(10, 1), 0, token)).status, 403);
      assert.equal((await coop(`/enlaces/${id}/revocar`, { method: "POST" })).status, 404);
    });

    it("muestra el estado de cada invernadero sin revelar el enlace", async () => {
      // La semana siguiente, sin los enlaces de demostración de la próxima recolección.
      const later = upcomingHarvests()[1].inicio;
      const { token, id } = await (await create("inv-1", later)).json() as { token: string; id: string };
      const response = await coop(`/enlaces?inicio=${later}`);
      const text = await response.text();
      assert.ok(!text.includes(token));
      const body = JSON.parse(text) as { invernaderos: { id: string; enlace: { id: string } | null }[] };
      assert.equal(body.invernaderos.find((g) => g.id === "inv-1")?.enlace?.id, id);
      assert.equal(body.invernaderos.find((g) => g.id === "inv-2")?.enlace, null);
    });

    it("no acepta fechas fuera de las próximas recolecciones ni invernaderos inexistentes", async () => {
      assert.equal((await create("inv-1", "2020-01-06")).status, 400);
      assert.equal((await create("inv-1", harvestWeek("2099-01-05").inicio)).status, 400);
      assert.equal((await create("nada")).status, 404);
      assert.equal((await coop("/enlaces?inicio=2020-01-06")).status, 400);
    });

    it("registra quién creó el enlace", async () => {
      const { id } = await (await create()).json() as { id: string };
      const { rows } = await pool.query(
        "SELECT u.email FROM upload_links l JOIN users u ON u.id = l.created_by WHERE l.id = $1", [id],
      );
      assert.equal(rows[0].email, EMAIL);
    });
  });

  describe("invernaderos", () => {
    const add = (body: unknown) => coop("/invernaderos", { method: "POST", body: JSON.stringify(body) });

    it("crea uno nuevo que ya admite enlaces y subidas", async () => {
      const response = await add({ nombre: "  Nave Sur ", cultivo: "pepino", hileras: 6 });
      assert.equal(response.status, 201);
      const { id, nombre } = await response.json() as { id: string; nombre: string };
      assert.equal(nombre, "Nave Sur");
      const { token } = await (await coop("/enlaces", {
        method: "POST",
        body: JSON.stringify({ invernaderoId: id, inicio: upcomingHarvests()[0].inicio }),
      })).json() as { token: string };
      assert.equal((await createUpload({ hilera: 6, token })).status, 201);
      assert.equal((await createUpload({ hilera: 7, token })).status, 400);
    });

    it("rechaza nombres repetidos sin distinguir mayúsculas y valores inválidos", async () => {
      assert.equal((await add({ nombre: "INVERNADERO 1", cultivo: "pepino", hileras: 1 })).status, 409);
      for (const bad of [
        { nombre: "", cultivo: "pepino", hileras: 1 },
        { nombre: "x".repeat(101), cultivo: "pepino", hileras: 1 },
        { nombre: "A", cultivo: "uva", hileras: 1 },
        { nombre: "A", cultivo: "pepino", hileras: 0 },
        { nombre: "A", cultivo: "pepino", hileras: 2.5 },
      ]) {
        assert.equal((await add(bad)).status, 400, JSON.stringify(bad));
      }
    });
  });

  describe("conteo de frutos", () => {
    const result = (maduros: number) => ({
      detector: "rfdetr-prueba",
      maduros,
      frutos: maduros + 3,
      tramos: [{ n: 1, maduros, clases: { rojo: maduros, inmaduro: 3 } }],
      fotogramasAnalizados: 900,
      duracionS: 300,
      posicion: "desplazamiento",
      avisos: [],
    });
    const countOf = async (id: string) =>
      (await pool.query("SELECT count_status, count_attempts, count FROM videos WHERE id = $1", [id])).rows[0];

    beforeEach(() => {
      countCalls = [];
      countReply = () => ({ status: 200, body: result(12) });
    });

    it("cuenta cada vídeo recibido con el cultivo y los tramos de su invernadero", async () => {
      const id = await uploadComplete();
      assert.equal(await countPendingVideos(pool, analysisUrl), 1);
      assert.deepEqual(countCalls, [{ video: id, cultivo: "tomate_cherry", tramos: 8 }]);
      assert.equal((await countOf(id)).count_status, "ok");
      // La cooperativa lo ve; el detalle interno del análisis no se envía.
      const overview = await (await coop(`/recolecciones/${HARVEST}`)).json() as {
        invernaderos: { id: string; videos: { conteo: { estado: string; resultado: Record<string, unknown> } }[] }[];
      };
      const video = overview.invernaderos.find((g) => g.id === "inv-1")?.videos[0];
      assert.equal(video?.conteo.estado, "ok");
      assert.equal(video?.conteo.resultado.maduros, 12);
      assert.equal(video?.conteo.resultado.fotogramasAnalizados, undefined);
    });

    it("sin modelo para un cultivo lo deja pendiente sin gastar intentos y sigue con los demás", async () => {
      countReply = ({ cultivo }) => (cultivo === "tomate_cherry"
        ? { status: 503, body: { error: "sin_detector" } }
        : { status: 200, body: result(5) });
      const cherry = await uploadComplete();
      const pepper = await uploadComplete({ token: OTHER_TOKEN });
      assert.equal(await countPendingVideos(pool, analysisUrl), 1);
      assert.deepEqual(await countOf(cherry), { count_status: "pendiente", count_attempts: 0, count: null });
      assert.equal((await countOf(pepper)).count_status, "ok");
    });

    it("un vídeo ilegible queda en error sin más intentos", async () => {
      countReply = () => ({ status: 422, body: { error: "Vídeo ilegible" } });
      const id = await uploadComplete();
      await countPendingVideos(pool, analysisUrl);
      assert.equal((await countOf(id)).count_status, "error");
      assert.equal(countCalls.length, 1);
    });

    it("tras 3 errores del servicio se rinde", async () => {
      countReply = () => ({ status: 500, body: {} });
      const id = await uploadComplete();
      await countPendingVideos(pool, analysisUrl);
      assert.deepEqual(await countOf(id), { count_status: "error", count_attempts: 3, count: null });
    });

    it("con el servicio caído o reiniciándose sigue pendiente, sin gastar intentos", async () => {
      const id = await uploadComplete();
      assert.equal(await countPendingVideos(pool, "http://127.0.0.1:1"), 0);
      countReply = () => ({ status: 503, body: { error: "otro" } });
      await countPendingVideos(pool, analysisUrl);
      assert.deepEqual(await countOf(id), { count_status: "pendiente", count_attempts: 0, count: null });
    });

    it("no cuenta subidas a medias ni vídeos quitados", async () => {
      await createUpload({ size: 10 });
      const id = await uploadComplete({ hilera: 2 });
      await link(`/videos/${id}`, { method: "DELETE" });
      assert.equal(await countPendingVideos(pool, analysisUrl), 0);
      assert.deepEqual(countCalls, []);
    });
  });

  describe("meteorología", () => {
    // Carchuna. "Hoy" es el miércoles 11 de noviembre a las 13:00 en España.
    const week = (inicio = "2026-11-09", lat = "36.7", lon = "-3.443") =>
      coop(`/meteorologia?lat=${lat}&lon=${lon}&inicio=${inicio}`);
    type Day = { fecha: string; tipo: string; temperaturaHoraria: number[]; normalHoraria: number[]; lluviaMm: number };
    const days = async (response: Response) => {
      assert.equal(response.status, 200);
      return (await response.json() as { dias: Day[]; desactualizado: boolean }).dias;
    };

    beforeEach(async () => {
      await pool.query("DELETE FROM weather_points");
      meteoDown = false;
      meteoCalls = [];
      weatherNow = Date.parse("2026-11-11T12:00:00Z");
    });

    it("exige sesión y valida lugar y fecha", async () => {
      const anonymous = await fetch(`${api}/api/cooperativa/meteorologia?lat=36.7&lon=-3.443&inicio=2026-11-09`);
      assert.equal(anonymous.status, 401);
      assert.equal((await week("2026-11-10")).status, 400);
      assert.equal((await week("2026-11-09", "100")).status, 400);
      assert.equal((await week("2026-11-09", "")).status, 400);
      assert.equal((await coop("/meteorologia?lat=36.7&inicio=2026-11-09")).status, 400);
      assert.deepEqual(meteoCalls, []);
    });

    it("da de sábado a viernes la temperatura por hora, lo normal y la lluvia", async () => {
      const dias = await days(await week());
      assert.deepEqual(dias.map((d) => d.fecha), [
        "2026-11-07", "2026-11-08", "2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13",
      ]);
      assert.deepEqual(dias.map((d) => d.tipo), [
        "observado", "observado", "observado", "observado", "prevision", "prevision", "prevision",
      ]);
      assert.ok(dias.every((d) => d.temperaturaHoraria.length === 24 && d.temperaturaHoraria.every((t) => t === 20)));
      assert.deepEqual(dias[0].normalHoraria, Array.from({ length: 24 }, (_, h) => h));
      assert.equal(dias[0].lluviaMm, 2.4);
    });

    it("guarda lo pedido y solo vuelve a pedir la previsión cuando caduca", async () => {
      await week();
      await week();
      assert.equal(meteoCalls.filter((c) => c.startsWith("/v1/archive")).length, 1);
      assert.equal(meteoCalls.filter((c) => c.startsWith("/v1/forecast")).length, 1);
      weatherNow += 2 * 3_600_000;
      await week();
      assert.equal(meteoCalls.filter((c) => c.startsWith("/v1/forecast")).length, 2);
    });

    it("una semana ya pasada no se vuelve a pedir", async () => {
      await week("2026-11-02");
      weatherNow += 5 * 3_600_000;
      await week("2026-11-02");
      assert.equal(meteoCalls.filter((c) => c.startsWith("/v1/forecast")).length, 1);
    });

    it("el día del cambio de hora tiene 25 horas", async () => {
      const dias = await days(await week("2026-10-26"));
      assert.equal(dias.find((d) => d.fecha === "2026-10-25")?.temperaturaHoraria.length, 25);
    });

    it("más allá de la previsión usa lo normal y lo indica", async () => {
      const dias = await days(await week("2027-01-04"));
      assert.ok(dias.every((d) => d.tipo === "normal"));
      assert.deepEqual(dias[0].temperaturaHoraria, dias[0].normalHoraria);
      assert.ok(!meteoCalls.some((c) => c.startsWith("/v1/forecast")));
    });

    it("lo muy antiguo se pide al histórico", async () => {
      await week("2026-06-01");
      assert.ok(meteoCalls.includes("/v1/archive 2026-05-30 2026-06-05"));
    });

    it("si Open-Meteo falla, sirve lo guardado avisando, y sin nada guardado responde 503", async () => {
      await week();
      weatherNow += 2 * 3_600_000;
      meteoDown = true;
      const stale = await week();
      assert.equal(stale.status, 200);
      assert.equal((await stale.json() as { desactualizado: boolean }).desactualizado, true);
      assert.equal((await week("2026-11-09", "37.5", "-4")).status, 503);
    });
  });

  describe("cooperativa", () => {
    it("ve los vídeos recibidos y los datos de todos los invernaderos, sin subidas a medias", async () => {
      const id = await uploadComplete({ filename: "vigente.mp4" });
      await createUpload({ lado: "B" });
      await uploadComplete({ token: OTHER_TOKEN, filename: "otro.mp4" });
      const response = await coop(`/recolecciones/${HARVEST}`);
      assert.equal(response.status, 200);
      const body = await response.json() as { invernaderos: { id: string; videos: { id: string }[] }[] };
      assert.equal(body.invernaderos.length, 3);
      assert.deepEqual(body.invernaderos.find((g) => g.id === "inv-1")?.videos.map((v) => v.id), [id]);
      assert.equal(body.invernaderos.find((g) => g.id === "inv-2")?.videos.length, 1);
    });

    it("lista recolecciones y responde 404 si no existe", async () => {
      const list = await (await coop("/recolecciones")).json() as { recolecciones: { id: string }[] };
      assert.ok(list.recolecciones.some((h) => h.id === HARVEST));
      assert.equal((await coop("/recolecciones/nada")).status, 404);
    });
  });
});
