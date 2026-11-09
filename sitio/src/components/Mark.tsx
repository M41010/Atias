/**
 * Símbolo de Atias: tres naves de un multitúnel sobre la línea de suelo, con una marca en cada pata
 * y el punto de medida en la nave central. Va solo (favicon, icono de app, sello).
 */
export function NaveMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 6.5 48 48" fill="none" aria-hidden className={className}>
      <path
        d="M3 33A7 12 0 0 1 17 33A7 12 0 0 1 31 33A7 12 0 0 1 45 33"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path d="M1.5 33H46.5M3 33v9M17 33v9M31 33v9M45 33v9" stroke="currentColor" strokeWidth={3} />
      <circle cx={24} cy={27.3} r={3.2} fill="var(--mark-accent)" />
    </svg>
  );
}

/**
 * Logotipo: la nave central del símbolo, sin modificar, hace de A delante de «TIAS».
 * El SVG mide lo mismo que la altura de las mayúsculas y se apoya en la línea base.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`wordmark ${className}`} role="img" aria-label="Atias">
      <svg viewBox="15.5 19.5 17 13.5" fill="none" aria-hidden>
        <path d="M17 33A7 12 0 0 1 31 33" stroke="currentColor" strokeWidth={3} />
        <circle cx={24} cy={27.3} r={3.2} fill="var(--mark-accent)" />
      </svg>
      <span aria-hidden>tias</span>
    </span>
  );
}
