"use client";

import { useId, useState } from "react";

/** Campo de texto que guarda al salir, para no interrumpir la escritura. */
export function TextField({ label, value, onCommit }: { label: string; value: string; onCommit: (value: string) => void }) {
  const id = useId();
  return (
    <>
      <label className="sr-only" htmlFor={id}>{label}</label>
      <input
        key={value}
        id={id}
        className="input w-full min-w-44"
        defaultValue={value}
        onBlur={(event) => {
          const next = event.target.value.trim();
          if (next && next !== value) onCommit(next);
          else event.target.value = value;
        }}
      />
    </>
  );
}

/**
 * Campo numérico que deja escribir libremente, incluido borrar todo, y solo guarda
 * valores válidos. Un valor inválido se señala y no altera los cálculos.
 */
export function NumberField({
  label,
  value,
  min,
  max,
  unit,
  hideLabel,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  hideLabel?: boolean;
  onCommit: (value: number) => void;
}) {
  const id = useId();
  const [text, setText] = useState(String(value));
  const [lastValue, setLastValue] = useState(value);
  // Si el valor cambia desde fuera (por ejemplo, al restablecer), el campo lo refleja.
  if (value !== lastValue) {
    setLastValue(value);
    if (Number(text.replace(",", ".")) !== value) setText(String(value));
  }

  const parsed = Number(text.replace(",", "."));
  const valid = text.trim() !== "" && Number.isFinite(parsed) && parsed >= min && parsed <= max;

  return (
    <div>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "mb-1 block text-sm font-medium"}>{label}</label>
      <div className="flex items-center justify-end gap-2">
        <input
          id={id}
          inputMode="decimal"
          value={text}
          aria-invalid={!valid}
          aria-describedby={valid ? undefined : `${id}-error`}
          onChange={(event) => {
            setText(event.target.value);
            const next = Number(event.target.value.replace(",", "."));
            if (event.target.value.trim() !== "" && next >= min && next <= max) onCommit(next);
          }}
          onBlur={() => {
            if (!valid) setText(String(value));
          }}
          className={`input w-24 text-right tabular-nums ${valid ? "" : "border-bad-ink!"}`}
        />
        {unit && <span className="text-sm text-muted">{unit}</span>}
      </div>
      {!valid && (
        <p id={`${id}-error`} className="mt-1 text-right text-xs text-bad-ink">
          Entre {min} y {max}. Se mantiene {value}.
        </p>
      )}
    </div>
  );
}
