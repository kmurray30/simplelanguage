// Question bank + grading for Words quizzes and lessons, built from the user's own word list:
// see the English meaning, type the word - in the native script, or (for Chinese, Japanese and
// Korean) in romanization if you pick that. Pure: the page builds it from the words it already
// loaded, and the save routes rebuild it from the database to re-grade.

import { CATEGORIES } from "./categories";
import { kanaToRomaji } from "./kana";
import { LANGUAGES, type LanguageCode } from "./languages";
import type { Grade, QuizDefinition, QuizItem } from "./quizTypes";
import type { Word } from "@/types";

export type QuizWord = Pick<Word, "id" | "nativeText" | "romanization" | "englishGloss" | "usageNote" | "categories">;

export type AnswerMode = "native" | "romanized";

export const ROMANIZATION_NAME: Partial<Record<LanguageCode, string>> = {
  zh: "pinyin",
  ja: "romaji",
  ko: "romanization",
};

export const NATIVE_SCRIPT_NAME: Record<LanguageCode, string> = {
  zh: "汉字",
  ja: "kana or kanji",
  ko: "한글",
  fr: "French",
  es: "Spanish",
};

export function supportsRomanized(languageCode: LanguageCode): boolean {
  return LANGUAGES[languageCode].needsRomanization;
}

const CATEGORY_LABEL = new Map<string, string>(CATEGORIES.map((c) => [c.value, c.label]));

// --- Normalizing ---------------------------------------------------------------------------------

const PUNCTUATION = /[\s.,!?¡¿'"“”‘’`´、。！？・~～\-–—()（）「」『』…:;：；]/g;

function base(text: string): string {
  return text.normalize("NFKC").toLowerCase().replace(PUNCTUATION, "");
}

// Latin text only: NFD would also take apart Hangul and kana, so never use this on native scripts.
function stripMarks(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "");
}

function normalizeRomanized(text: string, languageCode: LanguageCode): string {
  let out = stripMarks(base(text)).replace(/[0-9]/g, "");
  if (languageCode === "zh") out = out.replace(/v/g, "u"); // ü is often typed v
  if (languageCode === "ja") {
    // Long vowels are written ō, ou or oo depending on who's typing - treat them all alike.
    out = out.replace(/ou/g, "o").replace(/([aeiou])\1/g, "$1");
  }
  return out;
}

function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

// --- The definition ------------------------------------------------------------------------------

export function makeWordsQuiz(words: readonly QuizWord[], languageCode: LanguageCode, answerMode: AnswerMode): QuizDefinition {
  const lang = LANGUAGES[languageCode];
  const romanized = answerMode === "romanized" && supportsRomanized(languageCode);
  const answerName = romanized ? ROMANIZATION_NAME[languageCode]! : NATIVE_SCRIPT_NAME[languageCode];
  const latinNative = !lang.needsRomanization;

  const wordById = new Map(words.map((w) => [w.id, w]));
  const items: QuizItem[] = words.map((w) => ({
    id: w.id,
    answer: romanized ? w.romanization || w.nativeText : w.nativeText,
    group: CATEGORY_LABEL.get(w.categories[0]) ?? "Other",
    code: answerName,
    note: w.usageNote ?? "",
    variants: [{ text: w.englishGloss }],
  }));
  const byId = new Map(items.map((item) => [item.id, item]));
  const groups = CATEGORIES.map((c) => c.label).filter((label) => items.some((item) => item.group === label));

  const glossKey = (w: QuizWord) => base(w.englishGloss);

  // Does what was typed spell this word, in either accepted form? Returns a note when it's right
  // but not exact (missing accents or tones, a kana reading).
  function matches(w: QuizWord, typed: string): { ok: boolean; note?: string } {
    const typedBase = base(typed);
    if (typedBase && typedBase === base(w.nativeText)) {
      return { ok: true, note: romanized ? `That's the ${lang.name} spelling - in ${answerName} it's ${w.romanization}.` : undefined };
    }
    if (latinNative && stripMarks(typedBase) === stripMarks(base(w.nativeText))) {
      return { ok: true, note: `Watch the accents: ${w.nativeText}.` };
    }
    if (w.romanization) {
      const typedRoman = normalizeRomanized(typed, languageCode);
      const reading = languageCode === "ja" ? kanaToRomaji(typedBase) : null;
      const target = normalizeRomanized(w.romanization, languageCode);
      if (romanized && typedRoman && typedRoman === target) {
        // Tones are optional for pinyin; say how it's written when the typed form differs.
        if (languageCode !== "zh" || base(typed) === base(w.romanization)) return { ok: true };
        const typedTones = stripMarks(base(typed)) !== base(typed);
        return { ok: true, note: `${typedTones ? "Check the tones" : "With tone marks"}: ${w.romanization}.` };
      }
      if (reading !== null && normalizeRomanized(reading, "ja") === target) {
        return { ok: true, note: base(w.nativeText) !== typedBase ? `That's the reading - it's usually written ${w.nativeText}.` : undefined };
      }
    }
    return { ok: false };
  }

  return {
    deck: "words",
    languageCode,
    statsKey: `words-${languageCode}`,
    title: "Words quiz",
    intro: `You'll see the English meaning of one of your words. Type the ${lang.name} word${romanized ? ` in ${answerName}` : ""}.`,
    defaultPrompt: `How do you say this in ${lang.name}?`,
    placeholder: romanized ? "" : lang.nativeTextPlaceholder.replace(/^e\.g\. /, "").split(" or ")[0],
    inputLang: romanized ? "en" : languageCode,
    contextLabel: "",
    items,
    groups,
    itemById: (id) => byId.get(id),
    variantCode: () => answerName,
    grade(item, _variantIndex, input): Grade {
      const word = wordById.get(item.id);
      if (!word) return { status: "invalid", message: "This word isn't in your list anymore." };
      if (!base(input)) return { status: "invalid", message: `Type the word in ${answerName} first.` };

      const own = matches(word, input);
      if (own.ok) return { status: "correct", note: own.note };

      // Another of your words: same meaning counts, a different one gets named.
      for (const other of words) {
        if (other.id === word.id || !matches(other, input).ok) continue;
        if (glossKey(other) === glossKey(word)) {
          return { status: "correct", note: `${other.nativeText} is also right. This card was ${word.nativeText}.` };
        }
        return {
          status: "wrong",
          given: input.trim(),
          message: `${other.nativeText} is your word for "${other.englishGloss}". "${word.englishGloss}" is ${word.nativeText}${word.romanization ? ` (${word.romanization})` : ""}.`,
        };
      }

      const target = romanized ? normalizeRomanized(item.answer, languageCode) : base(item.answer);
      const typed = romanized ? normalizeRomanized(input, languageCode) : base(input);
      const close = target.length >= 4 && editDistance(typed, target) === 1;
      return {
        status: "wrong",
        given: input.trim(),
        message: `${close ? "So close - one letter off. " : ""}"${word.englishGloss}" is ${word.nativeText}${word.romanization ? ` (${word.romanization})` : ""}.`,
      };
    },
    answerLabel: (item) => {
      const w = wordById.get(item.id);
      if (!w) return null;
      return romanized ? w.nativeText : w.romanization || null;
    },
    audioSrc: (item) => `/api/words/${item.id}/audio`,
    answerSize: "word",
  };
}
