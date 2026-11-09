import { PencilLine } from "lucide-react";
import type { ReactNode } from "react";

/** Aviso de texto o dato que la empresa aún debe completar. Se ve siempre: nunca se inventa. */
export function PendingNote({ children }: { children: ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 border-2 border-dashed border-ink bg-paper px-3 py-2 text-sm font-semibold">
      <PencilLine size={16} aria-hidden />
      {children}
    </p>
  );
}

/** Hueco de un dato legal pendiente, dentro de una frase. */
export function PendingValue({ label }: { label: string }) {
  return (
    <span className="mx-0.5 inline-block border-2 border-dashed border-ink px-1.5 font-semibold">[{label}]</span>
  );
}
