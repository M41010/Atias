import { ArrowRight, FlaskConical } from "lucide-react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ClosingBand } from "@/components/ClosingBand";
import { JsonLd } from "@/components/JsonLd";
import { type Crop, CROPS, type Locale, pathFor } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { getContent } from "@/i18n/content";
import { article } from "@/seo/schema";

/** Página que reúne los cultivos del piloto y enlaza a cada uno. */
export function CropsHub({ lang }: { lang: Locale }) {
  const { nav, cta, home } = getDictionary(lang);
  const { cropsHub, crops, links } = getContent(lang);

  return (
    <>
      <section className="plate border-b-[3px] border-ink">
        <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-10 sm:px-8 lg:pb-20 lg:pt-14">
          <Breadcrumbs
            label={links.breadcrumb}
            items={[
              { name: nav.home, path: pathFor(lang) },
              { name: links.crops, path: pathFor(lang, "cultivos") },
            ]}
          />
          <h1 className="display mt-10 max-w-[18ch] text-[clamp(3rem,7vw,6rem)]">{cropsHub.title}</h1>
          <p className="lead mt-7 text-[1.2rem] font-medium text-ink-soft">{cropsHub.lead}</p>
        </div>
      </section>

      <section className="bg-trap">
        <div className="mx-auto max-w-[1320px] px-4 py-12 sm:px-8 lg:py-20">
          <ul className="label">
            {CROPS.map((crop, index) => (
              <li key={crop} className={index > 0 ? "border-t-[3px] border-ink" : ""}>
                <Link
                  href={pathFor(lang, "cultivos", crop)}
                  className="grid gap-2 px-6 py-7 no-underline hover:bg-trap md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)_auto] md:items-center md:gap-10"
                >
                  <h2 className="display text-[clamp(2rem,3.6vw,3rem)]">{crops[crop].name}</h2>
                  <p className="prose-measure text-[1.0625rem] text-ink-soft">{crops[crop].lead}</p>
                  <ArrowRight size={26} aria-hidden className="hidden md:block" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="prose-measure mt-5 text-ink-soft">{cropsHub.note}</p>
        </div>
      </section>

      <ClosingBand lang={lang} title={home.closeTitle} cta={cta.demo} />
    </>
  );
}

/** Página de un cultivo: qué complica su aforo, qué cuenta Atias y qué está aún en pruebas. */
export function CropPage({ lang, crop }: { lang: Locale; crop: Crop }) {
  const { nav, cta, home } = getDictionary(lang);
  const { crops, links, guide } = getContent(lang);
  const data = crops[crop];
  const others = CROPS.filter((other) => other !== crop);

  return (
    <>
      <JsonLd data={article(lang, "cultivos", data.title, data.seoDescription, guide.date, crop)} />
      <section className="plate border-b-[3px] border-ink">
        <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-10 sm:px-8 lg:pb-20 lg:pt-14">
          <Breadcrumbs
            label={links.breadcrumb}
            items={[
              { name: nav.home, path: pathFor(lang) },
              { name: links.crops, path: pathFor(lang, "cultivos") },
              { name: data.name, path: pathFor(lang, "cultivos", crop) },
            ]}
          />
          <h1 className="display mt-10 max-w-[18ch] text-[clamp(2.75rem,6vw,5rem)]">{data.title}</h1>
          <p className="lead mt-7 text-[1.2rem] font-medium text-ink-soft">{data.lead}</p>
        </div>
      </section>

      <section className="bg-trap">
        <div className="mx-auto max-w-[1320px] px-4 py-12 sm:px-8 lg:py-20">
          {data.sections.map((section, index) => (
            <div
              key={section.heading}
              className={`grid gap-4 py-9 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)] md:gap-12 ${
                index > 0 ? "border-t-[3px] border-ink" : ""
              }`}
            >
              <h2 className="display text-[clamp(1.9rem,3.4vw,2.75rem)]">{section.heading}</h2>
              <p className="prose-measure self-center text-[1.125rem] leading-relaxed">{section.body}</p>
            </div>
          ))}

          <p className="label mt-6 flex gap-3 px-5 py-4 font-semibold">
            <FlaskConical size={20} className="mt-0.5 shrink-0" aria-hidden />
            {data.testing}
          </p>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-2">
            <Link href={pathFor(lang, "aforo-de-cosecha")} className="btn-secondary">
              {links.guideTeaser}
              <ArrowRight size={18} aria-hidden />
            </Link>
            {others.map((other) => (
              <Link key={other} href={pathFor(lang, "cultivos", other)} className="btn-secondary">
                {crops[other].title}
                <ArrowRight size={18} aria-hidden />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ClosingBand lang={lang} title={home.closeTitle} cta={cta.demo} />
    </>
  );
}
