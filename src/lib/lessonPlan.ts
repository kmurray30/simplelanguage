// Builds a lesson: which items, in what order, and when items come back. Pure functions so the
// rules can be checked without a browser; the clock and RNG are passed in.
//
// Every item in a lesson has to be answered right twice IN A ROW (with other items in between)
// before the lesson can finish: a miss resets it, and it comes back until it's right twice running.

import { effectiveScore } from "./mastery";
import type { ItemStatDTO, Pickable } from "./quizSelection";

// A lesson has a budget: a new item costs NEW_COST, a review item REVIEW_COST. Left alone a lesson is
// a quarter new-item budget and half review - 2 new + 4 review for Short, 4 + 8, 6 + 12 - and when
// one side runs out the other fills the budget at the same exchange rate (2 reviews per new item).
export const LESSON_LENGTHS = [
  { value: "short", label: "Short", budget: 8 },
  { value: "medium", label: "Medium", budget: 16 },
  { value: "long", label: "Long", budget: 24 },
] as const;
export type LessonLength = (typeof LESSON_LENGTHS)[number]["value"];
export const DEFAULT_LENGTH: LessonLength = "medium";
export const NEW_COST = 2;
// New items are drawn at random from this many of the earliest unlearned ones.
export const NEW_WINDOW = 15;
export const REVIEW_COST = 1;
// How many consecutive right answers lock an item in for the lesson.
export const CORRECT_IN_A_ROW = 2;
// An item that comes back is put this many cards later (or at the end, if the lesson is nearly done).
export const REPEAT_GAP = 3;

export type LessonCard = {
  kind: "teach" | "ask";
  itemId: string;
  variantIndex: number;
};

export type LessonPlan = { cards: LessonCard[]; newIds: string[]; reviewIds: string[] };

function shuffle<T>(list: readonly T[], rand: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// How many of a lesson's items are new and how many are review, given the budget and what's
// available. Normally B/4 new and B/2 review; whatever one side can't fill, the other takes up.
export function planCounts({ budget, newAvailable, reviewAvailable }: { budget: number; newAvailable: number; reviewAvailable: number }) {
  let newCount = Math.min(newAvailable, Math.floor(budget / (2 * NEW_COST)));
  let reviewCount = Math.min(reviewAvailable, Math.floor(budget / (2 * REVIEW_COST)));
  const left = () => budget - newCount * NEW_COST - reviewCount * REVIEW_COST;
  newCount += Math.min(newAvailable - newCount, Math.floor(left() / NEW_COST));
  reviewCount += Math.min(reviewAvailable - reviewCount, Math.floor(left() / REVIEW_COST));
  return { newCount, reviewCount };
}

export function planLesson({
  items,
  stats,
  now = Date.now(),
  rand = Math.random,
  budget = 16,
  isNew,
}: {
  items: readonly Pickable[]; // in curriculum order
  stats: readonly ItemStatDTO[];
  now?: number;
  rand?: () => number;
  budget?: number;
  // Which items count as new. By default, ones never answered (letters, syllables); for words,
  // only suggestion-pool words - anything on your own list counts as needing review from the start.
  isNew?: (item: Pickable) => boolean;
}): LessonPlan {
  const statById = new Map(stats.map((s) => [s.itemId, s]));
  const newCheck = isNew ?? ((item: Pickable) => !statById.get(item.id)?.scoreAt);
  // New material comes from the front of the curriculum, but not strictly in order: each lesson
  // picks at random from the next NEW_WINDOW unlearned items (so the basics still come first, but
  // a lesson isn't just the next four letters of the keypad, in keypad order).
  const newPool = items.filter(newCheck);
  // Review: weakest (most decayed, or never scored) first; ties keep list order.
  const reviewPool = items
    .filter((item) => !newCheck(item))
    .map((item, order) => ({ item, order, score: effectiveScore(statById.get(item.id), now) }))
    .sort((a, b) => a.score - b.score || a.order - b.order)
    .map((s) => s.item);

  const { newCount, reviewCount } = planCounts({ budget, newAvailable: newPool.length, reviewAvailable: reviewPool.length });

  const fresh = shuffle(newPool.slice(0, Math.max(NEW_WINDOW, newCount)), rand).slice(0, newCount);
  const review = shuffle(reviewPool.slice(0, reviewCount), rand);
  const variantOf = (item: Pickable) => Math.floor(rand() * item.variants.length);

  // Spread the new items evenly through the reviews.
  const order: { item: Pickable; isNew: boolean }[] = [];
  const slots = fresh.length + review.length;
  let r = 0;
  let n = 0;
  for (let i = 0; i < slots; i++) {
    const newDue = fresh.length > 0 && n < fresh.length && (r >= review.length || (i * fresh.length) / slots >= n);
    if (newDue) order.push({ item: fresh[n++], isNew: true });
    else order.push({ item: review[r++], isNew: false });
  }

  // A new item is taught, then asked a couple of cards later.
  const cards: LessonCard[] = [];
  const pending: { card: LessonCard; due: number }[] = [];
  const flush = (force: boolean) => {
    for (let i = 0; i < pending.length; ) {
      if (force || pending[i].due <= cards.length) cards.push(pending.splice(i, 1)[0].card);
      else i++;
    }
  };
  for (const { item, isNew: itemIsNew } of order) {
    const variantIndex = variantOf(item);
    if (itemIsNew) {
      cards.push({ kind: "teach", itemId: item.id, variantIndex });
      pending.push({ card: { kind: "ask", itemId: item.id, variantIndex }, due: cards.length + 2 });
    } else {
      cards.push({ kind: "ask", itemId: item.id, variantIndex });
    }
    flush(false);
  }
  flush(true);

  return { cards, newIds: fresh.map((i) => i.id), reviewIds: review.map((i) => i.id) };
}

// After an answer at `index`, the item either comes back (not yet right twice in a row) or is done.
// Returns a new array with its next ask inserted REPEAT_GAP cards later, or the same cards if done.
export function scheduleNext(
  cards: readonly LessonCard[],
  index: number,
  itemId: string,
  streak: number,
  pickVariant: () => number,
): LessonCard[] {
  if (streak >= CORRECT_IN_A_ROW) return [...cards];
  const out = [...cards];
  const at = Math.min(out.length, index + 1 + REPEAT_GAP);
  out.splice(at, 0, { kind: "ask", itemId, variantIndex: pickVariant() });
  return out;
}

// How an answer went: "close" is one letter off - not a miss, but it doesn't count as right either.
export type AttemptResult = "correct" | "close" | "wrong";

// The streak after an answer: right adds one, wrong starts over, close leaves it be.
export function nextStreak(streak: number, result: AttemptResult): number {
  if (result === "close") return streak;
  return result === "correct" ? streak + 1 : 0;
}

// How many attempts at an item were wrong (close ones aren't).
export function wrongCount(results: readonly AttemptResult[]): number {
  return results.filter((r) => r === "wrong").length;
}

// This lesson's score for an item, out of 5: every wrong answer costs one point, never below 1.
export function lessonScore(results: readonly AttemptResult[]): number {
  return Math.max(1, 5 - wrongCount(results));
}

// 1 star for 3 or less, 2 for 4, 3 for a clean 5.
export function starsFor(score: number): 1 | 2 | 3 {
  return score >= 5 ? 3 : score >= 4 ? 2 : 1;
}

// What the proficiency score hears about an item: 0 wrong = first try, then 1, 2, or more wrong answers.
export function outcomeOf(results: readonly AttemptResult[]): "first" | "second" | "third" | "struggled" {
  const wrong = wrongCount(results);
  if (wrong === 0) return "first";
  if (wrong === 1) return "second";
  if (wrong === 2) return "third";
  return "struggled";
}
