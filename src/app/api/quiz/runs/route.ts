import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { QUIZ_TYPES } from "@/lib/decks";
import { getQuiz } from "@/lib/quizzes";
import { LEARNER_COOKIE, LEARNER_COOKIE_OPTIONS, isLearnerId } from "@/lib/learner";
import { loadRuns, loadStats } from "@/lib/quizStore";

const RunSchema = z.object({
  deck: z.enum(QUIZ_TYPES),
  mode: z.enum(["full", "smart"]),
  answers: z
    .array(
      z.object({
        itemId: z.string().min(1).max(20),
        variantIndex: z.number().int().min(0).max(20),
        given: z.string().max(8),
      }),
    )
    .min(1)
    // The longest quiz ("All" katakana) is 130 questions.
    .max(300),
});

// Saves a finished quiz. The server re-grades every answer from the question bank rather than
// trusting the client's verdict, then records the run and rolls the per-letter stats forward.
export async function POST(req: NextRequest) {
  const parsed = RunSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { deck, mode, answers } = parsed.data;
  const quiz = getQuiz(deck);
  if (!quiz) return NextResponse.json({ error: `No quiz for ${deck}` }, { status: 400 });

  const graded: (z.infer<typeof RunSchema>["answers"][number] & { correct: boolean })[] = [];
  for (const a of answers) {
    const item = quiz.itemById(a.itemId);
    if (!item || a.variantIndex >= item.variants.length) {
      return NextResponse.json({ error: `Unknown question ${a.itemId}` }, { status: 400 });
    }
    graded.push({ ...a, correct: quiz.grade(item, a.variantIndex, a.given).status === "correct" });
  }

  const cookieId = req.cookies.get(LEARNER_COOKIE)?.value;
  const existing = isLearnerId(cookieId) ? await prisma.learner.findUnique({ where: { id: cookieId } }) : null;
  const learnerId = existing?.id ?? (await prisma.learner.create({ data: {} })).id;

  const now = new Date();
  const correct = graded.filter((a) => a.correct).length;

  const run = await prisma.$transaction(async (tx) => {
    const created = await tx.quizRun.create({
      data: {
        learnerId,
        languageCode: quiz.languageCode,
        deck,
        mode,
        total: graded.length,
        correct,
        answers: {
          create: graded.map((a) => ({
            itemId: a.itemId,
            variantIndex: a.variantIndex,
            given: a.given,
            correct: a.correct,
          })),
        },
      },
    });

    const stats = new Map(
      (await tx.itemStat.findMany({ where: { learnerId, deck } })).map((s) => [s.itemId, s]),
    );
    for (const a of graded) {
      const prev = stats.get(a.itemId);
      const next = {
        learnerId,
        deck,
        itemId: a.itemId,
        seen: (prev?.seen ?? 0) + 1,
        correctCount: (prev?.correctCount ?? 0) + (a.correct ? 1 : 0),
        correctStreak: a.correct ? (prev?.correctStreak ?? 0) + 1 : 0,
        lastSeenAt: now,
        lastWrongAt: a.correct ? (prev?.lastWrongAt ?? null) : now,
      };
      stats.set(a.itemId, next);
      await tx.itemStat.upsert({
        where: { learnerId_deck_itemId: { learnerId, deck, itemId: a.itemId } },
        create: next,
        update: next,
      });
    }
    return created;
  });

  const res = NextResponse.json(
    {
      run: { id: run.id, mode, total: run.total, correct: run.correct, createdAt: run.createdAt.toISOString() },
      stats: await loadStats(learnerId, deck),
      runs: await loadRuns(learnerId, deck),
    },
    { status: 201 },
  );
  if (!existing) res.cookies.set(LEARNER_COOKIE, learnerId, LEARNER_COOKIE_OPTIONS);
  return res;
}
