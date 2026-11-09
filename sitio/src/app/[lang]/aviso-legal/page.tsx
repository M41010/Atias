import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPage } from "@/components/LegalPage";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/aviso-legal">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: `${getDictionary(lang).legal.noticeTitle} · Atias`, robots: { index: false } };
}

export default async function Notice({ params }: PageProps<"/[lang]/aviso-legal">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const { legal } = getDictionary(lang);
  return <LegalPage title={legal.noticeTitle} sections={legal.notice} legal={legal} />;
}
