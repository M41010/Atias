import type { ReactNode } from "react";
import { Providers } from "@/components/Providers";
import { FarmerShell } from "@/components/Shell";

export default function SubirLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <FarmerShell>{children}</FarmerShell>
    </Providers>
  );
}
