"use client";

import { AudioButton } from "./AudioButton";
import { CategoryBadge } from "./CategoryBadge";
import type { WordCategory } from "@/types";
import { clsx } from "clsx";

export function SuggestionCard({
  nativeText,
  romanization,
  englishGloss,
  category,
  whyNext,
  audioSrc,
  added,
  onAdd,
  onRemove,
}: {
  nativeText: string;
  romanization: string;
  englishGloss: string;
  category: WordCategory;
  whyNext: string | null;
  audioSrc: string | (() => Promise<string>);
  added: boolean;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border p-3 flex items-start gap-3 transition-colors",
        added ? "border-accent bg-accent-soft" : "border-border",
      )}
    >
      <AudioButton src={audioSrc} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="native-text text-lg">{nativeText}</span>
          {romanization && <span className="text-sm text-foreground-muted">{romanization}</span>}
          <CategoryBadge category={category} />
        </div>
        <div className="text-sm font-medium mt-0.5">{englishGloss}</div>
        {whyNext && <p className="text-xs text-foreground-muted mt-1">{whyNext}</p>}
      </div>
      <div className="shrink-0">
        {added ? (
          <button
            onClick={onRemove}
            className="text-xs px-3 py-1 rounded-full border border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Remove
          </button>
        ) : (
          <button
            onClick={onAdd}
            className="text-xs px-3 py-1 rounded-full bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
          >
            Add
          </button>
        )}
      </div>
    </div>
  );
}
