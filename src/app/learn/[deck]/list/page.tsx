import { redirect } from "next/navigation";
import { SymbolList } from "@/components/SymbolList";
import { loadSession } from "@/lib/quizServer";

export const dynamic = "force-dynamic";

// Every symbol in a reference deck (Hangul, kana), tap one for its details. Words have the Vocab page.
export default async function SymbolListPage({ params, searchParams }: PageProps<"/learn/[deck]/list">) {
  const [{ deck }, search] = await Promise.all([params, searchParams]);
  const s = await loadSession(deck, search);
  if (s.deck === "words") redirect(`/?lang=${s.languageCode}`);
  return <SymbolList key={`${s.deck}-${s.languageCode}`} deck={s.deck} languageCode={s.languageCode} stats={s.stats} />;
}
