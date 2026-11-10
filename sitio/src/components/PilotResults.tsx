import { type PilotResults as Data, RESULTADOS } from "@/content/resultados";
import Link from "next/link";
import { type Locale, NUMBER_LOCALE, pathFor } from "@/i18n/config";
import { getContent } from "@/i18n/content";
import { fill, formatPct, hasResults, MIN_WEEKS, plural } from "./resultsModel";

/**
 * Resultados medidos del piloto. No aparece mientras `RESULTADOS` sea null: la web pública nunca
 * enseña cifras de ejemplo. `data` solo se pasa para probar la maqueta en local.
 */
export function PilotResults({ lang, data = RESULTADOS }: { lang: Locale; data?: Data | null }) {
  if (!hasResults(data)) return null;
  const t = getContent(lang).results;
  const numbers = NUMBER_LOCALE[lang];
  const date = new Intl.DateTimeFormat(numbers, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${data.asOf}T00:00:00Z`),
  );

  return (
    <section className="plate border-b-[3px] border-ink" aria-labelledby="resultados-piloto">
      <div className="mx-auto max-w-[1320px] px-4 py-20 sm:px-8 lg:py-28">
        <p className="font-bold uppercase tracking-[0.08em] text-ink-soft">{t.eyebrow}</p>
        <h2 id="resultados-piloto" className="display mt-4 max-w-[20ch] text-[clamp(2.25rem,4.4vw,3.75rem)]">
          {t.title}
        </h2>
        <p className="lead mt-6 text-[1.125rem] text-ink-soft">
          {fill(t.lead, {
            greenhouses: plural(t.greenhouse, data.greenhouses),
            weeks: plural(t.week, data.weeks),
          })}
        </p>

        <div className="label mt-10 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-left">
            <caption className="sr-only">{t.title}</caption>
            <thead>
              <tr className="border-b-[3px] border-ink">
                <th scope="col" className="px-5 py-4 font-bold sm:px-8">{t.source}</th>
                <th scope="col" className="px-5 py-4 text-right font-bold sm:px-8">{t.error}</th>
                <th scope="col" className="px-5 py-4 text-right font-bold sm:px-8">{t.bias}</th>
              </tr>
            </thead>
            <tbody>
              {data.forecasts.map((row) => (
                <tr key={row.source} className={`border-t border-ink/20 ${row.source === "atias" ? "bg-trap" : ""}`}>
                  <th scope="row" className="display px-5 py-5 text-[1.75rem] sm:px-8">{t.sources[row.source]}</th>
                  <td className="numeral px-5 py-5 text-right text-[1.75rem] sm:px-8">{formatPct(row.errorPct, numbers)}</td>
                  <td className="numeral px-5 py-5 text-right text-[1.75rem] sm:px-8">{formatPct(row.biasPct, numbers, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="prose-measure mt-6 flex flex-col gap-2 text-ink-soft">
          {data.controlDiffPct !== undefined && <p>{fill(t.control, { value: formatPct(data.controlDiffPct, numbers) })}</p>}
          <p>
            {t.method}{" "}
            <Link href={pathFor(lang, "como-medimos")} className="font-semibold text-ink underline underline-offset-4">
              {getContent(lang).links.measure}
            </Link>
          </p>
          {data.weeks < MIN_WEEKS && <p className="font-semibold text-ink">{t.caution}</p>}
          <p className="text-sm">{fill(t.asOf, { date })}</p>
        </div>
      </div>
    </section>
  );
}
