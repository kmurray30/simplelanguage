"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchSuggestions, searchSuggestions } from "@/lib/api-client";
import { LANGUAGES } from "@/lib/languages";
import type {
  CategoryCount,
  SuggestionItem,
  Word,
  WordCategory,
  WordDraft,
  LanguageCode,
} from "@/types";
import { SuggestionCard } from "./SuggestionCard";
import { FilterChip } from "./FilterChip";
import { categoryLabel } from "@/lib/categories";
import { Skeleton } from "./Skeleton";
import { clsx } from "clsx";

const TOP_CATEGORY_COUNT = 6;
const SEARCH_DEBOUNCE_MS = 350;

export function SuggestionsPanel({
  words,
  languageCode,
  onPick,
  onRemove,
  onQuickAdd,
}: {
  words: Word[];
  languageCode: LanguageCode;
  onPick: (item: WordDraft) => void;
  onRemove: (wordId: string) => void;
  onQuickAdd: (text: string) => void;
}) {
  const lang = LANGUAGES[languageCode];
  const [items, setItems] = useState<SuggestionItem[] | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<WordCategory | "all">("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [quickInput, setQuickInput] = useState("");
  const [searchResults, setSearchResults] = useState<SuggestionItem[] | null>(null);
  const [searching, setSearching] = useState(false);
  const searchRequestId = useRef(0);

  const load = useCallback(
    async (category: WordCategory | "all") => {
      setLoading(true);
      setError(null);
      try {
        const results = await fetchSuggestions(languageCode, 6, category);
        setItems(results.suggestions);
        setCategoryCounts(results.categoryCounts);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't load suggestions");
      } finally {
        setLoading(false);
      }
    },
    [languageCode],
  );

  useEffect(() => {
    // Runs on mount and whenever the category filter changes - a legitimate fetch-on-change,
    // not a synchronous render-loop setState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(categoryFilter);
  }, [categoryFilter, load]);

  useEffect(() => {
    const q = quickInput.trim();
    if (!q) {
      // Synchronizing search state to the (now-empty) input, not a render-loop setState.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchResults(null);
      setSearching(false);
      return;
    }
    const requestId = ++searchRequestId.current;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchSuggestions(languageCode, q);
        if (requestId === searchRequestId.current) setSearchResults(results);
      } catch {
        if (requestId === searchRequestId.current) setSearchResults([]);
      } finally {
        if (requestId === searchRequestId.current) setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [quickInput, languageCode]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = quickInput.trim();
    if (!text) return;
    onQuickAdd(text);
    setQuickInput("");
  }

  const topCategories = categoryCounts.slice(0, TOP_CATEGORY_COUNT);
  const overflowCategories = categoryCounts.slice(TOP_CATEGORY_COUNT);
  const isOverflowSelected = overflowCategories.some((c) => c.category === categoryFilter);
  const isSearching = quickInput.trim().length > 0;

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
      <div>
        <h3 className="text-sm font-medium">Words to learn next</h3>
        <p className="text-xs text-foreground-muted">Suggestions based on your current list</p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
          placeholder={`Search or type an English or ${lang.name} word to add…`}
          className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
        <button
          type="submit"
          disabled={!quickInput.trim()}
          className="shrink-0 px-4 py-2 rounded-full text-sm bg-accent text-accent-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          Find translations
        </button>
      </form>

      {isSearching ? (
        <div className="space-y-2">
          {searching && !searchResults && (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border p-3 space-y-2">
                  <div className="flex items-baseline gap-2">
                    <Skeleton className="h-5 w-14" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>
          )}
          {searchResults &&
            searchResults.map((item) => {
              const addedWord = words.find((w) => w.nativeText === item.nativeText);
              return (
                <SuggestionCard
                  key={item.poolId}
                  nativeText={item.nativeText}
                  romanization={item.romanization}
                  englishGloss={item.englishGloss}
                  category={item.category}
                  whyNext={item.whyNext}
                  audioSrc={`/api/suggestions/${item.poolId}/audio`}
                  added={!!addedWord}
                  onAdd={() => onPick(item)}
                  onRemove={() => addedWord && onRemove(addedWord.id)}
                />
              );
            })}
          {searchResults && searchResults.length === 0 && !searching && (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-foreground-muted">
              No matches for &ldquo;{quickInput.trim()}&rdquo;.
            </div>
          )}
        </div>
      ) : (
        <>
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
              {items.map((item) => {
                const addedWord = words.find((w) => w.nativeText === item.nativeText);
                return (
                  <SuggestionCard
                    key={item.poolId}
                    nativeText={item.nativeText}
                    romanization={item.romanization}
                    englishGloss={item.englishGloss}
                    category={item.category}
                    whyNext={item.whyNext}
                    audioSrc={`/api/suggestions/${item.poolId}/audio`}
                    added={!!addedWord}
                    onAdd={() => onPick(item)}
                    onRemove={() => addedWord && onRemove(addedWord.id)}
                  />
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
        </>
      )}
    </div>
  );
}
