import { createHash } from "node:crypto";
import pg from "pg";

export type Pool = pg.Pool;

export function createPool(connectionString: string): Pool {
  return new pg.Pool({ connectionString, max: 10 });
}

const MIGRATIONS: { id: string; sql: string }[] = [
  {
    id: "001_subidas",
    sql: `
      CREATE TABLE greenhouses (
        id text PRIMARY KEY,
        name text NOT NULL,
        crop text NOT NULL,
        default_hileras integer NOT NULL CHECK (default_hileras > 0)
      );
      CREATE TABLE harvests (
        id text PRIMARY KEY,
        label text NOT NULL,
        starts_on date NOT NULL
      );
      -- Solo se guarda el hash: quien lea la base de datos no obtiene enlaces válidos.
      CREATE TABLE upload_links (
        token_sha256 text PRIMARY KEY,
        greenhouse_id text NOT NULL REFERENCES greenhouses(id),
        harvest_id text NOT NULL REFERENCES harvests(id),
        expires_at timestamptz,
        revoked_at timestamptz
      );
      CREATE TABLE weekly_data (
        greenhouse_id text NOT NULL REFERENCES greenhouses(id),
        harvest_id text NOT NULL REFERENCES harvests(id),
        variety text,
        hileras integer,
        longitud_m double precision,
        temperatura_c double precision,
        humedad_pct double precision,
        kilos_semana_pasada double precision,
        updated_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (greenhouse_id, harvest_id)
      );
      CREATE TABLE videos (
        id uuid PRIMARY KEY,
        greenhouse_id text NOT NULL REFERENCES greenhouses(id),
        harvest_id text NOT NULL REFERENCES harvests(id),
        hilera integer NOT NULL CHECK (hilera > 0),
        lado text NOT NULL CHECK (lado IN ('A', 'B')),
        file_name text NOT NULL,
        mime_type text NOT NULL,
        size_bytes bigint NOT NULL,
        status text NOT NULL CHECK (status IN ('subiendo', 'recibido', 'sustituido', 'quitado')),
        created_at timestamptz NOT NULL DEFAULT now(),
        received_at timestamptz,
        delete_after timestamptz
      );
      -- Cada lado de cada hilera tiene como mucho un vídeo vigente.
      CREATE UNIQUE INDEX videos_one_received_per_slot
        ON videos (greenhouse_id, harvest_id, hilera, lado) WHERE status = 'recibido';
      CREATE INDEX videos_by_harvest ON videos (harvest_id, greenhouse_id);
    `,
  },
];

/** Aplica las migraciones pendientes. El bloqueo evita conflictos si arrancan varias copias. */
export async function migrate(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock(727001)");
    await client.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    for (const migration of MIGRATIONS) {
      const { rowCount } = await client.query("SELECT 1 FROM schema_migrations WHERE id = $1", [migration.id]);
      if (rowCount) continue;
      await client.query("BEGIN");
      try {
        await client.query(migration.sql);
        await client.query("INSERT INTO schema_migrations (id) VALUES ($1)", [migration.id]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock(727001)").catch(() => {});
    client.release();
  }
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const DEMO_TOKENS = ["demo-invernadero-1", "demo-invernadero-2", "demo-invernadero-3"];

/** Datos de prueba para el prototipo. Solo se cargan si se pide expresamente. */
export async function seedDemo(pool: Pool): Promise<void> {
  await pool.query(`
    INSERT INTO greenhouses (id, name, crop, default_hileras) VALUES
      ('inv-1', 'Invernadero 1', 'tomate_cherry', 4),
      ('inv-2', 'Invernadero 2', 'pimiento', 4),
      ('inv-3', 'Invernadero 3', 'pepino', 4)
    ON CONFLICT (id) DO NOTHING
  `);
  await pool.query(`
    INSERT INTO harvests (id, label, starts_on) VALUES ('2026-W46', 'Recolección 9–12 nov', '2026-11-09')
    ON CONFLICT (id) DO NOTHING
  `);
  for (const [index, token] of DEMO_TOKENS.entries()) {
    await pool.query(
      `INSERT INTO upload_links (token_sha256, greenhouse_id, harvest_id) VALUES ($1, $2, '2026-W46')
       ON CONFLICT (token_sha256) DO NOTHING`,
      [hashToken(token), `inv-${index + 1}`],
    );
  }
}
