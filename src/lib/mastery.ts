// The mastery score: one number per (learner, deck, item), 0-100, shared by every way of practising
// (lessons and quizzes alike). Correct answers push it up - first-shot answers most - and it decays
// over time, faster for items you know less well. Pure functions; the clock is passed in.

export type Outcome = "first" | "second" | "third" | "missed";

// How much one result moves the score. A lesson item counts as right on the viewing it was first
// answered correctly (1st / 2nd / 3rd) or missed if all three viewings were wrong. A quiz answer is
// a single shot: right = "first", wrong = "missed".
export const BOOST: Record<Outcome, number> = {
  first: 40,
  second: 15,
  third: 5,
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

export type Band = "new" | "weak" | "learning" | "strong";

export const BAND_LABEL: Record<Band, string> = {
  new: "not learned yet",
  weak: "weak (under 30)",
  learning: "learning (30-74)",
  strong: "strong (75+)",
};

export function bandOf(state: ScoreState | undefined, now: number): Band {
  if (!state || state.scoreAt === null) return "new";
  const score = effectiveScore(state, now);
  // A first-try answer on a new item scores 40, so it reads as "learning" for a couple of days
  // before fading to "weak" and asking for review; two first-try answers make it "strong".
  if (score >= 75) return "strong";
  if (score >= 30) return "learning";
  return "weak";
}
