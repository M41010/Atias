"use client";

import { CalendarDays, ChartColumn, ClipboardList, Crosshair, Home, Link2, LogOut, Presentation, Scale, SlidersHorizontal, Upload, Users, Video, Warehouse, WifiOff } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { type ReactNode, Suspense, useEffect, useState } from "react";
import { notifyManager, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthGate } from "@/components/AuthGate";
import { Wordmark } from "@/components/Wordmark";
import { fmtDate } from "@/lib/format";
import { useOnline } from "@/lib/hooks";
import { setDataMode, useDataMode } from "@/lib/mode";
import {
  clearOfflineCopy,
  copyStatus,
  type CopyStatus,
  harvestListQuery,
  harvestOverviewQuery,
  harvestRecordsQuery,
  registerOfflineScreens,
} from "@/lib/offlineCopy";
import { fetchCurrentUser, signOut } from "@/lib/serverApi";

const NAV = [
  { href: "/", label: "Resumen", icon: Home },
  { href: "/prevision", label: "Previsión diaria", icon: CalendarDays },
  { href: "/produccion", label: "Producción", icon: ChartColumn },
  { href: "/invernaderos", label: "Invernaderos", icon: Warehouse },
  { href: "/videos", label: "Vídeos recibidos", icon: Video },
  { href: "/subir-videos", label: "Subir vídeos", icon: Upload },
  { href: "/enlaces", label: "Enlaces", icon: Link2 },
  { href: "/cosecha", label: "Cosecha real", icon: Scale },
  { href: "/campo", label: "Datos de campo", icon: ClipboardList },
  { href: "/precision", label: "Precisión", icon: Crosshair },
  { href: "/temporeros", label: "Temporeros", icon: Users },
  { href: "/parametros", label: "Parámetros", icon: SlidersHorizontal },
];

function UserMenu() {
  const { data } = useQuery({ queryKey: ["usuario"], queryFn: fetchCurrentUser, staleTime: 60_000 });
  const [failed, setFailed] = useState(false);
  if (!data) return null;
  return (
    <div className="ml-auto shrink-0 md:mt-6 md:ml-0 md:border-t md:border-line md:px-3 md:pt-4">
      <p className="hidden truncate text-sm font-medium md:block">{data.nombre}</p>
      <button
        type="button"
        onClick={() => {
          signOut()
            .then(clearOfflineCopy)
            // Carga completa a propósito: no debe quedar en memoria nada de la sesión cerrada.
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination
            .then(() => window.location.assign("/acceder"))
            .catch(() => setFailed(true));
        }}
        className="flex min-h-10 items-center gap-2 whitespace-nowrap rounded-md text-sm text-muted transition-colors duration-150 hover:text-ink"
      >
        <LogOut size={16} aria-hidden />
        Salir
      </button>
      {failed && <p role="alert" className="text-xs text-bad-ink">Cerrar la sesión necesita conexión.</p>}
    </div>
  );
}

function NavLinks() {
  const pathname = usePathname();
  const params = useSearchParams();
  const harvest = params.get("recoleccion");
  const query = harvest ? `?recoleccion=${encodeURIComponent(harvest)}` : "";
  return (
    <ul className="flex gap-1 md:flex-col">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              // Temporeros y Parámetros siempre trabajan sobre la recolección actual.
              href={["/", "/invernaderos", "/prevision", "/campo", "/precision"].includes(href) ? `${href}${query}` : href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-10 items-center gap-2.5 whitespace-nowrap rounded-md px-3 text-sm transition-colors duration-150 ${
                active
                  ? "bg-ink font-semibold text-canvas"
                  : "text-muted hover:bg-sunken hover:text-ink"
              }`}
            >
              <Icon size={16} strokeWidth={2} aria-hidden />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

const SIMULATED_NOTICE = "Modo demostración: datos simulados. Ninguna cifra procede de un invernadero real ni indica la precisión del sistema.";
const REAL_NOTICE = "Datos reales del piloto. El peso por fruto y la fruta tapada aún se están midiendo: las cifras pueden cambiar.";

function DataNotice() {
  const mode = useDataMode();
  const pathname = usePathname();
  // Vídeos, subidas, enlaces, cosecha y datos de campo son siempre reales, también en la demostración.
  const alwaysReal = ["/videos", "/subir-videos", "/enlaces", "/cosecha", "/campo"].some((path) => pathname.startsWith(path));
  return <>{mode === "demo" && !alwaysReal ? SIMULATED_NOTICE : REAL_NOTICE}</>;
}

/** Interruptor del modo demostración, visible siempre para no confundir datos reales con simulados. */
function DemoSwitch() {
  const mode = useDataMode();
  const demo = mode === "demo";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={demo}
      onClick={() => setDataMode(demo ? "real" : "demo")}
      className={`flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3 text-sm transition-colors duration-150 md:mt-4 md:w-full ${
        demo ? "bg-warn-soft font-semibold text-warn-ink" : "text-muted hover:bg-sunken hover:text-ink"
      }`}
    >
      <Presentation size={16} aria-hidden />
      Demostración
      <span className={`ml-auto rounded-full px-2 text-xs ${demo ? "bg-warn-ink text-surface" : "bg-sunken text-muted"}`}>
        {demo ? "Sí" : "No"}
      </span>
    </button>
  );
}

/** Lo que hay en pantalla de la copia local, al día con cada cambio en las consultas. */
function useShownCopy(): CopyStatus {
  const client = useQueryClient();
  const [status, setStatus] = useState<CopyStatus>({ savedAt: null, failing: false });
  useEffect(() => {
    const cache = client.getQueryCache();
    const update = () => {
      const next = copyStatus(cache.getAll().filter((query) => query.isActive()));
      setStatus((value) => (value.savedAt === next.savedAt && value.failing === next.failing ? value : next));
    };
    update();
    // La caché avisa en el mismo instante en que otro componente crea su consulta, a mitad de su
    // render: actualizar el estado ahí da «Cannot update a component (Notices) while rendering a
    // different component». batchCalls aplaza el aviso a después del render.
    let active = true;
    const unsubscribe = cache.subscribe(notifyManager.batchCalls(() => active && update()));
    return () => {
      active = false;
      unsubscribe();
    };
  }, [client]);
  return status;
}

const COPY_REFRESH_MS = 5 * 60 * 1000;

/** Mantiene al día la copia de la última recolección, aunque no se hayan abierto sus pantallas. */
function OfflineCopyKeeper() {
  const client = useQueryClient();
  const online = useOnline();
  useEffect(registerOfflineScreens, []);
  useEffect(() => {
    if (!online) return;
    const refresh = async () => {
      const harvests = await client.fetchQuery(harvestListQuery()).catch(() => null);
      const latest = harvests?.[0]?.id;
      if (!latest) return;
      await Promise.all([
        client.prefetchQuery(harvestOverviewQuery(latest)),
        client.prefetchQuery(harvestRecordsQuery(latest)),
      ]);
    };
    void refresh();
    const timer = setInterval(() => void refresh(), COPY_REFRESH_MS);
    return () => clearInterval(timer);
  }, [client, online]);
  return null;
}

function Notices() {
  const online = useOnline();
  const demo = useDataMode() === "demo";
  const { savedAt, failing } = useShownCopy();
  const saved = savedAt ? `Datos guardados: ${fmtDate(new Date(savedAt).toISOString())}. Pueden no estar actualizados.` : "Los datos pueden no estar actualizados.";
  return (
    <div className="sticky top-0 z-10">
      <p role="status" className={`border-b px-4 py-2 text-center text-sm font-medium ${demo ? "border-warn-line bg-warn-soft text-warn-ink" : "border-line bg-sunken text-ink"}`}>
        <Suspense fallback={SIMULATED_NOTICE}>
          <DataNotice />
        </Suspense>
      </p>
      {(!online || failing) && (
        <p role="status" className="flex items-center justify-center gap-2 border-b border-line bg-sunken px-4 py-2 text-sm text-ink">
          <WifiOff size={15} className="shrink-0" aria-hidden />
          {online ? "No se puede conectar con el servidor." : "Sin conexión."} {saved}
        </p>
      )}
    </div>
  );
}

/** Pantalla del agricultor: sin menú, porque no debe ver datos de la cooperativa ni de otros. */
export function FarmerShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <div className="sticky top-0 z-10">
        <p role="status" className="border-b border-warn-line bg-warn-soft px-4 py-2 text-center text-sm font-medium text-warn-ink">
          Prototipo en pruebas: vídeos y datos se envían a un servidor de prueba.
        </p>
      </div>
      <p className="mx-auto max-w-xl px-4 pt-4 text-xl">
        <Wordmark />
      </p>
      <main className="mx-auto max-w-xl px-4 pt-2 pb-8">
        <Suspense fallback={null}>{children}</Suspense>
      </main>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[224px_minmax(0,1fr)]">
      <nav aria-label="Principal" className="border-b border-line bg-surface md:border-r md:border-b-0">
        <div className="flex items-center gap-4 overflow-x-auto px-4 py-2.5 md:sticky md:top-0 md:block md:px-3 md:py-5">
          <Link href="/" className="shrink-0 px-1 text-xl md:mb-6 md:block md:px-3">
            <Wordmark />
          </Link>
          <Suspense fallback={null}>
            <NavLinks />
          </Suspense>
          <DemoSwitch />
          <UserMenu />
        </div>
      </nav>
      <div className="min-w-0">
        <Notices />
        <main className="mx-auto max-w-[1160px] px-4 py-6 md:px-8 md:py-7">
          <AuthGate>
            <OfflineCopyKeeper />
            <Suspense fallback={null}>{children}</Suspense>
          </AuthGate>
        </main>
      </div>
    </div>
  );
}
