"use client";

import { useMemo, useState } from "react";
import { WordRow } from "./WordRow";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import type { Word } from "@/types";
import { clsx } from "clsx";

export function KnownWordsPanel({
  words,
  onEdit,
  onDelete,
}: {
  words: Word[];
  onEdit: (word: Word) => void;
  onDelete: (word: Word) => void;
}) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");

  const presentCategories = useMemo(() => {
    const present = new Set(words.map((w) => w.category));
    return CATEGORIES.filter((c) => present.has(c.value));
  }, [words]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return words.filter((w) => {
      if (categoryFilter !== "all" && w.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        w.nativeText.includes(q) ||
        w.romanization.toLowerCase().includes(q) ||
        w.englishGloss.toLowerCase().includes(q)
      );
    });
  }, [words, query, categoryFilter]);

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
      {words.length > 0 && (
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your words…"
            className="w-full rounded-full border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          />

          {presentCategories.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1">
              <FilterChip
                label="All"
                active={categoryFilter === "all"}
                onClick={() => setCategoryFilter("all")}
              />
              {presentCategories.map((c) => (
                <FilterChip
                  key={c.value}
                  label={c.label}
                  active={categoryFilter === c.value}
                  onClick={() => setCategoryFilter(c.value)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-0.5">
        {filtered.map((word) => (
          <WordRow
            key={word.id}
            word={word}
            onEdit={() => onEdit(word)}
            onDelete={() => onDelete(word)}
          />
        ))}
        {words.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-foreground-muted">
            No words yet. Add your first one, or get suggestions below to get started.
          </div>
        )}
        {words.length > 0 && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-foreground-muted">
            {categoryFilter !== "all"
              ? `No words in "${categoryLabel(categoryFilter)}" match your search.`
              : `No words match "${query}".`}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({
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
