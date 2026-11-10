"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Content } from "@/i18n/content";
import type { Tour } from "@/tour/engine";

type Props = {
  t: Content["tour"];
  numberLocale: string;
  how: { label: string; href: string };
};

/** Dónde empieza cada paso dentro del avance del scroll (0 a 1). Los tres primeros, andando. */
const STEP_START = [0, 0.25, 0.5, 0.74, 0.87];
const stepAt = (progress: number) => STEP_START.reduce((found, start, index) => (progress >= start ? index : found), 0);

const REDUCED = "(prefers-reduced-motion: reduce)";
let webgl: boolean | undefined;

/** ¿Hay 3D? Solo con WebGL y sin movimiento reducido. Al generar la página, nunca. */
function canRun3d() {
  if (window.matchMedia(REDUCED).matches) return false;
  if (webgl === undefined) {
    try {
      const test = document.createElement("canvas");
      webgl = Boolean(test.getContext("webgl2") ?? test.getContext("webgl"));
    } catch {
      webgl = false;
    }
  }
  return webgl;
}

function subscribeMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Recorrido con scroll: al bajar, la cámara avanza por un invernadero 3D, marca los frutos maduros
 * y sube el contador; al lado aparece el texto de cada tramo. El texto está siempre en la página:
 * sin JavaScript, con movimiento reducido o sin WebGL se ve como una lista con una imagen fija.
 * El 3D (three.js) solo se descarga cuando la sección está a punto de verse.
 */
export function RowTour({ t, numberLocale, how }: Props) {
  const mode = useSyncExternalStore(subscribeMotion, canRun3d, () => false) ? "3d" : "static";
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [count, setCount] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (mode !== "3d" || !track.current) return;
    const node = track.current;
    let tour: Tour | null = null;
    let cancelled = false;
    let visible = false;

    const progress = () => {
      const rect = node.getBoundingClientRect();
      const run = rect.height - window.innerHeight;
      return run > 0 ? Math.min(1, Math.max(0, -rect.top / run)) : 0;
    };
    const update = () => {
      const p = progress();
      setStep(stepAt(p));
      if (visible) tour?.setProgress(p);
    };

    // Carga diferida: three.js se pide cuando la sección está a una pantalla de distancia.
    const loader = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || tour || cancelled) return;
        loader.disconnect();
        void import("@/tour/engine").then(({ createTour }) => {
          if (cancelled || !canvas.current || !overlay.current) return;
          const lite = window.matchMedia("(max-width: 767px)").matches || (navigator.hardwareConcurrency ?? 8) <= 4;
          tour = createTour({ canvas: canvas.current, overlay: overlay.current, lite, onCount: setCount });
          tour.setProgress(progress());
          setReady(true);
        });
      },
      { rootMargin: "100% 0px" },
    );
    loader.observe(node);

    // Solo se dibuja mientras la sección está en pantalla.
    const watcher = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) update();
    });
    watcher.observe(node);

    const onResize = () => tour?.resize();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", onResize);
    update();
    return () => {
      cancelled = true;
      loader.disconnect();
      watcher.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", onResize);
      tour?.dispose();
    };
  }, [mode]);

  const counted = new Intl.NumberFormat(numberLocale).format(count);
  const walking = step < 3;

  const header = (
    <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-20 sm:px-8 lg:pt-28">
      <p className="font-bold uppercase tracking-[0.08em] text-[var(--mark-accent)]">{t.eyebrow}</p>
      <h2 id="recorrido" className="display mt-4 max-w-[18ch] text-[clamp(2.5rem,5.4vw,4.75rem)]">
        {t.title}
      </h2>
      {mode === "3d" && <p className="mt-5 text-[1.0625rem]">{t.hint} ↓</p>}
    </div>
  );

  if (mode === "static") {
    return (
      <section className="on-ink border-b-[3px] border-ink bg-ink text-trap" aria-labelledby="recorrido">
        {header}
        <div className="mx-auto max-w-[1320px] px-4 pb-20 sm:px-8 lg:pb-28">
          <figure className="relative border-[3px] border-trap/40">
            {/* eslint-disable-next-line @next/next/no-img-element -- web estática sin optimizador de imágenes */}
            <img src="/tour/recorrido.jpg" alt="" width={1280} height={720} className="block h-auto w-full" />
            <figcaption className="absolute left-3 top-3 bg-paper px-2.5 py-1 text-sm font-bold text-ink">{t.tag}</figcaption>
          </figure>
          <ol className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
            {t.steps.map((item, index) => (
              <li key={item.label} className="border-t-[3px] border-trap/40 pt-5">
                <p className="text-sm font-bold uppercase tracking-[0.08em] text-[var(--mark-accent)]">
                  {String(index + 1).padStart(2, "0")} · {item.label}
                </p>
                <h3 className="display mt-3 text-[1.9rem]">{item.title}</h3>
                <p className="mt-3 max-w-[44ch]">{item.body}</p>
              </li>
            ))}
          </ol>
          <Link href={how.href} className="btn-primary mt-10">
            {how.label}
            <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="on-ink border-b-[3px] border-ink bg-ink text-trap" aria-labelledby="recorrido">
      {header}
      <div ref={track} className="relative h-[560vh]">
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          {/* Mientras carga el 3D se ve la imagen fija de la misma escena. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- web estática sin optimizador de imágenes */}
          <img src="/tour/recorrido.jpg" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
          <canvas
            ref={canvas}
            aria-hidden
            className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
          />
          <canvas ref={overlay} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />
          {/* Viñeta de lente y fundido inferior para que el texto se lea sobre la escena. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(15_43_32/0.45)_100%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-ink/85 to-transparent md:inset-y-0 md:left-0 md:right-auto md:h-auto md:w-[55%] md:bg-gradient-to-r"
          />

          <p className="absolute left-4 top-4 bg-paper px-2.5 py-1 text-sm font-bold text-ink sm:left-8 sm:top-6">{t.tag}</p>

          {/* Contador: frutos maduros que la cámara ya ha dejado atrás. */}
          <div
            className={`absolute right-4 top-4 border-[3px] border-trap/30 bg-ink/80 px-4 py-3 text-right backdrop-blur-sm transition-opacity duration-500 sm:right-8 sm:top-6 sm:px-5 ${
              walking ? "opacity-100" : "opacity-0"
            }`}
            aria-live="off"
          >
            <p className="text-sm font-bold">{t.steps[Math.min(step, 2)].label}</p>
            <p className="numeral text-[2.4rem] leading-none text-[var(--mark-accent)] sm:text-[3rem]">{counted}</p>
            <p className="text-sm">{t.counted}</p>
          </div>

          {/* El texto de cada tramo: todos en la página, solo se ve el del tramo actual. */}
          <ol className="absolute inset-x-4 bottom-20 sm:inset-x-8 md:bottom-auto md:left-8 md:right-auto md:top-1/2 md:w-[min(520px,42vw)] md:-translate-y-1/2 lg:left-[max(2rem,calc((100vw-1320px)/2+2rem))]">
            {t.steps.map((item, index) => (
              <li
                key={item.label}
                aria-current={index === step ? "step" : undefined}
                className={`transition-all duration-500 ${
                  index === step ? "relative opacity-100" : "pointer-events-none absolute inset-x-0 bottom-0 translate-y-4 opacity-0 md:bottom-auto md:top-0"
                }`}
              >
                <p className="text-sm font-bold uppercase tracking-[0.08em] text-[var(--mark-accent)]">
                  {String(index + 1).padStart(2, "0")} · {item.label}
                </p>
                <h3 className="display mt-3 text-[clamp(2rem,4.2vw,3.5rem)]">{item.title}</h3>
                <p className="mt-4 max-w-[40ch] text-[1.0625rem] sm:text-[1.15rem]">{item.body}</p>
                {index === t.steps.length - 1 && (
                  <Link href={how.href} className="btn-primary mt-6">
                    {how.label}
                    <ArrowRight size={18} aria-hidden />
                  </Link>
                )}
              </li>
            ))}
          </ol>

          {/* Avance por tramos. */}
          <ol aria-hidden className="absolute inset-x-4 bottom-6 flex gap-2 sm:inset-x-8">
            {t.steps.map((item, index) => (
              <li key={item.label} className={`h-[5px] flex-1 transition-colors duration-500 ${index <= step ? "bg-[var(--mark-accent)]" : "bg-trap/25"}`} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
