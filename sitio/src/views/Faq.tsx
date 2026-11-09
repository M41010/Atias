import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ClosingBand } from "@/components/ClosingBand";
import { JsonLd } from "@/components/JsonLd";
import { type Locale, pathFor } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { getContent } from "@/i18n/content";
import { faqPage } from "@/seo/schema";

/** Preguntas frecuentes: todas las respuestas visibles, sin desplegables, para leerlas de un vistazo. */
export function Faq({ lang }: { lang: Locale }) {
  const { nav, cta, home } = getDictionary(lang);
  const { faq, links } = getContent(lang);

  return (
    <>
      <JsonLd data={faqPage(lang, faq.items)} />
      <section className="plate border-b-[3px] border-ink">
        <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-10 sm:px-8 lg:pb-20 lg:pt-14">
          <Breadcrumbs
            label={links.breadcrumb}
            items={[
              { name: nav.home, path: pathFor(lang) },
              { name: faq.title, path: pathFor(lang, "preguntas-frecuentes") },
            ]}
          />
          <h1 className="display mt-10 text-[clamp(3rem,7vw,6rem)]">{faq.title}</h1>
          <p className="lead mt-7 text-[1.2rem] font-medium text-ink-soft">{faq.lead}</p>
        </div>
      </section>

      <section className="bg-trap">
        <div className="mx-auto max-w-[1320px] px-4 py-10 sm:px-8 lg:py-16">
          {faq.items.map((item, index) => (
            <div
              key={item.q}
              className={`grid gap-3 py-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.5fr)] md:gap-12 ${
                index > 0 ? "border-t-[3px] border-ink" : ""
              }`}
            >
              <h2 className="display text-[clamp(1.6rem,2.8vw,2.25rem)]">{item.q}</h2>
              <p className="prose-measure self-center text-[1.125rem] leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <ClosingBand lang={lang} title={home.closeTitle} cta={cta.demo} />
    </>
  );
}
