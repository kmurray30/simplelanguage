"use client";

import { clsx } from "clsx";

const CONSONANTS = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const VOWELS = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];

// On-screen Hangul keys: phone and desktop IMEs make typing a lone jamo awkward (a consonant
// followed by a vowel fuses into a syllable), so the quiz offers this as an alternative to the keyboard.
export function JamoKeypad({ value, onPick }: { value: string; onPick: (jamo: string) => void }) {
  const group = (label: string, letters: string[]) => (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wide text-foreground-muted">{label}</span>
      <div className="grid grid-cols-7 gap-1.5">
        {letters.map((jamo) => (
          <button
            key={jamo}
            type="button"
            onClick={() => onPick(jamo)}
            aria-label={`Letter ${jamo}`}
            className={clsx(
              "native-text h-10 rounded-lg border text-lg transition-colors",
              value === jamo
                ? "border-accent bg-accent-soft text-foreground"
                : "border-border bg-surface hover:bg-surface-muted",
            )}
          >
            {jamo}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3 w-full">
      {group("Consonants", CONSONANTS)}
      {group("Vowels", VOWELS)}
    </div>
  );
}
