"use client";

import { useEffect, useState } from "react";
import { fetchSuggestions } from "@/lib/api-client";
import type { CategoryCount, SuggestionItem, Word, WordCategory } from "@/types";
import { CategoryBadge } from "./CategoryBadge";
import { FilterChip } from "./FilterChip";
import { categoryLabel } from "@/lib/categories";
import { Skeleton } from "./Skeleton";
import { clsx } from "clsx";

const TOP_CATEGORY_COUNT = 6;

export function SuggestionsPanel({
  words,
  onPick,
  onRemove,
  onQuickAdd,
}: {
  words: Word[];
  onPick: (item: SuggestionItem) => void;
  onRemove: (wordId: string) => void;
  onQuickAdd: (text: string) => void;
}) {
  const [items, setItems] = useState<SuggestionItem[] | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<WordCategory | "all">("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickInput, setQuickInput] = useState("");

  async function load(category: WordCategory | "all") {
    setLoading(true);
    setError(null);
    try {
      const results = await fetchSuggestions(6, category);
      setItems(results.suggestions);
      setCategoryCounts(results.categoryCounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load suggestions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Runs on mount and whenever the category filter changes - a legitimate fetch-on-change,
    // not a synchronous render-loop setState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(categoryFilter);
  }, [categoryFilter]);

  function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    const text = quickInput.trim();
    if (!text) return;
    onQuickAdd(text);
    setQuickInput("");
  }

  const topCategories = categoryCounts.slice(0, TOP_CATEGORY_COUNT);
  const overflowCategories = categoryCounts.slice(TOP_CATEGORY_COUNT);
  const isOverflowSelected = overflowCategories.some((c) => c.category === categoryFilter);

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Words to learn next</h3>
          <p className="text-xs text-foreground-muted">Suggestions based on your current list</p>
        </div>
        <button
          onClick={() => load(categoryFilter)}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-surface-muted transition-colors disabled:opacity-50"
        >
          {loading ? "Thinking…" : "Refresh"}
        </button>
      </div>

      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <input
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
          placeholder="Type an English or Chinese word to add…"
          className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
        <button
          type="submit"
          disabled={!quickInput.trim()}
          className="shrink-0 px-4 py-2 rounded-full text-sm bg-accent text-accent-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          Add word
        </button>
      </form>

      {categoryCounts.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1">
          <FilterChip
            label="All"
            active={categoryFilter === "all"}
            onClick={() => setCategoryFilter("all")}
          />
          {topCategories.map((c) => (
            <FilterChip
              key={c.category}
              label={categoryLabel(c.category)}
              active={categoryFilter === c.category}
              onClick={() => setCategoryFilter(c.category)}
            />
          ))}
          {overflowCategories.length > 0 && (
            <select
              value={isOverflowSelected ? categoryFilter : ""}
              onChange={(e) => e.target.value && setCategoryFilter(e.target.value as WordCategory)}
              className={clsx(
                "shrink-0 text-xs px-2.5 py-1.5 rounded-full border transition-colors",
                isOverflowSelected
                  ? "bg-accent text-accent-foreground border-accent"
                  : "border-border text-foreground-muted bg-background",
              )}
            >
              <option value="">More…</option>
              {overflowCategories.map((c) => (
                <option key={c.category} value={c.category}>
                  {categoryLabel(c.category)} ({c.count})
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading && !items && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-3 space-y-2">
              <div className="flex items-baseline gap-2">
                <Skeleton className="h-5 w-14" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      )}

      {items && (
        <div className="space-y-2">
          {items.map((item, i) => {
            const addedWord = words.find((w) => w.nativeText === item.nativeText);
            return (
              <div
                key={i}
                className={clsx(
                  "rounded-xl border p-3 flex items-start justify-between gap-3 transition-colors",
                  addedWord ? "border-accent bg-accent-soft" : "border-border",
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="hanzi text-lg">{item.nativeText}</span>
                    <span className="text-sm text-foreground-muted">{item.romanization}</span>
                    <CategoryBadge category={item.category} />
                  </div>
                  <div className="text-sm font-medium mt-0.5">{item.englishGloss}</div>
                  <p className="text-xs text-foreground-muted mt-1">{item.whyNext}</p>
                </div>
                <div className="shrink-0">
                  {addedWord ? (
                    <button
                      onClick={() => onRemove(addedWord.id)}
                      className="text-xs px-3 py-1 rounded-full border border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={() => onPick(item)}
                      className="text-xs px-3 py-1 rounded-full bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {items.length === 0 && !loading && (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-foreground-muted">
              {categoryFilter !== "all"
                ? `You've learned all our suggested words in "${categoryLabel(categoryFilter)}".`
                : "You've learned all our suggested words! Nice work."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
