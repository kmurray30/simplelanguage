"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { updateWord } from "@/lib/api-client";
import type { Word } from "@/types";

export function EditWordDialog({
  word,
  onClose,
  onUpdated,
}: {
  word: Word | null;
  onClose: () => void;
  onUpdated: (word: Word) => void;
}) {
  return (
    <Modal open={!!word} onClose={onClose} wide>
      {word && (
        <EditWordFormBody key={word.id} word={word} onClose={onClose} onUpdated={onUpdated} />
      )}
    </Modal>
  );
}

function EditWordFormBody({
  word,
  onClose,
  onUpdated,
}: {
  word: Word;
  onClose: () => void;
  onUpdated: (word: Word) => void;
}) {
  const [nativeText, setNativeText] = useState(word.nativeText);
  const [englishGloss, setEnglishGloss] = useState(word.englishGloss);
  const [phonetic, setPhonetic] = useState(word.phonetic);
  const [usageNote, setUsageNote] = useState(word.usageNote ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nativeTextChanged = nativeText !== word.nativeText;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateWord(word.id, {
        nativeText,
        englishGloss,
        phonetic,
        usageNote: usageNote || null,
      });
      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save changes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-3">
      <h2 className="text-lg font-medium">Edit word</h2>

      <Field label="Chinese (hanzi)">
        <input
          className="hanzi text-lg w-full rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40"
          value={nativeText}
          onChange={(e) => setNativeText(e.target.value)}
        />
      </Field>
      <Field label="English translation">
        <input
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          value={englishGloss}
          onChange={(e) => setEnglishGloss(e.target.value)}
        />
      </Field>
      <Field label="Phonetic pronunciation">
        <input
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          value={phonetic}
          onChange={(e) => setPhonetic(e.target.value)}
        />
      </Field>
      <Field label="Usage note">
        <textarea
          rows={2}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/40"
          value={usageNote}
          onChange={(e) => setUsageNote(e.target.value)}
        />
      </Field>

      {nativeTextChanged && (
        <p className="text-xs text-amber-600">
          Changing the hanzi will regenerate the pinyin and re-synthesize the audio next time
          it&apos;s played.
        </p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-full text-sm border border-border hover:bg-surface-muted transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !nativeText.trim() || !englishGloss.trim()}
          className="px-4 py-2 rounded-full text-sm bg-accent text-accent-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
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
