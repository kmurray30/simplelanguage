import Link from "next/link";
import { DEFAULT_LANGUAGE, LANGUAGES, isLanguageCode } from "@/lib/languages";
import { DECK_LABELS, availableDecks, availableQuizzes, type DeckType, type QuizType } from "@/lib/decks";

const DECK_BLURB: Record<DeckType, string> = {
  words: "The words you've added to your list.",
  symbols: "The 40 Hangul letters: sound, name and an English example.",
  syllables: "270 common syllable blocks, from the basic grid to the tricky ones.",
  hiragana: "All the hiragana: the basic 46, voiced ゛ and ゜ kana, combinations like きゃ, and small っ.",
  katakana: "All the katakana, plus the long-vowel mark ー and foreign sounds like ファ and ティ.",
};

const QUIZ_BLURB: Partial<Record<DeckType, string>> = {
  symbols: "See an English sound, write the Hangul letter. Tracks your score and your weak spots.",
  hiragana: "See an English sound and its romaji, write the hiragana - including the particles は, へ, を.",
  katakana: "See an English sound and its romaji, write the katakana - including ー and foreign sounds.",
};

// Maps a deck to its quiz, when one exists.
const DECK_QUIZ: Partial<Record<DeckType, QuizType>> = {
  symbols: "symbols",
  hiragana: "hiragana",
  katakana: "katakana",
};

const buttonBase = "px-3.5 py-1.5 rounded-full text-sm transition-colors";

export default async function QuizHubPage({ searchParams }: PageProps<"/quiz">) {
  const { lang } = await searchParams;
  const langParam = typeof lang === "string" ? lang : undefined;
  const languageCode = isLanguageCode(langParam) ? langParam : DEFAULT_LANGUAGE;
  const language = LANGUAGES[languageCode];
  const decks = availableDecks(languageCode);
  const quizzes = availableQuizzes(languageCode);

  return (
    <div className="mx-auto max-w-lg w-full px-4 sm:px-6 py-8 flex flex-col gap-4">
      <h1 className="text-lg font-medium">
        <span aria-hidden>{language.flag}</span> Practice {language.name}
      </h1>
      <ul className="flex flex-col gap-3">
        {decks.map((deck) => {
          const quiz = DECK_QUIZ[deck];
          const hasQuiz = quiz !== undefined && quizzes.includes(quiz);
          return (
            <li key={deck} className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-3">
              <div>
                <h2 className="font-medium">{DECK_LABELS[deck]}</h2>
                <p className="text-sm text-foreground-muted">{DECK_BLURB[deck]}</p>
                {hasQuiz && <p className="text-sm text-foreground-muted mt-1">Quiz: {QUIZ_BLURB[deck]}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/flashcards?lang=${languageCode}&deck=${deck}`}
                  className={`${buttonBase} border border-border hover:bg-surface-muted`}
                >
                  Flashcards
                </Link>
                {hasQuiz ? (
                  <Link
                    href={`/quiz/${quiz}?lang=${languageCode}`}
                    className={`${buttonBase} bg-accent text-accent-foreground hover:opacity-90`}
                  >
                    Quiz
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className={`${buttonBase} border border-dashed border-border text-foreground-muted cursor-not-allowed`}
                  >
                    Quiz · coming soon
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
