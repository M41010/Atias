import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ClosingBand } from "@/components/ClosingBand";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { type Locale, type Page, pathFor } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { getContent } from "@/i18n/content";
import { article } from "@/seo/schema";

/** Los artículos del sitio: cada clave apunta a su página y a su texto. */
const ITEMS = [
  { page: "planificar-temporeros", key: "pickers", seo: "articlePickers" },
  { page: "errores-al-prever", key: "mistakes", seo: "articleMistakes" },
  { page: "precision-de-la-prevision", key: "accuracy", seo: "articleAccuracy" },
] as const;

type Item = (typeof ITEMS)[number];

/** Índice: la guía del aforo y los artículos, en tarjetas. */
export function ArticlesIndex({ lang }: { lang: Locale }) {
  const { nav, cta } = getDictionary(lang);
  const { articles, guide, links } = getContent(lang);
  const cards: { page: Page; eyebrow: string; title: string; lead: string }[] = [
    { page: "aforo-de-cosecha", eyebrow: guide.eyebrow, title: guide.title, lead: guide.lead },
    ...ITEMS.map((item) => ({ page: item.page as Page, ...articles[item.key] })),
  ];

  return (
    <>
      <section className="plate border-b-[3px] border-ink">
        <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-10 sm:px-8 lg:pb-20 lg:pt-14">
          <Breadcrumbs
            label={links.breadcrumb}
            items={[
              { name: nav.home, path: pathFor(lang) },
              { name: links.articles, path: pathFor(lang, "articulos") },
            ]}
          />
          <p className="mt-10 text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">{articles.index.eyebrow}</p>
          <h1 className="display mt-3 max-w-[20ch] text-[clamp(2.75rem,6vw,5rem)]">{articles.index.title}</h1>
          <p className="lead mt-7 text-[1.2rem] font-medium text-ink-soft">{articles.index.lead}</p>
        </div>
      </section>

      <section className="bg-trap">
        <ul className="mx-auto grid max-w-[1320px] gap-5 px-4 py-16 sm:px-8 md:grid-cols-2 lg:py-24">
          {cards.map((card, index) => (
            <Reveal as="li" key={card.page} delay={index * 100} className="label flex flex-col gap-4 p-6 sm:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.06em] text-ink-soft">{card.eyebrow}</p>
              <h2 className="display text-[clamp(1.75rem,2.8vw,2.4rem)]">{card.title}</h2>
              <p className="flex-1 text-ink-soft">{card.lead}</p>
              <Link href={pathFor(lang, card.page)} className="btn-secondary self-start">
                {articles.index.read}
                <span className="sr-only">: {card.title}</span>
                <ArrowRight size={18} aria-hidden />
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      <ClosingBand lang={lang} title={articles.ctaTitle} body={articles.ctaBody} cta={cta.demo} />
    </>
  );
}

/** Un artículo: misma composición que la guía, con enlaces a los otros dos al final. */
function ArticlePage({ lang, item }: { lang: Locale; item: Item }) {
  const { nav, cta } = getDictionary(lang);
  const { articles, links, seo } = getContent(lang);
  const text = articles[item.key];
  const others = ITEMS.filter((other) => other.key !== item.key);

  return (
    <>
      <JsonLd data={article(lang, item.page, text.title, seo[item.seo].description, articles.date)} />
      <section className="plate border-b-[3px] border-ink">
        <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-10 sm:px-8 lg:pb-20 lg:pt-14">
          <Breadcrumbs
            label={links.breadcrumb}
            items={[
              { name: nav.home, path: pathFor(lang) },
              { name: links.articles, path: pathFor(lang, "articulos") },
              { name: text.title, path: pathFor(lang, item.page) },
            ]}
          />
          <p className="mt-10 text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">{text.eyebrow}</p>
          <h1 className="display mt-3 max-w-[22ch] text-[clamp(2.5rem,5.6vw,4.75rem)]">{text.title}</h1>
          <p className="lead mt-7 text-[1.2rem] font-medium text-ink-soft">{text.lead}</p>
          <p className="mt-5 text-sm font-semibold">
            <time dateTime={articles.date}>{articles.updated}</time>
          </p>
        </div>
      </section>

      <article className="bg-trap">
        <div className="mx-auto max-w-[1320px] px-4 py-12 sm:px-8 lg:py-20">
          {text.sections.map((section, index) => (
            <section
              key={section.heading}
              className={`grid gap-4 py-10 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)] md:gap-12 ${
                index > 0 ? "border-t-[3px] border-ink" : ""
              }`}
            >
              <h2 className="display text-[clamp(1.75rem,3vw,2.5rem)]">{section.heading}</h2>
              <div className="prose-measure grid gap-4 text-[1.125rem] leading-relaxed">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}

          <aside className="label mt-8 grid sm:grid-cols-2">
            {others.map((other, index) => (
              <Link
                key={other.key}
                href={pathFor(lang, other.page)}
                className={`flex items-center justify-between gap-3 px-5 py-4 font-bold no-underline hover:bg-trap ${
                  index > 0 ? "border-t-2 border-ink sm:border-l-2 sm:border-t-0" : ""
                }`}
              >
                {articles[other.key].title}
                <ArrowRight size={18} className="shrink-0" aria-hidden />
              </Link>
            ))}
          </aside>
        </div>
      </article>

      <ClosingBand lang={lang} title={articles.ctaTitle} body={articles.ctaBody} cta={cta.demo} />
    </>
  );
}

export const ArticlePickers = ({ lang }: { lang: Locale }) => <ArticlePage lang={lang} item={ITEMS[0]} />;
export const ArticleMistakes = ({ lang }: { lang: Locale }) => <ArticlePage lang={lang} item={ITEMS[1]} />;
export const ArticleAccuracy = ({ lang }: { lang: Locale }) => <ArticlePage lang={lang} item={ITEMS[2]} />;
