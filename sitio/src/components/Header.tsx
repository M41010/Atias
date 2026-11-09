"use client";

import { Globe, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LOCALE_NAMES, LOCALES, type Locale, type Page, pathFor, swapLocale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/es";
import { Wordmark } from "./Mark";

type Props = { locale: Locale; nav: Dictionary["nav"] };

const LINKS: { page: Page; key: "home" | "company" | "product" | "contact" }[] = [
  { page: "", key: "home" },
  { page: "empresa", key: "company" },
  { page: "producto", key: "product" },
  { page: "contacto", key: "contact" },
];

/** Cabecera: el logotipo, el menú, el estado del piloto y el idioma. */
export function Header({ locale, nav }: Props) {
  const pathname = usePathname() ?? `/${locale}/`;
  const [open, setOpen] = useState(false);

  const isActive = (page: Page) => {
    const target = pathFor(locale, page);
    return page === "" ? pathname === target || pathname === `/${locale}` : pathname.startsWith(target);
  };

  return (
    <header className="relative z-30 border-b-[3px] border-ink bg-trap">
      <div className="mx-auto flex h-[72px] max-w-[1320px] items-center gap-6 px-4 sm:px-8">
        <Link href={pathFor(locale)} className="no-underline" aria-label="Atias">
          <Wordmark />
        </Link>

        <nav aria-label={nav.menu} className="ml-6 hidden items-center gap-1 md:flex">
          {LINKS.slice(1, 3).map(({ page, key }) => (
            <Link
              key={page}
              href={pathFor(locale, page)}
              aria-current={isActive(page) ? "page" : undefined}
              className="px-3 py-2 font-semibold no-underline decoration-[3px] underline-offset-[10px] hover:underline aria-[current=page]:underline"
            >
              {nav[key]}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden items-center gap-2 bg-ink px-3 py-1.5 text-sm font-bold text-trap lg:inline-flex">
            <span className="inline-block h-2.5 w-2.5 animate-pulse bg-trap motion-reduce:animate-none" aria-hidden />
            {nav.pilot}
          </span>

          <details className="group relative">
            <summary
              className="flex min-h-11 cursor-pointer list-none items-center gap-2 border-2 border-ink px-3 font-bold uppercase [&::-webkit-details-marker]:hidden"
              aria-label={`${nav.language}: ${LOCALE_NAMES[locale]}`}
            >
              <Globe size={17} aria-hidden />
              {locale}
            </summary>
            <ul className="label absolute right-0 top-[calc(100%+6px)] z-40 w-48 py-1" lang="">
              {LOCALES.map((code) => (
                <li key={code}>
                  <Link
                    href={swapLocale(pathname, code)}
                    hrefLang={code}
                    lang={code}
                    aria-current={code === locale ? "true" : undefined}
                    className="flex items-center justify-between px-4 py-2.5 font-semibold no-underline hover:bg-trap aria-[current=true]:bg-ink aria-[current=true]:text-trap"
                  >
                    {LOCALE_NAMES[code]}
                    <span className="text-sm uppercase opacity-70">{code}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </details>

          <Link href={pathFor(locale, "contacto")} className="btn-primary hidden !min-h-11 !px-4 !text-base sm:inline-flex">
            {nav.contact}
          </Link>

          <button
            type="button"
            className="flex min-h-11 min-w-11 items-center justify-center border-2 border-ink md:hidden"
            aria-expanded={open}
            aria-controls="menu-movil"
            aria-label={open ? nav.close : nav.menu}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="menu-movil" aria-label={nav.menu} className="border-t-[3px] border-ink bg-trap md:hidden">
          <ul className="mx-auto max-w-[1320px] px-4 py-2">
            {LINKS.map(({ page, key }) => (
              <li key={page} className="border-b border-ink/30 last:border-0">
                <Link
                  href={pathFor(locale, page)}
                  aria-current={isActive(page) ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className="display block py-3 text-3xl no-underline aria-[current=page]:underline"
                >
                  {nav[key]}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mx-auto max-w-[1320px] px-4 pb-4 text-sm font-bold">{nav.pilot}</p>
        </nav>
      )}
    </header>
  );
}
