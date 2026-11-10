import type { ReactNode } from "react";
import { AuthGate } from "@/components/AuthGate";
import { Providers } from "@/components/Providers";

/** Pantalla completa para compartir en una reunión: sin menú, pero con la misma sesión. */
export default function PresentacionLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <AuthGate>{children}</AuthGate>
    </Providers>
  );
}
