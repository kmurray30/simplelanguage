"use client";

import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { AudioButton } from "./AudioButton";
import { CategoryBadge } from "./CategoryBadge";
import { fetchWord } from "@/lib/api-client";
import type { Word } from "@/types";

export function WordDetailDialog({ word, onClose }: { word: Word | null; onClose: () => void }) {
  return (
    <Modal open={!!word} onClose={onClose} wide>
      {word && <WordDetailBody key={word.id} summary={word} onClose={onClose} />}
    </Modal>
  );
}

// The list never carries "breakdown" (it's often a long LLM-generated paragraph, excluded from
// the initial page load to keep it small) - fetch the full word fresh on open instead, which
// also picks up a breakdown that finished generating in the background since the list loaded.
function WordDetailBody({ summary, onClose }: { summary: Word; onClose: () => void }) {
  const [full, setFull] = useState<Word | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchWord(summary.id)
      .then((w) => {
        if (!cancelled) setFull(w);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [summary.id]);

  const word = full ?? summary;

  return (
    <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="native-text text-2xl">{word.nativeText}</span>
            {word.romanization && (
              <span className="text-base text-foreground-muted">{word.romanization}</span>
            )}
          </div>
          <span className="text-xs italic text-foreground-muted">
            &ldquo;{word.phonetic}&rdquo;
          </span>
        </div>
        <AudioButton src={`/api/words/${word.id}/audio`} size="md" />
      </div>

      <div className="text-lg font-medium">{word.englishGloss}</div>

      {word.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <CategoryBadge categories={word.categories} />
        </div>
      )}

      {word.usageNote && (
        <div>
          <h3 className="text-xs font-medium text-foreground-muted mb-1">Usage</h3>
          <p className="text-sm leading-relaxed">{word.usageNote}</p>
        </div>
      )}

      <div>
        <h3 className="text-xs font-medium text-foreground-muted mb-1">Breakdown</h3>
        {!full ? (
          <p className="text-sm text-foreground-muted italic">Loading…</p>
        ) : word.breakdown ? (
          <p className="text-sm leading-relaxed whitespace-pre-line">{word.breakdown}</p>
        ) : (
          <p className="text-sm text-foreground-muted italic">
            Still generating — check back in a moment.
          </p>
        )}
      </div>

      <div className="flex justify-end pt-1">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-full text-sm border border-border hover:bg-surface-muted transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
