"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { clsx } from "clsx";
import { QuestionForm, TeachContent, VerdictContent, verdictColors, type Revealed } from "./QuizCards";
import { AnswerModeToggle, BAND_STYLE, MasteryGrid, PillToggle, ScoreHistory } from "./learnShared";
import { itemNoun } from "./QuizSession";
import { buildQuiz } from "@/lib/quizzes";
import type { QuizType } from "@/lib/decks";
import { LESSON_SIZE, LESSON_SIZES, outcomeOf, planLesson, scheduleRepeats, type LessonCard } from "@/lib/lessonPlan";
import { BAND_LABEL, bandOf, type Band, type Outcome } from "@/lib/mastery";
import type { ItemStatDTO, RunDTO } from "@/lib/quizSelection";
import { POOL_PREFIX, type AnswerMode, type QuizWord } from "@/lib/wordsQuiz";
import type { LanguageCode } from "@/types";

type Phase = "start" | "card" | "results";
type SaveState = "idle" | "saving" | "saved" | "error";
type Attempt = { variantIndex: number; given: string; correct: boolean };

// Event handlers read the clock through this; the lint rule can't tell a handler from render code.
function currentTime(): number {
  return Date.now();
}

const OUTCOME_LABEL: Record<Outcome, string> = {
  first: "First try",
  second: "Second try",
  third: "Third try",
  missed: "Missed",
};

const OUTCOME_STYLE: Record<Outcome, string> = {
  first: "text-success",
  second: "text-accent",
  third: "text-accent",
  missed: "text-danger",
};

export function LessonSession({
  deck,
  languageCode,
  words,
  poolWords,
  initialAnswerMode,
  initialStats,
  initialRuns,
}: {
  deck: QuizType;
  languageCode: LanguageCode;
  words: QuizWord[];
  // Suggestion-pool words a lesson can introduce (saved to the list as "learned" when it finishes).
  poolWords: QuizWord[];
  initialAnswerMode: AnswerMode;
  initialStats: ItemStatDTO[];
  initialRuns: RunDTO[];
}) {
  const [answerMode, setAnswerMode] = useState<AnswerMode>(initialAnswerMode);
  const quiz = buildQuiz({ deck, languageCode, words: [...words, ...poolWords], answerMode });
  // The progress grid only shows what's already on the list, not the words a lesson could add.
  const gridQuiz = { ...quiz, items: quiz.items.filter((i) => !i.id.startsWith(POOL_PREFIX)) };
  const noun = itemNoun(deck);

  const [phase, setPhase] = useState<Phase>("start");
  const [stats, setStats] = useState(initialStats);
  const [runs, setRuns] = useState(initialRuns);
  const [size, setSize] = useState<number>(LESSON_SIZE);
  const [idMap, setIdMap] = useState<Record<string, string>>({});
  const [cards, setCards] = useState<LessonCard[]>([]);
  const [newIds, setNewIds] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [invalid, setInvalid] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Revealed | null>(null);
  const [attempts, setAttempts] = useState<Record<string, Attempt[]>>({});
  const [keypadOpen, setKeypadOpen] = useState(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [now, setNow] = useState(() => Date.now());

  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const card = cards[index];
  const item = card ? quiz.itemById(card.itemId) : undefined;
  const pick = card ? { itemId: card.itemId, variantIndex: card.variantIndex } : undefined;

  useEffect(() => {
    if (phase !== "card") return;
    if (revealed || card?.kind === "teach") nextRef.current?.focus();
    else if (window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus();
  }, [phase, index, revealed, card?.kind]);

  function start() {
    const startedAt = currentTime();
    const plan = planLesson({ items: quiz.items, stats, now: startedAt, size });
    setNow(startedAt);
    setCards(plan.cards);
    setNewIds(plan.newIds);
    setIndex(0);
    setInput("");
    setInvalid(null);
    setRevealed(null);
    setAttempts({});
    setSaveState("idle");
    setPhase("card");
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!card || !item || revealed) return;
    const grade = quiz.grade(item, card.variantIndex, input);
    if (grade.status === "invalid") {
      setInvalid(grade.message);
      return;
    }
    const correct = grade.status === "correct";
    setInvalid(null);
    setRevealed({
      correct,
      given: grade.status === "wrong" ? grade.given : input.trim(),
      message: grade.status === "wrong" ? grade.message : null,
      note: grade.status === "correct" ? grade.note : null,
    });
    setAttempts({ ...attempts, [item.id]: [...(attempts[item.id] ?? []), { variantIndex: card.variantIndex, given: input.trim(), correct }] });
    // Missed on the first viewing: it comes back twice more later in this lesson.
    if (!correct && card.viewing === 1) {
      setCards(scheduleRepeats(cards, index, card, () => Math.floor(Math.random() * item.variants.length)));
    }
  }

  function next() {
    if (index + 1 < cards.length) {
      setIndex(index + 1);
      setInput("");
      setInvalid(null);
      setRevealed(null);
    } else {
      void finish();
    }
  }

  async function finish() {
    setPhase("results");
    await save();
  }

  async function save() {
    setSaveState("saving");
    try {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deck: quiz.deck,
          lang: languageCode,
          answerMode,
          results: Object.entries(attempts).map(([itemId, list]) => ({
            itemId,
            attempts: list.map(({ variantIndex, given }) => ({ variantIndex, given })),
          })),
        }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      const data: { stats: ItemStatDTO[]; runs: RunDTO[]; idMap: Record<string, string> } = await res.json();
      setIdMap(data.idMap);
      setStats(data.stats);
      setRuns(data.runs);
      setNow(currentTime());
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  const backHref = `/learn?lang=${languageCode}`;

  if (quiz.items.length === 0) {
    return (
      <div className="mx-auto max-w-lg w-full px-4 sm:px-6 py-16 flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-foreground-muted">You don&apos;t have any words yet. Add some from the list to start a lesson.</p>
        <Link href={`/?lang=${languageCode}`} className="text-sm underline">
          Go to your list
        </Link>
      </div>
    );
  }

  // ---- Start -----------------------------------------------------------------------------------
  if (phase === "start") {
    const counts: Record<Band, number> = { new: 0, review: 0, reviewed: 0 };
    const statById = new Map(stats.map((s) => [s.itemId, s]));
    for (const it of gridQuiz.items) counts[bandOf(statById.get(it.id), now)]++;
    const unseenTotal = quiz.items.filter((it) => !statById.get(it.id)?.scoreAt).length;
    const lessonSize = Math.min(size, quiz.items.length);
    const newInNext = Math.min(unseenTotal, Math.round(lessonSize / 3));
    return (
      <div className="mx-auto max-w-lg w-full px-4 sm:px-6 py-8 flex flex-col gap-6">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-lg font-medium">{quiz.title.replace(/quiz$/i, "lesson")}</h1>
          <Link href={backHref} className="text-sm text-foreground-muted hover:text-foreground">
            &larr; Learn
          </Link>
        </div>

        <section className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-4">
          <p className="text-sm text-foreground-muted">
            A lesson mixes new {noun}s with review - about a third new, the rest the ones you know least or haven&apos;t seen in
            a while. New {noun}s are shown before they&apos;re asked. Miss one and it comes back twice more.
            {deck === "words" && poolWords.length > 0 && " New words come from the suggestions list and are added to your list as Learned."}
          </p>
          <div className="flex flex-wrap gap-2">
            {(["new", "review", "reviewed"] as const).map((band) => (
              <span key={band} className={clsx("text-xs px-2.5 py-1 rounded-full border", BAND_STYLE[band])}>
                {counts[band]} {BAND_LABEL[band]}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase tracking-wide text-foreground-muted">Length</span>
              <PillToggle
                options={LESSON_SIZES.map((n) => ({ value: n as number, label: `${n} ${noun}s` }))}
                value={size}
                onChange={setSize}
              />
            </div>
            {deck === "words" && <AnswerModeToggle languageCode={languageCode} value={answerMode} onChange={setAnswerMode} />}
          </div>
          <button
            type="button"
            onClick={start}
            className="self-start px-5 py-2 rounded-full text-sm bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
          >
            Start lesson{newInNext > 0 ? ` (${newInNext} new)` : ""}
          </button>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Your scores</h2>
          <ScoreHistory runs={runs} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Progress</h2>
          <MasteryGrid quiz={gridQuiz} stats={stats} />
        </section>
      </div>
    );
  }

  // ---- Results ---------------------------------------------------------------------------------
  if (phase === "results") {
    const afterById = new Map(stats.map((s) => [s.itemId, s]));
    const rows = Object.entries(attempts).map(([itemId, list]) => ({
      item: quiz.itemById(itemId),
      outcome: outcomeOf(list.map((a) => a.correct)),
      // Where the item stands now, once saved - as a label, never as a number.
      band: saveState === "saved" ? bandOf(afterById.get(idMap[itemId] ?? itemId), now) : null,
      isNew: newIds.includes(itemId),
    }));
    const addedToList = Object.keys(idMap).length;
    const firstTry = rows.filter((r) => r.outcome === "first").length;
    return (
      <div className="mx-auto max-w-lg w-full px-4 sm:px-6 py-8 flex flex-col gap-6">
        <section className="rounded-2xl border border-border bg-surface p-6 flex flex-col items-center gap-2 text-center">
          <span className="text-xs uppercase tracking-wide text-foreground-muted">Lesson complete</span>
          <span className="text-6xl font-medium tabular-nums">
            {firstTry}
            <span className="text-foreground-muted text-3xl"> / {rows.length}</span>
          </span>
          <span className="text-sm text-foreground-muted">right first try</span>
          <span className="text-xs text-foreground-muted min-h-4" aria-live="polite">
            {saveState === "saving" && "Saving your progress..."}
            {saveState === "saved" && (addedToList > 0 ? `Progress saved. ${addedToList} new word${addedToList === 1 ? "" : "s"} added to your list under Learned.` : "Progress saved.")}
            {saveState === "error" && (
              <>
                Couldn&apos;t save your progress.{" "}
                <button type="button" className="underline" onClick={() => void save()}>
                  Try again
                </button>
              </>
            )}
          </span>
        </section>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={start}
            disabled={saveState === "saving"}
            className="px-4 py-2 rounded-full text-sm bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Next lesson
          </button>
          <button type="button" onClick={() => setPhase("start")} className="px-4 py-2 rounded-full text-sm text-foreground-muted hover:text-foreground">
            Progress
          </button>
        </div>

        <ul className="flex flex-col gap-2">
          {rows.map(({ item: rowItem, outcome, band, isNew }) =>
            rowItem ? (
              <li key={rowItem.id} className="rounded-xl border border-border bg-surface p-3 flex items-center gap-3">
                <span className={clsx("native-text text-center", quiz.answerSize === "word" ? "text-xl" : "text-3xl w-12")}>{rowItem.answer}</span>
                <div className="flex-1 min-w-0 text-sm">
                  <div className={clsx("font-medium", OUTCOME_STYLE[outcome])}>
                    {OUTCOME_LABEL[outcome]}
                    {isNew && <span className="ml-2 text-[11px] uppercase tracking-wide text-foreground-muted">new</span>}
                  </div>
                  <div className="text-xs text-foreground-muted truncate">{rowItem.variants[0]?.text.replace(/\*\*/g, "")}</div>
                </div>
                {band && (
                  <span className={clsx("text-[11px] px-2 py-0.5 rounded-full border shrink-0", BAND_STYLE[band])}>{BAND_LABEL[band]}</span>
                )}
              </li>
            ) : null,
          )}
        </ul>
      </div>
    );
  }

  // ---- Cards -----------------------------------------------------------------------------------
  if (!card || !item || !pick) return null;
  const isTeach = card.kind === "teach";
  const isRevealed = revealed !== null;
  const isLast = index + 1 === cards.length;
  const done = index + (isTeach || isRevealed ? 1 : 0);

  return (
    <div className="mx-auto max-w-lg w-full px-4 sm:px-6 py-8 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link href={backHref} className="text-sm text-foreground-muted hover:text-foreground" aria-label="Quit lesson">
          &larr;
        </Link>
        <div className="flex-1 h-1.5 rounded-full bg-surface-muted overflow-hidden">
          <div className="h-full bg-accent transition-all" style={{ width: `${(done / cards.length) * 100}%` }} />
        </div>
        <span className="text-xs text-foreground-muted tabular-nums">
          {index + 1} / {cards.length}
        </span>
      </div>
      {card.kind === "ask" && card.viewing > 1 && (
        <p className="text-xs text-foreground-muted text-center">Again - {card.viewing === 2 ? "second" : "third"} time for this one.</p>
      )}

      {isTeach ? (
        <div className="rounded-3xl border border-border bg-accent-soft shadow-sm p-6 flex flex-col items-center gap-3 text-center">
          <TeachContent quiz={quiz} pick={pick} />
          <button
            ref={nextRef}
            type="button"
            onClick={next}
            className="mt-1 px-5 py-2 rounded-full text-sm bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
          >
            Got it &rarr;
          </button>
        </div>
      ) : (
        <div className="[perspective:1200px]">
          <div
            // Animate only the reveal; resetting for the next card must be instant (see QuizSession).
            className={clsx("grid [transform-style:preserve-3d]", isRevealed && "transition-transform duration-500")}
            style={{ transform: isRevealed ? "rotateY(180deg)" : "rotateY(0deg)" }}
          >
            <QuestionForm
              quiz={quiz}
              pick={pick}
              input={input}
              onInput={(value) => {
                setInput(value);
                setInvalid(null);
              }}
              invalid={invalid}
              onSubmit={submit}
              keypadOpen={keypadOpen}
              onToggleKeypad={() => setKeypadOpen((o) => !o)}
              inputRef={inputRef}
              inert={isRevealed}
              className="[grid-area:1/1] [backface-visibility:hidden]"
            />
            <div
              inert={!isRevealed}
              style={{ transform: "rotateY(180deg)" }}
              className={clsx(
                "[grid-area:1/1] [backface-visibility:hidden] rounded-3xl border shadow-sm p-6 flex flex-col items-center gap-3 text-center",
                verdictColors(revealed?.correct),
              )}
            >
              {revealed && <VerdictContent quiz={quiz} pick={pick} entry={revealed} />}
              {revealed && !revealed.correct && card.viewing === 1 && (
                <p className="text-xs text-foreground-muted">This one will come back twice more in this lesson.</p>
              )}
              <button
                ref={nextRef}
                type="button"
                onClick={next}
                className="mt-1 px-5 py-2 rounded-full text-sm bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
              >
                {isLast ? "Finish lesson" : "Next →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
