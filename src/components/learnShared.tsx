"use client";

// Widgets shared by the Quiz and Lesson pages: pill toggles, the answer-mode switch for words, the
// mastery grid and the score history.

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { Modal } from "./Modal";
import { TeachContent } from "./QuizCards";
import { WordDetailDialog } from "./WordDetailDialog";
import { BAND_LABEL, bandOf, effectiveScore, type Band } from "@/lib/mastery";
import type { ItemStatDTO, RunDTO } from "@/lib/quizSelection";
import type { QuizDefinition, QuizItem } from "@/lib/quizTypes";
import { NATIVE_SCRIPT_NAME, ROMANIZATION_NAME, supportsRomanized, type AnswerMode, type QuizWord } from "@/lib/wordsQuiz";
import type { LanguageCode, Word } from "@/types";

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
  review: "border-accent/40 bg-accent-soft text-foreground",
  reviewed: "border-success/40 bg-success-soft text-foreground",
};

const POPOVER_WIDTH = 224;

type Popover = { itemId: string; left: number; top: number | null; bottom: number | null };

// A list word as the detail dialog wants it; the dialog fetches the rest (breakdown...) when it opens.
function wordSummary(w: QuizWord, languageCode: LanguageCode): Word {
  return {
    ...w,
    languageCode,
    phonetic: "",
    breakdown: null,
    starred: false,
    source: "added",
    hasAudio: true,
    createdAt: "",
    updatedAt: "",
  };
}

// Every item as a tile, colored by its current (decayed) proficiency. Tapping a tile opens a small
// popover (the item, its meaning, its proficiency) with a button for the full card.
export function MasteryGrid({ quiz, stats, words }: { quiz: QuizDefinition; stats: ItemStatDTO[]; words?: QuizWord[] }) {
  // One clock per mount, so the render stays pure.
  const [now] = useState(() => Date.now());
  const [popover, setPopover] = useState<Popover | null>(null);
  const [card, setCard] = useState<string | null>(null);
  const byId = new Map(stats.map((s) => [s.itemId, s]));

  useEffect(() => {
    if (!popover) return;
    const close = () => setPopover(null);
    function onPointerDown(e: PointerEvent) {
      if (!(e.target as Element).closest("[data-grid-popover], [data-grid-tile]")) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [popover]);

  function open(item: QuizItem, target: HTMLElement) {
    if (popover?.itemId === item.id) {
      setPopover(null);
      return;
    }
    const rect = target.getBoundingClientRect();
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - 8));
    const below = rect.bottom + 8 + 130 < window.innerHeight;
    setPopover({ itemId: item.id, left, top: below ? rect.bottom + 6 : null, bottom: below ? null : window.innerHeight - rect.top + 6 });
  }

  const popItem = popover ? quiz.itemById(popover.itemId) : undefined;
  const popStat = popItem ? byId.get(popItem.id) : undefined;
  const cardItem = card ? quiz.itemById(card) : undefined;
  const cardWord = card && quiz.deck === "words" ? words?.find((w) => w.id === card) : undefined;

  return (
    <div className="flex flex-col gap-3">
      {quiz.groups.map((group) => (
        <div key={group} className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-wide text-foreground-muted">{group}</span>
          <div className="flex flex-wrap gap-1.5">
            {quiz.items
              .filter((item) => item.group === group)
              .map((item) => {
                const band = bandOf(byId.get(item.id), now, quiz.deck === "words");
                return (
                  <button
                    type="button"
                    key={item.id}
                    data-grid-tile
                    onClick={(e) => open(item, e.currentTarget)}
                    aria-label={`${item.answer}: ${BAND_LABEL[band]}`}
                    aria-expanded={popover?.itemId === item.id}
                    className={clsx(
                      "native-text min-w-9 h-9 px-1.5 rounded-lg border flex items-center justify-center hover:brightness-95 transition",
                      quiz.answerSize === "word" ? "text-sm" : "text-lg",
                      BAND_STYLE[band],
                      popover?.itemId === item.id && "ring-2 ring-accent",
                    )}
                  >
                    {item.answer}
                  </button>
                );
              })}
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-foreground-muted">
        {(quiz.deck === "words" ? (["review", "reviewed"] as const) : (["new", "review", "reviewed"] as const)).map((band) => (
          <span key={band} className="flex items-center gap-1">
            <span className={clsx("w-3 h-3 rounded border", BAND_STYLE[band])} />
            {BAND_LABEL[band]}
          </span>
        ))}
      </div>

      {popover && popItem && (
        <div
          data-grid-popover
          role="dialog"
          aria-label={popItem.answer}
          style={{ position: "fixed", left: popover.left, top: popover.top ?? undefined, bottom: popover.bottom ?? undefined, width: POPOVER_WIDTH }}
          className="z-40 rounded-xl border border-border bg-surface shadow-lg p-3 flex flex-col gap-1.5 animate-fade-in-up"
        >
          <div className="flex items-baseline justify-between gap-3">
            <span className="native-text text-xl truncate">{popItem.answer}</span>
            <span className="text-xs tabular-nums text-foreground-muted shrink-0">
              {Math.round(effectiveScore(popStat, now))}/100
            </span>
          </div>
          <span className="text-sm text-foreground-muted truncate">
            {quiz.deck === "words" ? popItem.variants[0]?.text : popItem.code}
          </span>
          <button
            type="button"
            onClick={() => {
              setCard(popItem.id);
              setPopover(null);
            }}
            className="self-start mt-0.5 text-xs underline text-foreground-muted hover:text-foreground"
          >
            Full card
          </button>
        </div>
      )}

      {cardWord ? (
        <WordDetailDialog word={wordSummary(cardWord, quiz.languageCode)} onClose={() => setCard(null)} />
      ) : (
        <Modal open={!!cardItem} onClose={() => setCard(null)}>
          {cardItem && (
            <div className="p-6 flex flex-col items-center gap-3 text-center">
              <TeachContent quiz={quiz} pick={{ itemId: cardItem.id, variantIndex: 0 }} />
              <button
                type="button"
                onClick={() => setCard(null)}
                className="mt-1 px-4 py-2 rounded-full text-sm border border-border hover:bg-surface-muted transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </Modal>
      )}
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
