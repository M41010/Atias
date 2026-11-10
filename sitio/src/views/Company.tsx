import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ClosingBand } from "@/components/ClosingBand";
import { NaveMark, Wordmark } from "@/components/Mark";
import { Reveal } from "@/components/Reveal";
import { type Locale, pathFor } from "@/i18n/config";
import { getDictionary } from "@/i18n";

/**
 * Quiénes somos: el origen, la misión, los hitos reales, el nombre y el logo, cómo trabajamos y a
 * quién buscamos. Sin nombres de personas ni equipo inventado: Atias está empezando.
 */
export function Company({ lang }: { lang: Locale }) {
  const { company, cta } = getDictionary(lang);

  return (
    <>
      {/* Portada: la frase que resume de dónde venimos y a dónde vamos. */}
      <section className="plate border-b-[3px] border-ink">
        <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-12 sm:px-8 lg:pb-24 lg:pt-20">
          <p className="font-bold uppercase tracking-[0.08em] text-ink-soft">{company.title}</p>
          <h1 className="display mt-6 max-w-[16ch] text-[clamp(3.25rem,7vw,6rem)]">{company.headline}</h1>
          <p className="lead mt-8 text-[1.2rem] font-medium leading-relaxed text-ink-soft">{company.lead}</p>
        </div>
      </section>

      {/* El origen, contado como una historia. */}
      <section className="plate border-b-[3px] border-ink" aria-labelledby="origen">
        <div className="mx-auto grid max-w-[1320px] gap-10 px-4 py-16 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:py-24">
          <h2 id="origen" className="display text-[clamp(2.25rem,4.4vw,3.75rem)]">{company.originTitle}</h2>
          <div className="label px-6 py-8 sm:px-10 sm:py-10">
            {company.origin.map((paragraph, index) => (
              <Reveal key={paragraph} delay={index * 120}>
                <p className={`prose-measure text-[1.125rem] leading-relaxed ${index > 0 ? "mt-5" : ""} ${index === company.origin.length - 1 ? "font-semibold" : ""}`}>
                  {paragraph}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* La misión, en grande sobre tinta. */}
      <section className="on-ink bg-ink text-trap" aria-labelledby="mision">
        <div className="mx-auto max-w-[1320px] px-4 py-20 sm:px-8 lg:py-28">
          <Reveal>
            <p className="font-bold uppercase tracking-[0.08em] text-[var(--mark-accent)]">{company.missionEyebrow}</p>
            <h2 id="mision" className="display mt-5 max-w-[20ch] text-[clamp(2.5rem,5.6vw,5rem)]">{company.mission}</h2>
            <p className="lead mt-8 text-[1.125rem]">{company.missionBody}</p>
            <Link href={pathFor(lang, "vision")} className="btn-secondary mt-8">
              {company.missionLink}
              <ArrowRight size={18} aria-hidden />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Hitos: solo lo que ha pasado de verdad, y lo siguiente. */}
      <section className="bg-trap" aria-labelledby="hitos">
        <div className="mx-auto max-w-[1320px] px-4 py-20 sm:px-8 lg:py-28">
          <h2 id="hitos" className="display text-[clamp(2.25rem,4.4vw,3.75rem)]">{company.milestonesTitle}</h2>
          <ol className="mt-12 grid border-t-[3px] border-ink md:grid-cols-4">
            {company.milestones.map((milestone, index) => {
              const next = index === company.milestones.length - 1;
              return (
                <Reveal
                  as="li"
                  key={milestone.name}
                  delay={index * 120}
                  className={`relative flex flex-col gap-3 border-b-[3px] border-ink py-8 md:border-b-0 md:pr-8 ${index > 0 ? "md:border-l-[3px] md:pl-8" : ""}`}
                >
                  <span
                    aria-hidden
                    className={`absolute -top-[11px] h-5 w-5 border-[3px] border-ink ${next ? "bg-paper" : "bg-sprout"} ${index > 0 ? "md:left-8" : "left-0"}`}
                  />
                  <p className={`text-sm font-bold uppercase tracking-[0.06em] ${next ? "text-ink-soft" : "text-sprout"}`}>{milestone.when}</p>
                  <h3 className="display text-[clamp(1.75rem,2.6vw,2.25rem)]">{milestone.name}</h3>
                  <p className="text-ink-soft">{milestone.body}</p>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </section>

      {/* El nombre y el símbolo, pieza a pieza. */}
      <section className="plate border-y-[3px] border-ink" aria-labelledby="nombre">
        <div className="mx-auto grid max-w-[1320px] items-center gap-12 px-4 py-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:py-28">
          <div>
            <h2 id="nombre" className="display text-[clamp(2.25rem,4.4vw,3.75rem)]">{company.nameTitle}</h2>
            <p className="lead mt-6 text-[1.2rem] font-medium text-ink-soft">{company.nameBody}</p>
            {/* Cada letra con su palabra: la sigla se lee de arriba abajo. */}
            <dl className="mt-10 border-t-[3px] border-ink">
              {company.nameParts.map((part, index) => (
                <Reveal key={part.letter} delay={index * 120} className="flex items-baseline gap-5 border-b-[3px] border-ink py-4">
                  <dt className="display w-[2.4ch] shrink-0 text-[clamp(2.75rem,5vw,4rem)] text-sprout">{part.letter}</dt>
                  <dd>
                    <span className="display block text-[clamp(1.6rem,2.6vw,2.25rem)]">{part.word}</span>
                    {part.meaning && <span className="text-ink-soft">{part.meaning}</span>}
                  </dd>
                </Reveal>
              ))}
            </dl>
            <p className="mt-8">
              <Wordmark className="wordmark-xl" />
            </p>
          </div>
          <div className="label p-6 sm:p-10">
            <div className="flex justify-center border-b-[3px] border-ink pb-8">
              <NaveMark size={200} />
            </div>
            <h3 className="mt-6 text-xl font-bold">{company.logoTitle}</h3>
            <dl className="mt-4 grid gap-x-8 sm:grid-cols-2">
              {company.logo.map((part, index) => (
                <Reveal key={part.name} delay={index * 100} className="border-t border-ink/20 py-4">
                  <dt className="flex items-center gap-3 font-semibold">
                    <span aria-hidden className="display flex h-8 w-8 shrink-0 items-center justify-center border-2 border-ink text-base">
                      {index + 1}
                    </span>
                    {part.name}
                  </dt>
                  <dd className="mt-2 text-ink-soft">{part.body}</dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Cómo trabajamos. */}
      <section className="bg-trap" aria-labelledby="principios">
        <div className="mx-auto max-w-[1320px] px-4 py-16 sm:px-8 lg:py-24">
          <h2 id="principios" className="display text-[clamp(2.25rem,4.4vw,3.75rem)]">{company.principlesTitle}</h2>
          <dl className="mt-10 border-t-[3px] border-ink">
            {company.principles.map((principle) => (
              <Reveal
                key={principle.name}
                className="grid gap-2 border-b-[3px] border-ink py-7 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-10"
              >
                <dt className="display text-[1.75rem] sm:text-[2.125rem]">{principle.name}</dt>
                <dd className="prose-measure self-center text-[1.0625rem] text-ink-soft">{principle.body}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* Súmate: cooperativas, inversores y talento, en cualquier lugar. */}
      <section className="plate border-t-[3px] border-ink" aria-labelledby="sumate">
        <div className="mx-auto max-w-[1320px] px-4 py-20 sm:px-8 lg:py-28">
          <h2 id="sumate" className="display text-[clamp(2.25rem,4.4vw,3.75rem)]">{company.joinTitle}</h2>
          <p className="lead mt-5 text-[1.125rem] text-ink-soft">{company.joinLead}</p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {company.join.map((item, index) => (
              <Reveal key={item.name} delay={index * 120} className="label flex flex-col gap-4 p-6 sm:p-8">
                <h3 className="display text-[clamp(1.75rem,2.6vw,2.25rem)]">{item.name}</h3>
                <p className="flex-1 text-ink-soft">{item.body}</p>
                <Link href={pathFor(lang, "contacto")} className="btn-secondary self-start">
                  {company.joinCta}
                  <ArrowRight size={18} aria-hidden />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <ClosingBand lang={lang} title={company.closeTitle} cta={cta.demo} />
    </>
  );
}
