import { Check, FlaskConical } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ClosingBand } from "@/components/ClosingBand";
import { Reveal } from "@/components/Reveal";
import { type Locale, pathFor } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { getContent } from "@/i18n/content";

/**
 * Cómo medimos: el método con el que se mide la precisión, publicado antes que el resultado.
 * Sin cifras de resultados: solo el procedimiento (docs/VALIDACION.md, web/src/lib/validation.ts).
 */
export function Measure({ lang }: { lang: Locale }) {
  const { nav, cta } = getDictionary(lang);
  const { measure, links } = getContent(lang);

  return (
    <>
      <section className="plate border-b-[3px] border-ink">
        <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-10 sm:px-8 lg:pb-24 lg:pt-14">
          <Breadcrumbs
            label={links.breadcrumb}
            items={[
              { name: nav.home, path: pathFor(lang) },
              { name: links.measure, path: pathFor(lang, "como-medimos") },
            ]}
          />
          <p className="mt-10 font-bold uppercase tracking-[0.08em] text-ink-soft">{measure.eyebrow}</p>
          <h1 className="display mt-4 max-w-[18ch] text-[clamp(3rem,7vw,6rem)]">{measure.title}</h1>
          <p className="lead mt-8 text-[1.2rem] font-medium leading-relaxed text-ink-soft">{measure.lead}</p>
        </div>
      </section>

      {/* Qué comparamos: cuatro pasos encadenados, de la previsión a la báscula. */}
      <section className="bg-trap" aria-labelledby="que-comparamos">
        <div className="mx-auto max-w-[1320px] px-4 py-20 sm:px-8 lg:py-28">
          <h2 id="que-comparamos" className="display text-[clamp(2.25rem,4.4vw,3.75rem)]">
            {measure.compareTitle}
          </h2>
          <ol className="mt-12 grid border-t-[3px] border-ink md:grid-cols-4">
            {measure.compare.map((step, index) => (
              <Reveal
                as="li"
                key={step.name}
                delay={index * 120}
                className={`flex flex-col gap-3 border-b-[3px] border-ink py-8 md:border-b-0 md:pr-8 ${
                  index > 0 ? "md:border-l-[3px] md:pl-8" : ""
                }`}
              >
                <span
                  aria-hidden
                  className={`display flex h-12 w-12 items-center justify-center border-[3px] border-ink text-[1.5rem] ${
                    index === measure.compare.length - 1 ? "bg-ink text-trap" : "bg-paper"
                  }`}
                >
                  {index + 1}
                </span>
                <h3 className="display text-[clamp(1.6rem,2.4vw,2rem)]">{step.name}</h3>
                <p className="text-ink-soft">{step.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Cómo calculamos el error: la fórmula en grande y las cuatro métricas. */}
      <section className="plate border-y-[3px] border-ink" aria-labelledby="como-calculamos">
        <div className="mx-auto max-w-[1320px] px-4 py-20 sm:px-8 lg:py-28">
          <h2 id="como-calculamos" className="display text-[clamp(2.25rem,4.4vw,3.75rem)]">
            {measure.metricsTitle}
          </h2>
          <Reveal className="label mt-10 px-6 py-8 sm:px-10">
            <p className="display text-center text-[clamp(1.35rem,3vw,2.5rem)] leading-tight">{measure.formula}</p>
          </Reveal>
          <dl className="mt-10 grid gap-5 md:grid-cols-2">
            {measure.metrics.map((metric, index) => (
              <Reveal key={metric.name} delay={index * 100} className="border-t-[3px] border-ink pt-5">
                <dt className="text-xl font-bold">{metric.name}</dt>
                <dd className="prose-measure mt-2 text-ink-soft">{metric.body}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* Cuándo se cumple el 10 %: las cuatro condiciones, sobre tinta. */}
      <section className="on-ink bg-ink text-trap" aria-labelledby="criterio">
        <div className="mx-auto grid max-w-[1320px] gap-12 px-4 py-20 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:py-28">
          <div>
            <h2 id="criterio" className="display text-[clamp(2.25rem,4.4vw,3.75rem)]">{measure.criteriaTitle}</h2>
            <p className="lead mt-6 text-[1.125rem]">{measure.criteriaLead}</p>
          </div>
          <div>
            <ol className="grid gap-px bg-trap/40">
              {measure.criteria.map((criterion, index) => (
                <Reveal as="li" key={criterion} delay={index * 120} className="flex gap-4 bg-ink py-5">
                  <span aria-hidden className="display w-8 shrink-0 text-[1.75rem] text-[var(--mark-accent)]">
                    {index + 1}
                  </span>
                  <span className="text-[1.0625rem]">{criterion}</span>
                </Reveal>
              ))}
            </ol>
            <p className="mt-8 border-t border-trap/40 pt-6 text-[1.0625rem]">{measure.criteriaNote}</p>
          </div>
        </div>
      </section>

      {/* Dónde se pierde la precisión: cada eslabón, medido aparte. */}
      <section className="bg-trap" aria-labelledby="eslabones">
        <div className="mx-auto max-w-[1320px] px-4 py-20 sm:px-8 lg:py-28">
          <h2 id="eslabones" className="display text-[clamp(2.25rem,4.4vw,3.75rem)]">{measure.linksTitle}</h2>
          <p className="prose-measure mt-5 text-[1.0625rem] text-ink-soft">{measure.linksLead}</p>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {measure.links.map((link, index) => (
              <Reveal key={link.name} delay={index * 100} className="label p-6 sm:p-8">
                <h3 className="display text-[clamp(1.6rem,2.4vw,2rem)]">{link.name}</h3>
                <p className="mt-3 text-ink-soft">{link.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Lo probado y lo que no, separados. */}
      <section className="plate border-t-[3px] border-ink" aria-labelledby="estado">
        <div className="mx-auto max-w-[1320px] px-4 py-20 sm:px-8 lg:py-28">
          <h2 id="estado" className="display text-[clamp(2.25rem,4.4vw,3.75rem)]">{measure.statusTitle}</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <Reveal className="label p-6 sm:p-8">
              <h3 className="flex items-center gap-3 text-xl font-bold">
                <Check size={22} aria-hidden />
                {measure.proven.name}
              </h3>
              <p className="mt-3 text-ink-soft">{measure.proven.body}</p>
            </Reveal>
            <Reveal delay={120} className="label p-6 sm:p-8">
              <h3 className="flex items-center gap-3 text-xl font-bold">
                <FlaskConical size={22} aria-hidden />
                {measure.testing.name}
              </h3>
              <p className="mt-3 text-ink-soft">{measure.testing.body}</p>
            </Reveal>
          </div>
        </div>
      </section>

      <ClosingBand lang={lang} title={measure.closeTitle} cta={cta.demo} />
    </>
  );
}
