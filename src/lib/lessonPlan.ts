// Builds a lesson: which items, in what order, and when items come back. Pure functions so the
// rules can be checked without a browser; the clock and RNG are passed in.
//
// Every item in a lesson has to be answered right twice IN A ROW (with other items in between)
// before the lesson can finish: a miss resets it, and it comes back until it's right twice running.

import { effectiveScore } from "./mastery";
import type { ItemStatDTO, Pickable } from "./quizSelection";

export const LESSON_SIZE = 12;
export const LESSON_SIZES = [6, 12, 18] as const;
// A third of each lesson is new material (2, 4 or 6 of 6, 12 or 18), the rest review.
export const NEW_SHARE = 1 / 3;
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

// How many of a lesson's items are new and how many are review, given what's available. Early on
// there's little to review (more new); once nothing new is left it's all review.
export function planCounts({ total, newAvailable, reviewAvailable }: { total: number; newAvailable: number; reviewAvailable: number }) {
  const wantNew = Math.min(newAvailable, Math.round(total * NEW_SHARE));
  const reviewCount = Math.min(reviewAvailable, total - wantNew);
  const newCount = Math.min(newAvailable, total - reviewCount);
  return { newCount, reviewCount };
}

export function planLesson({
  items,
  stats,
  now = Date.now(),
  rand = Math.random,
  size = LESSON_SIZE,
  isNew,
}: {
  items: readonly Pickable[]; // in curriculum order
  stats: readonly ItemStatDTO[];
  now?: number;
  rand?: () => number;
  size?: number;
  // Which items count as new. By default, ones never answered (letters, syllables); for words,
  // only suggestion-pool words - anything on your own list counts as needing review from the start.
  isNew?: (item: Pickable) => boolean;
}): LessonPlan {
  const statById = new Map(stats.map((s) => [s.itemId, s]));
  const newCheck = isNew ?? ((item: Pickable) => !statById.get(item.id)?.scoreAt);
  // New material is taken in the deck's own order, so lessons walk the curriculum.
  const newPool = items.filter(newCheck);
  // Review: weakest (most decayed, or never scored) first; ties keep list order.
  const reviewPool = items
    .filter((item) => !newCheck(item))
    .map((item, order) => ({ item, order, score: effectiveScore(statById.get(item.id), now) }))
    .sort((a, b) => a.score - b.score || a.order - b.order)
    .map((s) => s.item);

  const total = Math.min(size, items.length);
  const { newCount, reviewCount } = planCounts({ total, newAvailable: newPool.length, reviewAvailable: reviewPool.length });

  const fresh = newPool.slice(0, newCount);
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

// The streak after an answer: right adds one, wrong starts over.
export function nextStreak(streak: number, correct: boolean): number {
  return correct ? streak + 1 : 0;
}

// How many attempts at an item were wrong.
export function wrongCount(results: readonly boolean[]): number {
  return results.filter((ok) => !ok).length;
}

// This lesson's score for an item, out of 5: every wrong answer costs one point, never below 1.
export function lessonScore(results: readonly boolean[]): number {
  return Math.max(1, 5 - wrongCount(results));
}

// What the mastery score hears about an item: 0 wrong = first try, then 1, 2, or more wrong answers.
export function outcomeOf(results: readonly boolean[]): "first" | "second" | "third" | "struggled" {
  const wrong = wrongCount(results);
  if (wrong === 0) return "first";
  if (wrong === 1) return "second";
  if (wrong === 2) return "third";
  return "struggled";
}
