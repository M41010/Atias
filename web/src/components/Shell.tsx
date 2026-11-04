"use client";

import { Home, Link2, LogOut, Scale, SlidersHorizontal, Users, Video, Warehouse, WifiOff } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { type ReactNode, Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthGate } from "@/components/AuthGate";
import { useOnline } from "@/lib/hooks";
import { fetchCurrentUser, signOut } from "@/lib/serverApi";

const NAV = [
  { href: "/", label: "Resumen", icon: Home },
  { href: "/invernaderos", label: "Invernaderos", icon: Warehouse },
  { href: "/videos", label: "Vídeos recibidos", icon: Video },
  { href: "/enlaces", label: "Enlaces", icon: Link2 },
  { href: "/cosecha", label: "Cosecha real", icon: Scale },
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
      {failed && <p role="alert" className="text-xs text-bad-ink">No se ha podido cerrar la sesión.</p>}
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
              href={href === "/" || href === "/invernaderos" ? `${href}${query}` : href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-10 items-center gap-2.5 whitespace-nowrap rounded-md px-3 text-sm transition-colors duration-150 ${
                active
                  ? "bg-brand-soft font-semibold text-brand-ink"
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

const SIMULATED_NOTICE = "Datos simulados: ninguna cifra procede de un invernadero real ni indica la precisión del sistema.";

function DataNotice() {
  // Esta pantalla sí muestra lo que han enviado de verdad: no debe decir que es simulada.
  const pathname = usePathname();
  const real = ["/videos", "/enlaces", "/cosecha"].some((path) => pathname.startsWith(path));
  return <>{real ? "Prototipo: vídeos y datos reales de esta prueba. Aún no se analizan." : SIMULATED_NOTICE}</>;
}

function Notices() {
  const online = useOnline();
  return (
    <div className="sticky top-0 z-10">
      <p role="status" className="border-b border-warn-line bg-warn-soft px-4 py-2 text-center text-sm font-medium text-warn-ink">
        <Suspense fallback={SIMULATED_NOTICE}>
          <DataNotice />
        </Suspense>
      </p>
      {!online && (
        <p role="status" className="flex items-center justify-center gap-2 border-b border-line bg-sunken px-4 py-2 text-sm text-ink">
          <WifiOff size={15} aria-hidden />
          Sin conexión: se muestran los últimos datos cargados, que pueden no estar actualizados.
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
      <p className="mx-auto max-w-xl px-4 pt-4 text-lg font-semibold tracking-tight text-brand-ink">Atias</p>
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
          <Link href="/" className="shrink-0 px-1 text-lg font-semibold tracking-tight text-brand-ink md:mb-6 md:block md:px-3">
            Atias
          </Link>
          <Suspense fallback={null}>
            <NavLinks />
          </Suspense>
          <UserMenu />
        </div>
      </nav>
      <div className="min-w-0">
        <Notices />
        <main className="mx-auto max-w-[1160px] px-4 py-6 md:px-8 md:py-7">
          <AuthGate>
            <Suspense fallback={null}>{children}</Suspense>
          </AuthGate>
        </main>
      </div>
    </div>
  );
}
