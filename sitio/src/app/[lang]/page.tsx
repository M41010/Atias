import { ArrowRight, Check, FlaskConical } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Counter } from "@/components/Counter";
import { DataTrust } from "@/components/DataTrust";
import { NaveMark } from "@/components/Mark";
import { PilotOffer, pilotHref } from "@/components/PilotOffer";
import { AppTour } from "@/components/AppTour";
import { PilotResults } from "@/components/PilotResults";
import { PresentationVideo } from "@/components/PresentationVideo";
import { RowTour } from "@/components/RowTour";
import { JournalTeaser } from "@/components/JournalTeaser";
import { JsonLd } from "@/components/JsonLd";
import { isLocale, NUMBER_LOCALE, pathFor } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { getContent } from "@/i18n/content";
import { pageMetadata } from "@/seo/metadata";
import { organization, website } from "@/seo/schema";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { title, description } = getContent(lang).seo.home;
  return pageMetadata({ locale: lang, page: "", title, description });
}

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const { home, cta } = dict;
  const content = getContent(lang);

  return (
    <>
      <JsonLd data={[organization(content.seo.home.description), website(lang, content.seo.home.description)]} />
      {/* La placa: titular, acción y el contador funcionando. */}
      <section className="plate border-b-[3px] border-ink">
        <div className="mx-auto grid max-w-[1320px] gap-10 px-4 pb-16 pt-10 sm:px-8 lg:grid-cols-[1fr_minmax(0,560px)] lg:gap-14 lg:pb-24 lg:pt-16">
          <div className="flex flex-col lg:pt-6">
            <h1 className="display text-[clamp(3.25rem,6.6vw,5.5rem)]">
              <span className="mb-5 block font-sans text-base font-bold uppercase tracking-[0.08em] text-ink-soft [font-stretch:100%]">
                {content.links.heroEyebrow}
              </span>
              {home.heroTitle}
            </h1>
            <p className="lead mt-7 text-[1.2rem] font-medium leading-relaxed text-ink-soft">{home.heroLead}</p>
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href={pathFor(lang, "contacto")} className="btn-primary">
                {cta.demo}
                <ArrowRight size={18} aria-hidden />
              </Link>
              <Link href={pathFor(lang, "producto")} className="btn-secondary">
                {cta.how}
              </Link>
            </div>
            {/* La oferta de piloto, a la vista desde el primer momento. */}
            <Link
              href={pilotHref(lang)}
              className="mt-7 inline-flex items-center gap-2.5 self-start border-2 border-ink bg-paper px-3.5 py-2 font-bold no-underline transition-colors hover:bg-ink hover:text-trap"
            >
              <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-sprout" />
              {content.pilotOffer.badge}
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
          <Counter locale={lang} t={dict.counter} />
        </div>
      </section>

      {/* El recorrido con scroll por el invernadero: lo primero que se ve al bajar, en todos los idiomas. */}
      <RowTour
        t={content.tour}
        numberLocale={NUMBER_LOCALE[lang]}
        how={{ label: cta.how, href: pathFor(lang, "producto") }}
      />

      {/* El vídeo de presentación: de momento solo en español. */}
      {lang === "es" && <PresentationVideo />}

      {/* El problema: una sola frase grande y su explicación en etiqueta. */}
      <section className="plate border-b-[3px] border-ink">
        <div className="mx-auto grid max-w-[1320px] gap-8 px-4 py-20 sm:px-8 lg:grid-cols-[1.15fr_1fr] lg:items-end lg:py-28">
          <h2 className="display text-[clamp(2.5rem,5.2vw,4.5rem)]">{home.problemTitle}</h2>
          <div className="label px-6 py-6 sm:px-8">
            {home.problemBody.map((paragraph) => (
              <p key={paragraph} className="prose-measure text-[1.0625rem] [&+&]:mt-4">
                {paragraph}
              </p>
            ))}
            <Link href={pathFor(lang, "aforo-de-cosecha")} className="btn-secondary mt-2">
              {content.links.guideTeaser}
              <ArrowRight size={18} aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* Cómo funciona: tres días de la semana, separados por las líneas de la placa. */}
      <section className="bg-trap" aria-labelledby="como-funciona">
        <div className="mx-auto max-w-[1320px] px-4 pb-6 pt-20 sm:px-8 lg:pt-28">
          <h2 id="como-funciona" className="display max-w-[18ch] text-[clamp(2.25rem,4.4vw,3.75rem)]">
            {home.howTitle}
          </h2>
        </div>
        <ol className="mx-auto grid max-w-[1320px] border-y-[3px] border-ink md:grid-cols-3 md:border-x-[3px]">
          {home.steps.map((step, index) => (
            <li
              key={step.day}
              className={`flex flex-col gap-4 px-4 py-8 sm:px-8 md:py-10 ${
                index > 0 ? "border-t-[3px] border-ink md:border-l-[3px] md:border-t-0" : ""
              }`}
            >
              <p className="display text-[clamp(2.75rem,4.6vw,4rem)]">{step.day}</p>
              <h3 className="text-xl font-bold">{step.title}</h3>
              <p className="max-w-[38ch] text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>
        <div className="mx-auto max-w-[1320px] px-4 pb-20 pt-8 sm:px-8 lg:pb-28">
          <Link href={pathFor(lang, "producto")} className="btn-secondary">
            {home.howLink}
            <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
      </section>

      {/* La app por dentro: justo después de los tres pasos, las pantallas donde acaban. */}
      <section className="plate border-t-[3px] border-ink" aria-labelledby="app-por-dentro">
        <div className="mx-auto max-w-[1320px] px-4 py-20 sm:px-8 lg:py-28">
          <p className="font-bold uppercase tracking-[0.08em] text-ink-soft">{content.appTour.eyebrow}</p>
          <h2 id="app-por-dentro" className="display mt-4 max-w-[20ch] text-[clamp(2.25rem,4.4vw,3.75rem)]">
            {content.appTour.title}
          </h2>
          <p className="lead mt-5 text-[1.125rem] text-ink-soft">{content.appTour.lead}</p>
          <div className="mt-12">
            <AppTour tour={content.appTour} />
          </div>
        </div>
      </section>

      {/* Piloto gratis de 4 semanas: después de ver cómo funciona, la invitación a probarlo. */}
      <PilotOffer lang={lang} />

      {/* Para quién: una tabla en etiqueta, no tarjetas sueltas. */}
      <section className="plate border-y-[3px] border-ink" aria-labelledby="para-quien">
        <div className="mx-auto max-w-[1320px] px-4 py-20 sm:px-8 lg:py-28">
          <h2 id="para-quien" className="display text-[clamp(2.25rem,4.4vw,3.75rem)]">
            {home.forTitle}
          </h2>
          <dl className="label mt-10">
            {home.audiences.map((audience, index) => (
              <div
                key={audience.who}
                className={`grid gap-2 px-5 py-6 sm:px-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-10 ${
                  index > 0 ? "border-t-[3px] border-ink" : ""
                }`}
              >
                <dt className="display text-[1.75rem] sm:text-[2rem]">{audience.who}</dt>
                <dd className="prose-measure self-center text-[1.0625rem]">{audience.what}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Tus datos: lo que pasa con los vídeos, justo antes de hablar del piloto. */}
      <DataTrust lang={lang} trust={content.dataTrust} />

      {/* Resultados medidos del piloto: no aparece hasta que haya cifras reales en content/resultados.ts. */}
      <PilotResults lang={lang} />

      {/* El piloto: lo que funciona y lo que se está comprobando, sin prometer cifras. */}
      <section className="on-ink bg-ink text-trap" aria-labelledby="piloto">
        <div className="mx-auto max-w-[1320px] px-4 py-20 sm:px-8 lg:py-28">
          <h2 id="piloto" className="display max-w-[20ch] text-[clamp(2.25rem,4.4vw,3.75rem)]">
            {home.pilotTitle}
          </h2>
          <p className="lead mt-6 text-[1.125rem]">{home.pilotLead}</p>
          <div className="mt-12 grid gap-px bg-trap/40 md:grid-cols-2">
            <div className="bg-ink py-2 md:pr-10">
              <h3 className="flex items-center gap-2 text-xl font-bold">
                <Check size={22} aria-hidden />
                {home.worksTitle}
              </h3>
              <ul className="mt-5">
                {home.works.map((item) => (
                  <li key={item} className="flex gap-3 border-t border-trap/30 py-3.5">
                    <Check size={18} className="mt-1 shrink-0" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-ink py-2 md:pl-10">
              <h3 className="flex items-center gap-2 text-xl font-bold">
                <FlaskConical size={22} aria-hidden />
                {home.testingTitle}
              </h3>
              <ul className="mt-5">
                {home.testing.map((item) => (
                  <li key={item} className="flex gap-3 border-t border-trap/30 py-3.5">
                    <FlaskConical size={18} className="mt-1 shrink-0" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Diario del piloto: lo último que ha pasado, con fecha. */}
      <JournalTeaser lang={lang} />

      {/* Cierre. */}
      <section className="plate border-t-[3px] border-ink">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-12 px-4 py-24 sm:px-8 lg:py-32">
          <div className="flex flex-col items-start gap-8">
            <h2 className="display max-w-[16ch] text-[clamp(2.75rem,6vw,5.25rem)]">{home.closeTitle}</h2>
            <p className="lead text-[1.2rem] font-medium text-ink-soft">{home.closeBody}</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href={pathFor(lang, "contacto")} className="btn-primary">
                {cta.demo}
                <ArrowRight size={18} aria-hidden />
              </Link>
              <Link href={pilotHref(lang)} className="btn-secondary">
                {content.pilotOffer.badge}
              </Link>
            </div>
          </div>
          <NaveMark size={320} className="hidden shrink-0 md:block" />
        </div>
      </section>
    </>
  );
}
