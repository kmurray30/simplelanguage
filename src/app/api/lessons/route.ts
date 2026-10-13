import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { QUIZ_TYPES } from "@/lib/decks";
import { LanguageCodeSchema } from "@/lib/schemas";
import { outcomeOf, type AttemptResult } from "@/lib/lessonPlan";
import { loadQuiz } from "@/lib/quizServer";
import { loadRuns, loadStats, saveResults, type ItemResult } from "@/lib/quizStore";
import { resolveLearner } from "@/lib/learnerServer";
import { prisma } from "@/lib/prisma";
import { triggerAudioGeneration } from "@/lib/audioCache";
import { triggerBreakdownGeneration } from "@/lib/wordBreakdown";
import { POOL_PREFIX } from "@/lib/wordsQuiz";

const LessonSchema = z.object({
  deck: z.enum(QUIZ_TYPES),
  lang: LanguageCodeSchema,
  answerMode: z.enum(["native", "romanized"]).default("native"),
  results: z
    .array(
      z.object({
        itemId: z.string().min(1).max(60),
        // Every attempt at the item in order (an item has to be right twice in a row, so there can be many).
        attempts: z
          .array(z.object({ variantIndex: z.number().int().min(0).max(20), given: z.string().max(80) }))
          .min(1)
          .max(60),
      }),
    )
    .min(1)
    .max(40),
});

// Saves a finished lesson. Each item's viewings are re-graded on the server; the viewing it was first
// wrong answers it took sets how much its mastery score moves.
export async function POST(req: NextRequest) {
  const parsed = LessonSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { deck, lang, answerMode, results: submitted } = parsed.data;
  // New words a lesson introduces arrive as `pool:<id>`; they're graded as such, then saved to the list.
  const quiz = await loadQuiz(deck, lang, answerMode, submitted.map((r) => r.itemId));

  const results: ItemResult[] = [];
  for (const r of submitted) {
    const item = quiz.itemById(r.itemId);
    if (!item || r.attempts.some((a) => a.variantIndex >= item.variants.length)) {
      return NextResponse.json({ error: `Unknown question ${r.itemId}` }, { status: 400 });
    }
    const graded = r.attempts.map((a) => {
      const status = quiz.grade(item, a.variantIndex, a.given).status;
      // Blank or unparseable answers were skips in the lesson, so they count as misses.
      const result: AttemptResult = status === "correct" ? "correct" : status === "close" ? "close" : "wrong";
      return { ...a, result };
    });
    const attempts = graded.map((a) => ({ ...a, correct: a.result === "correct" }));
    results.push({ itemId: r.itemId, outcome: outcomeOf(graded.map((a) => a.result)), attempts });
  }

  // Progress is stored against the real word, so a pool word the lesson taught is added to the list
  // first (tagged "lesson", which is what the List page's Learned filter shows).
  const idMap = await saveLearnedWords(lang, results.map((r) => r.itemId));
  const saved = results.map((r) => ({ ...r, itemId: idMap[r.itemId] ?? r.itemId }));

  const learner = await resolveLearner(req);
  await saveResults({ learnerId: learner.learnerId, statsKey: quiz.statsKey, languageCode: quiz.languageCode, mode: "lesson", results: saved });

  return learner.remember(
    NextResponse.json(
      {
        outcomes: Object.fromEntries(results.map((r) => [r.itemId, r.outcome])),
        idMap,
        stats: await loadStats(learner.learnerId, quiz.statsKey),
        runs: await loadRuns(learner.learnerId, quiz.statsKey),
      },
      { status: 201 },
    ),
  );
}

// Creates a list word for each pool word a lesson taught (reusing one that's already there) and
// returns `pool:<id>` -> the list word's id.
async function saveLearnedWords(languageCode: z.infer<typeof LanguageCodeSchema>, itemIds: string[]): Promise<Record<string, string>> {
  const poolIds = itemIds.filter((id) => id.startsWith(POOL_PREFIX)).map((id) => id.slice(POOL_PREFIX.length));
  if (poolIds.length === 0) return {};
  const rows = await prisma.suggestionPoolWord.findMany({ where: { languageCode, id: { in: poolIds } } });
  const idMap: Record<string, string> = {};
  for (const row of rows) {
    const existing = await prisma.word.findFirst({ where: { languageCode, nativeText: row.nativeText } });
    if (existing) {
      idMap[`${POOL_PREFIX}${row.id}`] = existing.id;
      continue;
    }
    const word = await prisma.word.create({
      data: {
        languageCode,
        nativeText: row.nativeText,
        romanization: row.romanization,
        phonetic: row.phonetic,
        englishGloss: row.englishGloss,
        usageNote: row.usageNote,
        categories: row.categories,
        source: "lesson",
        audioClipId: row.audioClipId,
      },
    });
    if (!row.audioClipId) triggerAudioGeneration(word);
    triggerBreakdownGeneration(word);
    idMap[`${POOL_PREFIX}${row.id}`] = word.id;
  }
  return idMap;
}
