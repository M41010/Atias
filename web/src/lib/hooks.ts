"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getReport, LATEST_HARVEST_ID, listHarvests } from "./api";

export const queryKeys = {
  harvests: ["recolecciones"] as const,
  report: (id: string) => ["informe", id] as const,
  params: ["parametros"] as const,
};

/** La recolección elegida vive en la URL para poder compartirla y recuperarla al recargar. */
export function useSelectedHarvest(): string {
  return useSearchParams().get("recoleccion") ?? LATEST_HARVEST_ID;
}

export function useHarvests() {
  return useQuery({ queryKey: queryKeys.harvests, queryFn: listHarvests });
}

export function useReport(id: string) {
  return useQuery({ queryKey: queryKeys.report(id), queryFn: () => getReport(id) });
}

/** Cada pantalla tiene su título para orientarse entre pestañas y con lector de pantalla. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · Atias`;
  }, [title]);
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
