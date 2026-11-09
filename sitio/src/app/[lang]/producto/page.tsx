import { ArrowRight, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, pathFor } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import panel from "../../../../public/capturas/panel-resumen.png";

export async function generateMetadata({ params }: PageProps<"/[lang]/producto">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return { title: `${dict.product.title} · Atias`, description: dict.product.lead };
}

export default async function Product({ params }: PageProps<"/[lang]/producto">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const { product, cta, home } = getDictionary(lang);

  return (
    <>
      <section className="plate border-b-[3px] border-ink">
        <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-12 sm:px-8 lg:pb-24 lg:pt-20">
          <h1 className="display text-[clamp(3.25rem,7vw,6rem)]">{product.title}</h1>
          <p className="display mt-8 max-w-[24ch] text-[clamp(1.75rem,3.2vw,2.75rem)] !leading-[1.05]">{product.lead}</p>
        </div>
      </section>

      {/* Las cinco etapas, como renglones de la placa: el verbo a la izquierda, el detalle a la derecha. */}
      <section className="bg-trap">
        <ol className="mx-auto max-w-[1320px] px-4 py-10 sm:px-8 lg:py-16">
          {product.sections.map((section, index) => (
            <li
              key={section.title}
              className={`grid gap-3 py-9 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)] md:gap-12 ${
                index > 0 ? "border-t-[3px] border-ink" : ""
              }`}
            >
              <h2 className="display text-[clamp(2.25rem,4.4vw,3.75rem)]">{section.title}</h2>
              <p className="prose-measure self-center text-[1.125rem] leading-relaxed">{section.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* El panel de la cooperativa, tal como es, con datos de ejemplo. */}
      <section className="border-y-[3px] border-ink bg-trap" aria-labelledby="panel">
        <div className="mx-auto max-w-[1320px] px-4 py-16 sm:px-8 lg:py-24">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)] lg:gap-12">
            <div>
              <h2 id="panel" className="display text-[clamp(2.25rem,4.4vw,3.75rem)]">
                {product.panelTitle}
              </h2>
              <p className="prose-measure mt-5 text-[1.0625rem] text-ink-soft">{product.panelBody}</p>
            </div>
            <figure className="label overflow-hidden">
              <Image src={panel} alt={product.panelCaption} sizes="(min-width: 1024px) 800px, 100vw" className="h-auto w-full" />
              <figcaption className="border-t-[3px] border-ink px-4 py-2.5 text-sm font-semibold">
                {product.panelCaption}
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="bg-trap">
        <div className="mx-auto grid max-w-[1320px] gap-12 px-4 py-16 sm:px-8 lg:grid-cols-2 lg:py-24">
          <div>
            <h2 className="display text-[clamp(2rem,3.6vw,3rem)]">{product.cropsTitle}</h2>
            <ul className="mt-6 border-t-[3px] border-ink">
              {product.crops.map((crop) => (
                <li key={crop} className="display border-b-[3px] border-ink py-4 text-[2rem]">
                  {crop}
                </li>
              ))}
            </ul>
            <p className="prose-measure mt-4 text-ink-soft">{product.cropsNote}</p>
          </div>
          <div>
            <h2 className="display text-[clamp(2rem,3.6vw,3rem)]">{product.dataTitle}</h2>
            <ul className="label mt-6">
              {product.data.map((item, index) => (
                <li key={item} className={`flex gap-3 px-5 py-4 ${index > 0 ? "border-t-2 border-ink" : ""}`}>
                  <ShieldCheck size={20} className="mt-0.5 shrink-0" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="on-ink bg-ink text-trap">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-6 px-4 py-14 sm:px-8">
          <p className="display max-w-[20ch] text-[clamp(2rem,3.6vw,3rem)]">{home.closeTitle}</p>
          <Link href={pathFor(lang, "contacto")} className="btn-primary">
            {cta.demo}
            <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
