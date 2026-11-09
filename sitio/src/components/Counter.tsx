"use client";

import { RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NUMBER_LOCALE, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/es";
import { buildRow, countAt, estimate, ROW, scanAt } from "./counterModel";

const DURATION_MS = 7000;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

type Highlight = "observed" | "forecast" | null;

/**
 * El contador de la portada: recorre un invernadero de ejemplo y cada fruto maduro que cruza la
 * línea de lectura cae como una celda en el recuento. Un solo control (el recorrido) mueve todas
 * las cifras. Los datos son inventados y lo dice.
 */
export function Counter({ locale, t }: { locale: Locale; t: Dictionary["counter"] }) {
  const row = useMemo(() => buildRow(), []);
  const [progress, setProgress] = useState(0);
  const [settled, setSettled] = useState(false);
  const [highlight, setHighlight] = useState<Highlight>(null);
  const frame = useRef<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const format = useMemo(() => new Intl.NumberFormat(NUMBER_LOCALE[locale]), [locale]);

  const stop = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  }, []);

  const play = useCallback(() => {
    stop();
    setSettled(false);
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS);
      setProgress(easeOut(t));
      if (t < 1) frame.current = requestAnimationFrame(step);
      else {
        frame.current = null;
        setSettled(true);
      }
    };
    frame.current = requestAnimationFrame(step);
  }, [stop]);

  // Empieza a contar cuando se ve. Con movimiento reducido, se muestra el resultado directamente.
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      frame.current = requestAnimationFrame(() => {
        setProgress(1);
        setSettled(true);
      });
      return () => stop();
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          play();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      stop();
    };
  }, [play, stop]);

  const counted = countAt(row, progress);
  const figures = estimate(counted, row.ripeTotal);
  const rowNumber = Math.min(ROW.rows, Math.floor(progress * ROW.rows) + 1);
  const offset = progress * (1 - ROW.window);

  const ring = (target: Highlight) =>
    highlight === target ? "outline outline-[3px] outline-offset-4 outline-ink" : "";

  return (
    <div ref={root} className="label flex flex-col">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b-[3px] border-ink px-4 py-3 sm:px-5">
        <p className="font-bold">
          {t.title} · {t.tramo} {rowNumber} {t.of} {ROW.rows}
        </p>
        <p className="text-sm text-paper-muted">{t.sample}</p>
      </div>

      {/* La hilera, dibujada con las celdas de la placa, pasa por delante de la línea de lectura. */}
      <div className="relative h-[150px] overflow-hidden bg-leaf-dark sm:h-[176px]" aria-hidden>
        <svg
          viewBox={`0 0 ${row.width} ${row.height}`}
          preserveAspectRatio="xMinYMid slice"
          className="absolute inset-y-0 left-0 h-full will-change-transform"
          style={{ width: `${100 / ROW.window}%`, transform: `translateX(${-offset * 100}%)` }}
        >
          {row.leaves.map((leaf) => (
            <rect key={leaf.id} x={leaf.x} y={leaf.y} width={ROW.cell - 1} height={ROW.cell - 1} fill={leaf.fill} />
          ))}
          {row.fruits.map((fruit) => {
            const done = fruit.ripe && (progress >= 1 || fruit.position <= scanAt(progress));
            return (
              <g key={fruit.id}>
                <circle
                  cx={fruit.x}
                  cy={fruit.y}
                  r={ROW.cell * 0.42}
                  fill={fruit.ripe ? "var(--color-fruit)" : "var(--color-fruit-unripe)"}
                />
                {done && (
                  <rect
                    x={fruit.x - ROW.cell * 0.62}
                    y={fruit.y - ROW.cell * 0.62}
                    width={ROW.cell * 1.24}
                    height={ROW.cell * 1.24}
                    fill="none"
                    stroke="var(--color-trap)"
                    strokeWidth={2}
                  />
                )}
              </g>
            );
          })}
        </svg>
        <div className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-trap" />
        <svg className="absolute left-1/2 top-0 -translate-x-1/2 text-trap" width="18" height="12" viewBox="0 0 18 12">
          <path d="M0 0h18L9 12z" fill="currentColor" />
        </svg>
      </div>

      <div className="grid gap-px border-y-[3px] border-ink bg-ink sm:grid-cols-[1.1fr_1.3fr_0.8fr]">
        <div className={`bg-paper px-4 py-4 sm:px-5 ${ring("observed")}`}>
          <p className="numeral text-[2.75rem] leading-none text-observed-ink">{format.format(figures.fruits)}</p>
          <p className="mt-1 text-sm font-semibold">{t.ripe}</p>
        </div>
        <div className={`bg-paper px-4 py-4 sm:px-5 ${ring("forecast")}`}>
          <p className="numeral text-[2.75rem] leading-none">{format.format(figures.kg)}</p>
          <p className="mt-1 text-sm font-semibold">{t.kg}</p>
          <div className="relative mt-2 h-2 bg-forecast-soft" aria-hidden>
            <div
              className="absolute inset-y-0 bg-forecast/40"
              style={{ left: `${figures.bandLeft * 100}%`, right: `${(1 - figures.bandRight) * 100}%` }}
            />
            <div className="absolute inset-y-[-3px] w-[3px] bg-forecast-ink" style={{ left: `${figures.bandMid * 100}%` }} />
          </div>
          <p className="mt-1.5 text-sm text-forecast-ink">
            {t.range.replace("{min}", format.format(figures.min)).replace("{max}", format.format(figures.max))}
          </p>
        </div>
        <div className="bg-paper px-4 py-4 sm:px-5">
          <p className="numeral text-[2.75rem] leading-none">{figures.workers}</p>
          <p className="mt-1 text-sm font-semibold">{t.workers}</p>
          <p className="text-sm text-paper-muted">{t.workersNote}</p>
        </div>
      </div>

      {/* El recuento: una celda por cada 500 frutos maduros; las vacías son lo que queda por contar. */}
      <div className="px-4 pb-1 pt-4 sm:px-5">
        <div className="grid grid-cols-[repeat(30,minmax(0,1fr))] gap-[2px]" aria-hidden>
          {Array.from({ length: row.ripeTotal }, (_, i) => (
            <span key={i} className={`aspect-square border border-ink/35 ${i < counted ? "bg-ink" : "bg-paper"}`} />
          ))}
        </div>
        <p className="mt-2 text-sm text-paper-muted">{t.tally}</p>
      </div>

      <div className="flex items-center gap-3 px-4 pb-3 pt-2 sm:px-5">
        <label className="flex flex-1 flex-col gap-1 text-sm font-semibold">
          {t.position}
          <input
            type="range"
            className="track"
            min={0}
            max={1000}
            value={Math.round(progress * 1000)}
            onChange={(event) => {
              stop();
              setSettled(true);
              setProgress(Number(event.target.value) / 1000);
            }}
            aria-valuetext={`${t.tramo} ${rowNumber} ${t.of} ${ROW.rows}`}
          />
        </label>
        <button
          type="button"
          onClick={play}
          className="mt-5 flex min-h-11 items-center gap-2 border-2 border-ink px-3 text-sm font-bold hover:bg-trap"
        >
          <RotateCcw size={15} aria-hidden />
          {t.replay}
        </button>
      </div>

      <ul className="flex flex-wrap gap-x-5 gap-y-2 border-t-[3px] border-ink px-4 py-3 text-sm sm:px-5">
        <li className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-full bg-fruit" aria-hidden />
          {t.legendRipe}
        </li>
        <li className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-full bg-fruit-unripe" aria-hidden />
          {t.legendUnripe}
        </li>
        <li>
          <button
            type="button"
            className="flex items-center gap-2 underline-offset-4 hover:underline"
            onMouseEnter={() => setHighlight("observed")}
            onMouseLeave={() => setHighlight(null)}
            onFocus={() => setHighlight("observed")}
            onBlur={() => setHighlight(null)}
          >
            <span className="h-3.5 w-3.5 bg-observed" aria-hidden />
            {t.legendObserved}
          </button>
        </li>
        <li>
          <button
            type="button"
            className="flex items-center gap-2 underline-offset-4 hover:underline"
            onMouseEnter={() => setHighlight("forecast")}
            onMouseLeave={() => setHighlight(null)}
            onFocus={() => setHighlight("forecast")}
            onBlur={() => setHighlight(null)}
          >
            <span className="h-3.5 w-3.5 bg-forecast" aria-hidden />
            {t.legendForecast}
          </button>
        </li>
      </ul>

      <p className="sr-only" aria-live="polite">
        {settled
          ? `${format.format(figures.fruits)} ${t.ripe}. ${format.format(figures.kg)} ${t.kg}. ${t.range
              .replace("{min}", format.format(figures.min))
              .replace("{max}", format.format(figures.max))}. ${figures.workers} ${t.workers}.`
          : ""}
      </p>
    </div>
  );
}
