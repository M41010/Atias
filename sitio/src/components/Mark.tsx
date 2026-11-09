/** Marca de conteo de cinco: cuatro palos y el quinto que los cruza. Es el símbolo de Atias. */
export function TallyMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="square"
      aria-hidden
      className={className}
    >
      <path d="M5 4v20M10.5 4v20M16 4v20M21.5 4v20" />
      <path d="M2 21L26 7" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <TallyMark size={26} />
      <span className="display text-[1.75rem] leading-none">Atias</span>
    </span>
  );
}
