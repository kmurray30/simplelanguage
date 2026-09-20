"use client";

import { AudioButton } from "./AudioButton";
import type { Word } from "@/types";

export function WordRow({
  word,
  onEdit,
  onDelete,
}: {
  word: Word;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 hover:border-accent/40 transition-colors">
      <AudioButton wordId={word.id} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="hanzi text-xl">{word.nativeText}</span>
          <span className="text-sm text-foreground-muted">{word.romanization}</span>
          <span className="text-xs italic text-foreground-muted">&ldquo;{word.phonetic}&rdquo;</span>
        </div>
        <div className="text-sm mt-0.5">{word.englishGloss}</div>
        {word.usageNote && (
          <p className="text-xs text-foreground-muted mt-1 line-clamp-1">{word.usageNote}</p>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="text-xs px-2.5 py-1.5 rounded-full text-foreground-muted hover:bg-surface-muted hover:text-foreground transition-colors"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="text-xs px-2.5 py-1.5 rounded-full text-foreground-muted hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
