import { del, set } from "idb-keyval";
import { describe, expect, it, vi } from "vitest";
import { clearOfflineCopy, copyStatus, copyStorage, shouldRetry, shouldSave } from "./offlineCopy";
import { ApiError } from "./serverApi";

vi.mock("idb-keyval", () => ({
  get: vi.fn(async () => undefined),
  set: vi.fn(async () => undefined),
  del: vi.fn(async () => undefined),
}));

const query = (key: string, data: unknown = { ok: true }, status = "success", dataUpdatedAt = 1000) => ({
  queryKey: [key, "id"],
  state: { data, status, dataUpdatedAt },
});

describe("shouldSave", () => {
  it.each(["usuario", "recolecciones-reales", "videos-recibidos", "cosecha"])("guarda %s", (key) => {
    expect(shouldSave(query(key))).toBe(true);
  });

  it.each(["enlace", "enlaces", "proximas-recolecciones", "informe"])("nunca guarda %s", (key) => {
    expect(shouldSave(query(key))).toBe(false);
  });

  it("conserva los datos aunque la última actualización haya fallado", () => {
    expect(shouldSave(query("cosecha", { ok: true }, "error"))).toBe(true);
  });

  it("no guarda consultas sin datos", () => {
    const empty = query("cosecha");
    expect(shouldSave({ ...empty, state: { ...empty.state, data: undefined } })).toBe(false);
  });
});

describe("clearOfflineCopy", () => {
  it("una escritura pendiente no recupera la copia borrada", async () => {
    await copyStorage.setItem("copia", "antes");
    expect(set).toHaveBeenCalledTimes(1);
    await clearOfflineCopy();
    expect(del).toHaveBeenCalledTimes(1);
    await copyStorage.setItem("copia", "pendiente");
    expect(set).toHaveBeenCalledTimes(1);
  });
});

describe("shouldRetry", () => {
  it("sin conexión no reintenta, para poder avisar", () => {
    expect(shouldRetry(0, new TypeError("Failed to fetch"), false)).toBe(false);
  });

  it("con conexión reintenta una vez los fallos de red o del servidor", () => {
    expect(shouldRetry(0, new TypeError("Failed to fetch"), true)).toBe(true);
    expect(shouldRetry(0, new ApiError(500, "x"), true)).toBe(true);
    expect(shouldRetry(1, new ApiError(500, "x"), true)).toBe(false);
  });

  it("no reintenta los errores definitivos", () => {
    expect(shouldRetry(0, new ApiError(401, "x"), true)).toBe(false);
  });
});

describe("copyStatus", () => {
  it("muestra la fecha del dato más antiguo", () => {
    const status = copyStatus([query("cosecha", {}, "success", 3000), query("videos-recibidos", {}, "success", 2000)]);
    expect(status).toEqual({ savedAt: 2000, failing: false });
  });

  it("detecta que algo no se ha podido actualizar", () => {
    expect(copyStatus([query("cosecha", {}, "error")]).failing).toBe(true);
  });

  it("ignora al usuario y lo que no se guarda", () => {
    expect(copyStatus([query("usuario", {}, "error"), query("informe")])).toEqual({ savedAt: null, failing: false });
  });
});
