import { defineConfig, devices } from "@playwright/test";

/** Lo arranca ejecutar.mjs, que antes levanta la pila del ensayo y crea la cuenta de la cooperativa. */
export default defineConfig({
  testDir: ".",
  testMatch: "agricultor.spec.ts",
  // El análisis puede tardar: cuenta el tiempo de subida, la revisión de calidad y el conteo.
  timeout: 30 * 60 * 1000,
  expect: { timeout: 15_000 },
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  outputDir: "resultados/playwright",
  use: {
    baseURL: process.env.ENSAYO_URL ?? "http://localhost:3100",
    // Un móvil Android corriente, con la pantalla y el tacto de un teléfono.
    ...devices["Pixel 7"],
    locale: "es-ES",
    timezoneId: "Europe/Madrid",
    // Si un botón no aparece, mejor fallar pronto que esperar la media hora del ensayo.
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
