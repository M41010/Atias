import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ClosingBand } from "@/components/ClosingBand";
import { JournalList } from "@/components/JournalList";
import { DIARIO_UI } from "@/content/diario";
import { type Locale, pathFor } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { getContent } from "@/i18n/content";

/** Diario del piloto: todas las novedades fechadas, como un registro de cambios. */
export function Journal({ lang }: { lang: Locale }) {
  const ui = DIARIO_UI[lang];
  const { nav, cta, company } = getDictionary(lang);
  const { links } = getContent(lang);

  return (
    <>
      <section className="plate border-b-[3px] border-ink">
        <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-10 sm:px-8 lg:pb-20 lg:pt-14">
          <Breadcrumbs
            label={links.breadcrumb}
            items={[
              { name: nav.home, path: pathFor(lang) },
              { name: links.journal, path: pathFor(lang, "diario") },
            ]}
          />
          <p className="mt-10 font-bold uppercase tracking-[0.08em] text-ink-soft">{ui.eyebrow}</p>
          <h1 className="display mt-4 max-w-[16ch] text-[clamp(3rem,7vw,6rem)]">{ui.title}</h1>
          <p className="lead mt-8 text-[1.2rem] font-medium leading-relaxed text-ink-soft">{ui.lead}</p>
        </div>
      </section>

      <section className="bg-trap">
        <div className="mx-auto max-w-[1100px] px-4 py-20 sm:px-8 lg:py-28">
          <JournalList lang={lang} headingLevel={2} />
        </div>
      </section>

      <ClosingBand lang={lang} title={company.closeTitle} cta={cta.demo} />
    </>
  );
}
