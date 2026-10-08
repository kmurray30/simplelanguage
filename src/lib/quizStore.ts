import { prisma } from "@/lib/prisma";
import type { ItemStatDTO, QuizMode, RunDTO } from "@/lib/quizSelection";

export const QUIZ_HISTORY_LIMIT = 20;

export async function loadStats(learnerId: string, deck: string): Promise<ItemStatDTO[]> {
  const rows = await prisma.itemStat.findMany({ where: { learnerId, deck } });
  return rows.map((r) => ({
    itemId: r.itemId,
    seen: r.seen,
    correctCount: r.correctCount,
    correctStreak: r.correctStreak,
    lastSeenAt: r.lastSeenAt.toISOString(),
    lastWrongAt: r.lastWrongAt?.toISOString() ?? null,
  }));
}

// Newest first.
export async function loadRuns(learnerId: string, deck: string): Promise<RunDTO[]> {
  const rows = await prisma.quizRun.findMany({
    where: { learnerId, deck },
    orderBy: { createdAt: "desc" },
    take: QUIZ_HISTORY_LIMIT,
  });
  return rows.map((r) => ({
    id: r.id,
    mode: r.mode === "smart" ? ("smart" as QuizMode) : ("full" as QuizMode),
    total: r.total,
    correct: r.correct,
    createdAt: r.createdAt.toISOString(),
  }));
}
