import Link from "next/link";
import { clsx } from "clsx";
import { LANGUAGES } from "@/lib/languages";
import { DECK_LABELS, type DeckType } from "@/lib/decks";
import { loadDeckSummaries, parseLanguage } from "@/lib/quizServer";

export const dynamic = "force-dynamic";

const DECK_BLURB: Record<DeckType, string> = {
  words: "The words you've added to your list - see the meaning, type the word.",
  symbols: "The 40 Hangul letters: sound, name and an English example.",
  syllables: "270 common syllable blocks, from the basic grid to the tricky ones.",
  hiragana: "All the hiragana: the basic 46, voiced ゛ and ゜ kana, combinations like きゃ, and small っ.",
  katakana: "All the katakana, plus the long-vowel mark ー and foreign sounds like ファ and ティ.",
};

const buttonBase = "px-3.5 py-1.5 rounded-full text-sm transition-colors";

export default async function LearnPage({ searchParams }: PageProps<"/learn">) {
  const { lang } = await searchParams;
  const languageCode = parseLanguage(lang);
  const language = LANGUAGES[languageCode];
  const summaries = await loadDeckSummaries(languageCode);

  return (
    <div className="mx-auto max-w-lg w-full px-4 sm:px-6 py-8 flex flex-col gap-4">
      <h1 className="text-lg font-medium">
        <span aria-hidden>{language.flag}</span> Learn {language.name}
      </h1>
      <ul className="flex flex-col gap-3">
        {summaries.map(({ deck, total, counts }) => {
          const known = counts.strong + counts.learning + counts.weak;
          return (
            <li key={deck} className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-3">
              <div>
                <h2 className="font-medium">{DECK_LABELS[deck]}</h2>
                <p className="text-sm text-foreground-muted">{DECK_BLURB[deck]}</p>
              </div>
              {total > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="flex h-1.5 rounded-full overflow-hidden bg-surface-muted" aria-hidden>
                    <div className="bg-success" style={{ width: `${(counts.strong / total) * 100}%` }} />
                    <div className="bg-accent" style={{ width: `${(counts.learning / total) * 100}%` }} />
                    <div className="bg-danger/60" style={{ width: `${(counts.weak / total) * 100}%` }} />
                  </div>
                  <p className="text-xs text-foreground-muted">
                    {known === 0
                      ? `${total} to learn`
                      : `${counts.strong} strong · ${counts.learning} learning · ${counts.weak} weak · ${counts.new} new`}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/flashcards?lang=${languageCode}&deck=${deck}`}
                  className={clsx(buttonBase, "border border-border hover:bg-surface-muted")}
                >
                  Flashcards
                </Link>
                <Link href={`/learn/${deck}/quiz?lang=${languageCode}`} className={clsx(buttonBase, "border border-border hover:bg-surface-muted")}>
                  Quiz
                </Link>
                <Link href={`/learn/${deck}/lesson?lang=${languageCode}`} className={clsx(buttonBase, "bg-accent text-accent-foreground hover:opacity-90")}>
                  Lesson
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
