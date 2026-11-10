import { Reveal } from "@/components/Reveal";
import type { Content } from "@/i18n/content";

/**
 * Comparativa honesta: cómo se prevé hoy la cosecha y cómo lo hace Atias. Una tabla en escritorio;
 * en el móvil, cada criterio con sus tres respuestas una debajo de otra. La columna de Atias va
 * resaltada, pero ninguna celda promete cifras que aún no se han medido.
 */
export function Comparison({ compare }: { compare: Content["compare"] }) {
  const last = compare.methods.length - 1;
  return (
    <section className="plate border-y-[3px] border-ink" aria-labelledby="comparativa">
      <div className="mx-auto max-w-[1320px] px-4 py-20 sm:px-8 lg:py-28">
        <p className="font-bold uppercase tracking-[0.08em] text-ink-soft">{compare.eyebrow}</p>
        <h2 id="comparativa" className="display mt-4 max-w-[22ch] text-[clamp(2.25rem,4.4vw,3.75rem)]">
          {compare.title}
        </h2>
        <p className="lead mt-5 text-[1.125rem] text-ink-soft">{compare.lead}</p>

        <div className="label mt-10" role="table" aria-labelledby="comparativa">
          {/* Cabecera: solo en pantallas anchas, donde se lee como tabla. */}
          <div role="row" className="hidden grid-cols-[1.1fr_repeat(3,minmax(0,1fr))] border-b-[3px] border-ink md:grid">
            <span role="columnheader" className="px-5 py-4" />
            {compare.methods.map((method, index) => (
              <span
                key={method}
                role="columnheader"
                className={`display border-l-[3px] border-ink px-5 py-4 text-[1.6rem] ${index === last ? "bg-ink text-trap" : ""}`}
              >
                {method}
              </span>
            ))}
          </div>
          {compare.rows.map((row, rowIndex) => (
            <Reveal
              key={row.criterion}
              delay={rowIndex * 60}
              className={`grid md:grid-cols-[1.1fr_repeat(3,minmax(0,1fr))] ${rowIndex > 0 ? "border-t-[3px] border-ink" : ""}`}
            >
              <div role="row" className="contents">
                <span role="rowheader" className="px-5 pb-2 pt-5 font-bold md:py-5">
                  {row.criterion}
                </span>
                {row.values.map((value, index) => (
                  <span
                    key={compare.methods[index]}
                    role="cell"
                    className={`flex flex-col gap-1 px-5 py-2 md:border-l-[3px] md:border-ink md:py-5 ${
                      index === last ? "font-semibold md:bg-sprout/10" : "text-ink-soft"
                    } ${index === last ? "pb-5" : ""}`}
                  >
                    {/* En el móvil no hay cabecera: cada respuesta lleva el nombre del método. */}
                    <span className={`text-xs font-bold uppercase tracking-[0.06em] md:hidden ${index === last ? "text-sprout" : "text-ink-soft"}`}>
                      {compare.methods[index]}
                    </span>
                    {value}
                  </span>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 max-w-[60ch] font-semibold">{compare.note}</p>
      </div>
    </section>
  );
}
