import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";
import { createApp } from "./app.js";

function listen(server: Server): Promise<string> {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
    });
  });
}

function close(server: Server): Promise<void> {
  return new Promise((resolve) => server.close(() => resolve()));
}

describe("API", () => {
  let analysisStatus = 200;
  const analysis = createServer((_req, res) => {
    res.statusCode = analysisStatus;
    res.end("{}");
  });
  let apiServer: Server;
  let downServer: Server;
  let api: string;
  let apiWithoutAnalysis: string;

  before(async () => {
    const analysisUrl = await listen(analysis);
    apiServer = createServer(createApp({ analysisUrl }));
    api = await listen(apiServer);
    // Puerto cerrado: simula que el análisis no está en marcha.
    downServer = createServer(createApp({ analysisUrl: "http://127.0.0.1:1" }));
    apiWithoutAnalysis = await listen(downServer);
  });

  after(async () => {
    await Promise.all([close(apiServer), close(downServer), close(analysis)]);
  });

  it("/salud responde aunque el análisis no esté disponible", async () => {
    const response = await fetch(`${apiWithoutAnalysis}/salud`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { estado: "ok", servicio: "api" });
  });

  it("/listo responde 200 si el análisis funciona", async () => {
    analysisStatus = 200;
    const response = await fetch(`${api}/listo`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { estado: "listo", analisis: "ok" });
  });

  it("/listo responde 503 si el análisis da error", async () => {
    analysisStatus = 500;
    assert.equal((await fetch(`${api}/listo`)).status, 503);
  });

  it("/listo responde 503 si no se alcanza el análisis", async () => {
    const response = await fetch(`${apiWithoutAnalysis}/listo`);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { estado: "no_listo", analisis: "no_disponible" });
  });

  it("devuelve 404 en JSON y no anuncia la tecnología", async () => {
    const response = await fetch(`${api}/otra`);
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("x-powered-by"), null);
    assert.deepEqual(await response.json(), { error: "Ruta no encontrada" });
  });
});
