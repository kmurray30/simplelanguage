import { redirect } from "next/navigation";
import { SymbolsQuiz } from "@/components/SymbolsQuiz";
import { DEFAULT_LANGUAGE, isLanguageCode } from "@/lib/languages";
import { availableQuizzes } from "@/lib/decks";
import { readLearnerId } from "@/lib/learner";
import { loadRuns, loadStats } from "@/lib/quizStore";

export const dynamic = "force-dynamic";

export default async function SymbolsQuizPage({ searchParams }: PageProps<"/quiz/symbols">) {
  const { lang } = await searchParams;
  const langParam = typeof lang === "string" ? lang : undefined;
  const languageCode = isLanguageCode(langParam) ? langParam : DEFAULT_LANGUAGE;
  if (!availableQuizzes(languageCode).includes("symbols")) redirect(`/quiz?lang=${languageCode}`);

  // No cookie yet means a first-time visitor: empty history (the learner row is created on first save).
  const learnerId = await readLearnerId();
  const [stats, runs] = learnerId
    ? await Promise.all([loadStats(learnerId, "symbols"), loadRuns(learnerId, "symbols")])
    : [[], []];

  return <SymbolsQuiz languageCode={languageCode} initialStats={stats} initialRuns={runs} />;
}
