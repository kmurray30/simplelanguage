// Hangul syllable-block helpers shared by the quiz data and its pre-written responses.

import { composeSyllable } from "./hangul";

const FINALS_TABLE = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const INITIALS_TABLE = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const VOWELS_TABLE = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];

// `blank` picks which letter of the block is hidden: its final consonant (default) or its vowel.
export type KoWord = { before?: string; block: string; after?: string; blank?: "final" | "vowel" };

export function decomposeBlock(block: string): { initial: string; vowel: string; final: string } | null {
  const code = block.codePointAt(0);
  if (block.length !== 1 || code === undefined || code < 0xac00 || code > 0xd7a3) return null;
  const offset = code - 0xac00;
  return {
    initial: INITIALS_TABLE[Math.floor(offset / (21 * 28))],
    vowel: VOWELS_TABLE[Math.floor((offset % (21 * 28)) / 28)],
    final: FINALS_TABLE[offset % 28],
  };
}

// "책" -> "채＿" (final blanked), or "돼" -> "ㄷ＿" (vowel blanked): the word with one letter of the
// target block hidden.
export function blankedWord(word: KoWord): string | null {
  const parts = decomposeBlock(word.block);
  if (!parts) return null;
  const open =
    word.blank === "vowel"
      ? parts.initial
      : composeSyllable(parts.initial as never, parts.vowel as never, "");
  return `${word.before ?? ""}${open}＿${word.after ?? ""}`;
}

// The same word, spelled out - shown after answering.
export function fullWord(word: KoWord): string {
  return `${word.before ?? ""}${word.block}${word.after ?? ""}`;
}

// --- Building a block from separately typed jamo -------------------------------------------------
// The jamo keypad (and some keyboards) produce letters one at a time: ㄱ ㅏ ㄱ. This assembles them
// into one block (각), accepting the keystroke pairs that make doubled consonants, compound vowels
// and two-letter finals. Returns null if the letters don't form a single valid block.

const DOUBLE_INITIAL: Record<string, string> = { ㄱㄱ: "ㄲ", ㄷㄷ: "ㄸ", ㅂㅂ: "ㅃ", ㅅㅅ: "ㅆ", ㅈㅈ: "ㅉ" };
const VOWEL_PAIR: Record<string, string> = { ㅗㅏ: "ㅘ", ㅗㅐ: "ㅙ", ㅗㅣ: "ㅚ", ㅜㅓ: "ㅝ", ㅜㅔ: "ㅞ", ㅜㅣ: "ㅟ", ㅡㅣ: "ㅢ" };
const FINAL_PAIR: Record<string, string> = {
  ㄱㅅ: "ㄳ", ㄴㅈ: "ㄵ", ㄴㅎ: "ㄶ", ㄹㄱ: "ㄺ", ㄹㅁ: "ㄻ", ㄹㅂ: "ㄼ", ㄹㅅ: "ㄽ",
  ㄹㅌ: "ㄾ", ㄹㅍ: "ㄿ", ㄹㅎ: "ㅀ", ㅂㅅ: "ㅄ", ㄱㄱ: "ㄲ", ㅅㅅ: "ㅆ",
};

export function composeJamo(text: string): string | null {
  const chars = [...text];
  let i = 0;
  let initial = chars[i] ?? "";
  if (DOUBLE_INITIAL[initial + (chars[i + 1] ?? "")] && VOWELS_TABLE.includes(chars[i + 2] ?? "")) {
    initial = DOUBLE_INITIAL[initial + chars[i + 1]];
    i += 2;
  } else {
    i += 1;
  }
  const initialIndex = INITIALS_TABLE.indexOf(initial);
  if (initialIndex < 0) return null;

  let vowel = chars[i] ?? "";
  if (VOWEL_PAIR[vowel + (chars[i + 1] ?? "")]) {
    vowel = VOWEL_PAIR[vowel + chars[i + 1]];
    i += 2;
  } else {
    i += 1;
  }
  const vowelIndex = VOWELS_TABLE.indexOf(vowel);
  if (vowelIndex < 0) return null;

  const rest = chars.slice(i).join("");
  const final = rest.length <= 1 ? rest : (FINAL_PAIR[rest] ?? null);
  if (final === null) return null;
  const finalIndex = FINALS_TABLE.indexOf(final);
  if (finalIndex < 0) return null;

  return String.fromCharCode(0xac00 + (initialIndex * 21 + vowelIndex) * 28 + finalIndex);
}
