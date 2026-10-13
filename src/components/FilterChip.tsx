"use client";

import { clsx } from "clsx";

export function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap",
        active
          ? "bg-accent text-accent-foreground border-accent"
          : "border-border text-foreground-muted hover:text-foreground hover:bg-surface-muted",
      )}
    >
      {label}
    </button>
  );
}
