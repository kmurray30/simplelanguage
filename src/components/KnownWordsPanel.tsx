"use client";

import { useMemo, useState } from "react";
import { WordRow } from "./WordRow";
import { FilterChip } from "./FilterChip";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import type { Word, WordCategory } from "@/types";

type View = "mine" | "starred" | "learned";

const VIEWS: { value: View; label: string }[] = [
  { value: "mine", label: "My words" },
  { value: "starred", label: "Starred" },
  { value: "learned", label: "Learned" },
];

const EMPTY_VIEW: Record<View, string> = {
  mine: "No words yet. Add your first one, or get suggestions below to get started.",
  starred: "You haven't starred any words yet.",
  learned: "Words you learn or practise in lessons show up here.",
};

// Learned = taught by a lesson, or one of your own words you've since practised in a lesson.
function inView(word: Word, view: View, lessonIds: ReadonlySet<string>): boolean {
  if (view === "starred") return word.starred;
  if (view === "learned") return word.source === "lesson" || lessonIds.has(word.id);
  return word.source === "added";
}

export function KnownWordsPanel({
  words,
  lessonWordIds,
  onOpenDetail,
  onToggleStar,
  onEdit,
  onDelete,
}: {
  words: Word[];
  lessonWordIds: string[];
  onOpenDetail: (word: Word) => void;
  onToggleStar: (word: Word) => void;
  onEdit: (word: Word) => void;
  onDelete: (word: Word) => void;
}) {
  const [query, setQuery] = useState("");
  // Top level: which words (the ones you added, starred ones, or ones a lesson taught you).
  // Underneath, the categories narrow whichever of those is showing.
  const [view, setView] = useState<View>("mine");
  const [category, setCategory] = useState<WordCategory | "all">("all");

  const viewWords = useMemo(() => {
    const lessonIds = new Set(lessonWordIds);
    return words.filter((w) => inView(w, view, lessonIds));
  }, [words, view, lessonWordIds]);

  const presentCategories = useMemo(() => {
    const present = new Set(viewWords.flatMap((w) => w.categories));
    return CATEGORIES.filter((c) => present.has(c.value));
  }, [viewWords]);

  // A category that has no words in the newly selected view would show an empty list; fall back to All.
  const activeCategory = category !== "all" && !presentCategories.some((c) => c.value === category) ? "all" : category;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = viewWords.filter((w) => {
      if (activeCategory !== "all" && !w.categories.includes(activeCategory)) return false;
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
  }, [viewWords, query, activeCategory]);

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

          <div className="flex rounded-full border border-border p-0.5 text-sm w-fit">
            {VIEWS.map((v) => (
              <button
                key={v.value}
                type="button"
                onClick={() => setView(v.value)}
                aria-pressed={view === v.value}
                className={
                  view === v.value
                    ? "px-3.5 py-1 rounded-full bg-accent text-accent-foreground"
                    : "px-3.5 py-1 rounded-full text-foreground-muted hover:text-foreground transition-colors"
                }
              >
                {v.label}
              </button>
            ))}
          </div>

          {presentCategories.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1">
              <FilterChip label="All" active={activeCategory === "all"} onClick={() => setCategory("all")} />
              {presentCategories.map((c) => (
                <FilterChip key={c.value} label={c.label} active={activeCategory === c.value} onClick={() => setCategory(c.value)} />
              ))}
            </div>
          )}
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
        {viewWords.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-foreground-muted">
            {EMPTY_VIEW[view]}
          </div>
        )}
        {viewWords.length > 0 && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-foreground-muted">
            {query.trim()
              ? `No words match "${query}"${activeCategory !== "all" ? ` in "${categoryLabel(activeCategory)}"` : ""}.`
              : `No words in "${categoryLabel(activeCategory as WordCategory)}" yet.`}
          </div>
        )}
      </div>
    </div>
  );
}
