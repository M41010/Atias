import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPage } from "@/components/LegalPage";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/privacidad">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: `${getDictionary(lang).legal.privacyTitle} · Atias`, robots: { index: false } };
}

export default async function Privacy({ params }: PageProps<"/[lang]/privacidad">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const { legal } = getDictionary(lang);
  return <LegalPage title={legal.privacyTitle} sections={legal.privacy} legal={legal} />;
}
