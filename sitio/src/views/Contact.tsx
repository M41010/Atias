import { Mail } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { PendingValue } from "@/components/Pending";
import type { Locale } from "@/i18n/config";
import { getDictionary, LEGAL_DATA } from "@/i18n";
import { getContent } from "@/i18n/content";

export function Contact({ lang }: { lang: Locale }) {
  const { contact } = getDictionary(lang);

  return (
    <section className="plate">
      <div className="mx-auto grid max-w-[1320px] gap-10 px-4 pb-20 pt-12 sm:px-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.3fr)] lg:gap-14 lg:pb-28 lg:pt-20">
        <div>
          <h1 className="display text-[clamp(3.25rem,7vw,6rem)]">{contact.title}</h1>
          <p className="lead mt-7 text-[1.2rem] font-medium text-ink-soft">{contact.lead}</p>
          <div className="mt-10 border-t-[3px] border-ink pt-5">
            <p className="font-bold">{contact.directTitle}</p>
            <p className="mt-2 flex items-center gap-2">
              <Mail size={18} aria-hidden />
              {LEGAL_DATA.correo ? (
                <a href={`mailto:${LEGAL_DATA.correo}`} className="font-semibold underline">
                  {LEGAL_DATA.correo}
                </a>
              ) : (
                <PendingValue label={contact.directEmail} />
              )}
            </p>
          </div>
        </div>
        <ContactForm locale={lang} t={contact} offer={getContent(lang).pilotOffer} />
      </div>
    </section>
  );
}
