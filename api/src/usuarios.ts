/**
 * Gestión de cuentas de la cooperativa desde la línea de órdenes.
 *   crear o cambiar contraseña: node dist/usuarios.js crear correo@ejemplo.com "Nombre"
 *   retirar el acceso:          node dist/usuarios.js retirar correo@ejemplo.com
 */
import { randomBytes } from "node:crypto";
import { disableUser, setUserPassword } from "./auth.js";
import { createPool, migrate } from "./db.js";

const [command, email, name] = process.argv.slice(2);
const databaseUrl = process.env.DATABASE_URL;

function usage(): never {
  console.error('Uso: usuarios crear <correo> "<nombre>" | usuarios retirar <correo>');
  process.exit(1);
}

if (!databaseUrl) {
  console.error("Falta la variable DATABASE_URL");
  process.exit(1);
}
if (!email || (command !== "crear" && command !== "retirar") || (command === "crear" && !name)) usage();

const pool = createPool(databaseUrl);
try {
  await migrate(pool);
  if (command === "crear") {
    const password = randomBytes(18).toString("base64url");
    await setUserPassword(pool, email, name, password);
    console.log(`Cuenta lista para ${email}. Sus sesiones anteriores se han cerrado.`);
    console.log(`Contraseña (solo se muestra ahora): ${password}`);
  } else if (await disableUser(pool, email)) {
    console.log(`Acceso retirado a ${email}.`);
  } else {
    console.error(`No existe la cuenta ${email}.`);
    process.exitCode = 1;
  }
} catch (error) {
  console.error((error as Error).message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
