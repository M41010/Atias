import type { ReactNode } from "react";
import { Providers } from "@/components/Providers";
import { Shell } from "@/components/Shell";

export default function CooperativaLayout({ children }: { children: ReactNode }) {
  return (
    <Providers offlineCopy>
      <Shell>{children}</Shell>
    </Providers>
  );
}
