"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { CategorySelect } from "./CategorySelect";
import { updateWord } from "@/lib/api-client";
import { LANGUAGES } from "@/lib/languages";
import type { Word, LanguageCode } from "@/types";

export function EditWordDialog({
  word,
  languageCode,
  onClose,
  onUpdated,
}: {
  word: Word | null;
  languageCode: LanguageCode;
  onClose: () => void;
  onUpdated: (word: Word) => void;
}) {
  return (
    <Modal open={!!word} onClose={onClose} wide>
      {word && (
        <EditWordFormBody
          key={word.id}
          word={word}
          languageCode={languageCode}
          onClose={onClose}
          onUpdated={onUpdated}
        />
      )}
    </Modal>
  );
}

function EditWordFormBody({
  word,
  languageCode,
  onClose,
  onUpdated,
}: {
  word: Word;
  languageCode: LanguageCode;
  onClose: () => void;
  onUpdated: (word: Word) => void;
}) {
  const lang = LANGUAGES[languageCode];
  const [nativeText, setNativeText] = useState(word.nativeText);
  const [englishGloss, setEnglishGloss] = useState(word.englishGloss);
  const [phonetic, setPhonetic] = useState(word.phonetic);
  const [usageNote, setUsageNote] = useState(word.usageNote ?? "");
  const [categories, setCategories] = useState(word.categories);
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
        categories,
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

      <Field label={lang.nativeFieldLabel}>
        <input
          className="native-text text-lg w-full rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40"
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
      <Field label="Categories">
        <CategorySelect value={categories} onChange={setCategories} />
      </Field>

      {nativeTextChanged && (
        <p className="text-xs text-amber-600">
          {lang.needsRomanization
            ? "Changing the native text will regenerate the romanization and re-synthesize the audio next time it's played."
            : "Changing the native text will re-synthesize the audio next time it's played."}
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
          disabled={saving || !nativeText.trim() || !englishGloss.trim() || categories.length === 0}
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
