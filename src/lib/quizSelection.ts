// Picks which questions a quiz asks. Pure functions (the clock and RNG are passed in) so the
// Smart-quiz rules can be checked without a browser or database.

import type { QuizItem } from "./hangulQuiz";

export type QuizMode = "full" | "smart";

// What the server stores per letter (dates as ISO strings so it crosses the server/client boundary).
export type ItemStatDTO = {
  itemId: string;
  seen: number;
  correctCount: number;
  correctStreak: number;
  lastSeenAt: string;
  lastWrongAt: string | null;
};

export type RunDTO = {
  id: string;
  mode: QuizMode;
  total: number;
  correct: number;
  createdAt: string;
};

export type Pick = { itemId: string; variantIndex: number };

// A letter answered correctly in this many quizzes in a row is "mastered" and the Smart quiz skips it...
export const MASTERED_STREAK = 2;
// ...until it hasn't been seen for this long, when it comes back for a quick review.
export const REVIEW_AFTER_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

export function isMastered(stat: ItemStatDTO | undefined): boolean {
  return !!stat && stat.correctStreak >= MASTERED_STREAK;
}

function shuffle<T>(list: readonly T[], rand: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function toPick(item: QuizItem, rand: () => number): Pick {
  return { itemId: item.id, variantIndex: Math.floor(rand() * item.variants.length) };
}

export type Selection = {
  picks: Pick[];
  // Smart quiz only: how the set was put together, so the UI can say what the user is getting.
  summary?: { fresh: number; struggling: number; review: number; toppedUp: number };
};

export function pickQuestions({
  mode,
  items,
  stats,
  count,
  now = Date.now(),
  rand = Math.random,
}: {
  mode: QuizMode;
  items: readonly QuizItem[];
  stats: readonly ItemStatDTO[];
  count: number; // Infinity = every item
  now?: number;
  rand?: () => number;
}): Selection {
  if (mode === "full") {
    return { picks: shuffle(items, rand).slice(0, count).map((item) => toPick(item, rand)) };
  }

  const statById = new Map(stats.map((s) => [s.itemId, s]));
  const fresh: QuizItem[] = [];
  const struggling: { item: QuizItem; stat: ItemStatDTO }[] = [];
  const dueReview: { item: QuizItem; stat: ItemStatDTO }[] = [];
  const mastered: { item: QuizItem; stat: ItemStatDTO }[] = [];

  for (const item of items) {
    const stat = statById.get(item.id);
    if (!stat) fresh.push(item);
    else if (!isMastered(stat)) struggling.push({ item, stat });
    else if (now - Date.parse(stat.lastSeenAt) > REVIEW_AFTER_DAYS * DAY_MS) dueReview.push({ item, stat });
    else mastered.push({ item, stat });
  }

  // Weakest first: lowest streak, then most recent miss, then longest since last seen.
  struggling.sort((a, b) => {
    if (a.stat.correctStreak !== b.stat.correctStreak) return a.stat.correctStreak - b.stat.correctStreak;
    const aWrong = a.stat.lastWrongAt ? Date.parse(a.stat.lastWrongAt) : 0;
    const bWrong = b.stat.lastWrongAt ? Date.parse(b.stat.lastWrongAt) : 0;
    if (aWrong !== bWrong) return bWrong - aWrong;
    return Date.parse(a.stat.lastSeenAt) - Date.parse(b.stat.lastSeenAt);
  });
  const byOldestSeen = (a: { stat: ItemStatDTO }, b: { stat: ItemStatDTO }) =>
    Date.parse(a.stat.lastSeenAt) - Date.parse(b.stat.lastSeenAt);
  dueReview.sort(byOldestSeen);
  mastered.sort(byOldestSeen);

  const chosen: QuizItem[] = [];
  const summary = { fresh: 0, struggling: 0, review: 0, toppedUp: 0 };
  const take = (list: QuizItem[], bucket: keyof typeof summary) => {
    for (const item of list) {
      if (chosen.length >= count) return;
      chosen.push(item);
      summary[bucket]++;
    }
  };

  // Letters the user has trouble with come before ones never seen, so a fresh learner (everything
  // unseen) still gets a full quiz, and a returning one drills their weak spots first.
  take(struggling.map((s) => s.item), "struggling");
  take(shuffle(fresh, rand), "fresh");
  take(dueReview.map((s) => s.item), "review");
  take(mastered.map((s) => s.item), "toppedUp");

  return { picks: shuffle(chosen, rand).map((item) => toPick(item, rand)), summary };
}

// How many letters a Smart quiz would skip right now (mastered and seen recently).
export function countSkippable(items: readonly QuizItem[], stats: readonly ItemStatDTO[], now = Date.now()): number {
  const statById = new Map(stats.map((s) => [s.itemId, s]));
  return items.filter((item) => {
    const stat = statById.get(item.id);
    return isMastered(stat) && now - Date.parse(stat!.lastSeenAt) <= REVIEW_AFTER_DAYS * DAY_MS;
  }).length;
}
