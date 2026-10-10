"use client";

import { clsx } from "clsx";
import { composeJamo } from "@/lib/hangulBlocks";

const CONSONANTS = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const VOWELS = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];

// On-screen Hangul keys: phone and desktop IMEs make typing a lone jamo awkward (a consonant
// followed by a vowel fuses into a syllable), so the quiz offers this as an alternative to the keyboard.
// `build` mode is for whole syllables: taps append (ㄱ ㅏ ㄱ), with a preview of the block (각).
export function JamoKeypad({
  value,
  onPick,
  build = false,
}: {
  value: string;
  onPick: (value: string) => void;
  build?: boolean;
}) {
  const press = (jamo: string) => onPick(build ? ([...value].length >= 6 ? value : value + jamo) : jamo);
  const preview = build && value ? composeJamo(value) : null;
  const group = (label: string, letters: string[]) => (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wide text-foreground-muted">{label}</span>
      <div className="grid grid-cols-7 gap-1.5">
        {letters.map((jamo) => (
          <button
            key={jamo}
            type="button"
            onClick={() => press(jamo)}
            aria-label={`Letter ${jamo}`}
            className={clsx(
              "native-text h-10 rounded-lg border text-lg transition-colors",
              !build && value === jamo
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
      {build && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-foreground-muted">
            {value ? (preview ? <>Makes <span className="native-text text-lg text-foreground">{preview}</span></> : "Not a full syllable yet") : "Tap consonant, vowel, then final"}
          </span>
          <button
            type="button"
            onClick={() => onPick([...value].slice(0, -1).join(""))}
            aria-label="Delete the last letter"
            className="h-10 px-4 rounded-lg border border-border bg-surface hover:bg-surface-muted"
          >
            ⌫
          </button>
        </div>
      )}
    </div>
  );
}
