import type { ReactNode } from "react";
import { FarmerShell } from "@/components/Shell";

export default function SubirLayout({ children }: { children: ReactNode }) {
  return <FarmerShell>{children}</FarmerShell>;
}
