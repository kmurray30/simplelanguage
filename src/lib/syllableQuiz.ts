// Question bank + grading for the Korean "Syllables" quiz and lessons: see a syllable's sound
// (Revised Romanization + an English-friendly respelling), write the block. Built from the same
// hand-authored HANGUL_SYLLABLES the flashcards use.

import { HANGUL_SYLLABLES, HANGUL_SYMBOLS } from "./hangul";
import { composeJamo, decomposeBlock } from "./hangulBlocks";
import type { Grade, QuizDefinition, QuizItem } from "./quizTypes";

const items: QuizItem[] = [];
const seenIds = new Set<string>();
for (const s of HANGUL_SYLLABLES) {
  const id = `${s.section}:${s.block}`;
  if (seenIds.has(id)) continue;
  seenIds.add(id);
  items.push({
    id,
    answer: s.block,
    group: s.section,
    code: s.rr,
    note: s.note ?? `${s.block} is "${s.rr}", said like "${s.respell}".`,
    variants: [{ text: `**${s.respell}**` }],
  });
}

const byId = new Map(items.map((item) => [item.id, item]));
const groups = [...new Set(items.map((item) => item.group))];

// Blocks that are romanized the same (e.g. a double final that sounds like a single one): writing
// any of them is accepted, since the card can't tell them apart.
const BLOCKS_BY_RR = new Map<string, Set<string>>();
const RR_BY_BLOCK = new Map<string, string>();
for (const s of HANGUL_SYLLABLES) {
  if (!BLOCKS_BY_RR.has(s.rr)) BLOCKS_BY_RR.set(s.rr, new Set());
  BLOCKS_BY_RR.get(s.rr)!.add(s.block);
  RR_BY_BLOCK.set(s.block, s.rr);
}

const SOUND = new Map(HANGUL_SYMBOLS.map((s) => [s.jamo, s.sound]));
const COMPAT_JAMO = new Set(HANGUL_SYMBOLS.map((s) => s.jamo));

function normalize(input: string): { block: string } | { error: string } {
  const text = input.normalize("NFC").replace(/\s+/g, "");
  if (!text) return { error: "Type the syllable first - or build it on the keypad (ㄱ ㅏ ㄱ makes 각)." };
  const chars = [...text];
  if (chars.every((ch) => COMPAT_JAMO.has(ch) || ["ㄳ", "ㄵ", "ㄶ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅄ"].includes(ch))) {
    const block = composeJamo(text);
    if (block) return { block };
    return { error: "Those letters don't make one syllable. A block is a consonant, then a vowel, then an optional final consonant." };
  }
  // A few cards are two-block words (부엌, 히읗).
  if (chars.length <= 3 && chars.every((ch) => decomposeBlock(ch))) return { block: text };
  if (/[a-z]/i.test(text)) return { error: "That's romanization. Write the Hangul block - switch to a Korean keyboard or use the keypad." };
  return { error: "Type just the Hangul for this sound." };
}

function describeDifference(given: string, answer: string): string {
  const g = decomposeBlock(given);
  const a = decomposeBlock(answer);
  if (!g || !a) return "";
  const parts: string[] = [];
  const sound = (jamo: string) => (jamo ? (SOUND.get(jamo) ?? jamo) : "nothing");
  if (g.initial !== a.initial) parts.push(`the first consonant should be ${a.initial} (${sound(a.initial)}), not ${g.initial} (${sound(g.initial)})`);
  if (g.vowel !== a.vowel) parts.push(`the vowel should be ${a.vowel} (${sound(a.vowel)}), not ${g.vowel} (${sound(g.vowel)})`);
  if (g.final !== a.final) {
    parts.push(
      a.final
        ? `the final consonant should be ${a.final}${g.final ? `, not ${g.final}` : " - you left it off"}`
        : `there's no final consonant - drop the ${g.final}`,
    );
  }
  return parts.length ? `${parts.join("; ")}.` : "";
}

export const SYLLABLE_QUIZ: QuizDefinition = {
  deck: "syllables",
  languageCode: "ko",
  statsKey: "syllables",
  title: "Syllables quiz",
  intro:
    "You'll see how a syllable sounds - its romanization and an English-friendly respelling. Write the Hangul block: type it, or build it on the keypad (ㄱ ㅏ ㄱ becomes 각).",
  defaultPrompt: "Write the Hangul syllable for this sound.",
  placeholder: "가",
  inputLang: "ko",
  contextLabel: "",
  items,
  groups,
  itemById: (id) => byId.get(id),
  variantCode: (item) => item.code,
  grade(item, _variantIndex, input): Grade {
    const normalized = normalize(input);
    if ("error" in normalized) return { status: "invalid", message: normalized.error };
    const { block } = normalized;
    if (block === item.answer) return { status: "correct" };
    if (BLOCKS_BY_RR.get(item.code)?.has(block)) {
      return { status: "correct", note: `${block} is romanized the same way. This card's spelling is ${item.answer}.` };
    }
    const rr = RR_BY_BLOCK.get(block);
    const diff = describeDifference(block, item.answer);
    return {
      status: "wrong",
      given: block,
      message: `${block}${rr ? ` is "${rr}"` : ""}. For "${item.code}" write ${item.answer}${diff ? ` - ${diff}` : "."}`,
    };
  },
  answerLabel: (item) => `${item.code} · ${item.variants[0].text.replace(/\*\*/g, "\"")}`,
  audioSrc: (item) => `/api/tts?lang=ko&text=${encodeURIComponent(item.answer)}`,
  answerSize: "letter",
};
