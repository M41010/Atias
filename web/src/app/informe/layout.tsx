import type { ReactNode } from "react";
import { AuthGate } from "@/components/AuthGate";
import { Providers } from "@/components/Providers";

/** Hoja para imprimir o guardar en PDF: sin menú, con la misma sesión. */
export default function InformeLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <AuthGate>{children}</AuthGate>
    </Providers>
  );
}
