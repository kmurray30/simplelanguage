// Registry of quizzes, keyed by deck. The letter decks are fixed data; a Words quiz is built from
// the user's word list (and answer mode), so callers pass those in. Both the server (re-grading on
// save) and the quiz/lesson UI resolve definitions here.

import type { QuizType } from "./decks";
import { HANGUL_QUIZ } from "./hangulQuiz";
import { HIRAGANA_QUIZ, KATAKANA_QUIZ } from "./kanaQuiz";
import type { LanguageCode } from "./languages";
import type { QuizDefinition } from "./quizTypes";
import { SYLLABLE_QUIZ } from "./syllableQuiz";
import { makeWordsQuiz, type AnswerMode, type QuizWord } from "./wordsQuiz";

const STATIC_QUIZZES: Record<Exclude<QuizType, "words">, QuizDefinition> = {
  symbols: HANGUL_QUIZ,
  syllables: SYLLABLE_QUIZ,
  hiragana: HIRAGANA_QUIZ,
  katakana: KATAKANA_QUIZ,
};

export function buildQuiz({
  deck,
  languageCode,
  words = [],
  answerMode = "native",
}: {
  deck: QuizType;
  languageCode: LanguageCode;
  words?: readonly QuizWord[];
  answerMode?: AnswerMode;
}): QuizDefinition {
  if (deck === "words") return makeWordsQuiz(words, languageCode, answerMode);
  return STATIC_QUIZZES[deck];
}

// Where a deck's progress is stored (words are per language).
export function statsKeyFor(deck: QuizType, languageCode: LanguageCode): string {
  return deck === "words" ? `words-${languageCode}` : deck;
}
