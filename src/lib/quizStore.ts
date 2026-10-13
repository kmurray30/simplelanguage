import { prisma } from "@/lib/prisma";
import { applyOutcome, type Outcome } from "@/lib/mastery";
import type { ItemStatDTO, QuizMode, RunDTO } from "@/lib/quizSelection";
import type { LanguageCode } from "@/lib/languages";

export const QUIZ_HISTORY_LIMIT = 20;

export async function loadStats(learnerId: string, statsKey: string): Promise<ItemStatDTO[]> {
  const rows = await prisma.itemStat.findMany({ where: { learnerId, deck: statsKey } });
  return rows.map((r) => ({
    itemId: r.itemId,
    seen: r.seen,
    correctCount: r.correctCount,
    correctStreak: r.correctStreak,
    lastSeenAt: r.lastSeenAt.toISOString(),
    lastWrongAt: r.lastWrongAt?.toISOString() ?? null,
    score: r.score,
    scoreAt: r.scoreAt?.toISOString() ?? null,
  }));
}

// Newest first.
export async function loadRuns(learnerId: string, statsKey: string): Promise<RunDTO[]> {
  const rows = await prisma.quizRun.findMany({
    where: { learnerId, deck: statsKey },
    orderBy: { createdAt: "desc" },
    take: QUIZ_HISTORY_LIMIT,
  });
  return rows.map((r) => ({
    id: r.id,
    mode: (["full", "smart", "lesson"].includes(r.mode) ? r.mode : "full") as QuizMode,
    total: r.total,
    correct: r.correct,
    createdAt: r.createdAt.toISOString(),
  }));
}

export type ItemResult = {
  itemId: string;
  outcome: Outcome; // quiz: "first" or "missed"; lesson: the viewing it was first right on
  attempts: { variantIndex: number; given: string; correct: boolean }[];
};

// Records one finished quiz or lesson: the run, every attempt, and each item's rolling stats and
// mastery score. Returns the run row.
export async function saveResults({
  learnerId,
  statsKey,
  languageCode,
  mode,
  results,
  now = new Date(),
}: {
  learnerId: string;
  statsKey: string;
  languageCode: LanguageCode;
  mode: QuizMode;
  results: ItemResult[];
  now?: Date;
}) {
  return prisma.$transaction(async (tx) => {
    const run = await tx.quizRun.create({
      data: {
        learnerId,
        languageCode,
        deck: statsKey,
        mode,
        total: results.length,
        correct: results.filter((r) => r.outcome === "first").length,
        answers: {
          create: results.flatMap((r) =>
            r.attempts.map((a) => ({ itemId: r.itemId, variantIndex: a.variantIndex, given: a.given, correct: a.correct })),
          ),
        },
      },
    });

    const stats = new Map((await tx.itemStat.findMany({ where: { learnerId, deck: statsKey } })).map((s) => [s.itemId, s]));
    for (const r of results) {
      const prev = stats.get(r.itemId);
      const right = r.outcome === "first";
      const scored = applyOutcome(prev ? { score: prev.score, scoreAt: prev.scoreAt } : undefined, r.outcome, now.getTime());
      const next = {
        learnerId,
        deck: statsKey,
        itemId: r.itemId,
        seen: (prev?.seen ?? 0) + 1,
        correctCount: (prev?.correctCount ?? 0) + (right ? 1 : 0),
        correctStreak: right ? (prev?.correctStreak ?? 0) + 1 : 0,
        lastSeenAt: now,
        lastWrongAt: right ? (prev?.lastWrongAt ?? null) : now,
        score: scored.score,
        scoreAt: scored.scoreAt,
      };
      stats.set(r.itemId, next);
      await tx.itemStat.upsert({
        where: { learnerId_deck_itemId: { learnerId, deck: statsKey, itemId: r.itemId } },
        create: next,
        update: next,
      });
    }
    return run;
  });
}
