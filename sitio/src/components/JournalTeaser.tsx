import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { DIARIO_UI } from "@/content/diario";
import { type Locale, pathFor } from "@/i18n/config";
import { JournalList } from "./JournalList";

/** Portada: las tres últimas entradas del diario del piloto, con enlace al diario completo. */
export function JournalTeaser({ lang }: { lang: Locale }) {
  const ui = DIARIO_UI[lang];
  return (
    <section className="bg-trap border-t-[3px] border-ink" aria-labelledby="diario">
      <div className="mx-auto grid max-w-[1320px] gap-12 px-4 py-20 sm:px-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:py-28">
        <div className="flex flex-col items-start gap-5">
          <p className="font-bold uppercase tracking-[0.08em] text-ink-soft">{ui.eyebrow}</p>
          <h2 id="diario" className="display text-[clamp(2.25rem,4.4vw,3.75rem)]">{ui.latest}</h2>
          <p className="text-[1.0625rem] text-ink-soft">{ui.lead}</p>
          <Link href={pathFor(lang, "diario")} className="btn-secondary">
            {ui.all}
            <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
        <JournalList lang={lang} limit={3} />
      </div>
    </section>
  );
}
