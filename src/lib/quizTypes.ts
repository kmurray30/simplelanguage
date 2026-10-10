// Shapes shared by every letter quiz (Hangul Symbols, Hiragana, Katakana). Each script supplies a
// QuizDefinition - its items, grading and copy - and the quiz UI, the save route and the Smart quiz
// selection all work from that, so adding another alphabet is a data file plus a registry entry.

import type { QuizType } from "./decks";
import type { LanguageCode } from "./languages";

// A real word that pins down which of several same-sounding letters is meant, with the asked-about
// letter blanked (e.g. the Korean 옷 shown as 오＿, or the Japanese はなぢ shown as はな＿).
export type QuizContext = { blank: string; full: string; gloss: string };

export type QuizVariant = {
  // The English cue; "**x**" marks the sound being asked about.
  text: string;
  // Overrides the item's code for this variant.
  code?: string;
  // Replaces the definition's default question text.
  prompt?: string;
  // Extra explanation shown on the reveal side for this variant only.
  note?: string;
  context?: QuizContext;
};

export type QuizItem = {
  id: string; // stable across releases - progress is stored against it
  answer: string; // the one canonical letter (or letter pair, e.g. きゃ)
  group: string; // heading in the letter-by-letter progress grid
  code: string; // phonetic code shown with the question (romanization)
  note: string; // explanation shown after every answer
  variants: QuizVariant[];
};

export type Grade =
  // `note` explains a correct-but-not-exact answer (missing accent, toneless pinyin, a same-sound spelling).
  | { status: "correct"; note?: string }
  | { status: "wrong"; given: string; message: string }
  | { status: "invalid"; message: string };

export type QuizDefinition = {
  deck: QuizType;
  languageCode: LanguageCode;
  // Where progress is stored: the deck name, or "words-zh" etc. so each language's words are separate.
  statsKey: string;
  title: string; // "Symbols quiz"
  intro: string; // setup-screen blurb
  defaultPrompt: string;
  placeholder: string; // ghost text in the answer box
  inputLang: string; // lang attribute for the answer box, so phones offer the right keyboard
  contextLabel: string; // "In the Korean word" - lead-in for a variant's context word
  items: readonly QuizItem[];
  groups: readonly string[]; // display order for the progress grid
  itemById(id: string): QuizItem | undefined;
  variantCode(item: QuizItem, variantIndex: number): string;
  grade(item: QuizItem, variantIndex: number, input: string): Grade;
  // Extra line under the answer on the reveal side (a letter's name, its other-script twin...).
  answerLabel(item: QuizItem): string | null;
  // Audio for the answer (teach and verdict cards), played only from its button.
  audioSrc(item: QuizItem): string | null;
  // Letters and syllables get a small, huge-text answer box; words a wide one.
  answerSize: "letter" | "word";
};
