import { LegalPage } from "@/components/LegalPage";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";

export function Notice({ lang }: { lang: Locale }) {
  const { legal } = getDictionary(lang);
  return <LegalPage title={legal.noticeTitle} sections={legal.notice} legal={legal} />;
}
