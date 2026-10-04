"use client";

import { useMemo, useState } from "react";
import { WordRow } from "./WordRow";
import { FilterChip } from "./FilterChip";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import type { Word, WordCategory } from "@/types";

const PAGE_SIZE = 8;

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
  const [categoryFilter, setCategoryFilter] = useState<WordCategory | "all">("all");
  const [rawPage, setRawPage] = useState(0);

  const presentCategories = useMemo(() => {
    const present = new Set(words.flatMap((w) => w.categories));
    return CATEGORIES.filter((c) => present.has(c.value));
  }, [words]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return words.filter((w) => {
      if (categoryFilter !== "all" && !w.categories.includes(categoryFilter)) return false;
      if (!q) return true;
      return (
        w.nativeText.toLowerCase().includes(q) ||
        w.romanization.toLowerCase().includes(q) ||
        w.englishGloss.toLowerCase().includes(q)
      );
    });
  }, [words, query, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(rawPage, totalPages - 1);
  const pageItems = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
      {words.length > 0 && (
        <>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setRawPage(0);
            }}
            placeholder="Search your words…"
            className="w-full rounded-full border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          />

          {presentCategories.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1">
              <FilterChip
                label="All"
                active={categoryFilter === "all"}
                onClick={() => {
                  setCategoryFilter("all");
                  setRawPage(0);
                }}
              />
              {presentCategories.map((c) => (
                <FilterChip
                  key={c.value}
                  label={c.label}
                  active={categoryFilter === c.value}
                  onClick={() => {
                    setCategoryFilter(c.value);
                    setRawPage(0);
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      <div className="space-y-2">
        {pageItems.map((word) => (
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setRawPage(page - 1)}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-full text-xs border border-border text-foreground-muted disabled:opacity-40 hover:bg-surface-muted transition-colors"
          >
            ← Prev
          </button>
          <span className="text-xs text-foreground-muted">
            Page {page + 1} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setRawPage(page + 1)}
            disabled={page === totalPages - 1}
            className="px-3 py-1.5 rounded-full text-xs border border-border text-foreground-muted disabled:opacity-40 hover:bg-surface-muted transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
