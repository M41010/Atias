/**
 * Resultados medidos del piloto que se publican en la web.
 *
 * Mientras valga `null`, la sección de resultados NO aparece en ninguna página. Solo se rellena con
 * cifras medidas de verdad (pantalla de Precisión de la app, con cosecha real), nunca con ejemplos.
 * Errores y sesgos en porcentaje de los kilos recogidos (5.8 = 5,8 %); sesgo positivo = de más.
 *
 * Ejemplo de forma (no copiar las cifras):
 *   export const RESULTADOS: PilotResults | null = {
 *     asOf: "2027-01-15", greenhouses: 3, weeks: 8,
 *     forecasts: [{ source: "atias", errorPct: 0, biasPct: 0 }, …],
 *     controlDiffPct: 0,
 *   };
 */
export type ForecastSource = "atias" | "agricultor" | "tecnico";

export type PilotResults = {
  /** Fecha de los datos, AAAA-MM-DD. */
  asOf: string;
  greenhouses: number;
  weeks: number;
  /** Una fila por previsión comparada; las que no se midieron se dejan fuera. */
  forecasts: { source: ForecastSource; errorPct: number; biasPct: number }[];
  /** Diferencia del conteo de la cámara frente al conteo a mano en los tramos de control. */
  controlDiffPct?: number;
};

export const RESULTADOS: PilotResults | null = null;
