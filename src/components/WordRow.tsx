"use client";

import { AudioButton } from "./AudioButton";
import { CategoryBadge } from "./CategoryBadge";
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
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 hover:border-accent/40 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="native-text text-xl">{word.nativeText}</span>
          {word.romanization && (
            <span className="text-sm text-foreground-muted">{word.romanization}</span>
          )}
          <span className="text-xs italic text-foreground-muted">&ldquo;{word.phonetic}&rdquo;</span>
          <CategoryBadge categories={word.categories} />
        </div>
        <div className="text-sm mt-0.5">{word.englishGloss}</div>
        {word.usageNote && (
          <p className="text-xs text-foreground-muted mt-1 line-clamp-1">{word.usageNote}</p>
        )}
      </div>
      <div className="flex flex-col items-center gap-1 shrink-0">
        <AudioButton src={`/api/words/${word.id}/audio`} size="md" />
        <IconButton onClick={onEdit} title="Edit">
          <PencilIcon className="h-4 w-4" />
        </IconButton>
        <IconButton onClick={onDelete} title="Delete" danger>
          <TrashIcon className="h-4 w-4" />
        </IconButton>
      </div>
    </div>
  );
}

function IconButton({
  onClick,
  title,
  danger,
  children,
}: {
  onClick: () => void;
  title: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={
        danger
          ? "h-7 w-7 shrink-0 inline-flex items-center justify-center rounded-full border border-border text-foreground-muted hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-colors"
          : "h-7 w-7 shrink-0 inline-flex items-center justify-center rounded-full border border-border text-foreground-muted hover:bg-surface-muted hover:text-foreground transition-colors"
      }
    >
      {children}
    </button>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M15.5 4.5l4 4L8 20H4v-4L15.5 4.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M7 7l1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
