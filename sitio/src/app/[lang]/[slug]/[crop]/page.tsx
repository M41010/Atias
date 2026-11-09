import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CROP_SLUGS, cropFromSlug, isLocale, LOCALES, pageFromSlug, SLUGS } from "@/i18n/config";
import { getContent } from "@/i18n/content";
import { pageMetadata } from "@/seo/metadata";
import { CropPage } from "@/views/Crops";

export const dynamicParams = false;

/**
 * Una página por cultivo, solo dentro de «cultivos»: /es/cultivos/pepino/, /en/crops/cucumber/…
 * Se generan las tres partes de la ruta aquí, porque el resto de secciones no tiene subpáginas.
 */
export async function generateStaticParams() {
  return LOCALES.flatMap((lang) =>
    Object.values(CROP_SLUGS[lang]).map((crop) => ({ lang, slug: SLUGS[lang].cultivos, crop })),
  );
}

async function resolve(params: PageProps<"/[lang]/[slug]/[crop]">["params"]) {
  const { lang, slug, crop } = await params;
  if (!isLocale(lang) || pageFromSlug(lang, slug) !== "cultivos") return null;
  const key = cropFromSlug(lang, crop);
  return key ? { lang, crop: key } : null;
}

export async function generateMetadata({ params }: PageProps<"/[lang]/[slug]/[crop]">): Promise<Metadata> {
  const route = await resolve(params);
  if (!route) return {};
  const data = getContent(route.lang).crops[route.crop];
  return pageMetadata({
    locale: route.lang,
    page: "cultivos",
    crop: route.crop,
    title: data.seoTitle,
    description: data.seoDescription,
    type: "article",
  });
}

export default async function CropRoute({ params }: PageProps<"/[lang]/[slug]/[crop]">) {
  const route = await resolve(params);
  if (!route) notFound();
  return <CropPage lang={route.lang} crop={route.crop} />;
}
