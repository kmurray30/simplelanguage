"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { CandidateCard } from "./CandidateCard";
import { translate, createWord } from "@/lib/api-client";
import type { Direction, TranslationCandidate, Word } from "@/types";
import { clsx } from "clsx";

type Step = "input" | "candidates" | "editing";

export function AddWordDialog({
  open,
  onClose,
  onCreated,
  prefill,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (word: Word) => void;
  prefill?: TranslationCandidate | null;
}) {
  return (
    <Modal open={open} onClose={onClose} wide>
      {open && (
        <AddWordFormBody
          key={prefill ? `${prefill.nativeText}::${prefill.englishGloss}` : "blank"}
          prefill={prefill ?? null}
          onClose={onClose}
          onCreated={onCreated}
        />
      )}
    </Modal>
  );
}

function AddWordFormBody({
  prefill,
  onClose,
  onCreated,
}: {
  prefill: TranslationCandidate | null;
  onClose: () => void;
  onCreated: (word: Word) => void;
}) {
  const [direction, setDirection] = useState<Direction>("en2zh");
  const [input, setInput] = useState("");
  const [step, setStep] = useState<Step>(prefill ? "editing" : "input");
  const [candidates, setCandidates] = useState<TranslationCandidate[]>([]);
  const [selected, setSelected] = useState<TranslationCandidate | null>(prefill);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmitInput(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const results = await translate(input.trim(), direction);
      setCandidates(results);
      setStep("candidates");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function selectCandidate(c: TranslationCandidate) {
    setSelected({ ...c });
    setStep("editing");
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
      });
      onCreated(word);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save this word");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Add a word</h2>
        {step !== "input" && (
          <button
            onClick={() => setStep(candidates.length ? "candidates" : "input")}
            className="text-xs text-foreground-muted hover:text-foreground"
          >
            &larr; Back
          </button>
        )}
      </div>

      {step === "input" && (
        <form onSubmit={handleSubmitInput} className="space-y-4">
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

          <textarea
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              direction === "en2zh"
                ? 'e.g. "thank you (silly and informal)"'
                : "e.g. 谢谢 or xièxie"
            }
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/40"
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2 rounded-full text-sm bg-accent text-accent-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {loading ? "Thinking…" : "Get suggestions"}
            </button>
          </div>
        </form>
      )}

      {step === "candidates" && (
        <div className="space-y-2.5">
          <p className="text-xs text-foreground-muted">
            Pick the translation that fits best — you can edit it before saving.
          </p>
          {candidates.map((c, i) => (
            <CandidateCard key={i} candidate={c} onSelect={() => selectCandidate(c)} />
          ))}
        </div>
      )}

      {step === "editing" && selected && (
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
          <p className="text-xs text-foreground-muted">
            Pinyin (<span className="italic">{selected.romanization || "—"}</span>) is computed
            automatically from the hanzi.
          </p>

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
