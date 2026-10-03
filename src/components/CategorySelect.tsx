"use client";

import { CATEGORIES } from "@/lib/categories";
import type { WordCategory } from "@/types";

export function CategorySelect({
  value,
  onChange,
  className,
}: {
  value: WordCategory;
  onChange: (value: WordCategory) => void;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as WordCategory)}
      className={
        className ??
        "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
      }
    >
      {CATEGORIES.map((c) => (
        <option key={c.value} value={c.value}>
          {c.label}
        </option>
      ))}
    </select>
  );
}
