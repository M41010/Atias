import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { type Locale, pathFor } from "@/i18n/config";

/** Banda de tinta al final de una página: una frase y el botón de pedir demostración. */
export function ClosingBand({ lang, title, body, cta }: { lang: Locale; title: string; body?: string; cta: string }) {
  return (
    <section className="on-ink bg-ink text-trap">
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-6 px-4 py-14 sm:px-8">
        <div className="max-w-[40ch]">
          <p className="display text-[clamp(2rem,3.6vw,3rem)]">{title}</p>
          {body && <p className="mt-3 text-[1.0625rem]">{body}</p>}
        </div>
        <Link href={pathFor(lang, "contacto")} className="btn-primary">
          {cta}
          <ArrowRight size={18} aria-hidden />
        </Link>
      </div>
    </section>
  );
}
