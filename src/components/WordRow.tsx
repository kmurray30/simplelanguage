"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { AudioButton } from "./AudioButton";
import type { Word } from "@/types";

export function WordRow({
  word,
  onOpenDetail,
  onToggleStar,
  onEdit,
  onDelete,
}: {
  word: Word;
  onOpenDetail: () => void;
  onToggleStar: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenDetail}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDetail();
        }
      }}
      className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2 hover:border-accent/40 transition-colors cursor-pointer"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="native-text text-xl">{word.nativeText}</span>
          {word.romanization && (
            <span className="text-sm text-foreground-muted">{word.romanization}</span>
          )}
          <span className="text-xs italic text-foreground-muted">&ldquo;{word.phonetic}&rdquo;</span>
        </div>
        <div className="text-sm">{word.englishGloss}</div>
        {word.usageNote && (
          <p className="text-xs text-foreground-muted mt-0.5 line-clamp-1">{word.usageNote}</p>
        )}
      </div>
      <div className="flex flex-col items-center gap-1 shrink-0">
        <AudioButton src={`/api/words/${word.id}/audio`} size="sm" />
        <StarButton starred={word.starred} onClick={onToggleStar} />
        <MoreMenu onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
}

function StarButton({ starred, onClick }: { starred: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={starred ? "Unstar" : "Star"}
      aria-label={starred ? "Unstar" : "Star"}
      className={clsx(
        "h-6 w-6 shrink-0 inline-flex items-center justify-center rounded-full border transition-colors",
        starred
          ? "border-accent text-accent bg-accent-soft"
          : "border-border text-foreground-muted hover:bg-surface-muted hover:text-foreground",
      )}
    >
      <StarIcon filled={starred} className="h-3.5 w-3.5" />
    </button>
  );
}

function MoreMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!open && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen((o) => !o);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        title="More"
        aria-label="More"
        className="h-6 w-6 shrink-0 inline-flex items-center justify-center rounded-full border border-border text-foreground-muted hover:bg-surface-muted hover:text-foreground transition-colors"
      >
        <MoreIcon className="h-3.5 w-3.5" />
      </button>
      {open && coords && (
        <div
          style={{ position: "fixed", top: coords.top, right: coords.right }}
          className="z-50 min-w-[110px] rounded-lg border border-border bg-surface shadow-lg py-1"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onEdit();
            }}
            className="w-full text-left px-3 py-1.5 text-sm hover:bg-surface-muted transition-colors"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDelete();
            }}
            className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} className={className}>
      <path
        d="M12 3.5l2.59 5.25 5.79.84-4.19 4.08.99 5.77L12 16.9l-5.18 2.54.99-5.77-4.19-4.08 5.79-.84L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}
