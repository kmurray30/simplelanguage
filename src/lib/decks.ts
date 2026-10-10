import type { LanguageCode } from "./languages";

export const DECK_TYPES = ["words", "symbols", "syllables", "hiragana", "katakana"] as const;
export type DeckType = (typeof DECK_TYPES)[number];

export const DECK_LABELS: Record<DeckType, string> = {
  words: "Words",
  symbols: "Symbols",
  syllables: "Syllables",
  hiragana: "Hiragana",
  katakana: "Katakana",
};

export function isDeckType(value: unknown): value is DeckType {
  return typeof value === "string" && (DECK_TYPES as readonly string[]).includes(value);
}

// The reference decks are script-specific (Hangul for Korean, kana for Japanese); every other
// language only has the user's own words. Adding another language's alphabet deck means adding its
// data file and listing it here.
export function availableDecks(languageCode: LanguageCode): DeckType[] {
  if (languageCode === "ko") return ["words", "symbols", "syllables"];
  if (languageCode === "ja") return ["words", "hiragana", "katakana"];
  return ["words"];
}

// Quizzes and lessons: one per deck. A quiz shares its name with the deck it drills.
export const QUIZ_TYPES = ["words", "symbols", "syllables", "hiragana", "katakana"] as const;
export type QuizType = (typeof QUIZ_TYPES)[number];

export function isQuizType(value: unknown): value is QuizType {
  return typeof value === "string" && (QUIZ_TYPES as readonly string[]).includes(value);
}

// Every deck has a quiz and a lesson.
export function availableQuizzes(languageCode: LanguageCode): QuizType[] {
  return availableDecks(languageCode);
}
