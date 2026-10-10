import { LessonSession } from "@/components/LessonSession";
import { loadSession } from "@/lib/quizServer";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params, searchParams }: PageProps<"/learn/[deck]/lesson">) {
  const [{ deck }, search] = await Promise.all([params, searchParams]);
  const s = await loadSession(deck, search);
  return (
    <LessonSession
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
