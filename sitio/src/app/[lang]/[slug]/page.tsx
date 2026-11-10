import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isLocale, type Locale, pageFromSlug, SLUGS, type SubPage } from "@/i18n/config";
import { getContent } from "@/i18n/content";
import { pageMetadata } from "@/seo/metadata";
import { Company } from "@/views/Company";
import { Contact } from "@/views/Contact";
import { CropsHub } from "@/views/Crops";
import { Faq } from "@/views/Faq";
import { Guide } from "@/views/Guide";
import { Investors } from "@/views/Investors";
import { Notice } from "@/views/Notice";
import { Privacy } from "@/views/Privacy";
import { Product } from "@/views/Product";
import { Vision } from "@/views/Vision";

export const dynamicParams = false;

/** Cada página, con su dirección traducida: /es/producto/, /en/product/, /fr/produit/… */
export async function generateStaticParams({ params }: { params: { lang: string } }) {
  const lang = params.lang as Locale;
  return Object.values(SLUGS[lang]).map((slug) => ({ slug }));
}

const SEO_KEY: Record<SubPage, keyof ReturnType<typeof getContent>["seo"]> = {
  empresa: "company",
  producto: "product",
  contacto: "contact",
  "aviso-legal": "notice",
  privacidad: "privacy",
  "aforo-de-cosecha": "guide",
  "preguntas-frecuentes": "faq",
  cultivos: "crops",
  vision: "vision",
  inversores: "investors",
};

const VIEWS: Record<SubPage, (props: { lang: Locale }) => ReactNode> = {
  empresa: Company,
  producto: Product,
  contacto: Contact,
  "aviso-legal": Notice,
  privacidad: Privacy,
  "aforo-de-cosecha": Guide,
  "preguntas-frecuentes": Faq,
  cultivos: CropsHub,
  vision: Vision,
  inversores: Investors,
};

async function resolve(params: PageProps<"/[lang]/[slug]">["params"]) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return null;
  const page = pageFromSlug(lang, slug);
  return page ? { lang, page } : null;
}

export async function generateMetadata({ params }: PageProps<"/[lang]/[slug]">): Promise<Metadata> {
  const route = await resolve(params);
  if (!route) return {};
  const { title, description } = getContent(route.lang).seo[SEO_KEY[route.page]];
  return pageMetadata({
    locale: route.lang,
    page: route.page,
    title,
    description,
    type: route.page === "aforo-de-cosecha" ? "article" : "website",
  });
}

export default async function Section({ params }: PageProps<"/[lang]/[slug]">) {
  const route = await resolve(params);
  if (!route) notFound();
  const View = VIEWS[route.page];
  return <View lang={route.lang} />;
}
