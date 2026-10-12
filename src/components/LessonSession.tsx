"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { clsx } from "clsx";
import { QuestionForm, TeachContent, VerdictContent, verdictColors, type Revealed } from "./QuizCards";
import { AnswerModeToggle, BAND_STYLE, MasteryGrid, PillToggle } from "./learnShared";
import { itemNoun } from "./QuizSession";
import { buildQuiz } from "@/lib/quizzes";
import type { QuizType } from "@/lib/decks";
import {
  CORRECT_IN_A_ROW,
  LESSON_SIZE,
  LESSON_SIZES,
  lessonScore,
  nextStreak,
  planCounts,
  planLesson,
  scheduleNext,
  type LessonCard,
} from "@/lib/lessonPlan";
import { BAND_LABEL, bandOf, effectiveScore, type Band } from "@/lib/mastery";
import type { ItemStatDTO } from "@/lib/quizSelection";
import { POOL_PREFIX, type AnswerMode, type QuizWord } from "@/lib/wordsQuiz";
import type { LanguageCode } from "@/types";

type Phase = "start" | "card" | "results";
type SaveState = "idle" | "saving" | "saved" | "error";
type Attempt = { variantIndex: number; given: string; correct: boolean };

// Event handlers read the clock through this; the lint rule can't tell a handler from render code.
function currentTime(): number {
  return Date.now();
}

function randomIndex(length: number): number {
  return Math.floor(Math.random() * length);
}

export function LessonSession({
  deck,
  languageCode,
  words,
  poolWords,
  initialAnswerMode,
  initialStats,
}: {
  deck: QuizType;
  languageCode: LanguageCode;
  words: QuizWord[];
  // Suggestion-pool words a lesson can introduce (saved to the list as "learned" when it finishes).
  poolWords: QuizWord[];
  initialAnswerMode: AnswerMode;
  initialStats: ItemStatDTO[];
}) {
  const [answerMode, setAnswerMode] = useState<AnswerMode>(initialAnswerMode);
  const quiz = buildQuiz({ deck, languageCode, words: [...words, ...poolWords], answerMode });
  // The progress grid only shows what's already on the list, not the words a lesson could add.
  const gridQuiz = { ...quiz, items: quiz.items.filter((i) => !i.id.startsWith(POOL_PREFIX)) };
  const noun = itemNoun(deck);
  const isWords = deck === "words";
  // Your own words need review from the moment you add them; "new" ones come from the suggestion pool.
  const isNewItem = isWords ? (item: { id: string }) => item.id.startsWith(POOL_PREFIX) : undefined;

  const [phase, setPhase] = useState<Phase>("start");
  const [stats, setStats] = useState(initialStats);
  const [size, setSize] = useState<number>(LESSON_SIZE);
  const [idMap, setIdMap] = useState<Record<string, string>>({});
  const [cards, setCards] = useState<LessonCard[]>([]);
  const [lessonItemIds, setLessonItemIds] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [invalid, setInvalid] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Revealed | null>(null);
  const [attempts, setAttempts] = useState<Record<string, Attempt[]>>({});
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [keypadOpen, setKeypadOpen] = useState(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [now, setNow] = useState(() => Date.now());

  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const card = cards[index];
  const item = card ? quiz.itemById(card.itemId) : undefined;
  const pick = card ? { itemId: card.itemId, variantIndex: card.variantIndex } : undefined;

  useEffect(() => {
    if (phase !== "card") return;
    if (revealed || card?.kind === "teach") nextRef.current?.focus();
    else if (window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus();
  }, [phase, index, revealed, card?.kind]);

  // A card that shows the answer (a new item's teach card, or the verdict after answering) plays
  // its audio on its own. Audio is only stored once per word/syllable/letter - the server reuses it.
  const showingAnswer = phase === "card" && !!card && (card.kind === "teach" || revealed !== null);
  const audioSrc = showingAnswer && item ? quiz.audioSrc(item) : null;
  useEffect(() => {
    if (!audioSrc) return;
    const audio = new Audio(audioSrc);
    audioRef.current = audio;
    audio.play().catch(() => {
      // Autoplay can be blocked; the card's audio button still works.
    });
    return () => {
      audio.pause();
    };
  }, [audioSrc, index, revealed]);

  function start() {
    const startedAt = currentTime();
    const plan = planLesson({ items: quiz.items, stats, now: startedAt, size, isNew: isNewItem });
    setNow(startedAt);
    setCards(plan.cards);
    setLessonItemIds([...new Set(plan.cards.map((c) => c.itemId))]);
    setIndex(0);
    setInput("");
    setInvalid(null);
    setRevealed(null);
    setAttempts({});
    setStreaks({});
    setSaveState("idle");
    setPhase("card");
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!card || !item || revealed) return;
    // Nothing typed is a skip: it shows the answer and counts as a miss.
    const blank = input.trim() === "";
    const grade = blank ? null : quiz.grade(item, card.variantIndex, input);
    if (grade?.status === "invalid") {
      setInvalid(grade.message);
      return;
    }
    const correct = grade?.status === "correct";
    setInvalid(null);
    setRevealed({
      correct,
      given: grade?.status === "wrong" ? grade.given : input.trim(),
      message: grade?.status === "wrong" ? grade.message : null,
      note: grade?.status === "correct" ? grade.note : null,
    });
    setAttempts({ ...attempts, [item.id]: [...(attempts[item.id] ?? []), { variantIndex: card.variantIndex, given: input.trim(), correct }] });
    // Right twice in a row locks an item in; anything less brings it back a few cards later.
    const streak = nextStreak(streaks[item.id] ?? 0, correct);
    setStreaks({ ...streaks, [item.id]: streak });
    setCards(scheduleNext(cards, index, item.id, streak, () => randomIndex(item.variants.length)));
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
      const data: { stats: ItemStatDTO[]; idMap: Record<string, string> } = await res.json();
      setIdMap(data.idMap);
      setStats(data.stats);
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
        <p className="text-sm text-foreground-muted">There&apos;s nothing to learn here yet.</p>
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
    for (const it of gridQuiz.items) counts[bandOf(statById.get(it.id), now, isWords)]++;
    // What the next lesson will hold, using the same rules the lesson itself does.
    const newAvailable = isWords ? poolWords.length : quiz.items.filter((it) => !statById.get(it.id)?.scoreAt).length;
    const reviewAvailable = isWords ? words.length : quiz.items.length - newAvailable;
    const { newCount, reviewCount } = planCounts({ total: Math.min(size, quiz.items.length), newAvailable, reviewAvailable });
    const bands: Band[] = isWords ? ["review", "reviewed"] : ["new", "review", "reviewed"];
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
            A lesson mixes new {noun}s with review - the ones you know least or haven&apos;t seen in a while. New ones are shown
            before they&apos;re asked. Every {noun} has to be right {CORRECT_IN_A_ROW} times in a row, with others in between,
            before the lesson ends.
            {isWords && poolWords.length > 0 && " New words come from the suggestions list and are added to your list as Learned."}
          </p>
          <div className="flex flex-wrap gap-2">
            {bands.map((band) => (
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
            {isWords && <AnswerModeToggle languageCode={languageCode} value={answerMode} onChange={setAnswerMode} />}
          </div>
          <button
            type="button"
            onClick={start}
            className="self-start px-5 py-2 rounded-full text-sm bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
          >
            Start lesson ({newCount} new · {reviewCount} review)
          </button>
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
    const rows = lessonItemIds.flatMap((itemId) => {
      const rowItem = quiz.itemById(itemId);
      if (!rowItem) return [];
      const list = attempts[itemId] ?? [];
      return [
        {
          item: rowItem,
          lesson: lessonScore(list.map((a) => a.correct)),
          overall: saveState === "saved" ? Math.round(effectiveScore(afterById.get(idMap[itemId] ?? itemId), now)) : null,
        },
      ];
    });
    return (
      <div className="mx-auto max-w-lg w-full px-4 sm:px-6 py-8 flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-medium">Lesson complete</h1>
          <span className="text-xs text-foreground-muted" aria-live="polite">
            {saveState === "saving" && "Saving..."}
            {saveState === "saved" && "Saved"}
            {saveState === "error" && (
              <button type="button" className="underline" onClick={() => void save()}>
                Couldn&apos;t save - try again
              </button>
            )}
          </span>
        </div>

        <ul className="flex flex-col gap-2">
          {rows.map(({ item: rowItem, lesson, overall }) => (
            <li key={rowItem.id} className="rounded-xl border border-border bg-surface p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className={clsx("native-text truncate", quiz.answerSize === "word" ? "text-xl" : "text-3xl")}>{rowItem.answer}</div>
                {quiz.answerSize === "word" && (
                  <div className="text-xs text-foreground-muted truncate">{rowItem.variants[0]?.text}</div>
                )}
              </div>
              <div className="flex gap-4 text-right shrink-0">
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-foreground-muted">This lesson</div>
                  <div className="tabular-nums font-medium">{lesson}/5</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-foreground-muted">Overall</div>
                  <div className="tabular-nums font-medium">{overall === null ? "…" : `${overall}/100`}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={start}
            disabled={saveState === "saving"}
            className="px-5 py-2 rounded-full text-sm bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Next lesson
          </button>
          <button type="button" onClick={() => setPhase("start")} className="px-4 py-2 rounded-full text-sm text-foreground-muted hover:text-foreground">
            Progress
          </button>
        </div>
      </div>
    );
  }

  // ---- Cards -----------------------------------------------------------------------------------
  if (!card || !item || !pick) return null;
  const isTeach = card.kind === "teach";
  const isRevealed = revealed !== null;
  const isLast = index + 1 === cards.length;
  const locked = lessonItemIds.filter((id) => (streaks[id] ?? 0) >= CORRECT_IN_A_ROW).length;
  const streak = streaks[card.itemId] ?? 0;
  const tried = (attempts[card.itemId] ?? []).length > 0;

  return (
    <div className="mx-auto max-w-lg w-full px-4 sm:px-6 py-8 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link href={backHref} className="text-sm text-foreground-muted hover:text-foreground" aria-label="Quit lesson">
          &larr;
        </Link>
        <div className="flex-1 h-1.5 rounded-full bg-surface-muted overflow-hidden">
          <div className="h-full bg-accent transition-all" style={{ width: `${(locked / Math.max(1, lessonItemIds.length)) * 100}%` }} />
        </div>
        <span className="text-xs text-foreground-muted tabular-nums">
          {locked} / {lessonItemIds.length}
        </span>
      </div>
      {card.kind === "ask" && tried && !isRevealed && (
        <p className="text-xs text-foreground-muted text-center">
          {streak === 1 ? "Once more in a row to lock this one in." : "Again - it has to be right twice in a row."}
        </p>
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
              {revealed && (
                <p className="text-xs text-foreground-muted">
                  {streak >= CORRECT_IN_A_ROW
                    ? "Locked in for this lesson."
                    : revealed.correct
                      ? "Right! It comes back once more to lock it in."
                      : "It comes back - it has to be right twice in a row."}
                </p>
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
