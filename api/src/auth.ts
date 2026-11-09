import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import express, { type NextFunction, type Request, type RequestHandler, type Response, type Router } from "express";
import type { Pool } from "./db.js";

export const SESSION_COOKIE = "atias_sesion";
export const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 200;
const SESSION_DAYS = 14;
const MAX_FAILED_LOGINS = 5;
const LOCK_MS = 15 * 60 * 1000;
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEY_BYTES = 64;

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_BYTES, SCRYPT, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, key] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !key) return false;
  const expected = Buffer.from(key, "base64");
  const actual = await derive(password, Buffer.from(salt, "base64"));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Se compara contra esto si el correo no existe, para no revelarlo por el tiempo de respuesta.
const DUMMY_HASH = hashPassword(randomBytes(16).toString("hex"));

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** Fallos que bloquean durante 15 minutos, según qué se cuente. */
const LIMITS = {
  // Una cuenta desde un mismo equipo: quien prueba contraseñas solo se bloquea a sí mismo.
  pair: MAX_FAILED_LOGINS,
  // Un equipo contra cualquier cuenta: frena a quien prueba muchos correos.
  ip: 20,
  // Una cuenta desde todos los equipos: frena un ataque repartido entre muchas direcciones.
  account: 50,
};
const MAX_ENTRIES = 10_000;

type Attempts = { fails: number; lastFail: number; lockedUntil: number };

/**
 * Bloqueo temporal tras varios fallos. Con la dirección del cliente, un atacante no puede dejar
 * fuera a alguien de la cooperativa con unos pocos intentos desde su equipo. Sin ella (en local,
 * sin proxy de confianza) solo se puede contar por cuenta: 5 fallos la bloquean 15 minutos.
 * En memoria: sirve mientras haya una sola copia de la API.
 */
export class LoginLimiter {
  private attempts = new Map<string, Attempts>();

  constructor(private now: () => number = Date.now) {}

  private keys(email: string, ip: string): [string, number][] {
    if (!ip) return [[`c:${email}`, MAX_FAILED_LOGINS]];
    return [[`p:${email}|${ip}`, LIMITS.pair], [`i:${ip}`, LIMITS.ip], [`c:${email}`, LIMITS.account]];
  }

  private current(key: string): Attempts | undefined {
    const entry = this.attempts.get(key);
    if (!entry) return undefined;
    const now = this.now();
    // Se olvida al acabar el bloqueo o tras 15 minutos sin fallos.
    if ((entry.lockedUntil && entry.lockedUntil <= now) || (!entry.lockedUntil && now - entry.lastFail > LOCK_MS)) {
      this.attempts.delete(key);
      return undefined;
    }
    return entry;
  }

  isLocked(email: string, ip = ""): boolean {
    return this.keys(email, ip).some(([key]) => (this.current(key)?.lockedUntil ?? 0) > 0);
  }

  fail(email: string, ip = ""): void {
    this.trim();
    const now = this.now();
    for (const [key, limit] of this.keys(email, ip)) {
      const entry = this.current(key) ?? { fails: 0, lastFail: now, lockedUntil: 0 };
      entry.fails += 1;
      entry.lastFail = now;
      if (entry.fails >= limit) entry.lockedUntil = now + LOCK_MS;
      // Se vuelve a insertar para que el orden del mapa sea el de la última actividad.
      this.attempts.delete(key);
      this.attempts.set(key, entry);
    }
  }

  succeed(email: string, ip = ""): void {
    for (const [key] of this.keys(email, ip)) this.attempts.delete(key);
  }

  /** Limita la memoria sin borrar todos los bloqueos: primero lo caducado, luego lo más antiguo. */
  private trim(): void {
    if (this.attempts.size < MAX_ENTRIES) return;
    for (const key of [...this.attempts.keys()]) this.current(key);
    for (const key of this.attempts.keys()) {
      if (this.attempts.size < MAX_ENTRIES * 0.9) break;
      this.attempts.delete(key);
    }
  }
}

const hashSessionToken = (token: string) => createHash("sha256").update(token).digest("hex");

function readCookie(req: Request, name: string): string | undefined {
  for (const part of (req.headers.cookie ?? "").split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return undefined;
}

export type SessionUser = { id: string; email: string; name: string };

async function findSessionUser(pool: Pool, req: Request): Promise<SessionUser | null> {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token || token.length > 100) return null;
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.name FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_sha256 = $1 AND s.expires_at > now() AND u.disabled_at IS NULL`,
    [hashSessionToken(token)],
  );
  return rows[0] ?? null;
}

export function requireSession(pool: Pool): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await findSessionUser(pool, req);
    if (!user) {
      res.status(401).json({ error: "Inicia sesión para continuar" });
      return;
    }
    res.locals.user = user;
    next();
  };
}

export function createAuthRouter(
  pool: Pool,
  limiter: LoginLimiter,
  secureCookies: boolean,
  knowsClientIp = false,
): Router {
  const router = express.Router();
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: secureCookies,
    path: "/",
  };

  router.post("/entrar", async (req, res) => {
    const { correo, contrasena } = (req.body ?? {}) as Record<string, unknown>;
    if (typeof correo !== "string" || typeof contrasena !== "string"
      || correo.length > 254 || contrasena.length > MAX_PASSWORD_LENGTH) {
      res.status(400).json({ error: "Indica tu correo y tu contraseña" });
      return;
    }
    const email = normalizeEmail(correo);
    // Sin una dirección fiable, el bloqueo solo puede ser por cuenta.
    const ip = knowsClientIp ? req.ip ?? "" : "";
    if (limiter.isLocked(email, ip)) {
      res.status(429).json({ error: "Demasiados intentos. Vuelve a probar dentro de 15 minutos." });
      return;
    }
    const { rows } = await pool.query(
      "SELECT id, name, email, password_hash FROM users WHERE email = $1 AND disabled_at IS NULL",
      [email],
    );
    const user = rows[0];
    const valid = await verifyPassword(contrasena, user?.password_hash ?? (await DUMMY_HASH));
    if (!user || !valid) {
      limiter.fail(email, ip);
      res.status(401).json({ error: "Correo o contraseña incorrectos" });
      return;
    }
    limiter.succeed(email, ip);
    const token = randomBytes(32).toString("base64url");
    await pool.query(
      `INSERT INTO sessions (token_sha256, user_id, expires_at)
       VALUES ($1, $2, now() + make_interval(days => $3))`,
      [hashSessionToken(token), user.id, SESSION_DAYS],
    );
    res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: SESSION_DAYS * 86_400_000 });
    res.json({ nombre: user.name, correo: user.email });
  });

  router.post("/salir", async (req, res) => {
    const token = readCookie(req, SESSION_COOKIE);
    if (token) await pool.query("DELETE FROM sessions WHERE token_sha256 = $1", [hashSessionToken(token)]);
    res.clearCookie(SESSION_COOKIE, cookieOptions);
    res.status(204).end();
  });

  router.get("/yo", async (req, res) => {
    const user = await findSessionUser(pool, req);
    if (!user) {
      res.status(401).json({ error: "Inicia sesión para continuar" });
      return;
    }
    res.json({ nombre: user.name, correo: user.email });
  });

  return router;
}

/** Crea una cuenta o, si ya existe, cambia su contraseña y cierra sus sesiones. */
export async function setUserPassword(pool: Pool, email: string, name: string, password: string): Promise<void> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
  }
  const normalized = normalizeEmail(email);
  if (!/^[^@\s]+@[^@\s]+$/.test(normalized)) throw new Error("Correo no válido");
  await pool.query(
    `INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, disabled_at = NULL`,
    [normalized, name, await hashPassword(password)],
  );
  await pool.query(
    "DELETE FROM sessions WHERE user_id = (SELECT id FROM users WHERE email = $1)",
    [normalized],
  );
}

/** Retira el acceso a una persona de inmediato. Devuelve si existía. */
export async function disableUser(pool: Pool, email: string): Promise<boolean> {
  const { rows } = await pool.query(
    "UPDATE users SET disabled_at = now() WHERE email = $1 RETURNING id",
    [normalizeEmail(email)],
  );
  if (!rows[0]) return false;
  await pool.query("DELETE FROM sessions WHERE user_id = $1", [rows[0].id]);
  return true;
}

export async function purgeExpiredSessions(pool: Pool): Promise<void> {
  await pool.query("DELETE FROM sessions WHERE expires_at <= now()");
}
