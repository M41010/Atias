"use client";

import { useEffect, useState } from "react";

/**
 * La app trabaja con datos reales del piloto. El modo demostración enseña los datos simulados,
 * siempre con una franja visible, para presentar la app completa aunque haya pocos datos reales.
 */
export type DataMode = "real" | "demo";

const KEY = "atias.modo.v1";
const EVENT = "atias:modo";

export function getDataMode(): DataMode {
  if (typeof window === "undefined") return "real";
  try {
    return window.localStorage.getItem(KEY) === "demo" ? "demo" : "real";
  } catch {
    return "real";
  }
}

export function setDataMode(mode: DataMode): void {
  try {
    window.localStorage.setItem(KEY, mode);
  } catch {
    // Sin almacenamiento el cambio no se recuerda, pero la pantalla sigue funcionando.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useDataMode(): DataMode {
  const [mode, setMode] = useState<DataMode>("real");
  useEffect(() => {
    const update = () => setMode(getDataMode());
    update();
    window.addEventListener(EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return mode;
}
