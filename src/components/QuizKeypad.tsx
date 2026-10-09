"use client";

import { JamoKeypad } from "./JamoKeypad";
import { KanaKeypad } from "./KanaKeypad";
import type { QuizType } from "@/lib/decks";

// The on-screen keypad for each letter quiz. A Hangul answer is one jamo, so a tap replaces the
// answer; kana answers can be two characters (きゃ), so kana taps append.
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
  return <KanaKeypad script={deck} value={value} onChange={onChange} />;
}
