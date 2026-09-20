"use client";

import type { TranslationCandidate } from "@/types";
import { clsx } from "clsx";

export function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-1.5 shrink-0" title={`${pct}% confidence`}>
      <div className="w-14 h-1.5 rounded-full bg-surface-muted overflow-hidden">
        <div
          className="h-full bg-accent rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] tabular-nums text-foreground-muted">{pct}%</span>
    </div>
  );
}

export function CandidateCard({
  candidate,
  extra,
  selected,
  onSelect,
}: {
  candidate: TranslationCandidate;
  extra?: React.ReactNode;
  selected?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        "w-full text-left rounded-xl border p-3.5 transition-colors",
        selected
          ? "border-accent bg-accent-soft"
          : "border-border hover:border-accent/50 hover:bg-surface-muted",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="hanzi text-xl">{candidate.nativeText}</span>
            <span className="text-sm text-foreground-muted">{candidate.romanization}</span>
            <span className="text-xs italic text-foreground-muted">
              &ldquo;{candidate.phonetic}&rdquo;
            </span>
          </div>
          <div className="mt-1 text-sm font-medium">{candidate.englishGloss}</div>
          <p className="mt-1 text-xs text-foreground-muted leading-relaxed">
            {candidate.usageNote}
          </p>
          {extra}
        </div>
        <ConfidenceBar value={candidate.confidence} />
      </div>
    </button>
  );
}
