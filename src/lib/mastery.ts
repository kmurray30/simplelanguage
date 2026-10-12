// The proficiency score: one number per (learner, deck, item), 0-100, shared by every way of
// practising (lessons and quizzes alike). Pure functions; the clock is passed in.
//
// The model borrows from established spaced-repetition work (FSRS, SuperMemo, Duolingo's half-life
// regression) and from reinforcement learning's delta rule:
//
// - Learning is a delta-rule update towards 100: a good answer closes a fraction (alpha) of the gap
//   that's left, so the closer you are to 100 the less one answer adds.
// - How slowly a memory fades (its "stability") follows from how little gap is left: every success
//   multiplies stability, like FSRS and SM-2. A score of 50 holds for about a day, 90 for five days,
//   99 for about seven weeks and 99.99 for over a decade.
// - Forgetting follows FSRS's power-law curve, so the loss per day is largest around 50 (about 6
//   points) and tiny near 100, and a score never quite reaches 0.

export type Outcome = "first" | "second" | "third" | "struggled" | "missed";

// The share of the remaining gap to 100 that a result closes. In a lesson every item ends up right,
// so what matters is how many wrong answers it took: none = "first", one = "second", two = "third",
// more = "struggled". A quiz answer is a single shot: right = "first", wrong = "missed".
export const ALPHA: Record<Exclude<Outcome, "missed">, number> = {
  first: 0.8,
  second: 0.5,
  third: 0.3,
  struggled: 0.2,
};

// A miss in a quiz knocks this share off the current score.
export const MISS_LOSS = 0.3;

// Days of stability at a score of 50; every halving of the remaining gap doubles it.
const STABILITY_AT_50 = 1;
// FSRS's forgetting curve: R(t, S) = (1 + FACTOR * t / S) ^ DECAY, which is 0.9 when t = S.
const FACTOR = 19 / 81;
const DECAY = -0.5;

// Scores stop just short of 100 so the remaining gap (and so the stability) stays finite.
export const MAX_SCORE = 99.99;

const DAY_MS = 24 * 60 * 60 * 1000;

// Days a score holds up (the time for recall to drop to 90%), from how much gap is left.
export function stabilityDays(score: number): number {
  const gap = Math.max(100 - Math.min(score, MAX_SCORE), 100 - MAX_SCORE);
  return (STABILITY_AT_50 * 50) / gap;
}

export type ScoreState = { score: number; scoreAt: string | Date | null };

function toMs(at: string | Date): number {
  return typeof at === "string" ? Date.parse(at) : at.getTime();
}

// The score right now, after forgetting.
export function effectiveScore(state: ScoreState | undefined, now: number): number {
  if (!state || state.scoreAt === null) return 0;
  const days = Math.max(0, now - toMs(state.scoreAt)) / DAY_MS;
  return state.score * (1 + (FACTOR * days) / stabilityDays(state.score)) ** DECAY;
}

export function applyOutcome(state: ScoreState | undefined, outcome: Outcome, now: number): { score: number; scoreAt: Date } {
  const current = effectiveScore(state, now);
  const next = outcome === "missed" ? current * (1 - MISS_LOSS) : current + ALPHA[outcome] * (100 - current);
  return { score: Math.min(MAX_SCORE, Math.max(0, next)), scoreAt: new Date(now) };
}

// What the user sees: three states. Unlearned = never answered; reviewed = the score is holding up
// (one first-try lesson gets a word there, and it stays for about three days before fading back);
// needs review = learned but the score is low or has faded.
export type Band = "new" | "review" | "reviewed";

export const REVIEWED_AT = 70;

export const BAND_LABEL: Record<Band, string> = {
  new: "unlearned",
  review: "needs review",
  reviewed: "reviewed",
};

// `untestedIsReview`: your own words count as needing review from the moment you add them (you
// meant to learn them), so an untested one is "needs review", never "unlearned".
export function bandOf(state: ScoreState | undefined, now: number, untestedIsReview = false): Band {
  if (!state || state.scoreAt === null) return untestedIsReview ? "review" : "new";
  return effectiveScore(state, now) >= REVIEWED_AT ? "reviewed" : "review";
}
