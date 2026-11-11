import { hashToken, type Pool } from "./db.js";
import { type HarvestWeek, uploadableHarvests } from "./harvests.js";

export const LINK_HEADER = "x-atias-enlace";

export type Link = { greenhouseId: string; harvestId: string };

/** Devuelve a qué invernadero y recolección da acceso un enlace, o null si no es válido. */
export async function resolveLink(pool: Pool, token: string | null | undefined): Promise<Link | null> {
  if (!token || token.length > 200) return null;
  const { rows } = await pool.query(
    `SELECT greenhouse_id, harvest_id FROM upload_links
     WHERE token_sha256 = $1 AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now())`,
    [hashToken(token)],
  );
  return rows[0] ? { greenhouseId: rows[0].greenhouse_id, harvestId: rows[0].harvest_id } : null;
}

/** Hileras vigentes: las que indicó el agricultor o, si no, las previstas para el invernadero. */
export async function currentHileras(pool: Pool, link: Link): Promise<number> {
  const { rows } = await pool.query(
    `SELECT COALESCE(w.hileras, g.default_hileras) AS hileras
     FROM greenhouses g
     LEFT JOIN weekly_data w ON w.greenhouse_id = g.id AND w.harvest_id = $2
     WHERE g.id = $1`,
    [link.greenhouseId, link.harvestId],
  );
  return rows[0].hileras;
}

/**
 * Destino de una subida de la cooperativa, que no depende de ningún enlace: cualquier invernadero y
 * una recolección ya registrada o una de las semanas abiertas (la en curso y las próximas).
 * Devuelve también la semana que falta registrar, si es nueva. Null si no existe.
 */
export async function cooperativeTarget(
  pool: Pool,
  greenhouseId: string | null | undefined,
  harvestId: string | null | undefined,
): Promise<{ target: Link; newHarvest: HarvestWeek | null } | null> {
  if (!greenhouseId || !harvestId || greenhouseId.length > 100 || harvestId.length > 20) return null;
  const { rows } = await pool.query(
    `SELECT (SELECT 1 FROM greenhouses WHERE id = $1) AS greenhouse, (SELECT 1 FROM harvests WHERE id = $2) AS harvest`,
    [greenhouseId, harvestId],
  );
  if (!rows[0].greenhouse) return null;
  const newHarvest = rows[0].harvest ? null : uploadableHarvests().find((h) => h.id === harvestId);
  if (newHarvest === undefined) return null;
  return { target: { greenhouseId, harvestId }, newHarvest };
}
