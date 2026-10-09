import { redirect } from "next/navigation";
import { LetterQuiz } from "@/components/LetterQuiz";
import { DEFAULT_LANGUAGE, isLanguageCode } from "@/lib/languages";
import { availableQuizzes, isQuizType } from "@/lib/decks";
import { readLearnerId } from "@/lib/learner";
import { loadRuns, loadStats } from "@/lib/quizStore";

export const dynamic = "force-dynamic";

export default async function LetterQuizPage({ params, searchParams }: PageProps<"/quiz/[deck]">) {
  const [{ deck }, { lang }] = await Promise.all([params, searchParams]);
  const langParam = typeof lang === "string" ? lang : undefined;
  const languageCode = isLanguageCode(langParam) ? langParam : DEFAULT_LANGUAGE;
  // Unknown deck, or a deck from another language (e.g. switching to Korean while on /quiz/hiragana).
  if (!isQuizType(deck) || !availableQuizzes(languageCode).includes(deck)) redirect(`/quiz?lang=${languageCode}`);

  // No cookie yet means a first-time visitor: empty history (the learner row is created on first save).
  const learnerId = await readLearnerId();
  const [stats, runs] = learnerId
    ? await Promise.all([loadStats(learnerId, deck), loadRuns(learnerId, deck)])
    : [[], []];

  return <LetterQuiz key={deck} deck={deck} languageCode={languageCode} initialStats={stats} initialRuns={runs} />;
}
