"use client";

import { useState } from "react";
import { KnownWordsPanel } from "./KnownWordsPanel";
import { AddWordDialog } from "./AddWordDialog";
import { EditWordDialog } from "./EditWordDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { SuggestionsPanel } from "./SuggestionsPanel";
import { deleteWord } from "@/lib/api-client";
import type { SuggestionItem, TranslationCandidate, Word } from "@/types";

type AddSeed = { prefill: TranslationCandidate | null; initialInput: string | null };
const BLANK_SEED: AddSeed = { prefill: null, initialInput: null };

export function WordListView({ initialWords }: { initialWords: Word[] }) {
  const [words, setWords] = useState<Word[]>(initialWords);
  const [addOpen, setAddOpen] = useState(false);
  const [addSeed, setAddSeed] = useState<AddSeed>(BLANK_SEED);
  const [quickInput, setQuickInput] = useState("");
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [deletingWord, setDeletingWord] = useState<Word | null>(null);

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

  function openBlank() {
    setAddSeed(BLANK_SEED);
    setAddOpen(true);
  }

  function handlePickSuggestion(item: SuggestionItem) {
    setAddSeed({ prefill: item, initialInput: null });
    setAddOpen(true);
  }

  function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    const text = quickInput.trim();
    if (!text) return;
    setAddSeed({ prefill: null, initialInput: text });
    setAddOpen(true);
    setQuickInput("");
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
          onClick={openBlank}
          className="px-4 py-2 rounded-full text-sm bg-accent text-accent-foreground hover:opacity-90 transition-opacity shrink-0"
        >
          + Add word
        </button>
      </div>

      <KnownWordsPanel
        words={words}
        onEdit={(word) => setEditingWord(word)}
        onDelete={(word) => setDeletingWord(word)}
      />

      <form
        onSubmit={handleQuickAdd}
        className="rounded-2xl border border-border bg-surface p-3 flex gap-2"
      >
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

      <SuggestionsPanel
        words={words}
        onPick={handlePickSuggestion}
        onRemove={(id) => {
          const word = words.find((w) => w.id === id);
          if (word) handleDelete(word);
        }}
      />

      <AddWordDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={handleCreated}
        prefill={addSeed.prefill}
        initialInput={addSeed.initialInput}
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
