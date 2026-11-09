import Link from "next/link";
import { LanguageRedirect } from "@/components/LanguageRedirect";
import { NaveMark, Wordmark } from "@/components/Mark";
import { LOCALE_NAMES, LOCALES, pathFor } from "@/i18n/config";
import { getDictionary } from "@/i18n";

/** La raíz lleva al idioma del navegador; sin JavaScript, deja elegir. */
export default function Root() {
  return (
    <main className="plate flex min-h-dvh flex-col items-start justify-center gap-8 px-6 py-16 sm:px-12">
      <LanguageRedirect />
      <NaveMark size={80} className="-ml-1" />
      <h1>
        <Wordmark />
      </h1>
      <ul className="label w-full max-w-md">
        {LOCALES.map((code, index) => (
          <li key={code} className={index > 0 ? "border-t-2 border-ink" : ""}>
            <Link href={pathFor(code)} hrefLang={code} lang={code} className="flex justify-between px-5 py-3.5 font-semibold no-underline hover:bg-trap">
              {LOCALE_NAMES[code]}
              <span className="text-sm opacity-70">{getDictionary(code).root.choose}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
