"use client";

import { useMemo, useState } from "react";
import { WordRow } from "./WordRow";
import { AddWordDialog } from "./AddWordDialog";
import { EditWordDialog } from "./EditWordDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { SuggestionsPanel } from "./SuggestionsPanel";
import { deleteWord } from "@/lib/api-client";
import type { SuggestionItem, TranslationCandidate, Word } from "@/types";

export function WordListView({ initialWords }: { initialWords: Word[] }) {
  const [words, setWords] = useState<Word[]>(initialWords);
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addPrefill, setAddPrefill] = useState<TranslationCandidate | null>(null);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [deletingWord, setDeletingWord] = useState<Word | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return words;
    return words.filter(
      (w) =>
        w.nativeText.includes(q) ||
        w.romanization.toLowerCase().includes(q) ||
        w.englishGloss.toLowerCase().includes(q),
    );
  }, [words, query]);

  function handleCreated(word: Word) {
    setWords((prev) => [word, ...prev]);
  }

  function handleUpdated(word: Word) {
    setWords((prev) => prev.map((w) => (w.id === word.id ? word : w)));
  }

  async function handleDelete(word: Word) {
    setWords((prev) => prev.filter((w) => w.id !== word.id));
    await deleteWord(word.id).catch(() => {
      setWords((prev) => [word, ...prev]);
    });
  }

  function handlePickSuggestion(item: SuggestionItem) {
    setAddPrefill(item);
    setAddOpen(true);
  }

  return (
    <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium">Your words</h1>
          <p className="text-sm text-foreground-muted">
            {words.length} word{words.length === 1 ? "" : "s"} learned
          </p>
        </div>
        <button
          onClick={() => {
            setAddPrefill(null);
            setAddOpen(true);
          }}
          className="px-4 py-2 rounded-full text-sm bg-accent text-accent-foreground hover:opacity-90 transition-opacity shrink-0"
        >
          + Add word
        </button>
      </div>

      {words.length > 0 && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your words…"
          className="w-full rounded-full border border-border bg-surface px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      )}

      <div className="space-y-2">
        {filtered.map((word) => (
          <WordRow
            key={word.id}
            word={word}
            onEdit={() => setEditingWord(word)}
            onDelete={() => setDeletingWord(word)}
          />
        ))}
        {words.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-foreground-muted">
            No words yet. Add your first one, or get suggestions below to get started.
          </div>
        )}
        {words.length > 0 && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-foreground-muted">
            No words match &ldquo;{query}&rdquo;.
          </div>
        )}
      </div>

      <SuggestionsPanel onPick={handlePickSuggestion} />

      <AddWordDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={handleCreated}
        prefill={addPrefill}
      />
      <EditWordDialog word={editingWord} onClose={() => setEditingWord(null)} onUpdated={handleUpdated} />
      <ConfirmDialog
        open={!!deletingWord}
        title="Delete this word?"
        description={
          deletingWord
            ? `"${deletingWord.nativeText}" (${deletingWord.englishGloss}) will be removed from your list.`
            : ""
        }
        confirmLabel="Delete"
        danger
        onConfirm={() => deletingWord && handleDelete(deletingWord)}
        onClose={() => setDeletingWord(null)}
      />
    </div>
  );
}
