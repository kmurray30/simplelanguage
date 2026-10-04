"use client";

import { useMemo, useState } from "react";
import { WordRow } from "./WordRow";
import { FilterChip } from "./FilterChip";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import type { Word, WordCategory } from "@/types";

type FilterValue = WordCategory | "all" | "starred";

function filterLabel(filter: FilterValue): string {
  return filter === "starred" ? "Starred" : categoryLabel(filter);
}

export function KnownWordsPanel({
  words,
  onOpenDetail,
  onToggleStar,
  onEdit,
  onDelete,
}: {
  words: Word[];
  onOpenDetail: (word: Word) => void;
  onToggleStar: (word: Word) => void;
  onEdit: (word: Word) => void;
  onDelete: (word: Word) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");

  const presentCategories = useMemo(() => {
    const present = new Set(words.flatMap((w) => w.categories));
    return CATEGORIES.filter((c) => present.has(c.value));
  }, [words]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = words.filter((w) => {
      if (filter === "starred" && !w.starred) return false;
      if (filter !== "all" && filter !== "starred" && !w.categories.includes(filter)) return false;
      if (!q) return true;
      return (
        w.nativeText.toLowerCase().includes(q) ||
        w.romanization.toLowerCase().includes(q) ||
        w.englishGloss.toLowerCase().includes(q)
      );
    });
    // Starred words sort to the top of whatever's currently filtered for, preserving the
    // existing relative order within each group (stable sort).
    return [...matches].sort((a, b) => Number(b.starred) - Number(a.starred));
  }, [words, query, filter]);

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

          <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1">
            <FilterChip label="All" active={filter === "all"} onClick={() => setFilter("all")} />
            {presentCategories.map((c) => (
              <FilterChip
                key={c.value}
                label={c.label}
                active={filter === c.value}
                onClick={() => setFilter(c.value)}
              />
            ))}
            <FilterChip
              label="Starred"
              active={filter === "starred"}
              onClick={() => setFilter("starred")}
            />
          </div>
        </>
      )}

      <div className="scroll-contained space-y-2 max-h-[300px] sm:max-h-[560px] pr-2 -mr-2">
        {filtered.map((word) => (
          <WordRow
            key={word.id}
            word={word}
            onOpenDetail={() => onOpenDetail(word)}
            onToggleStar={() => onToggleStar(word)}
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
            {query.trim()
              ? filter !== "all"
                ? `No words in "${filterLabel(filter)}" match "${query}".`
                : `No words match "${query}".`
              : filter === "starred"
                ? "You haven't starred any words yet."
                : `No words in "${filterLabel(filter)}" yet.`}
          </div>
        )}
      </div>
    </div>
  );
}
