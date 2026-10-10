import { QuizSession } from "@/components/QuizSession";
import { loadSession } from "@/lib/quizServer";

export const dynamic = "force-dynamic";

export default async function QuizPage({ params, searchParams }: PageProps<"/learn/[deck]/quiz">) {
  const [{ deck }, search] = await Promise.all([params, searchParams]);
  const s = await loadSession(deck, search);
  return (
    <QuizSession
      key={`${s.deck}-${s.languageCode}`}
      deck={s.deck}
      languageCode={s.languageCode}
      words={s.words}
      initialAnswerMode={s.answerMode}
      initialStats={s.stats}
      initialRuns={s.runs}
    />
  );
}
