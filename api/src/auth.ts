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

/** Bloqueo temporal tras varios fallos. En memoria: sirve mientras haya una sola copia de la API. */
export class LoginLimiter {
  private attempts = new Map<string, { fails: number; lockedUntil: number }>();

  constructor(private now: () => number = Date.now) {}

  isLocked(email: string): boolean {
    const entry = this.attempts.get(email);
    if (!entry) return false;
    if (entry.lockedUntil && entry.lockedUntil <= this.now()) {
      this.attempts.delete(email);
      return false;
    }
    return entry.lockedUntil > 0;
  }

  fail(email: string): void {
    // Limita la memoria si alguien prueba muchos correos distintos.
    if (this.attempts.size > 10_000) this.attempts.clear();
    const entry = this.attempts.get(email) ?? { fails: 0, lockedUntil: 0 };
    entry.fails += 1;
    if (entry.fails >= MAX_FAILED_LOGINS) entry.lockedUntil = this.now() + LOCK_MS;
    this.attempts.set(email, entry);
  }

  succeed(email: string): void {
    this.attempts.delete(email);
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

export function createAuthRouter(pool: Pool, limiter: LoginLimiter, secureCookies: boolean): Router {
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
    if (limiter.isLocked(email)) {
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
      limiter.fail(email);
      res.status(401).json({ error: "Correo o contraseña incorrectos" });
      return;
    }
    limiter.succeed(email);
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
