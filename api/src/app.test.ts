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
import { createPool, hashToken, migrate, type Pool, seedDemo } from "./db.js";
import { harvestWeek, upcomingHarvests } from "./harvests.js";
import { createVideoStore, purgeExpired } from "./uploads.js";

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
  const analysis = createServer((_req, res) => {
    res.statusCode = analysisStatus;
    res.end("{}");
  });
  let apiServer: Server;
  let api: string;
  let cookie: string;
  let now = 0;
  const limiter = new LoginLimiter(() => now);

  const login = (correo = EMAIL, contrasena = PASSWORD) =>
    fetch(`${api}/api/auth/entrar`, {
      method: "POST",
      headers: { "content-type": "application/json" },
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
    const analysisUrl = await listen(analysis);
    apiServer = createServer(createApp({ analysisUrl, pool, store, limiter }));
    api = await listen(apiServer);
  });

  beforeEach(async () => {
    analysisStatus = 200;
    await pool.query("DELETE FROM videos; DELETE FROM weekly_data;");
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
    await Promise.all([close(apiServer), close(analysis)]);
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
