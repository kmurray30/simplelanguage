"use client";

import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { CandidateCard } from "./CandidateCard";
import { CategorySelect } from "./CategorySelect";
import { SkeletonCandidateCard } from "./Skeleton";
import { translate, createWord } from "@/lib/api-client";
import type { Direction, TranslationCandidate, Word, WordDraft } from "@/types";
import { clsx } from "clsx";

const CJK_PATTERN = /[一-鿿]/;

export function AddWordDialog({
  open,
  onClose,
  onCreated,
  prefill,
  initialInput,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (word: Word) => void;
  prefill?: WordDraft | null;
  initialInput?: string | null;
}) {
  return (
    <Modal open={open} onClose={onClose} wide>
      {open && (
        <AddWordFormBody
          key={
            prefill
              ? `${prefill.nativeText}::${prefill.englishGloss}`
              : initialInput
                ? `input::${initialInput}`
                : "blank"
          }
          prefill={prefill ?? null}
          initialInput={initialInput ?? null}
          onClose={onClose}
          onCreated={onCreated}
        />
      )}
    </Modal>
  );
}

type Step = "search" | "confirm";

function AddWordFormBody({
  prefill,
  initialInput,
  onClose,
  onCreated,
}: {
  prefill: WordDraft | null;
  initialInput: string | null;
  onClose: () => void;
  onCreated: (word: Word) => void;
}) {
  const [step, setStep] = useState<Step>(prefill ? "confirm" : "search");
  const [direction, setDirection] = useState<Direction>(
    initialInput && CJK_PATTERN.test(initialInput) ? "zh2en" : "en2zh",
  );
  const [input, setInput] = useState(initialInput ?? "");
  const [candidates, setCandidates] = useState<TranslationCandidate[]>([]);
  const [selected, setSelected] = useState<WordDraft | null>(prefill);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runTranslate(text: string, dir: Direction) {
    setLoading(true);
    setError(null);
    try {
      const results = await translate(text, dir);
      setCandidates(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }

  // Auto-runs the search once on mount when opened from the quick-add row, as though the user
  // had already typed the text and hit Suggest.
  useEffect(() => {
    if (initialInput && !prefill) {
      // Mirrors the user submitting the search form on mount - a legitimate one-time
      // fetch-on-open, not a synchronous render-loop setState.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void runTranslate(initialInput, direction);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmitInput(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    await runTranslate(input.trim(), direction);
  }

  function selectCandidate(c: TranslationCandidate) {
    setSelected({ ...c });
    setError(null);
    setStep("confirm");
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const word = await createWord({
        nativeText: selected.nativeText,
        englishGloss: selected.englishGloss,
        phonetic: selected.phonetic,
        usageNote: selected.usageNote,
        category: selected.category,
      });
      onCreated(word);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save this word");
    } finally {
      setSaving(false);
    }
  }

  if (step === "confirm" && selected) {
    return (
      <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Confirm this word</h2>
          <button
            onClick={() => setStep("search")}
            className="text-xs text-foreground-muted hover:text-foreground"
          >
            &larr; Back to suggestions
          </button>
        </div>

        <div className="space-y-3">
          <Field label="Chinese (hanzi)">
            <input
              className="hanzi text-lg w-full rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40"
              value={selected.nativeText}
              onChange={(e) => setSelected({ ...selected, nativeText: e.target.value })}
            />
          </Field>
          <Field label="English translation">
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              value={selected.englishGloss}
              onChange={(e) => setSelected({ ...selected, englishGloss: e.target.value })}
            />
          </Field>
          <Field label="Phonetic pronunciation (English-friendly)">
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              value={selected.phonetic}
              onChange={(e) => setSelected({ ...selected, phonetic: e.target.value })}
            />
          </Field>
          <Field label="Usage note">
            <textarea
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/40"
              value={selected.usageNote}
              onChange={(e) => setSelected({ ...selected, usageNote: e.target.value })}
            />
          </Field>
          <Field label="Category">
            <CategorySelect
              value={selected.category}
              onChange={(category) => setSelected({ ...selected, category })}
            />
          </Field>
          <p className="text-xs text-foreground-muted">
            Pinyin (<span className="italic">{selected.romanization || "—"}</span>) is computed
            automatically from the hanzi.
          </p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end pt-1">
          <button
            onClick={handleSave}
            disabled={saving || !selected.nativeText.trim() || !selected.englishGloss.trim()}
            className="px-4 py-2 rounded-full text-sm bg-accent text-accent-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {saving ? "Adding…" : "Add to my list"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
      <h2 className="text-lg font-medium">Add a word</h2>

      <form onSubmit={handleSubmitInput} className="space-y-3">
        <div className="flex rounded-full border border-border p-0.5 w-fit text-sm">
          {(["en2zh", "zh2en"] as Direction[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDirection(d)}
              className={clsx(
                "px-3 py-1.5 rounded-full transition-colors",
                direction === d
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground-muted hover:text-foreground",
              )}
            >
              {d === "en2zh" ? "English → 中文" : "中文 → English"}
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-start">
          <textarea
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              direction === "en2zh"
                ? 'e.g. "thank you (silly and informal)"'
                : "e.g. 谢谢 or xièxie"
            }
            rows={2}
            className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="shrink-0 px-4 py-2.5 rounded-full text-sm bg-accent text-accent-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {loading ? "Thinking…" : "Suggest"}
          </button>
        </div>
      </form>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {(loading || candidates.length > 0) && (
        <div className="space-y-2.5">
          {!loading && (
            <p className="text-xs text-foreground-muted">
              Pick the translation that fits best — you can edit it on the next screen.
            </p>
          )}
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonCandidateCard key={i} />)
            : candidates.map((c, i) => (
                <CandidateCard key={i} candidate={c} onSelect={() => selectCandidate(c)} />
              ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-foreground-muted">{label}</span>
      {children}
    </label>
  );
}
