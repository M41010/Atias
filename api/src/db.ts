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
  {
    id: "002_acceso_cooperativa",
    sql: `
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text NOT NULL UNIQUE,
        name text NOT NULL,
        password_hash text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        disabled_at timestamptz
      );
      CREATE TABLE sessions (
        token_sha256 text PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz NOT NULL
      );
      ALTER TABLE upload_links
        ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
        ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(),
        ADD COLUMN created_by uuid REFERENCES users(id);
      -- Un solo enlace vigente por invernadero y recolección.
      CREATE UNIQUE INDEX upload_links_one_active
        ON upload_links (greenhouse_id, harvest_id) WHERE revoked_at IS NULL;
      CREATE UNIQUE INDEX greenhouses_unique_name ON greenhouses (lower(name));
    `,
  },
  {
    id: "003_cosecha_real",
    sql: `
      -- Los dos alcances miden cosas distintas y nunca se suman ni se mezclan.
      CREATE TABLE harvest_records (
        greenhouse_id text NOT NULL REFERENCES greenhouses(id),
        harvest_id text NOT NULL REFERENCES harvests(id),
        scope text NOT NULL CHECK (scope IN ('lunes_jueves', 'cosecha_inmediata')),
        kg double precision NOT NULL CHECK (kg >= 0),
        recorded_by uuid NOT NULL REFERENCES users(id),
        recorded_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (greenhouse_id, harvest_id, scope)
      );
    `,
  },
  {
    id: "004_calidad_videos",
    sql: `
      ALTER TABLE videos
        ADD COLUMN quality_status text NOT NULL DEFAULT 'pendiente'
          CHECK (quality_status IN ('pendiente', 'ok', 'avisos', 'error')),
        ADD COLUMN quality jsonb,
        ADD COLUMN quality_attempts integer NOT NULL DEFAULT 0,
        ADD COLUMN quality_checked_at timestamptz;
    `,
  },
  {
    id: "005_tecnicos_familias_diario",
    sql: `
      -- La recolección pasa a ser de lunes a viernes, como la registra la empresa.
      ALTER TABLE harvest_records DROP CONSTRAINT harvest_records_scope_check;
      UPDATE harvest_records SET scope = 'lunes_viernes' WHERE scope = 'lunes_jueves';
      ALTER TABLE harvest_records ADD CONSTRAINT harvest_records_scope_check
        CHECK (scope IN ('lunes_viernes', 'cosecha_inmediata'));

      -- Familia es como la empresa llama al cultivo y la variedad. crop es el tipo que reconoce la visión.
      CREATE TABLE families (
        id text PRIMARY KEY,
        name text NOT NULL UNIQUE,
        crop text NOT NULL CHECK (crop IN ('tomate_cherry', 'pimiento', 'pepino'))
      );
      INSERT INTO families (id, name, crop) VALUES
        ('cherry_pera', 'Cherry pera', 'tomate_cherry'),
        ('cherry_redondo_rojo', 'Cherry redondo rojo', 'tomate_cherry'),
        ('cherry_colores', 'Cherry colores', 'tomate_cherry'),
        ('cherry_rama', 'Cherry rama', 'tomate_cherry'),
        ('katrina', 'Katrina', 'pepino'),
        ('tatayoyo', 'Tatayoyo', 'pimiento'),
        ('jalapeno', 'Jalapeño', 'pimiento'),
        ('padron', 'Padrón', 'pimiento'),
        ('chilis', 'Chilis', 'pimiento'),
        ('snack', 'Snack', 'pepino'),
        ('sweetbites', 'Sweetbites', 'pimiento'),
        ('pepino_holandes', 'Pepino holandés', 'pepino');

      -- Cada técnico lleva varios agricultores y cada agricultor uno o varios invernaderos.
      -- erp_code enlaza con el registro del ERP cuando se conecte.
      CREATE TABLE technicians (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        erp_code text UNIQUE,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE growers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        technician_id uuid REFERENCES technicians(id),
        erp_code text UNIQUE,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      ALTER TABLE greenhouses
        ADD COLUMN grower_id uuid REFERENCES growers(id),
        ADD COLUMN family_id text REFERENCES families(id),
        ADD COLUMN erp_code text UNIQUE,
        -- Localización: de ella sale la meteorología.
        ADD COLUMN municipality text,
        ADD COLUMN latitude double precision CHECK (latitude BETWEEN -90 AND 90),
        ADD COLUMN longitude double precision CHECK (longitude BETWEEN -180 AND 180);
      CREATE INDEX growers_by_technician ON growers (technician_id);
      CREATE INDEX greenhouses_by_grower ON greenhouses (grower_id);

      -- Previsiones por día de recolección. Las del técnico y las de Atias se guardan aparte para compararlas.
      CREATE TABLE daily_forecasts (
        greenhouse_id text NOT NULL REFERENCES greenhouses(id),
        day date NOT NULL CHECK (extract(isodow FROM day) BETWEEN 1 AND 5),
        source text NOT NULL CHECK (source IN ('tecnico', 'atias')),
        kg double precision NOT NULL CHECK (kg >= 0),
        recorded_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (greenhouse_id, day, source)
      );

      -- Kilos reales de cada día. Vendrán del ERP; manual queda para pruebas sin conexión.
      CREATE TABLE daily_harvests (
        greenhouse_id text NOT NULL REFERENCES greenhouses(id),
        day date NOT NULL CHECK (extract(isodow FROM day) BETWEEN 1 AND 5),
        kg double precision NOT NULL CHECK (kg >= 0),
        source text NOT NULL CHECK (source IN ('erp', 'manual')),
        recorded_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (greenhouse_id, day)
      );

      -- La temperatura depende del día y de la hora: se guarda una lectura por hora.
      -- exterior viene de Open-Meteo con la localización; interior, de un sensor dentro del invernadero.
      -- El cálculo usa interior cuando existe y, si no, exterior. observado sustituye a prevision al pasar la hora.
      CREATE TABLE hourly_weather (
        greenhouse_id text NOT NULL REFERENCES greenhouses(id),
        measured_at timestamptz NOT NULL CHECK (date_trunc('hour', measured_at) = measured_at),
        place text NOT NULL CHECK (place IN ('exterior', 'interior')),
        kind text NOT NULL CHECK (kind IN ('prevision', 'observado')),
        temp_c double precision NOT NULL CHECK (temp_c BETWEEN -30 AND 60),
        humidity_pct double precision CHECK (humidity_pct BETWEEN 0 AND 100),
        precipitation_mm double precision CHECK (precipitation_mm >= 0),
        source text NOT NULL CHECK (source IN ('open-meteo', 'sensor', 'simulado')),
        fetched_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (greenhouse_id, measured_at, place)
      );

      -- Lo normal en cada lugar y semana del año (media de años anteriores, histórico de Open-Meteo).
      -- Es la referencia para saber si una semana madura más deprisa o más despacio.
      CREATE TABLE weather_normals (
        greenhouse_id text NOT NULL REFERENCES greenhouses(id),
        iso_week integer NOT NULL CHECK (iso_week BETWEEN 1 AND 53),
        degree_days double precision NOT NULL CHECK (degree_days >= 0),
        base_temp_c double precision NOT NULL,
        years integer NOT NULL CHECK (years > 0),
        computed_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (greenhouse_id, iso_week)
      );
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
  // Nombres inventados: la empresa dará de alta los suyos.
  await pool.query(`
    INSERT INTO technicians (id, name) VALUES
      ('00000000-0000-4000-8000-000000000001', 'Lucía Ferrer')
    ON CONFLICT (id) DO NOTHING
  `);
  await pool.query(`
    INSERT INTO growers (id, name, technician_id) VALUES
      ('00000000-0000-4000-8000-000000000101', 'Antonio Gil', '00000000-0000-4000-8000-000000000001')
    ON CONFLICT (id) DO NOTHING
  `);
  await pool.query(`
    UPDATE greenhouses g SET grower_id = '00000000-0000-4000-8000-000000000101', family_id = v.family,
      municipality = 'Motril', latitude = 36.745, longitude = -3.520
    FROM (VALUES ('inv-1', 'cherry_redondo_rojo'), ('inv-2', 'padron'), ('inv-3', 'pepino_holandes')) AS v(id, family)
    WHERE g.id = v.id AND g.grower_id IS NULL
  `);
  await pool.query(`
    INSERT INTO harvests (id, label, starts_on) VALUES ('2026-W46', 'Recolección 9–13 nov', '2026-11-09')
    ON CONFLICT (id) DO NOTHING
  `);
  for (const [index, token] of DEMO_TOKENS.entries()) {
    await pool.query(
      `INSERT INTO upload_links (token_sha256, greenhouse_id, harvest_id) VALUES ($1, $2, '2026-W46')
       ON CONFLICT DO NOTHING`,
      [hashToken(token), `inv-${index + 1}`],
    );
  }
}
