import { prisma } from "@/lib/prisma";
import { buildQuiz } from "@/lib/quizzes";
import type { QuizType } from "@/lib/decks";
import type { LanguageCode } from "@/lib/languages";
import type { QuizDefinition } from "@/lib/quizTypes";
import type { AnswerMode, QuizWord } from "@/lib/wordsQuiz";
import { redirect } from "next/navigation";
import { DEFAULT_LANGUAGE, isLanguageCode } from "@/lib/languages";
import { availableQuizzes, availableDecks, isQuizType } from "@/lib/decks";
import { readLearnerId } from "@/lib/learner";
import { loadRuns, loadStats } from "@/lib/quizStore";
import { bandOf, type Band } from "@/lib/mastery";
import { statsKeyFor } from "@/lib/quizzes";
// The user's words for a language, oldest first - the order new words are introduced in lessons.
export async function loadQuizWords(languageCode: LanguageCode): Promise<QuizWord[]> {
  return prisma.word.findMany({
    where: { languageCode },
    orderBy: { createdAt: "asc" },
    select: { id: true, nativeText: true, romanization: true, englishGloss: true, usageNote: true, categories: true },
  });
}

export async function loadQuiz(deck: QuizType, languageCode: LanguageCode, answerMode: AnswerMode): Promise<QuizDefinition> {
  const words = deck === "words" ? await loadQuizWords(languageCode) : [];
  return buildQuiz({ deck, languageCode, words, answerMode });
}


function parseLanguage(lang: string | string[] | undefined): LanguageCode {
  const value = typeof lang === "string" ? lang : undefined;
  return isLanguageCode(value) ? value : DEFAULT_LANGUAGE;
}

// Everything the Quiz and Lesson pages need for one deck. Redirects to the Learn hub for a deck the
// language doesn't have (e.g. switching to Korean while on /learn/hiragana/quiz).
export async function loadSession(deckParam: string, search: { lang?: string | string[]; answer?: string | string[] }) {
  const languageCode = parseLanguage(search.lang);
  if (!isQuizType(deckParam) || !availableQuizzes(languageCode).includes(deckParam)) redirect(`/learn?lang=${languageCode}`);
  const deck = deckParam;
  const answerMode: AnswerMode = search.answer === "romanized" ? "romanized" : "native";
  const statsKey = statsKeyFor(deck, languageCode);
  // No cookie yet means a first-time visitor: empty history (the learner row is created on first save).
  const learnerId = await readLearnerId();
  const [words, stats, runs] = await Promise.all([
    deck === "words" ? loadQuizWords(languageCode) : Promise.resolve([]),
    learnerId ? loadStats(learnerId, statsKey) : Promise.resolve([]),
    learnerId ? loadRuns(learnerId, statsKey) : Promise.resolve([]),
  ]);
  return { deck, languageCode, answerMode, words, stats, runs };
}

export type DeckSummary = { deck: QuizType; total: number; counts: Record<Band, number> };

// Per-deck mastery counts for the Learn hub.
export async function loadDeckSummaries(languageCode: LanguageCode): Promise<DeckSummary[]> {
  const learnerId = await readLearnerId();
  const words = await loadQuizWords(languageCode);
  const now = Date.now();
  return Promise.all(
    availableDecks(languageCode).map(async (deck) => {
      const quiz = buildQuiz({ deck, languageCode, words });
      const stats = learnerId ? await loadStats(learnerId, quiz.statsKey) : [];
      const byId = new Map(stats.map((s) => [s.itemId, s]));
      const counts: Record<Band, number> = { new: 0, weak: 0, learning: 0, strong: 0 };
      for (const item of quiz.items) counts[bandOf(byId.get(item.id), now)]++;
      return { deck, total: quiz.items.length, counts };
    }),
  );
}

export { parseLanguage };
