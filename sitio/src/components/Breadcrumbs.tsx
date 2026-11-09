import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { breadcrumbs } from "@/seo/schema";
import { JsonLd } from "./JsonLd";

type Crumb = { name: string; path: string };

/** Ruta de navegación visible y, para los buscadores, la misma ruta como datos estructurados. */
export function Breadcrumbs({ items, label }: { items: Crumb[]; label: string }) {
  return (
    <>
      <nav aria-label={label}>
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm font-semibold text-ink-soft">
          {items.map((item, index) => {
            const last = index === items.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-1.5">
                {last ? (
                  <span aria-current="page" className="text-ink">
                    {item.name}
                  </span>
                ) : (
                  <>
                    <Link href={item.path} className="underline decoration-2 underline-offset-4 hover:text-ink">
                      {item.name}
                    </Link>
                    <ChevronRight size={14} aria-hidden />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbs(items)} />
    </>
  );
}
