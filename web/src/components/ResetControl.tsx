"use client";

import { RotateCcw, Undo2 } from "lucide-react";

export function ResetControl({
  label,
  changed,
  canUndo,
  onReset,
  onUndo,
}: {
  label: string;
  changed: boolean;
  canUndo: boolean;
  onReset: () => void;
  onUndo: () => void;
}) {
  if (canUndo) {
    return (
      <button type="button" className="btn-secondary" onClick={onUndo}>
        <Undo2 size={15} aria-hidden />
        Deshacer
      </button>
    );
  }
  return (
    <button type="button" className="btn-secondary" onClick={onReset} disabled={!changed}>
      <RotateCcw size={15} aria-hidden />
      {label}
    </button>
  );
}
