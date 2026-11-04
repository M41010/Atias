"use client";

import { Home, SlidersHorizontal, Users, Warehouse, WifiOff } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { useOnline } from "@/lib/hooks";

const NAV = [
  { href: "/", label: "Resumen", icon: Home },
  { href: "/invernaderos", label: "Invernaderos", icon: Warehouse },
  { href: "/temporeros", label: "Temporeros", icon: Users },
  { href: "/parametros", label: "Parámetros", icon: SlidersHorizontal },
];

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

function Notices() {
  const online = useOnline();
  return (
    <div className="sticky top-0 z-10">
      <p role="status" className="border-b border-warn-line bg-warn-soft px-4 py-2 text-center text-sm font-medium text-warn-ink">
        Datos simulados: ninguna cifra procede de un invernadero real ni indica la precisión del sistema.
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
        </div>
      </nav>
      <div className="min-w-0">
        <Notices />
        <main className="mx-auto max-w-[1160px] px-4 py-6 md:px-8 md:py-7">
          <Suspense fallback={null}>{children}</Suspense>
        </main>
      </div>
    </div>
  );
}
