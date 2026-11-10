import { ArrowRight, KeyRound, Link2, ScanEye, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Content } from "@/i18n/content";
import { type Locale, pathFor } from "@/i18n/config";

const ICONS = [Link2, KeyRound, ScanEye, Trash2];

/**
 * «Tus datos»: lo que hace hoy Atias con los vídeos y los datos, tal como está programado en la API
 * (enlaces por invernadero y semana, contraseñas, detector propio, borrado a los siete días). Lo que
 * aún no está decidido se dice, en lugar de prometerlo.
 */
export function DataTrust({ lang, trust }: { lang: Locale; trust: Content["dataTrust"] }) {
  return (
    <section className="plate border-b-[3px] border-ink" aria-labelledby="tus-datos">
      <div className="mx-auto max-w-[1320px] px-4 py-20 sm:px-8 lg:py-28">
        <p className="font-bold uppercase tracking-[0.08em] text-ink-soft">{trust.eyebrow}</p>
        <h2 id="tus-datos" className="display mt-4 max-w-[22ch] text-[clamp(2.25rem,4.4vw,3.75rem)]">
          {trust.title}
        </h2>
        <p className="lead mt-5 text-[1.125rem] text-ink-soft">{trust.lead}</p>
        <ul className="label mt-10 grid md:grid-cols-2 lg:grid-cols-4">
          {trust.points.map((point, index) => {
            const Icon = ICONS[index % ICONS.length];
            return (
              <li
                key={point.name}
                className={`flex flex-col gap-3 p-6 sm:p-7 ${index > 0 ? "border-t-[3px] border-ink md:border-t-0" : ""} ${
                  index % 2 === 1 ? "md:border-l-[3px] md:border-ink" : ""
                } ${index >= 2 ? "md:border-t-[3px] lg:border-t-0" : ""} ${index === 2 ? "lg:border-l-[3px] lg:border-ink" : ""}`}
              >
                <Icon size={26} aria-hidden className="text-sprout" />
                <h3 className="text-lg font-bold">{point.name}</h3>
                <p className="text-ink-soft">{point.body}</p>
              </li>
            );
          })}
        </ul>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
          <p className="text-sm text-ink-soft">{trust.pending}</p>
          <Link href={`${pathFor(lang, "producto")}#seguridad-y-datos`} className="btn-secondary">
            {trust.more}
            <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
