// Builds a lesson: which items, in what order, and when missed items come back. Pure functions so
// the rules can be checked without a browser; the clock and RNG are passed in.

import { effectiveScore } from "./mastery";
import type { ItemStatDTO, Pickable } from "./quizSelection";

export const LESSON_SIZE = 12;
// Roughly a third of each lesson is new material, the rest review.
export const NEW_SHARE = 1 / 3;
// A first-shot miss comes back twice more, this many cards apart.
export const REPEAT_GAP = 3;

export type LessonCard = {
  kind: "teach" | "ask";
  itemId: string;
  variantIndex: number;
  viewing: 1 | 2 | 3; // ask cards only: which time this item is being asked in the lesson
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

export function planLesson({
  items,
  stats,
  now = Date.now(),
  rand = Math.random,
  size = LESSON_SIZE,
}: {
  items: readonly Pickable[]; // in curriculum order
  stats: readonly ItemStatDTO[];
  now?: number;
  rand?: () => number;
  size?: number;
}): LessonPlan {
  const statById = new Map(stats.map((s) => [s.itemId, s]));
  // "New" = never scored; taken in the deck's own order, so lessons walk the curriculum.
  const unseen = items.filter((item) => !statById.get(item.id)?.scoreAt);
  // Review = scored before; weakest (most decayed) first.
  const seen = items
    .filter((item) => statById.get(item.id)?.scoreAt)
    .map((item) => ({ item, score: effectiveScore(statById.get(item.id), now) }))
    .sort((a, b) => a.score - b.score)
    .map((s) => s.item);

  const total = Math.min(size, items.length);
  let newCount = Math.min(unseen.length, Math.round(total * NEW_SHARE));
  const reviewCount = Math.min(seen.length, total - newCount);
  // Not enough to review (early on) -> more new; nothing new left -> all review.
  newCount = Math.min(unseen.length, total - reviewCount);

  const fresh = unseen.slice(0, newCount);
  const review = shuffle(seen.slice(0, reviewCount), rand);
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
  for (const { item, isNew } of order) {
    const variantIndex = variantOf(item);
    if (isNew) {
      cards.push({ kind: "teach", itemId: item.id, variantIndex, viewing: 1 });
      pending.push({ card: { kind: "ask", itemId: item.id, variantIndex, viewing: 1 }, due: cards.length + 2 });
    } else {
      cards.push({ kind: "ask", itemId: item.id, variantIndex, viewing: 1 });
    }
    flush(false);
  }
  flush(true);

  return { cards, newIds: fresh.map((i) => i.id), reviewIds: review.map((i) => i.id) };
}

// After a first-shot miss at `index`, queue the 2nd and 3rd viewings REPEAT_GAP cards apart (or at
// the end, if the lesson is nearly over). Returns a new array.
export function scheduleRepeats(cards: readonly LessonCard[], index: number, missed: LessonCard, pickVariant: () => number): LessonCard[] {
  const out = [...cards];
  const second: LessonCard = { kind: "ask", itemId: missed.itemId, variantIndex: pickVariant(), viewing: 2 };
  const third: LessonCard = { kind: "ask", itemId: missed.itemId, variantIndex: pickVariant(), viewing: 3 };
  const secondAt = Math.min(out.length, index + 1 + REPEAT_GAP);
  out.splice(secondAt, 0, second);
  const thirdAt = Math.min(out.length, secondAt + 1 + REPEAT_GAP);
  out.splice(thirdAt, 0, third);
  return out;
}

// Which viewing an item was first answered correctly on.
export function outcomeOf(results: readonly boolean[]): "first" | "second" | "third" | "missed" {
  const first = results.indexOf(true);
  if (first === 0) return "first";
  if (first === 1) return "second";
  if (first === 2) return "third";
  return "missed";
}
