// Hangul syllable-block helpers shared by the quiz data and its pre-written responses.

import { composeSyllable } from "./hangul";

const FINALS_TABLE = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const INITIALS_TABLE = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const VOWELS_TABLE = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];

export type KoWord = { before?: string; block: string; after?: string };

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

// "책" -> "채＿": the word with the block's final letter removed and a blank in its place.
export function blankedWord(word: KoWord): string | null {
  const parts = decomposeBlock(word.block);
  if (!parts) return null;
  const open = composeSyllable(parts.initial as never, parts.vowel as never, "");
  return `${word.before ?? ""}${open}＿${word.after ?? ""}`;
}

// The same word, spelled out - shown after answering.
export function fullWord(word: KoWord): string {
  return `${word.before ?? ""}${word.block}${word.after ?? ""}`;
}
