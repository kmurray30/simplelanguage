// The mastery score: one number per (learner, deck, item), 0-100, shared by every way of practising
// (lessons and quizzes alike). Correct answers push it up - first-shot answers most - and it decays
// over time, faster for items you know less well. Pure functions; the clock is passed in.

export type Outcome = "first" | "second" | "third" | "struggled" | "missed";

// How much one result moves the score. In a lesson every item ends up right, so what matters is how
// many wrong answers it took: none = "first", one = "second", two = "third", more = "struggled".
// A quiz answer is a single shot: right = "first", wrong = "missed".
export const BOOST: Record<Outcome, number> = {
  first: 40,
  second: 15,
  third: 5,
  struggled: 0,
  missed: -20,
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Days for the score to halve. Weak items fade in a few days, strong ones last over a week:
// score 20 -> 3 days, 50 -> 6 days, 100 -> 11 days.
export function halfLifeDays(score: number): number {
  return 1 + score / 10;
}

export type ScoreState = { score: number; scoreAt: string | Date | null };

function toMs(at: string | Date): number {
  return typeof at === "string" ? Date.parse(at) : at.getTime();
}

// The score right now, after decay.
export function effectiveScore(state: ScoreState | undefined, now: number): number {
  if (!state || state.scoreAt === null) return 0;
  const days = Math.max(0, now - toMs(state.scoreAt)) / DAY_MS;
  return state.score * 0.5 ** (days / halfLifeDays(state.score));
}

export function applyOutcome(state: ScoreState | undefined, outcome: Outcome, now: number): { score: number; scoreAt: Date } {
  const current = effectiveScore(state, now);
  return { score: Math.min(100, Math.max(0, current + BOOST[outcome])), scoreAt: new Date(now) };
}

// What the user sees: three states, never the number. Unlearned = never answered; reviewed = the
// score is holding up (it takes a good answer in a lesson, then another after it has faded a bit);
// needs review = learned once but the score is low or has decayed.
export type Band = "new" | "review" | "reviewed";

export const REVIEWED_AT = 60;

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
