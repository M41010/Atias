import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { NaveMark } from "@/components/Mark";
import { Reveal } from "@/components/Reveal";
import { INVERSORES } from "@/content/inversores";
import { type Locale, pathFor } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { getContent } from "@/i18n/content";

/**
 * Inversores y socios: el problema, la solución, por qué ahora, a dónde vamos, en qué punto estamos
 * y qué buscamos. Sin tamaño de mercado, sin cantidades y sin cifras de precisión aún no medidas.
 * «Por qué ahora» y los datos clave son los de Quiénes somos; las versiones, las de Visión.
 */
export function Investors({ lang }: { lang: Locale }) {
  const t = INVERSORES[lang];
  const { nav, company } = getDictionary(lang);
  const { links, vision } = getContent(lang);

  return (
    <>
      <section className="plate border-b-[3px] border-ink">
        <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-10 sm:px-8 lg:pb-24 lg:pt-14">
          <Breadcrumbs
            label={links.breadcrumb}
            items={[
              { name: nav.home, path: pathFor(lang) },
              { name: links.investors, path: pathFor(lang, "inversores") },
            ]}
          />
          <p className="mt-10 font-bold uppercase tracking-[0.08em] text-ink-soft">{t.eyebrow}</p>
          <h1 className="display mt-4 max-w-[16ch] text-[clamp(3rem,7vw,6rem)]">{t.title}</h1>
          <p className="lead mt-8 text-[1.2rem] font-medium leading-relaxed text-ink-soft">{t.lead}</p>
          <Link href={pathFor(lang, "contacto")} className="btn-primary mt-10">
            {t.ctaButton}
            <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
      </section>

      {/* El problema y la solución, uno frente a otro. */}
      <section className="plate border-b-[3px] border-ink" aria-labelledby="problema">
        <div className="mx-auto grid max-w-[1320px] gap-10 px-4 py-20 sm:px-8 lg:grid-cols-2 lg:py-28">
          <Reveal>
            <h2 id="problema" className="display text-[clamp(2.25rem,4.4vw,3.75rem)]">{t.problemTitle}</h2>
            {t.problem.map((paragraph) => (
              <p key={paragraph} className="prose-measure mt-5 text-[1.125rem] leading-relaxed text-ink-soft">
                {paragraph}
              </p>
            ))}
          </Reveal>
          <Reveal delay={120} className="label p-6 sm:p-10">
            <h2 className="display text-[clamp(2.25rem,4.4vw,3.75rem)]">{t.solutionTitle}</h2>
            <ol className="mt-6 border-t-[3px] border-ink">
              {t.solution.map((step, index) => (
                <li key={step.name} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-4 border-b-[3px] border-ink py-5">
                  <span aria-hidden className="display text-[2rem] text-sprout">{index + 1}</span>
                  <div>
                    <h3 className="text-xl font-bold">{step.name}</h3>
                    <p className="mt-1 text-ink-soft">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link href={pathFor(lang, "producto")} className="btn-secondary mt-4">
              {t.solutionLink}
              <ArrowRight size={18} aria-hidden />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Por qué ahora: lo mismo que cuenta Quiénes somos. */}
      <section className="bg-trap border-b-[3px] border-ink" aria-labelledby="por-que-ahora">
        <div className="mx-auto grid max-w-[1320px] gap-10 px-4 py-20 sm:px-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:py-28">
          <h2 id="por-que-ahora" className="display text-[clamp(2.25rem,4.4vw,3.75rem)]">{company.whyNowTitle}</h2>
          <ol className="border-t-[3px] border-ink">
            {company.whyNow.map((reason, index) => (
              <Reveal as="li" key={reason.name} delay={index * 120} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-4 border-b-[3px] border-ink py-6">
                <span aria-hidden className="display text-[2rem] text-sprout">{index + 1}</span>
                <div>
                  <h3 className="text-xl font-bold">{reason.name}</h3>
                  <p className="mt-2 text-ink-soft">{reason.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* A dónde vamos: las versiones de la hoja de ruta, de un vistazo. */}
      <section className="on-ink bg-ink text-trap" aria-labelledby="a-donde">
        <div className="mx-auto max-w-[1320px] px-4 py-20 sm:px-8 lg:py-28">
          <Reveal>
            <h2 id="a-donde" className="display max-w-[18ch] text-[clamp(2.5rem,5.4vw,4.75rem)]">{t.visionTitle}</h2>
            <p className="lead mt-6 text-[1.125rem]">{t.visionLead}</p>
          </Reveal>
          <ol className="mt-12 grid gap-px bg-trap/30 sm:grid-cols-2 lg:grid-cols-3">
            {vision.versions.map((step, index) => (
              <Reveal as="li" key={step.version} delay={index * 80} className="flex flex-col gap-2 bg-ink p-6">
                <span className={`display text-[2.5rem] ${index === 0 ? "text-[var(--mark-accent)]" : ""}`}>{step.version}</span>
                <h3 className="text-xl font-bold">{step.name}</h3>
                <p className="text-[0.95rem] opacity-80">{step.when}</p>
              </Reveal>
            ))}
          </ol>
          <Link href={pathFor(lang, "vision")} className="btn-secondary mt-10">
            {t.visionLink}
            <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
      </section>

      {/* En qué punto estamos: solo hechos, y lo que aún no se puede contar. */}
      <section className="plate border-b-[3px] border-ink" aria-labelledby="estado">
        <div className="mx-auto max-w-[1320px] px-4 py-20 sm:px-8 lg:py-28">
          <h2 id="estado" className="display text-[clamp(2.25rem,4.4vw,3.75rem)]">{t.statusTitle}</h2>
          <p className="lead mt-5 text-[1.125rem] text-ink-soft">{t.statusLead}</p>
          <dl className="mt-10 grid border-[3px] border-ink bg-paper sm:grid-cols-2 lg:grid-cols-4">
            {company.facts.map((fact, index) => (
              <Reveal
                key={fact.label}
                delay={index * 100}
                className={`flex flex-col gap-2 p-6 ${index > 0 ? "border-t-[3px] border-ink sm:border-t-0" : ""} ${
                  index % 2 === 1 ? "sm:border-l-[3px] sm:border-ink" : ""
                } ${index >= 2 ? "sm:border-t-[3px] lg:border-t-0" : ""} ${index === 2 ? "lg:border-l-[3px] lg:border-ink" : ""}`}
              >
                <dt className="order-2 text-ink-soft">{fact.label}</dt>
                <dd className="display order-1 text-[clamp(2.5rem,4.4vw,3.5rem)]">{fact.value}</dd>
              </Reveal>
            ))}
          </dl>
          <Reveal className="mt-8 border-l-[6px] border-sprout bg-paper px-6 py-5">
            <h3 className="text-xl font-bold">{t.honestyTitle}</h3>
            <p className="prose-measure mt-2 text-ink-soft">{t.honestyBody}</p>
          </Reveal>
        </div>
      </section>

      {/* Qué buscamos. */}
      <section className="bg-trap" aria-labelledby="buscamos">
        <div className="mx-auto max-w-[1320px] px-4 py-20 sm:px-8 lg:py-28">
          <h2 id="buscamos" className="display text-[clamp(2.25rem,4.4vw,3.75rem)]">{t.seekTitle}</h2>
          <p className="lead mt-5 text-[1.125rem] text-ink-soft">{t.seekLead}</p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {t.seek.map((item, index) => (
              <Reveal key={item.name} delay={index * 120} className="label p-6 sm:p-8">
                <h3 className="display text-[clamp(1.75rem,2.6vw,2.25rem)]">{item.name}</h3>
                <p className="mt-3 text-ink-soft">{item.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="on-ink bg-ink text-trap">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-8 px-4 py-16 sm:px-8">
          <div className="max-w-[44ch]">
            <p className="display text-[clamp(2rem,3.6vw,3rem)]">{t.ctaTitle}</p>
            <p className="mt-3 text-[1.0625rem]">{t.ctaBody}</p>
          </div>
          <div className="flex items-center gap-8">
            <NaveMark size={96} className="hidden sm:block" />
            <Link href={pathFor(lang, "contacto")} className="btn-primary">
              {t.ctaButton}
              <ArrowRight size={18} aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
