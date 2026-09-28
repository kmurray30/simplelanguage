"use client";

import { useEffect, useState } from "react";
import { fetchSuggestions } from "@/lib/api-client";
import type { SuggestionItem, Word } from "@/types";
import { ConfidenceBar } from "./CandidateCard";
import { Skeleton } from "./Skeleton";
import { clsx } from "clsx";

const CACHE_KEY = "simplelanguage:suggestions:zh";

function readCache(): SuggestionItem[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as SuggestionItem[]) : null;
  } catch {
    return null;
  }
}

function writeCache(items: SuggestionItem[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(items));
  } catch {
    // storage unavailable - suggestions just won't persist across visits
  }
}

export function SuggestionsPanel({
  words,
  onPick,
  onRemove,
}: {
  words: Word[];
  onPick: (item: SuggestionItem) => void;
  onRemove: (wordId: string) => void;
}) {
  // Starts null on both server and client (localStorage doesn't exist during SSR) - the cache
  // is read post-mount in the effect below, to avoid a hydration mismatch.
  const [items, setItems] = useState<SuggestionItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const results = await fetchSuggestions(6);
      setItems(results);
      writeCache(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load suggestions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const cached = readCache();
    if (cached && cached.length > 0) {
      // localStorage is browser-only and unavailable during SSR, so this can only run post-mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(cached);
    } else {
      load();
    }
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Words to learn next</h3>
          <p className="text-xs text-foreground-muted">Suggestions based on your current list</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-surface-muted transition-colors disabled:opacity-50"
        >
          {loading ? "Thinking…" : "Refresh"}
        </button>
      </div>

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
                  </div>
                  <div className="text-sm font-medium mt-0.5">{item.englishGloss}</div>
                  <p className="text-xs text-foreground-muted mt-1">{item.whyNext}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <ConfidenceBar value={item.confidence} />
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
        </div>
      )}
    </div>
  );
}
