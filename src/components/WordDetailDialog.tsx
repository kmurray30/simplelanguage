"use client";

import { Modal } from "./Modal";
import { AudioButton } from "./AudioButton";
import { CategoryBadge } from "./CategoryBadge";
import type { Word } from "@/types";

export function WordDetailDialog({ word, onClose }: { word: Word | null; onClose: () => void }) {
  return (
    <Modal open={!!word} onClose={onClose} wide>
      {word && <WordDetailBody word={word} onClose={onClose} />}
    </Modal>
  );
}

function WordDetailBody({ word, onClose }: { word: Word; onClose: () => void }) {
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
        {word.breakdown ? (
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
