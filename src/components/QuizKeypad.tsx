"use client";

import { JamoKeypad } from "./JamoKeypad";
import { KanaKeypad } from "./KanaKeypad";
import type { QuizType } from "@/lib/decks";

// Words are typed on the device keyboard; every letter deck has an on-screen keypad.
export function hasKeypad(deck: QuizType): boolean {
  return deck !== "words";
}

// A Hangul symbol answer is one jamo, so a tap replaces it; syllables are built from several
// jamo and kana answers can be two characters (きゃ), so those taps append.
export function QuizKeypad({
  deck,
  value,
  onChange,
}: {
  deck: QuizType;
  value: string;
  onChange: (value: string) => void;
}) {
  if (deck === "symbols") return <JamoKeypad value={value} onPick={onChange} />;
  if (deck === "syllables") return <JamoKeypad value={value} onPick={onChange} build />;
  if (deck === "hiragana" || deck === "katakana") return <KanaKeypad script={deck} value={value} onChange={onChange} />;
  return null;
}
