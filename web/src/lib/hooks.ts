"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getReport, LATEST_HARVEST_ID, listHarvests } from "./api";
import { type DataMode, useDataMode } from "./mode";

/** El modo va en la clave: los datos reales y los de demostración nunca comparten caché. */
export const queryKeys = {
  harvests: (mode: DataMode) => ["recolecciones", mode] as const,
  report: (id: string, mode: DataMode) => ["informe", mode, id] as const,
  reports: (mode: DataMode) => ["informe", mode, "todas"] as const,
  params: ["parametros"] as const,
};

/** La recolección elegida vive en la URL para poder compartirla y recuperarla al recargar. */
export function useSelectedHarvest(): string {
  return useSearchParams().get("recoleccion") ?? LATEST_HARVEST_ID;
}

export function useHarvests() {
  const mode = useDataMode();
  return useQuery({ queryKey: queryKeys.harvests(mode), queryFn: listHarvests });
}

export function useReport(id: string) {
  const mode = useDataMode();
  return useQuery({ queryKey: queryKeys.report(id, mode), queryFn: () => getReport(id) });
}

/** Cada pantalla tiene su título para orientarse entre pestañas y con lector de pantalla. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · Atias`;
  }, [title]);
}

/**
 * Mantiene la pantalla encendida mientras `active`. En el móvil, si la pantalla se apaga en mitad de
 * una subida, el navegador congela la página y la subida se corta. El bloqueo se pierde al cambiar de
 * pestaña, así que se vuelve a pedir al regresar. Sin soporte (navegadores antiguos), no hace nada.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const request = () => {
      if (document.visibilityState !== "visible") return;
      navigator.wakeLock
        .request("screen")
        .then((sentinel) => {
          if (cancelled) void sentinel.release();
          else lock = sentinel;
        })
        .catch(() => {});
    };
    request();
    document.addEventListener("visibilitychange", request);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", request);
      void lock?.release().catch(() => {});
    };
  }, [active]);
}

type NetworkInformation = { type?: string; saveData?: boolean; addEventListener?: (event: "change", fn: () => void) => void; removeEventListener?: (event: "change", fn: () => void) => void };

/** Si el móvil sube con datos móviles. Solo lo saben algunos navegadores (Chrome en Android). */
export function useCellular(): boolean {
  const [cellular, setCellular] = useState(false);
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    if (!connection) return;
    const update = () => setCellular(connection.type === "cellular" || Boolean(connection.saveData));
    update();
    connection.addEventListener?.("change", update);
    return () => connection.removeEventListener?.("change", update);
  }, []);
  return cellular;
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}
