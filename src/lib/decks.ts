import type { LanguageCode } from "./languages";

export const DECK_TYPES = ["words", "symbols", "syllables"] as const;
export type DeckType = (typeof DECK_TYPES)[number];

export const DECK_LABELS: Record<DeckType, string> = {
  words: "Words",
  symbols: "Symbols",
  syllables: "Syllables",
};

export function isDeckType(value: unknown): value is DeckType {
  return typeof value === "string" && (DECK_TYPES as readonly string[]).includes(value);
}

// The Symbols/Syllables reference decks are Hangul-specific; every other language only has
// the user's own words. Adding another language's alphabet deck means adding its data file and
// listing it here.
export function availableDecks(languageCode: LanguageCode): DeckType[] {
  return languageCode === "ko" ? ["words", "symbols", "syllables"] : ["words"];
}
