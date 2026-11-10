"use client";

import { type ReactNode, useEffect, useRef } from "react";

/**
 * Hace aparecer su contenido cuando entra en pantalla al bajar. Solo cambia la opacidad y la
 * posición: el texto está en la página desde el principio (buscadores, lectores de pantalla y
 * navegadores sin JavaScript lo ven entero). Con movimiento reducido no se anima.
 */
export function Reveal({
  children,
  className = "",
  as: Tag = "div",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li";
  delay?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.dataset.reveal = "waiting";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.dataset.reveal = "shown";
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={(node: HTMLElement | null) => {
        ref.current = node;
      }}
      className={`reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
