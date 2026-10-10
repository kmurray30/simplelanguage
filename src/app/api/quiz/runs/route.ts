import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { QUIZ_TYPES } from "@/lib/decks";
import { LanguageCodeSchema } from "@/lib/schemas";
import { loadQuiz } from "@/lib/quizServer";
import { loadRuns, loadStats, saveResults, type ItemResult } from "@/lib/quizStore";
import { resolveLearner } from "@/lib/learnerServer";

const RunSchema = z.object({
  deck: z.enum(QUIZ_TYPES),
  lang: LanguageCodeSchema,
  answerMode: z.enum(["native", "romanized"]).default("native"),
  mode: z.enum(["full", "smart"]),
  answers: z
    .array(
      z.object({
        itemId: z.string().min(1).max(60),
        variantIndex: z.number().int().min(0).max(20),
        given: z.string().max(80),
      }),
    )
    .min(1)
    // The longest quiz ("All" katakana) is 130 questions; a big word list can be longer.
    .max(1000),
});

// Saves a finished quiz. The server re-grades every answer from the question bank rather than
// trusting the client's verdict, then records the run and rolls the per-item stats and mastery
// scores forward (a quiz answer is a single shot: right = first try, wrong = missed).
export async function POST(req: NextRequest) {
  const parsed = RunSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { deck, lang, answerMode, mode, answers } = parsed.data;
  const quiz = await loadQuiz(deck, lang, answerMode);

  const results: ItemResult[] = [];
  for (const a of answers) {
    const item = quiz.itemById(a.itemId);
    if (!item || a.variantIndex >= item.variants.length) {
      return NextResponse.json({ error: `Unknown question ${a.itemId}` }, { status: 400 });
    }
    const correct = quiz.grade(item, a.variantIndex, a.given).status === "correct";
    results.push({ itemId: a.itemId, outcome: correct ? "first" : "missed", attempts: [{ ...a, correct }] });
  }

  const learner = await resolveLearner(req);
  const run = await saveResults({ learnerId: learner.learnerId, statsKey: quiz.statsKey, languageCode: quiz.languageCode, mode, results });

  return learner.remember(
    NextResponse.json(
      {
        run: { id: run.id, mode, total: run.total, correct: run.correct, createdAt: run.createdAt.toISOString() },
        stats: await loadStats(learner.learnerId, quiz.statsKey),
        runs: await loadRuns(learner.learnerId, quiz.statsKey),
      },
      { status: 201 },
    ),
  );
}
