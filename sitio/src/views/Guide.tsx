import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ClosingBand } from "@/components/ClosingBand";
import { JsonLd } from "@/components/JsonLd";
import { CROPS, type Locale, pathFor } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { getContent } from "@/i18n/content";
import { article } from "@/seo/schema";

/** Guía del aforo de cosecha: el contenido informativo que atrae búsquedas sobre el problema. */
export function Guide({ lang }: { lang: Locale }) {
  const { nav, cta } = getDictionary(lang);
  const { guide, links, crops, seo } = getContent(lang);

  return (
    <>
      <JsonLd data={article(lang, "aforo-de-cosecha", guide.title, seo.guide.description, guide.date)} />
      <section className="plate border-b-[3px] border-ink">
        <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-10 sm:px-8 lg:pb-20 lg:pt-14">
          <Breadcrumbs
            label={links.breadcrumb}
            items={[
              { name: nav.home, path: pathFor(lang) },
              { name: links.guide, path: pathFor(lang, "aforo-de-cosecha") },
            ]}
          />
          <p className="mt-10 text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">{guide.eyebrow}</p>
          <h1 className="display mt-3 max-w-[20ch] text-[clamp(2.75rem,6vw,5rem)]">{guide.title}</h1>
          <p className="lead mt-7 text-[1.2rem] font-medium text-ink-soft">{guide.lead}</p>
          <p className="mt-5 text-sm font-semibold">
            <time dateTime={guide.date}>{guide.updated}</time>
          </p>
        </div>
      </section>

      <article className="bg-trap">
        <div className="mx-auto max-w-[1320px] px-4 py-12 sm:px-8 lg:py-20">
          {guide.sections.map((section, index) => (
            <section
              key={section.heading}
              className={`grid gap-4 py-10 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)] md:gap-12 ${
                index > 0 ? "border-t-[3px] border-ink" : ""
              }`}
            >
              <h2 className="display text-[clamp(1.9rem,3.4vw,2.75rem)]">{section.heading}</h2>
              <div className="prose-measure grid gap-4 text-[1.125rem] leading-relaxed">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}

          <aside className="label mt-8 grid gap-0 sm:grid-cols-3">
            {CROPS.map((crop, index) => (
              <Link
                key={crop}
                href={pathFor(lang, "cultivos", crop)}
                className={`flex items-center justify-between gap-3 px-5 py-4 font-bold no-underline hover:bg-trap ${
                  index > 0 ? "border-t-2 border-ink sm:border-l-2 sm:border-t-0" : ""
                }`}
              >
                {crops[crop].title}
                <ArrowRight size={18} className="shrink-0" aria-hidden />
              </Link>
            ))}
          </aside>
        </div>
      </article>

      <ClosingBand lang={lang} title={guide.ctaTitle} body={guide.ctaBody} cta={cta.demo} />
    </>
  );
}
