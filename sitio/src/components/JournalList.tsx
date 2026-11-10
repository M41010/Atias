import { DIARIO, DIARIO_UI, formatJournalDate, isUpcoming } from "@/content/diario";
import type { Locale } from "@/i18n/config";
import { Reveal } from "./Reveal";

/**
 * Entradas del diario del piloto, de la más reciente a la más antigua, sobre una línea de tiempo.
 * La web es estática: «Próximo» se decide con la fecha del día en que se compila.
 */
export function JournalList({ lang, limit }: { lang: Locale; limit?: number }) {
  const ui = DIARIO_UI[lang];
  const today = new Date().toISOString().slice(0, 10);
  const entries = limit ? DIARIO.slice(0, limit) : DIARIO;

  return (
    <ol className="relative border-l-[3px] border-ink">
      {entries.map((entry, index) => {
        const upcoming = isUpcoming(entry.date, today);
        const text = entry.text[lang];
        return (
          <Reveal
            as="li"
            key={`${entry.date}-${text.title}`}
            delay={index * 100}
            className="relative grid gap-2 pb-10 pl-8 last:pb-0 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-8 sm:pl-10"
          >
            <span
              aria-hidden
              className={`absolute -left-[12px] top-1 h-5 w-5 border-[3px] border-ink ${upcoming ? "bg-paper" : "bg-sprout"}`}
            />
            <p className="flex flex-wrap content-start items-center gap-2 self-start pt-0.5 text-sm font-bold uppercase tracking-[0.06em] text-ink-soft">
              <time dateTime={entry.date}>{formatJournalDate(entry.date, lang)}</time>
              {upcoming && <span className="border-2 border-ink px-2 py-0.5 text-[0.75rem] text-ink">{ui.upcoming}</span>}
            </p>
            <div>
              <h3 className="display text-[clamp(1.6rem,2.6vw,2.25rem)]">{text.title}</h3>
              <p className="prose-measure mt-2 text-ink-soft">{text.body}</p>
            </div>
          </Reveal>
        );
      })}
    </ol>
  );
}
