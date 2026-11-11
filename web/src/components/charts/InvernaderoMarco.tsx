"use client";

/**
 * Piezas comunes a los gráficos de la ficha del invernadero: medir el ancho para dibujar a tamaño
 * real (el texto no encoge en el móvil), la etiqueta flotante y la leyenda.
 */

import { type ReactNode, useLayoutEffect, useState } from "react";

/**
 * Ancho disponible del contenedor, en píxeles. Empieza en `initial` hasta medirse. Es una referencia
 * de función: el contenedor puede aparecer más tarde (al llegar los datos) y se mide entonces.
 */
export function useMeasuredWidth<T extends HTMLElement>(initial = 640): [(node: T | null) => void, number] {
  const [node, setNode] = useState<T | null>(null);
  const [width, setWidth] = useState(initial);
  useLayoutEffect(() => {
    if (!node) return;
    const update = () => setWidth(Math.max(240, Math.round(node.getBoundingClientRect().width)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);
  return [setNode, width];
}

export type TipState = { x: number; y: number; content: ReactNode } | null;

/**
 * Etiqueta flotante: se abre al pasar el cursor o al llegar con el teclado. Solo amplía lo que ya está
 * en la tabla de debajo, así que se oculta al lector de pantalla.
 */
export function useTip() {
  const [tip, setTip] = useState<TipState>(null);
  const place = (target: Element, content: ReactNode, clientX?: number) => {
    // El marco es el contenedor del gráfico, marcado con data-tip-frame.
    const box = target.closest("[data-tip-frame]")?.getBoundingClientRect();
    const mark = target.getBoundingClientRect();
    if (!box) return;
    const x = (clientX ?? mark.left + mark.width / 2) - box.left;
    setTip({ x, y: mark.top - box.top, content });
  };
  const bind = (content: ReactNode) => ({
    onPointerEnter: (e: React.PointerEvent<Element>) => place(e.currentTarget, content),
    onFocus: (e: React.FocusEvent<Element>) => place(e.currentTarget, content),
    onPointerLeave: () => setTip(null),
    onBlur: () => setTip(null),
  });
  return { tip, bind, clear: () => setTip(null) };
}

export function Tip({ tip, width }: { tip: TipState; width: number }) {
  if (!tip) return null;
  // Se mantiene dentro del gráfico aunque la marca esté en un borde.
  const left = Math.min(Math.max(tip.x, 90), Math.max(90, width - 90));
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-10 w-max max-w-[220px] -translate-x-1/2 -translate-y-full rounded-md border border-line bg-surface px-3 py-2 text-xs shadow-[0_4px_12px_rgb(20_30_24/0.12)]"
      style={{ left, top: tip.y - 8 }}
    >
      {tip.content}
    </div>
  );
}

/** Fila de la etiqueta: el valor manda y el nombre acompaña, con su marca de color. */
export function TipRow({ color, label, value, shape = "line" }: { color?: string; label: string; value: string; shape?: "line" | "none" }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-muted">
        {color && shape === "line" && <span className="inline-block h-0.5 w-3 rounded-full" style={{ background: color }} />}
        {label}
      </span>
      <span className="font-semibold tabular-nums text-ink">{value}</span>
    </div>
  );
}

/** Las marcas de serie son las de toda la app (series.tsx). */
export { Marker } from "./series";

export type LegendItem ={ key: string; label: string; swatch: ReactNode };

export function Legend({ items }: { items: LegendItem[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted" aria-hidden>
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-1.5">
          <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden className="shrink-0 overflow-visible">
            {item.swatch}
          </svg>
          {item.label}
        </li>
      ))}
    </ul>
  );
}
