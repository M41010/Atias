import { LegalPage } from "@/components/LegalPage";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";

export function Privacy({ lang }: { lang: Locale }) {
  const { legal } = getDictionary(lang);
  return <LegalPage title={legal.privacyTitle} sections={legal.privacy} legal={legal} />;
}
