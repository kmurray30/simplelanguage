import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { QUIZ_TYPES } from "@/lib/decks";
import { LanguageCodeSchema } from "@/lib/schemas";
import { outcomeOf } from "@/lib/lessonPlan";
import { loadQuiz } from "@/lib/quizServer";
import { loadRuns, loadStats, saveResults, type ItemResult } from "@/lib/quizStore";
import { resolveLearner } from "@/lib/learnerServer";

const LessonSchema = z.object({
  deck: z.enum(QUIZ_TYPES),
  lang: LanguageCodeSchema,
  answerMode: z.enum(["native", "romanized"]).default("native"),
  results: z
    .array(
      z.object({
        itemId: z.string().min(1).max(60),
        // Every viewing of the item in order: one if right first time, up to three otherwise.
        attempts: z
          .array(z.object({ variantIndex: z.number().int().min(0).max(20), given: z.string().max(80) }))
          .min(1)
          .max(3),
      }),
    )
    .min(1)
    .max(40),
});

// Saves a finished lesson. Each item's viewings are re-graded on the server; the viewing it was first
// right on (1st / 2nd / 3rd, or never) sets how much its mastery score moves.
export async function POST(req: NextRequest) {
  const parsed = LessonSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { deck, lang, answerMode, results: submitted } = parsed.data;
  const quiz = await loadQuiz(deck, lang, answerMode);

  const results: ItemResult[] = [];
  for (const r of submitted) {
    const item = quiz.itemById(r.itemId);
    if (!item || r.attempts.some((a) => a.variantIndex >= item.variants.length)) {
      return NextResponse.json({ error: `Unknown question ${r.itemId}` }, { status: 400 });
    }
    const attempts = r.attempts.map((a) => ({ ...a, correct: quiz.grade(item, a.variantIndex, a.given).status === "correct" }));
    results.push({ itemId: r.itemId, outcome: outcomeOf(attempts.map((a) => a.correct)), attempts });
  }

  const learner = await resolveLearner(req);
  await saveResults({ learnerId: learner.learnerId, statsKey: quiz.statsKey, languageCode: quiz.languageCode, mode: "lesson", results });

  return learner.remember(
    NextResponse.json(
      {
        outcomes: Object.fromEntries(results.map((r) => [r.itemId, r.outcome])),
        stats: await loadStats(learner.learnerId, quiz.statsKey),
        runs: await loadRuns(learner.learnerId, quiz.statsKey),
      },
      { status: 201 },
    ),
  );
}
