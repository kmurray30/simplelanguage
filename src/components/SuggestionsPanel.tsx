"use client";

import { useState } from "react";
import { fetchSuggestions } from "@/lib/api-client";
import type { SuggestionItem } from "@/types";
import { ConfidenceBar } from "./CandidateCard";

export function SuggestionsPanel({
  onPick,
}: {
  onPick: (item: SuggestionItem) => void;
}) {
  const [items, setItems] = useState<SuggestionItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const results = await fetchSuggestions(6);
      setItems(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load suggestions");
    } finally {
      setLoading(false);
    }
  }

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
          {loading ? "Thinking…" : items ? "Refresh" : "Suggest words"}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {items && (
        <div className="space-y-2">
          {items.map((item, i) => {
            const isAdded = added.has(item.nativeText);
            return (
              <div
                key={i}
                className="rounded-xl border border-border p-3 flex items-start justify-between gap-3"
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
                  <button
                    onClick={() => {
                      onPick(item);
                      setAdded((prev) => new Set(prev).add(item.nativeText));
                    }}
                    disabled={isAdded}
                    className="text-xs px-3 py-1 rounded-full bg-accent text-accent-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
                  >
                    {isAdded ? "Added" : "Add"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
