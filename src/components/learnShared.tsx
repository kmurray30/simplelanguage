"use client";

// Widgets shared by the Quiz and Lesson pages: pill toggles, the answer-mode switch for words, the
// mastery grid and the score history.

import { useState } from "react";
import { clsx } from "clsx";
import { BAND_LABEL, bandOf, effectiveScore, type Band } from "@/lib/mastery";
import type { ItemStatDTO, RunDTO } from "@/lib/quizSelection";
import type { QuizDefinition } from "@/lib/quizTypes";
import { NATIVE_SCRIPT_NAME, ROMANIZATION_NAME, supportsRomanized, type AnswerMode } from "@/lib/wordsQuiz";
import type { LanguageCode } from "@/types";

export function PillToggle<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex rounded-full border border-border p-0.5 text-xs w-fit">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={clsx(
            "px-3 py-1 rounded-full transition-colors",
            value === o.value ? "bg-accent text-accent-foreground" : "text-foreground-muted hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Words in Chinese, Japanese and Korean can be answered in the native script or romanization.
// The choice is kept in the URL (?answer=) so it survives a reload.
export function AnswerModeToggle({
  languageCode,
  value,
  onChange,
}: {
  languageCode: LanguageCode;
  value: AnswerMode;
  onChange: (value: AnswerMode) => void;
}) {
  if (!supportsRomanized(languageCode)) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wide text-foreground-muted">Answer in</span>
      <PillToggle
        options={[
          { value: "native" as AnswerMode, label: NATIVE_SCRIPT_NAME[languageCode] },
          { value: "romanized" as AnswerMode, label: ROMANIZATION_NAME[languageCode]! },
        ]}
        value={value}
        onChange={(next) => {
          const url = new URL(window.location.href);
          url.searchParams.set("answer", next);
          window.history.replaceState(null, "", url.toString());
          onChange(next);
        }}
      />
    </div>
  );
}

export const BAND_STYLE: Record<Band, string> = {
  new: "border-border bg-surface text-foreground-muted",
  weak: "border-danger/40 bg-danger-soft text-foreground",
  learning: "border-accent/40 bg-accent-soft text-foreground",
  strong: "border-success/40 bg-success-soft text-foreground",
};

// Every item as a tile, colored by its current (decayed) mastery score.
export function MasteryGrid({ quiz, stats }: { quiz: QuizDefinition; stats: ItemStatDTO[] }) {
  // One clock per mount, so the render stays pure.
  const [now] = useState(() => Date.now());
  const byId = new Map(stats.map((s) => [s.itemId, s]));
  return (
    <div className="flex flex-col gap-3">
      {quiz.groups.map((group) => (
        <div key={group} className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-wide text-foreground-muted">{group}</span>
          <div className="flex flex-wrap gap-1.5">
            {quiz.items
              .filter((item) => item.group === group)
              .map((item) => {
                const stat = byId.get(item.id);
                const band = bandOf(stat, now);
                return (
                  <span
                    key={item.id}
                    title={`${item.answer} · ${
                      stat?.scoreAt ? `score ${Math.round(effectiveScore(stat, now))}, ${stat.correctCount}/${stat.seen} right` : "not learned yet"
                    }`}
                    className={clsx(
                      "native-text min-w-9 h-9 px-1.5 rounded-lg border flex items-center justify-center",
                      quiz.answerSize === "word" ? "text-sm" : "text-lg",
                      BAND_STYLE[band],
                    )}
                  >
                    {item.answer}
                  </span>
                );
              })}
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-foreground-muted">
        {(["new", "weak", "learning", "strong"] as const).map((band) => (
          <span key={band} className="flex items-center gap-1">
            <span className={clsx("w-3 h-3 rounded border", BAND_STYLE[band])} />
            {BAND_LABEL[band]}
          </span>
        ))}
      </div>
      <p className="text-[11px] text-foreground-muted">
        Scores rise with right answers - most for getting it first try - and fade over time, so review keeps them up.
      </p>
    </div>
  );
}

const RUN_COLOR: Record<RunDTO["mode"], string> = {
  full: "bg-accent",
  smart: "bg-accent/50",
  lesson: "bg-success/70",
};

// Oldest to newest, left to right.
export function ScoreHistory({ runs }: { runs: RunDTO[] }) {
  if (runs.length === 0) {
    return <p className="text-sm text-foreground-muted">No scores yet - finish a quiz or lesson and it shows up here.</p>;
  }
  const shown = runs.slice(0, 12).reverse();
  const best = Math.max(...runs.map((r) => Math.round((r.correct / r.total) * 100)));
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-1.5 h-20" role="img" aria-label={`Your last ${shown.length} scores`}>
        {shown.map((run) => {
          const pct = Math.round((run.correct / run.total) * 100);
          return (
            <div
              key={run.id}
              className="flex-none w-9 flex flex-col items-center justify-end gap-0.5 h-full"
              title={`${run.createdAt.slice(0, 10)} · ${run.mode === "lesson" ? "lesson" : `${run.mode} quiz`} · ${run.correct}/${run.total}`}
            >
              <span className="text-[10px] text-foreground-muted tabular-nums">{pct}</span>
              <div className={clsx("w-full rounded-t", RUN_COLOR[run.mode])} style={{ height: `${Math.max(pct, 4) * 0.6}%` }} />
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-foreground-muted">
        % right first try, oldest to newest · dark: quiz · light: smart quiz · green: lesson · best {best}%
      </p>
    </div>
  );
}
