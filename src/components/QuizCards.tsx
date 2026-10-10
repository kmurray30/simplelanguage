"use client";

// The pieces of a quiz card, shared by the Quiz and Lesson pages so both look and behave the same:
// the question (front), the verdict (back) and a lesson's teach card.

import { type FormEvent, type ReactNode, type RefObject } from "react";
import { clsx } from "clsx";
import { AudioButton } from "./AudioButton";
import { Emphasis } from "./Emphasis";
import { QuizKeypad, hasKeypad } from "./QuizKeypad";
import type { QuizDefinition, QuizItem } from "@/lib/quizTypes";
import type { Pick } from "@/lib/quizSelection";

export type Revealed = { correct: boolean; given: string; message: string | null; note?: string | null };

export const verdictColors = (correct: boolean | undefined) =>
  correct ? "border-success/50 bg-success-soft" : "border-danger/50 bg-danger-soft";

function AnswerBlock({ quiz, item }: { quiz: QuizDefinition; item: QuizItem }) {
  const audio = quiz.audioSrc(item);
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={clsx("native-text leading-tight text-center", quiz.answerSize === "word" ? "text-5xl" : "text-7xl")}>
        {item.answer}
      </span>
      {quiz.answerLabel(item) && <span className="native-text text-sm text-foreground-muted">{quiz.answerLabel(item)}</span>}
      {audio && <AudioButton key={audio} src={audio} size="sm" />}
    </div>
  );
}

function ItemNote({ item, variantIndex }: { item: QuizItem; variantIndex: number }) {
  const variant = item.variants[variantIndex];
  if (!item.note && !variant?.note) return null;
  return (
    <p className="text-sm text-foreground-muted text-left">
      <span className="font-medium text-foreground">{item.group}: </span>
      {item.note}
      {variant?.note && <> {variant.note}</>}
    </p>
  );
}

function CueLine({ quiz, item, variantIndex }: { quiz: QuizDefinition; item: QuizItem; variantIndex: number }) {
  const variant = item.variants[variantIndex];
  if (!variant) return null;
  return (
    <p className="text-sm text-foreground-muted">
      <Emphasis text={variant.text} highlight /> · {quiz.variantCode(item, variantIndex)}
      {variant.context && (
        <>
          {" "}
          · in <span className="native-text text-foreground">{variant.context.full}</span> ({variant.context.gloss})
        </>
      )}
    </p>
  );
}

// The back of a card: ✓/✗, the right answer, what was typed, and why.
export function VerdictContent({ quiz, pick, entry }: { quiz: QuizDefinition; pick: Pick; entry: Revealed }) {
  const item = quiz.itemById(pick.itemId);
  if (!item) return null;
  return (
    <>
      <div className="flex items-center gap-2" aria-live="polite">
        <span
          className={clsx(
            "w-9 h-9 rounded-full flex items-center justify-center text-xl font-semibold text-white",
            entry.correct ? "bg-success" : "bg-danger",
          )}
          aria-hidden
        >
          {entry.correct ? "✓" : "✗"}
        </span>
        <span className="text-lg font-medium">{entry.correct ? "Correct" : "Not quite"}</span>
      </div>

      <AnswerBlock quiz={quiz} item={item} />

      {!entry.correct && (
        <p className="text-sm">
          You wrote <span className="native-text text-xl align-middle">{entry.given || "nothing"}</span>
        </p>
      )}

      <CueLine quiz={quiz} item={item} variantIndex={pick.variantIndex} />

      {entry.message && (
        <p className="text-sm rounded-xl border border-danger/30 bg-surface/60 px-3 py-2 text-left">{entry.message}</p>
      )}
      {entry.correct && entry.note && (
        <p className="text-sm rounded-xl border border-success/30 bg-surface/60 px-3 py-2 text-left">{entry.note}</p>
      )}

      <ItemNote item={item} variantIndex={pick.variantIndex} />
    </>
  );
}

// A lesson's first look at a new item: the answer side, before it's ever asked.
export function TeachContent({ quiz, pick }: { quiz: QuizDefinition; pick: Pick }) {
  const item = quiz.itemById(pick.itemId);
  if (!item) return null;
  return (
    <>
      <span className="text-[11px] uppercase tracking-wide text-foreground-muted">New</span>
      <CueLine quiz={quiz} item={item} variantIndex={pick.variantIndex} />
      <AnswerBlock quiz={quiz} item={item} />
      <ItemNote item={item} variantIndex={pick.variantIndex} />
    </>
  );
}

// The front of a card: the prompt, the cue and the answer box (plus the on-screen keypad).
export function QuestionForm({
  quiz,
  pick,
  input,
  onInput,
  invalid,
  onSubmit,
  keypadOpen,
  onToggleKeypad,
  inputRef,
  inert,
  className,
}: {
  quiz: QuizDefinition;
  pick: Pick;
  input: string;
  onInput: (value: string) => void;
  invalid: string | null;
  onSubmit: (e: FormEvent) => void;
  keypadOpen: boolean;
  onToggleKeypad: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
  inert?: boolean;
  className?: string;
}): ReactNode {
  const item = quiz.itemById(pick.itemId);
  const variant = item?.variants[pick.variantIndex];
  if (!item || !variant) return null;
  const keypad = hasKeypad(quiz.deck);
  const isWord = quiz.answerSize === "word";
  return (
    <form
      onSubmit={onSubmit}
      inert={inert}
      className={clsx("rounded-3xl border border-border bg-surface shadow-sm p-6 flex flex-col items-center gap-4", className)}
    >
      <p className="text-sm text-foreground-muted text-center">{variant.prompt ?? quiz.defaultPrompt}</p>
      <div className="flex flex-col items-center gap-2 py-2">
        <span className={clsx("font-normal text-foreground-muted text-center", isWord ? "text-3xl text-foreground" : "text-4xl")}>
          <Emphasis text={variant.text} highlight />
        </span>
        <span className="text-lg font-mono px-3 py-0.5 rounded-full bg-accent-soft">{quiz.variantCode(item, pick.variantIndex)}</span>
        {variant.context && (
          <span className="text-sm text-foreground-muted text-center">
            {quiz.contextLabel} <span className="native-text text-lg text-foreground">{variant.context.blank}</span>{" "}
            ({variant.context.gloss})
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => onInput(e.target.value)}
        lang={quiz.inputLang}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label="Your answer"
        aria-invalid={invalid !== null}
        placeholder={quiz.placeholder}
        className={clsx(
          "native-text text-center rounded-xl border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40",
          isWord ? "w-full max-w-xs text-2xl" : "w-28 text-4xl",
        )}
      />
      <p className="text-xs text-danger min-h-4 text-center" role="alert">
        {invalid}
      </p>
      <div className="flex items-center gap-3">
        {keypad && (
          <button
            type="button"
            onClick={onToggleKeypad}
            aria-expanded={keypadOpen}
            className="px-3 py-2 rounded-full text-sm border border-border hover:bg-surface-muted transition-colors"
          >
            {keypadOpen ? "Hide keypad" : "Keypad"}
          </button>
        )}
        <button type="submit" className="px-5 py-2 rounded-full text-sm bg-accent text-accent-foreground hover:opacity-90 transition-opacity">
          Check
        </button>
      </div>
      {keypad && keypadOpen && <QuizKeypad deck={quiz.deck} value={input} onChange={onInput} />}
    </form>
  );
}
