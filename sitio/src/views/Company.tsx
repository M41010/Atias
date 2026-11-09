import { PendingNote } from "@/components/Pending";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";

export function Company({ lang }: { lang: Locale }) {
  const { company } = getDictionary(lang);

  return (
    <>
      <section className="plate border-b-[3px] border-ink">
        <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-12 sm:px-8 lg:pb-24 lg:pt-20">
          <PendingNote>{company.pending}</PendingNote>
          <h1 className="display mt-8 text-[clamp(3.25rem,7vw,6rem)]">{company.title}</h1>
          <p className="display mt-8 max-w-[22ch] text-[clamp(1.75rem,3.2vw,2.75rem)] !leading-[1.05]">{company.lead}</p>
        </div>
      </section>

      <section className="plate border-b-[3px] border-ink">
        <div className="mx-auto max-w-[1320px] px-4 py-16 sm:px-8 lg:py-24">
          <div className="label max-w-[860px] px-6 py-8 sm:px-10 sm:py-10">
            {company.body.map((paragraph) => (
              <p key={paragraph} className="prose-measure text-[1.125rem] leading-relaxed [&+&]:mt-5">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-trap" aria-labelledby="principios">
        <div className="mx-auto max-w-[1320px] px-4 py-16 sm:px-8 lg:py-24">
          <h2 id="principios" className="display text-[clamp(2.25rem,4.4vw,3.75rem)]">
            {company.principlesTitle}
          </h2>
          <dl className="mt-10 border-t-[3px] border-ink">
            {company.principles.map((principle) => (
              <div
                key={principle.name}
                className="grid gap-2 border-b-[3px] border-ink py-7 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-10"
              >
                <dt className="display text-[1.75rem] sm:text-[2.125rem]">{principle.name}</dt>
                <dd className="prose-measure self-center text-[1.0625rem] text-ink-soft">{principle.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
