"use client";

import { CATEGORIES } from "@/lib/categories";
import { FilterChip } from "./FilterChip";
import type { WordCategory } from "@/types";

// A word can belong to more than one category (e.g. "hello" is both GREETINGS and BASICS), so
// this is a toggle-chip multi-select rather than a single dropdown - clicking a chip adds or
// removes it from the selected set.
export function CategorySelect({
  value,
  onChange,
}: {
  value: WordCategory[];
  onChange: (value: WordCategory[]) => void;
}) {
  function toggle(category: WordCategory) {
    if (value.includes(category)) {
      onChange(value.filter((c) => c !== category));
    } else {
      onChange([...value, category]);
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {CATEGORIES.map((c) => (
        <FilterChip
          key={c.value}
          label={c.label}
          active={value.includes(c.value)}
          onClick={() => toggle(c.value)}
        />
      ))}
    </div>
  );
}
