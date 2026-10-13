import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { availableDecks, availableQuizzes, isQuizType, type QuizType } from "@/lib/decks";
import { DEFAULT_LANGUAGE, isLanguageCode, type LanguageCode } from "@/lib/languages";
import { readLearnerId } from "@/lib/learner";
import { bandOf, type Band } from "@/lib/mastery";
import { loadRuns, loadStats } from "@/lib/quizStore";
import { buildQuiz, statsKeyFor } from "@/lib/quizzes";
import type { QuizDefinition } from "@/lib/quizTypes";
import { POOL_PREFIX, defaultAnswerMode, type AnswerMode, type QuizWord } from "@/lib/wordsQuiz";

// The user's words for a language, oldest first - the order unlearned words are introduced in lessons.
export async function loadQuizWords(languageCode: LanguageCode): Promise<QuizWord[]> {
  return prisma.word.findMany({
    where: { languageCode },
    orderBy: { createdAt: "asc" },
    select: { id: true, nativeText: true, romanization: true, englishGloss: true, usageNote: true, categories: true },
  });
}

const POOL_SELECT = { id: true, nativeText: true, romanization: true, englishGloss: true, usageNote: true, categories: true } as const;

type PoolRow = { id: string; nativeText: string; romanization: string; englishGloss: string; usageNote: string; categories: QuizWord["categories"] };

function poolAsQuizWord(p: PoolRow): QuizWord {
  return {
    id: `${POOL_PREFIX}${p.id}`,
    nativeText: p.nativeText,
    romanization: p.romanization,
    englishGloss: p.englishGloss,
    usageNote: p.usageNote,
    categories: p.categories,
  };
}

// Words a lesson can introduce: the most useful ones from the language's suggestion pool that
// aren't on the user's list yet, best first. (A lesson saves the ones it teaches to the list.)
export async function loadPoolCandidates(languageCode: LanguageCode, limit = 18): Promise<QuizWord[]> {
  const [pool, existing] = await Promise.all([
    prisma.suggestionPoolWord.findMany({ where: { languageCode }, orderBy: { rank: "asc" }, take: 200, select: POOL_SELECT }),
    prisma.word.findMany({ where: { languageCode }, select: { nativeText: true } }),
  ]);
  const have = new Set(existing.map((w) => w.nativeText));
  return pool.filter((p) => !have.has(p.nativeText)).slice(0, limit).map(poolAsQuizWord);
}

// Pool words by their quiz ids (`pool:<id>`), for re-grading a saved lesson.
export async function loadPoolWordsById(languageCode: LanguageCode, quizIds: string[]): Promise<QuizWord[]> {
  const ids = quizIds.filter((id) => id.startsWith(POOL_PREFIX)).map((id) => id.slice(POOL_PREFIX.length));
  if (ids.length === 0) return [];
  const rows = await prisma.suggestionPoolWord.findMany({ where: { languageCode, id: { in: ids } }, select: POOL_SELECT });
  return rows.map(poolAsQuizWord);
}

export async function loadQuiz(
  deck: QuizType,
  languageCode: LanguageCode,
  answerMode: AnswerMode,
  poolQuizIds: string[] = [],
): Promise<QuizDefinition> {
  const words =
    deck === "words" ? [...(await loadQuizWords(languageCode)), ...(await loadPoolWordsById(languageCode, poolQuizIds))] : [];
  return buildQuiz({ deck, languageCode, words, answerMode });
}

export function parseLanguage(lang: string | string[] | undefined): LanguageCode {
  const value = typeof lang === "string" ? lang : undefined;
  return isLanguageCode(value) ? value : DEFAULT_LANGUAGE;
}

// Everything the Quiz and Lesson pages need for one deck. Redirects to the Learn hub for a deck the
// language doesn't have (e.g. switching to Korean while on /learn/hiragana/quiz).
export async function loadSession(
  deckParam: string,
  search: { lang?: string | string[]; answer?: string | string[] },
  { withPool = false }: { withPool?: boolean } = {},
) {
  const languageCode = parseLanguage(search.lang);
  if (!isQuizType(deckParam) || !availableQuizzes(languageCode).includes(deckParam)) redirect(`/learn?lang=${languageCode}`);
  const deck = deckParam;
  const answerMode = defaultAnswerMode(languageCode, typeof search.answer === "string" ? search.answer : undefined);
  const statsKey = statsKeyFor(deck, languageCode);
  // No cookie yet means a first-time visitor: empty history (the learner row is created on first save).
  const learnerId = await readLearnerId();
  const [words, poolWords, stats, runs] = await Promise.all([
    deck === "words" ? loadQuizWords(languageCode) : Promise.resolve([]),
    deck === "words" && withPool ? loadPoolCandidates(languageCode) : Promise.resolve([]),
    learnerId ? loadStats(learnerId, statsKey) : Promise.resolve([]),
    learnerId ? loadRuns(learnerId, statsKey) : Promise.resolve([]),
  ]);
  return { deck, languageCode, answerMode, words, poolWords, stats, runs };
}

export type DeckSummary = { deck: QuizType; total: number; counts: Record<Band, number> };

// Per-deck progress counts for the Learn hub.
export async function loadDeckSummaries(languageCode: LanguageCode): Promise<DeckSummary[]> {
  const learnerId = await readLearnerId();
  const words = await loadQuizWords(languageCode);
  const now = Date.now();
  return Promise.all(
    availableDecks(languageCode).map(async (deck) => {
      const quiz = buildQuiz({ deck, languageCode, words });
      const stats = learnerId ? await loadStats(learnerId, quiz.statsKey) : [];
      const byId = new Map(stats.map((s) => [s.itemId, s]));
      const counts: Record<Band, number> = { new: 0, review: 0, reviewed: 0 };
      for (const item of quiz.items) counts[bandOf(byId.get(item.id), now, deck === "words")]++;
      return { deck, total: quiz.items.length, counts };
    }),
  );
}
