// Registry of letter quizzes, keyed by deck. Both the server (grading on save) and the quiz UI
// look quizzes up here, so a new script is one data file plus one line below.

import type { QuizType } from "./decks";
import { HANGUL_QUIZ } from "./hangulQuiz";
import { HIRAGANA_QUIZ, KATAKANA_QUIZ } from "./kanaQuiz";
import type { QuizDefinition } from "./quizTypes";

const QUIZZES: Record<QuizType, QuizDefinition> = {
  symbols: HANGUL_QUIZ,
  hiragana: HIRAGANA_QUIZ,
  katakana: KATAKANA_QUIZ,
};

export function getQuiz(deck: string): QuizDefinition | undefined {
  return Object.hasOwn(QUIZZES, deck) ? QUIZZES[deck as QuizType] : undefined;
}
