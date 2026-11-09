import { Fragment } from "react";
import type { Dictionary } from "@/i18n/es";
import { LEGAL_DATA } from "@/i18n";
import { PendingNote, PendingValue } from "./Pending";

type Section = { heading: string; body: string };

/** Sustituye {titular}, {nif}… por el dato real o por un hueco visible si aún falta. */
function fill(text: string, pending: string) {
  return text.split(/(\{[a-z]+\})/g).map((part, index) => {
    const key = part.match(/^\{([a-z]+)\}$/)?.[1] as keyof typeof LEGAL_DATA | undefined;
    if (!key) return <Fragment key={index}>{part}</Fragment>;
    const value = LEGAL_DATA[key];
    return value ? <strong key={index}>{value}</strong> : <PendingValue key={index} label={`${pending}: ${key}`} />;
  });
}

export function LegalPage({ title, sections, legal }: { title: string; sections: Section[]; legal: Dictionary["legal"] }) {
  const complete = Object.values(LEGAL_DATA).every(Boolean);
  return (
    <section className="plate">
      <div className="mx-auto max-w-[1320px] px-4 pb-20 pt-12 sm:px-8 lg:pb-28 lg:pt-20">
        <h1 className="display text-[clamp(2.75rem,6vw,5rem)]">{title}</h1>
        {!complete && (
          <div className="mt-6">
            <PendingNote>{legal.draft}</PendingNote>
          </div>
        )}
        <div className="label mt-10 max-w-[860px] px-6 py-4 sm:px-10">
          {sections.map((section, index) => (
            <section key={section.heading} className={`py-6 ${index > 0 ? "border-t-2 border-ink" : ""}`}>
              <h2 className="text-xl font-bold">{section.heading}</h2>
              <p className="prose-measure mt-2 leading-relaxed">{fill(section.body, legal.pending)}</p>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
