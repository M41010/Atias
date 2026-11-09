import Link from "next/link";
import { type Locale, pathFor } from "@/i18n/config";
import type { Dictionary } from "@/i18n/es";
import { getContent } from "@/i18n/content";
import { NaveMark, Wordmark } from "./Mark";

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { links } = getContent(locale);
  return (
    <footer className="on-ink bg-ink text-trap">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-8 px-4 py-12 sm:px-8 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3">
          <NaveMark size={72} className="-ml-1" />
          <Wordmark />
          <p className="max-w-[40ch] text-[0.95rem]">{dict.footer.rights}</p>
        </div>
        <nav aria-label={dict.footer.notice} className="flex flex-wrap gap-x-6 gap-y-2 text-[0.95rem] font-semibold">
          <Link href={pathFor(locale, "empresa")}>{dict.nav.company}</Link>
          <Link href={pathFor(locale, "producto")}>{dict.nav.product}</Link>
          <Link href={pathFor(locale, "cultivos")}>{links.crops}</Link>
          <Link href={pathFor(locale, "aforo-de-cosecha")}>{links.guide}</Link>
          <Link href={pathFor(locale, "preguntas-frecuentes")}>{links.faq}</Link>
          <Link href={pathFor(locale, "contacto")}>{dict.nav.contact}</Link>
          <Link href={pathFor(locale, "aviso-legal")}>{dict.footer.notice}</Link>
          <Link href={pathFor(locale, "privacidad")}>{dict.footer.privacy}</Link>
        </nav>
        <p className="text-[0.95rem]">{dict.footer.noCookies}</p>
      </div>
    </footer>
  );
}
