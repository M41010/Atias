import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ClosingBand } from "@/components/ClosingBand";
import { NaveMark } from "@/components/Mark";
import { Reveal } from "@/components/Reveal";
import { type Locale, pathFor } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { getContent } from "@/i18n/content";

/**
 * Visión: hacia dónde va Atias, versión a versión. Sin fechas ni cifras. La hoja de ruta se
 * construye al bajar: cada versión aparece cuando llega a la pantalla, unida por el raíl.
 */
export function Vision({ lang }: { lang: Locale }) {
  const { nav, cta } = getDictionary(lang);
  const { vision, links } = getContent(lang);

  return (
    <>
      <section className="plate border-b-[3px] border-ink">
        <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-10 sm:px-8 lg:pb-24 lg:pt-14">
          <Breadcrumbs
            label={links.breadcrumb}
            items={[
              { name: nav.home, path: pathFor(lang) },
              { name: links.vision, path: pathFor(lang, "vision") },
            ]}
          />
          <div className="grid items-end gap-12 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <p className="mt-10 font-bold uppercase tracking-[0.08em] text-ink-soft">{vision.eyebrow}</p>
              <h1 className="display mt-4 max-w-[16ch] text-[clamp(3rem,7.4vw,6.5rem)]">{vision.title}</h1>
              <p className="lead mt-8 text-[1.2rem] font-medium leading-relaxed text-ink-soft">{vision.lead}</p>
            </div>
            {/* Las seis versiones de un vistazo, unidas por el raíl. Decorativo: el detalle va abajo. */}
            <ol aria-hidden className="relative hidden lg:flex lg:flex-col lg:gap-5">
              <span className="absolute bottom-8 left-1/2 top-8 w-[3px] -translate-x-1/2 bg-ink" />
              {vision.versions.map((step, index) => (
                <li
                  key={step.version}
                  className={`display relative flex h-[68px] w-[68px] items-center justify-center border-[3px] border-ink text-[1.6rem] ${
                    index === 0 ? "bg-ink text-trap" : "bg-paper"
                  }`}
                >
                  {step.version}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-trap" aria-labelledby="hoja-de-ruta">
        <div className="mx-auto max-w-[1320px] px-4 py-20 sm:px-8 lg:py-28">
          <h2 id="hoja-de-ruta" className="display text-[clamp(2.25rem,4.4vw,3.75rem)]">
            {vision.roadmapTitle}
          </h2>
          <p className="prose-measure mt-5 text-[1.0625rem] text-ink-soft">{vision.roadmapLead}</p>

          <ol className="relative mt-14">
            {vision.versions.map((step, index) => {
              const current = index === 0;
              const last = index === vision.versions.length - 1;
              return (
                <Reveal
                  as="li"
                  key={step.version}
                  className="relative grid grid-cols-[56px_minmax(0,1fr)] gap-x-5 pb-10 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-x-10 lg:grid-cols-[200px_minmax(0,1fr)]"
                >
                  {/* El raíl: une cada versión con la siguiente y se dibuja al aparecer. */}
                  {!last && (
                    <span
                      aria-hidden
                      className="reveal-rail absolute bottom-0 left-[27px] top-14 w-[3px] bg-ink sm:left-[59px] lg:left-[99px]"
                    />
                  )}
                  <div className="flex flex-col items-center">
                    <span
                      className={`display relative z-10 flex h-14 w-14 items-center justify-center border-[3px] border-ink text-[1.35rem] sm:h-[120px] sm:w-[120px] sm:text-[2.6rem] ${
                        current ? "bg-ink text-trap" : "bg-paper"
                      }`}
                    >
                      {step.version}
                    </span>
                  </div>
                  <div className={current ? "on-ink border-[3px] border-ink bg-ink p-6 text-trap sm:p-8" : "label p-6 sm:p-8"}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                      <h3 className="display text-[clamp(1.9rem,3.4vw,2.75rem)]">{step.name}</h3>
                      <p
                        className={`border-2 px-2.5 py-0.5 text-sm font-bold uppercase tracking-[0.06em] ${
                          current ? "border-trap" : "border-ink"
                        }`}
                      >
                        {step.when}
                      </p>
                    </div>
                    <p className={`mt-4 max-w-[52ch] text-[1.125rem] font-medium ${current ? "" : "text-ink-soft"}`}>
                      {step.line}
                    </p>
                    <ul className="mt-5 grid gap-x-8 sm:grid-cols-2">
                      {step.items.map((item) => (
                        <li
                          key={item}
                          className={`flex gap-3 border-t py-3 ${current ? "border-trap/30" : "border-ink/20"}`}
                        >
                          <span aria-hidden className={`mt-[0.55em] h-2 w-2 shrink-0 ${current ? "bg-[var(--mark-accent)]" : "bg-sprout"}`} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="on-ink bg-ink text-trap" aria-labelledby="principio">
        <div className="mx-auto grid max-w-[1320px] items-center gap-12 px-4 py-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:py-28">
          <Reveal>
            <p className="font-bold uppercase tracking-[0.08em] text-[var(--mark-accent)]">{vision.principleEyebrow}</p>
            <h2 id="principio" className="display mt-4 max-w-[18ch] text-[clamp(2.5rem,5.4vw,4.75rem)]">
              {vision.principleTitle}
            </h2>
            <p className="lead mt-6 text-[1.125rem]">{vision.principleBody}</p>
          </Reveal>
          <NaveMark size={240} className="hidden shrink-0 lg:block" />
        </div>
      </section>

      <ClosingBand lang={lang} title={vision.closeTitle} cta={cta.demo} />
    </>
  );
}
