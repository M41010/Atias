import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { type Locale, pathFor } from "@/i18n/config";
import { getContent } from "@/i18n/content";
import { Reveal } from "./Reveal";

/** Dirección del formulario con el piloto ya elegido como interés. */
export const pilotHref = (lang: Locale) => `${pathFor(lang, "contacto")}?interes=piloto`;

/**
 * Oferta de piloto gratis de 4 semanas: la llamada a la acción medible que nadie más ofrece.
 * Tres pasos y un botón al formulario con el piloto preseleccionado. Sin precio.
 */
export function PilotOffer({ lang }: { lang: Locale }) {
  const { pilotOffer: t } = getContent(lang);
  return (
    <section className="on-ink bg-ink text-trap" aria-labelledby="piloto-gratis">
      <div className="mx-auto max-w-[1320px] px-4 py-20 sm:px-8 lg:py-28">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="font-bold uppercase tracking-[0.08em] text-[var(--mark-accent)]">{t.eyebrow}</p>
            <h2 id="piloto-gratis" className="display mt-4 max-w-[18ch] text-[clamp(2.5rem,5.4vw,4.75rem)]">
              {t.title}
            </h2>
            <p className="lead mt-6 text-[1.125rem]">{t.lead}</p>
          </div>
          <Link href={pilotHref(lang)} className="btn-primary self-start lg:self-end">
            {t.cta}
            <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
        <ol className="mt-12 grid gap-px bg-trap/40 md:grid-cols-3">
          {t.steps.map((step, index) => (
            <Reveal as="li" key={step.name} delay={index * 120} className="flex flex-col gap-3 bg-ink py-6 md:px-8 md:first:pl-0">
              <span aria-hidden className="display text-[3rem] leading-none text-[var(--mark-accent)]">
                {index + 1}
              </span>
              <h3 className="text-xl font-bold">{step.name}</h3>
              <p>{step.body}</p>
            </Reveal>
          ))}
        </ol>
        <p className="mt-8 text-[1.0625rem] font-semibold">{t.note}</p>
      </div>
    </section>
  );
}
