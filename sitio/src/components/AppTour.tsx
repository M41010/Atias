"use client";

import { type KeyboardEvent, useId, useRef, useState } from "react";
import type { Content } from "@/i18n/content";

type Tour = Content["appTour"];

/**
 * «La app por dentro»: pantallas reales de la aplicación con datos de ejemplo, en pestañas. Cada
 * pestaña dice qué decide la cooperativa con esa pantalla. Pestañas accesibles (flechas, Inicio y
 * Fin); las capturas cargan diferidas y solo se pinta la elegida.
 */
export function AppTour({ tour }: { tour: Tour }) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const base = useId();
  const screen = tour.screens[active];

  const select = (index: number) => {
    const next = (index + tour.screens.length) % tour.screens.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const moves: Record<string, number> = {
      ArrowDown: active + 1,
      ArrowRight: active + 1,
      ArrowUp: active - 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: tour.screens.length - 1,
    };
    if (event.key in moves) {
      event.preventDefault();
      select(moves[event.key]);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:gap-12">
      <div
        role="tablist"
        aria-label={tour.tabsLabel}
        aria-orientation="vertical"
        className="flex gap-2 overflow-x-auto [scrollbar-width:none] lg:flex-col lg:gap-0 lg:overflow-visible lg:border-t-[3px] lg:border-ink lg:pb-0"
      >
        {tour.screens.map((item, index) => {
          const selected = index === active;
          return (
            <button
              key={item.id}
              ref={(node) => {
                tabs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${base}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
              onKeyDown={onKeyDown}
              className={`shrink-0 border-[3px] border-ink px-4 py-3 text-left transition-colors duration-150 lg:border-x-0 lg:border-t-0 lg:px-0 lg:py-5 ${
                selected ? "bg-ink text-trap lg:bg-transparent lg:text-ink" : "bg-paper lg:bg-transparent"
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  aria-hidden
                  className={`hidden h-3 w-3 shrink-0 border-2 border-ink lg:block ${selected ? "bg-sprout" : "bg-transparent"}`}
                />
                <span className="display whitespace-nowrap text-[1.35rem] lg:text-[1.75rem]">{item.name}</span>
              </span>
              <span className={`mt-2 hidden max-w-[34ch] text-[0.98rem] lg:block ${selected ? "text-ink" : "text-ink-soft"}`}>
                {item.decision}
              </span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`${base}-panel`} aria-labelledby={`${base}-tab-${screen.id}`} className="min-w-0">
        <p className="mb-4 text-[1.0625rem] font-medium lg:hidden">{screen.decision}</p>
        {/* Marco de ventana: la captura se lee como la app, no como una foto suelta. */}
        <figure className="label overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b-[3px] border-ink px-4 py-2.5">
            <span aria-hidden className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-ink" />
              <span className="h-2.5 w-2.5 rounded-full border-2 border-ink" />
              <span className="h-2.5 w-2.5 rounded-full border-2 border-ink" />
            </span>
            <span className="border-2 border-ink bg-forecast-soft px-2 py-0.5 text-xs font-bold uppercase tracking-[0.06em] text-forecast-ink">
              {tour.sample}
            </span>
          </div>
          <img
            key={screen.id}
            src={`/capturas/app/${screen.id}.webp`}
            alt={screen.alt}
            width={1600}
            height={704}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full"
          />
        </figure>
        <p className="mt-3 text-sm text-ink-soft">
          {tour.blurred}
          {tour.uiLanguage && ` ${tour.uiLanguage}`}
        </p>
      </div>
    </div>
  );
}
