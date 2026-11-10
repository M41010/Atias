/**
 * Logotipo de Atias, igual que en la web pública (sitio/src/components/Mark.tsx): la nave central
 * del símbolo, con su punto de medida, hace de A delante de «TIAS».
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`wordmark ${className}`} role="img" aria-label="Atias">
      <svg viewBox="15.5 19.5 17 13.5" fill="none" aria-hidden>
        <path d="M17 33A7 12 0 0 1 31 33" stroke="currentColor" strokeWidth={3} />
        <circle cx={24} cy={27.3} r={3.2} fill="var(--color-sprout)" />
      </svg>
      <span aria-hidden>tias</span>
    </span>
  );
}
