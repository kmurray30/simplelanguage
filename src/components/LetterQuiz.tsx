"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { clsx } from "clsx";
import { Emphasis } from "./Emphasis";
import { QuizKeypad } from "./QuizKeypad";
import { getQuiz } from "@/lib/quizzes";
import type { QuizType } from "@/lib/decks";
import type { QuizDefinition } from "@/lib/quizTypes";
import {
  countSkippable,
  isMastered,
  pickQuestions,
  type ItemStatDTO,
  type Pick,
  type QuizMode,
  type RunDTO,
} from "@/lib/quizSelection";
import type { LanguageCode } from "@/types";

type Phase = "setup" | "asking" | "revealed" | "results";

type GivenAnswer = { itemId: string; variantIndex: number; given: string; correct: boolean };

type Revealed = { correct: boolean; given: string; message: string | null };

type SaveState = "idle" | "saving" | "saved" | "error";

function lengthOptions(total: number): { label: string; count: number }[] {
  return [
    { label: "10", count: 10 },
    { label: "20", count: 20 },
    { label: `All ${total}`, count: Infinity },
  ];
}

function PillToggle<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex rounded-full border border-border p-0.5 text-xs">
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

function statusOf(stat: ItemStatDTO | undefined): "new" | "struggling" | "learning" | "mastered" {
  if (!stat) return "new";
  if (isMastered(stat)) return "mastered";
  return stat.correctStreak === 0 ? "struggling" : "learning";
}

const STATUS_STYLE: Record<ReturnType<typeof statusOf>, string> = {
  new: "border-border bg-surface text-foreground-muted",
  struggling: "border-danger/40 bg-danger-soft text-foreground",
  learning: "border-accent/40 bg-accent-soft text-foreground",
  mastered: "border-success/40 bg-success-soft text-foreground",
};

function MasteryGrid({ quiz, stats }: { quiz: QuizDefinition; stats: ItemStatDTO[] }) {
  const byId = new Map(stats.map((s) => [s.itemId, s]));
  return (
    <div className="flex flex-col gap-3">
      {quiz.groups.map((group) => (
        <div key={group} className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-wide text-foreground-muted">{group}</span>
          <div className="flex flex-wrap gap-1.5">
            {quiz.items.filter((item) => item.group === group).map((item) => {
              const stat = byId.get(item.id);
              const status = statusOf(stat);
              return (
                <span
                  key={item.id}
                  title={`${item.answer} · ${group.toLowerCase()} · ${
                    stat ? `${stat.correctCount}/${stat.seen} correct, streak ${stat.correctStreak}` : "not asked yet"
                  }`}
                  className={clsx(
                    "native-text min-w-9 h-9 px-1 rounded-lg border flex items-center justify-center text-lg",
                    STATUS_STYLE[status],
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
        {(["new", "struggling", "learning", "mastered"] as const).map((status) => (
          <span key={status} className="flex items-center gap-1">
            <span className={clsx("w-3 h-3 rounded border", STATUS_STYLE[status])} />
            {{ new: "not asked yet", struggling: "missed last time", learning: "1 in a row", mastered: "2+ in a row" }[status]}
          </span>
        ))}
      </div>
    </div>
  );
}

// Oldest to newest, left to right.
function ScoreHistory({ runs }: { runs: RunDTO[] }) {
  if (runs.length === 0) {
    return <p className="text-sm text-foreground-muted">No scores yet - finish a quiz and it shows up here.</p>;
  }
  const shown = runs.slice(0, 12).reverse();
  const best = Math.max(...runs.map((r) => Math.round((r.correct / r.total) * 100)));
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-1.5 h-20" role="img" aria-label={`Your last ${shown.length} quiz scores`}>
        {shown.map((run) => {
          const pct = Math.round((run.correct / run.total) * 100);
          return (
            <div
              key={run.id}
              className="flex-none w-9 flex flex-col items-center justify-end gap-0.5 h-full"
              title={`${run.createdAt.slice(0, 10)} · ${run.mode} quiz · ${run.correct}/${run.total}`}
            >
              <span className="text-[10px] text-foreground-muted tabular-nums">{pct}</span>
              <div
                className={clsx("w-full rounded-t", run.mode === "smart" ? "bg-accent/50" : "bg-accent")}
                style={{ height: `${Math.max(pct, 4) * 0.6}%` }}
              />
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-foreground-muted">
        % correct, oldest to newest · dark bars full quizzes, light bars smart quizzes · best {best}%
      </p>
    </div>
  );
}

export function LetterQuiz({
  deck,
  languageCode,
  initialStats,
  initialRuns,
}: {
  deck: QuizType;
  languageCode: LanguageCode;
  initialStats: ItemStatDTO[];
  initialRuns: RunDTO[];
}) {
  // The page only renders this for a deck that has a quiz, so this lookup always succeeds.
  const quiz = getQuiz(deck)!;
  const LENGTHS = lengthOptions(quiz.items.length);
  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<QuizMode>("full");
  const [count, setCount] = useState(20);
  const [stats, setStats] = useState(initialStats);
  const [runs, setRuns] = useState(initialRuns);

  const [questions, setQuestions] = useState<Pick[]>([]);
  const [quizNote, setQuizNote] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [invalid, setInvalid] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Revealed | null>(null);
  const [answers, setAnswers] = useState<GivenAnswer[]>([]);
  const [keypadOpen, setKeypadOpen] = useState(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [finishedMode, setFinishedMode] = useState<QuizMode>("full");
  // Index of an already-answered card being looked at again (read-only), or null for the live question.
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  // Move focus to whatever the user does next: the answer box (only where a physical keyboard is
  // likely, so a phone's keyboard doesn't cover the keypad) or the Next button after answering.
  useEffect(() => {
    if (reviewIndex !== null) nextRef.current?.focus();
    else if (phase === "revealed") nextRef.current?.focus();
    else if (phase === "asking" && window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus();
  }, [phase, index, reviewIndex]);

  const pick = questions[index];
  const item = pick ? quiz.itemById(pick.itemId) : undefined;
  const variant = item && pick ? item.variants[pick.variantIndex] : undefined;

  function start(nextMode: QuizMode) {
    const selection = pickQuestions({ mode: nextMode, items: quiz.items, stats, count });
    setQuestions(selection.picks);
    const summary = selection.summary;
    setQuizNote(
      !summary
        ? null
        : summary.struggling > 0 && summary.toppedUp > 0
          ? `Focusing on ${summary.struggling} letter${summary.struggling === 1 ? "" : "s"} you've been missing, plus a quick review of the rest.`
          : summary.toppedUp > 0
            ? "You've mastered most letters, so this one is mostly quick review."
            : summary.struggling > 0
              ? `Focusing on ${summary.struggling} letter${summary.struggling === 1 ? "" : "s"} you've been missing.`
              : null,
    );
    setFinishedMode(nextMode);
    setIndex(0);
    setInput("");
    setInvalid(null);
    setRevealed(null);
    setAnswers([]);
    setReviewIndex(null);
    setSaveState("idle");
    setPhase("asking");
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!item || !pick || phase !== "asking") return;
    const grade = quiz.grade(item, pick.variantIndex, input);
    if (grade.status === "invalid") {
      setInvalid(grade.message);
      return;
    }
    setInvalid(null);
    const correct = grade.status === "correct";
    setRevealed({ correct, given: correct ? item.answer : grade.status === "wrong" ? grade.given : input, message: grade.status === "wrong" ? grade.message : null });
    setAnswers([...answers, { itemId: item.id, variantIndex: pick.variantIndex, given: input.trim(), correct }]);
    setPhase("revealed");
  }

  function next() {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setInput("");
      setInvalid(null);
      setRevealed(null);
      setPhase("asking");
    } else {
      void finish();
    }
  }

  // Looking back is strictly read-only: it re-derives the verdict from what was already submitted.
  function reviewEntry(i: number): Revealed | null {
    const a = answers[i];
    const q = questions[i];
    const qItem = q ? quiz.itemById(q.itemId) : undefined;
    if (!a || !qItem) return null;
    const grade = quiz.grade(qItem, a.variantIndex, a.given);
    return {
      correct: a.correct,
      given: grade.status === "wrong" ? grade.given : a.given,
      message: grade.status === "wrong" ? grade.message : null,
    };
  }

  function reviewBack() {
    const target = (reviewIndex ?? index) - 1;
    if (target >= 0) setReviewIndex(target);
  }

  function reviewForward() {
    if (reviewIndex === null) return;
    // Stepping past the last answered card lands back on the live question.
    setReviewIndex(reviewIndex + 1 >= index ? null : reviewIndex + 1);
  }

  // The verdict side of a card: used for the live flip and for read-only review.
  function verdictContent(q: Pick, entry: Revealed) {
    const qItem = quiz.itemById(q.itemId);
    const qVariant = qItem?.variants[q.variantIndex];
    if (!qItem || !qVariant) return null;
    const qContext = qVariant.context;
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

        <div className="flex flex-col items-center gap-0.5">
          <span className="native-text text-7xl leading-tight">{qItem.answer}</span>
          <span className="native-text text-sm text-foreground-muted">{quiz.answerLabel(qItem)}</span>
        </div>

        {!entry.correct && (
          <p className="text-sm">
            You wrote <span className="native-text text-xl align-middle">{entry.given || "nothing"}</span>
          </p>
        )}

        <p className="text-sm text-foreground-muted">
          <Emphasis text={qVariant.text} highlight /> · {quiz.variantCode(qItem, q.variantIndex)}
          {qContext && (
            <>
              {" "}
              · in <span className="native-text text-foreground">{qContext.full}</span> ({qContext.gloss})
            </>
          )}
        </p>

        {entry.message && (
          <p className="text-sm rounded-xl border border-danger/30 bg-surface/60 px-3 py-2 text-left">{entry.message}</p>
        )}

        <p className="text-sm text-foreground-muted text-left">
          <span className="font-medium text-foreground">{qItem.group}: </span>
          {qItem.note}
          {qVariant.note && <> {qVariant.note}</>}
        </p>
      </>
    );
  }

  const verdictColors = (correct: boolean | undefined) =>
    correct ? "border-success/50 bg-success-soft" : "border-danger/50 bg-danger-soft";

  async function finish() {
    setPhase("results");
    setSaveState("saving");
    await save(answers, finishedMode);
  }

  async function save(toSave: GivenAnswer[], savedMode: QuizMode) {
    setSaveState("saving");
    try {
      const res = await fetch("/api/quiz/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deck: quiz.deck,
          mode: savedMode,
          answers: toSave.map(({ itemId, variantIndex, given }) => ({ itemId, variantIndex, given })),
        }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      const data: { stats: ItemStatDTO[]; runs: RunDTO[] } = await res.json();
      setStats(data.stats);
      setRuns(data.runs);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  const backHref = `/quiz?lang=${languageCode}`;

  // ---- Setup -----------------------------------------------------------------------------------
  if (phase === "setup") {
    const skippable = countSkippable(quiz.items, stats);
    return (
      <div className="mx-auto max-w-lg w-full px-4 sm:px-6 py-8 flex flex-col gap-6">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-lg font-medium">{quiz.title}</h1>
          <Link href={backHref} className="text-sm text-foreground-muted hover:text-foreground">
            &larr; All practice
          </Link>
        </div>

        <section className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-4">
          <p className="text-sm text-foreground-muted">
            {quiz.intro}
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase tracking-wide text-foreground-muted">Quiz</span>
              <PillToggle
                options={[
                  { value: "full" as QuizMode, label: "Full" },
                  { value: "smart" as QuizMode, label: "Smart" },
                ]}
                value={mode}
                onChange={setMode}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase tracking-wide text-foreground-muted">Questions</span>
              <PillToggle
                options={LENGTHS.map((l) => ({ value: l.count, label: l.label }))}
                value={count}
                onChange={setCount}
              />
            </div>
          </div>
          <p className="text-xs text-foreground-muted">
            {mode === "full"
              ? "A random mix across every letter and position."
              : stats.length === 0
                ? "Smart quizzes focus on the letters you miss. Take a full quiz first so there's something to learn from."
                : `Focuses on letters you've missed or haven't seen. ${skippable} letter${skippable === 1 ? "" : "s"} you got right in 2 quizzes in a row ${skippable === 1 ? "is" : "are"} skipped (they return after a week).`}
          </p>
          <button
            type="button"
            onClick={() => start(mode)}
            className="self-start px-5 py-2 rounded-full text-sm bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
          >
            Start {mode === "smart" ? "smart " : ""}quiz
          </button>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Your scores</h2>
          <ScoreHistory runs={runs} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Letter by letter</h2>
          <MasteryGrid quiz={quiz} stats={stats} />
        </section>
      </div>
    );
  }

  // ---- Results ---------------------------------------------------------------------------------
  if (phase === "results") {
    const total = answers.length;
    const correct = answers.filter((a) => a.correct).length;
    const missed = answers.filter((a) => !a.correct);
    const pct = Math.round((correct / total) * 100);
    // runs[0] is the run just saved once saveState === "saved"; the one before it is the comparison.
    const previous = saveState === "saved" ? runs[1] : runs[0];
    const previousPct = previous ? Math.round((previous.correct / previous.total) * 100) : null;
    return (
      <div className="mx-auto max-w-lg w-full px-4 sm:px-6 py-8 flex flex-col gap-6">
        <section className="rounded-2xl border border-border bg-surface p-6 flex flex-col items-center gap-2 text-center">
          <span className="text-xs uppercase tracking-wide text-foreground-muted">
            {finishedMode === "smart" ? "Smart quiz" : "Full quiz"} complete
          </span>
          <span className="text-6xl font-medium tabular-nums">
            {correct}
            <span className="text-foreground-muted text-3xl"> / {total}</span>
          </span>
          <span className="text-sm text-foreground-muted">{pct}% correct</span>
          {previousPct !== null && (
            <span className="text-sm text-foreground-muted">
              Last time: {previousPct}%
              {pct > previousPct ? " - you improved" : pct < previousPct ? "" : " - the same"}
            </span>
          )}
          <span className="text-xs text-foreground-muted min-h-4" aria-live="polite">
            {saveState === "saving" && "Saving your score..."}
            {saveState === "saved" && "Score saved."}
            {saveState === "error" && (
              <>
                Couldn&apos;t save your score.{" "}
                <button type="button" className="underline" onClick={() => void save(answers, finishedMode)}>
                  Try again
                </button>
              </>
            )}
          </span>
        </section>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => start(finishedMode)}
            className="px-4 py-2 rounded-full text-sm border border-border hover:bg-surface-muted transition-colors"
          >
            Quiz again
          </button>
          <button
            type="button"
            onClick={() => start("smart")}
            disabled={saveState === "saving"}
            className="px-4 py-2 rounded-full text-sm bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Smart quiz
          </button>
          <button
            type="button"
            onClick={() => setPhase("setup")}
            className="px-4 py-2 rounded-full text-sm text-foreground-muted hover:text-foreground"
          >
            Scores &amp; letters
          </button>
        </div>

        {missed.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium">To review ({missed.length})</h2>
            <ul className="flex flex-col gap-2">
              {missed.map((a, i) => {
                const missedItem = quiz.itemById(a.itemId);
                if (!missedItem) return null;
                const v = missedItem.variants[a.variantIndex];
                return (
                  <li key={`${a.itemId}-${i}`} className="rounded-xl border border-border bg-surface p-3 flex items-center gap-3">
                    <span className="native-text text-3xl w-10 text-center">{missedItem.answer}</span>
                    <div className="flex-1 min-w-0 text-sm">
                      <div>
                        <Emphasis text={v.text} highlight />{" "}
                        <span className="text-foreground-muted">· {quiz.variantCode(missedItem, a.variantIndex)}</span>
                      </div>
                      <div className="text-xs text-foreground-muted">
                        {missedItem.group} · you wrote{" "}
                        <span className="native-text">{a.given || "nothing"}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Your scores</h2>
          <ScoreHistory runs={runs} />
        </section>
      </div>
    );
  }

  // ---- Asking / revealed -----------------------------------------------------------------------
  if (!item || !pick || !variant) return null;
  const context = variant.context;
  const isRevealed = phase === "revealed" && revealed !== null;
  const isLast = index + 1 === questions.length;
  const reviewing = reviewIndex !== null ? reviewIndex : null;
  const reviewPick = reviewing !== null ? questions[reviewing] : undefined;
  const reviewResult = reviewing !== null ? reviewEntry(reviewing) : null;
  const canGoBack = (reviewIndex ?? index) > 0;

  return (
    <div className="mx-auto max-w-lg w-full px-4 sm:px-6 py-8 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link href={backHref} className="text-sm text-foreground-muted hover:text-foreground" aria-label="Quit quiz">
          &larr;
        </Link>
        <div className="flex-1 h-1.5 rounded-full bg-surface-muted overflow-hidden">
          <div className="h-full bg-accent transition-all" style={{ width: `${((index + (isRevealed ? 1 : 0)) / questions.length) * 100}%` }} />
        </div>
        <button
          type="button"
          onClick={reviewBack}
          disabled={!canGoBack}
          className="px-2.5 py-1 rounded-full text-xs border border-border hover:bg-surface-muted transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
        >
          &larr; Previous
        </button>
        <span className="text-xs text-foreground-muted tabular-nums">
          {(reviewing ?? index) + 1} / {questions.length}
        </span>
      </div>
      {quizNote && index === 0 && <p className="text-xs text-foreground-muted">{quizNote}</p>}

      {reviewing !== null && reviewPick && reviewResult ? (
        <>
          <p className="text-xs text-foreground-muted text-center">
            Looking back at an answered card - answers are locked.
          </p>
          <div
            className={clsx(
              "rounded-3xl border shadow-sm p-6 flex flex-col items-center gap-3 text-center",
              verdictColors(reviewResult.correct),
            )}
          >
            {verdictContent(reviewPick, reviewResult)}
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={reviewBack}
              disabled={reviewing === 0}
              className="px-4 py-2 rounded-full text-sm border border-border hover:bg-surface-muted transition-colors disabled:opacity-30"
            >
              &larr; Previous
            </button>
            <button
              ref={nextRef}
              type="button"
              onClick={reviewForward}
              className="px-4 py-2 rounded-full text-sm bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
            >
              {reviewing + 1 >= index ? `Back to question ${index + 1}` : "Next \u2192"}
            </button>
          </div>
        </>
      ) : (
        <>
      <div className="[perspective:1200px]">
        <div
          // Only animate the reveal. Resetting for the next question must be instant: the back
          // face already holds the NEXT question's answer by then, and a flip-back would show it.
          className={clsx("grid [transform-style:preserve-3d]", isRevealed && "transition-transform duration-500")}
          style={{ transform: isRevealed ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          {/* Front: the question */}
          <form
            onSubmit={submit}
            inert={isRevealed}
            className="[grid-area:1/1] [backface-visibility:hidden] rounded-3xl border border-border bg-surface shadow-sm p-6 flex flex-col items-center gap-4"
          >
            <p className="text-sm text-foreground-muted text-center">{variant.prompt ?? quiz.defaultPrompt}</p>
            <div className="flex flex-col items-center gap-2 py-2">
              <span className="text-4xl font-normal text-foreground-muted text-center">
                <Emphasis text={variant.text} highlight />
              </span>
              <span className="text-lg font-mono px-3 py-0.5 rounded-full bg-accent-soft">{quiz.variantCode(item, pick.variantIndex)}</span>
              {context && (
                <span className="text-sm text-foreground-muted text-center">
                  {quiz.contextLabel} <span className="native-text text-lg text-foreground">{context.blank}</span>{" "}
                  ({context.gloss})
                </span>
              )}
            </div>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setInvalid(null);
              }}
              lang={quiz.inputLang}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label="Hangul letter"
              aria-invalid={invalid !== null}
              placeholder={quiz.placeholder}
              className="native-text w-28 text-center text-4xl rounded-xl border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <p className="text-xs text-danger min-h-4 text-center" role="alert">
              {invalid}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setKeypadOpen((o) => !o)}
                aria-expanded={keypadOpen}
                className="px-3 py-2 rounded-full text-sm border border-border hover:bg-surface-muted transition-colors"
              >
                {keypadOpen ? "Hide keypad" : "Keypad"}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full text-sm bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
              >
                Check
              </button>
            </div>
            {keypadOpen && (
              <QuizKeypad
                deck={quiz.deck}
                value={input}
                onChange={(next) => {
                  setInput(next);
                  setInvalid(null);
                }}
              />
            )}
          </form>

          {/* Back: the verdict */}
          <div
            inert={!isRevealed}
            style={{ transform: "rotateY(180deg)" }}
            className={clsx(
              "[grid-area:1/1] [backface-visibility:hidden] rounded-3xl border shadow-sm p-6 flex flex-col items-center gap-3 text-center",
              verdictColors(revealed?.correct),
            )}
          >
            {revealed && verdictContent(pick, revealed)}
            <button
              ref={reviewing === null ? nextRef : undefined}
              type="button"
              onClick={next}
              className="mt-1 px-5 py-2 rounded-full text-sm bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
            >
              {isLast ? "See results" : "Next \u2192"}
            </button>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
