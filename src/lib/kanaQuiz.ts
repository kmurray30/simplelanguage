// Question banks + grading for the Japanese Hiragana and Katakana quizzes.
//
// One item per kana (or kana combination like きゃ), asked as "English cue with the sound in bold +
// its romaji -> write the kana". On top of the plain sounds, the hiragana quiz asks the spellings a
// learner can't hear: the particles は (wa), へ (e) and を (o), the rare ぢ/づ (pinned down by a real
// word), and the small っ. The katakana quiz adds the long-vowel mark ー and the foreign-sound
// combinations (ファ, ティ...). Wrong answers get the fixed responses in kanaMisconceptions.ts.

import { CUES, KANA, KANA_AUDIO_TEXTS, isHiraganaChar, isKatakanaChar, kanaNote, type KanaEntry, type KanaGroup, type KanaScript } from "./kana";
import { explainKanaWrong } from "./kanaMisconceptions";
import type { Grade, QuizDefinition, QuizItem, QuizVariant } from "./quizTypes";

function cueVariants(romaji: string): QuizVariant[] {
  return (CUES[romaji] ?? [`**${romaji}**`]).map((text) => ({ text }));
}

function charOf(entry: KanaEntry, script: KanaScript): string | null {
  return script === "hiragana" ? entry.hira : entry.kata;
}

function plainItem(entry: KanaEntry, script: KanaScript): QuizItem | null {
  const char = charOf(entry, script);
  if (!char) return null;
  const other = script === "hiragana" ? entry.kata : entry.hira;
  const fallbackNote = other
    ? `"${entry.romaji}" - ${char} in ${script}, ${other} in ${script === "hiragana" ? "katakana" : "hiragana"}.`
    : `"${entry.romaji}".`;
  return {
    id: `${script === "hiragana" ? "h" : "k"}:${char}`,
    answer: char,
    group: entry.group,
    code: entry.romaji,
    note: kanaNote(entry, script) ?? fallbackNote,
    variants: cueVariants(entry.romaji),
  };
}

// Kana that sound like a more common one, so a real word has to say which is meant.
const RARE_TWIN_CONTEXTS: Record<string, QuizVariant[]> = {
  ぢ: [
    { text: "**jee**p", context: { blank: "はな＿", full: "はなぢ", gloss: "nosebleed" } },
    { text: "**gi**n", context: { blank: "ち＿む", full: "ちぢむ", gloss: "to shrink" } },
  ],
  づ: [
    { text: "**zoo**", context: { blank: "つ＿く", full: "つづく", gloss: "to continue" } },
    { text: "**zoo**m", context: { blank: "みか＿き", full: "みかづき", gloss: "crescent moon" } },
  ],
};

// Left out of the quizzes (still on the flashcards): を is asked as the object particle instead, and
// katakana ヲ ヂ ヅ are too rare to have real words to pin them down. The lone small ゃゅょ only make
// sense attached to another kana, which the Combined questions cover.
const NOT_QUIZZED = new Set(["を", "ヲ", "ヂ", "ヅ", "ゃ", "ゅ", "ょ", "ャ", "ュ", "ョ", "っ", "ッ", "ー"]);

const HIRAGANA_SPECIAL: QuizItem[] = [
  {
    id: "h:p-wa",
    answer: "は",
    group: "Special",
    code: "wa",
    note: "As the topic particle, は is pronounced \"wa\" - a spelling left over from older Japanese. Everywhere else は is \"ha\", and the \"wa\" inside words is わ.",
    variants: [
      { text: "**wa**", prompt: "In 私＿学生です (watashi wa gakusei desu, \"I am a student\"), the topic particle is pronounced \"wa\". Which hiragana is it written with?" },
      { text: "**wa**", prompt: "In これ＿ペンです (kore wa pen desu, \"this is a pen\"), the topic particle is pronounced \"wa\". Which hiragana is it written with?" },
    ],
  },
  {
    id: "h:p-e",
    answer: "へ",
    group: "Special",
    code: "e",
    note: "As the direction particle (\"to, toward\"), へ is pronounced \"e\". Everywhere else へ is \"he\", and the plain vowel \"e\" is え.",
    variants: [
      { text: "**e**", prompt: "In 学校＿行きます (gakkō e ikimasu, \"I go to school\"), the particle meaning \"to\" is pronounced \"e\". Which hiragana is it written with?" },
      { text: "**e**", prompt: "In 日本＿ようこそ (nihon e yōkoso, \"welcome to Japan\"), the particle meaning \"to\" is pronounced \"e\". Which hiragana is it written with?" },
    ],
  },
  {
    id: "h:p-o",
    answer: "を",
    group: "Special",
    code: "o",
    note: "を is pronounced just \"o\", the same as お, and is used for nothing but the object particle.",
    variants: [
      { text: "**o**", prompt: "In りんご＿食べます (ringo o tabemasu, \"I eat an apple\"), the object particle is pronounced \"o\". Which hiragana is it written with?" },
      { text: "**o**", prompt: "In 本＿読みます (hon o yomimasu, \"I read a book\"), the object particle is pronounced \"o\". Which hiragana is it written with?" },
    ],
  },
  {
    id: "h:っ",
    answer: "っ",
    group: "Special",
    code: "(pause)",
    note: "Small tsu has no sound of its own: it doubles the next consonant with a tiny pause (きって, kitte, \"stamp\"). Full-size つ is the syllable \"tsu\".",
    variants: [
      { text: "ho**t t**ub", prompt: "A tiny pause that doubles the next consonant - as in きって (kitte, \"stamp\") - is written with which small hiragana?" },
      { text: "boo**kk**eeper", prompt: "A tiny pause that doubles the next consonant - as in ざっし (zasshi, \"magazine\") - is written with which small hiragana?" },
    ],
  },
];

const KATAKANA_SPECIAL: QuizItem[] = [
  {
    id: "k:ッ",
    answer: "ッ",
    group: "Special",
    code: "(pause)",
    note: "Small tsu has no sound of its own: it doubles the next consonant with a tiny pause (ベッド, beddo, \"bed\"). Full-size ツ is the syllable \"tsu\".",
    variants: [
      { text: "ho**t t**ub", prompt: "A tiny pause that doubles the next consonant - as in ベッド (beddo, \"bed\") - is written with which small katakana?" },
      { text: "boo**kk**eeper", prompt: "A tiny pause that doubles the next consonant - as in ネット (netto, \"internet\") - is written with which small katakana?" },
    ],
  },
  {
    id: "k:ー",
    answer: "ー",
    group: "Special",
    code: "(long vowel)",
    note: "Katakana stretches a vowel with the long-vowel mark ー (コーヒー, kōhī, \"coffee\"). Hiragana doubles the vowel instead (おかあさん).",
    variants: [
      { text: "a vowel held **long**", prompt: "Katakana stretches a vowel with a single mark - as in コ＿ヒ＿ (kōhī, \"coffee\"). Which mark is it?" },
      { text: "a vowel held **long**", prompt: "Katakana stretches a vowel with a single mark - as in ケ＿キ (kēki, \"cake\"). Which mark is it?" },
    ],
  },
];

function buildItems(script: KanaScript): QuizItem[] {
  const items: QuizItem[] = [];
  for (const entry of KANA) {
    const char = charOf(entry, script);
    if (!char || NOT_QUIZZED.has(char)) continue;
    const item = plainItem(entry, script);
    if (!item) continue;
    if (RARE_TWIN_CONTEXTS[char]) item.variants = RARE_TWIN_CONTEXTS[char];
    items.push(item);
  }
  return [...items, ...(script === "hiragana" ? HIRAGANA_SPECIAL : KATAKANA_SPECIAL)];
}

function normalize(input: string): { text: string } | { error: string } {
  const text = input.normalize("NFKC").replace(/\s+/g, "");
  if (!text) return { error: "Type the kana first - or tap it on the keypad." };
  if (/^[-‐－一]$/.test(text)) {
    return { error: "That's a dash (or the kanji 一). The katakana long-vowel mark is ー - it's on the keypad." };
  }
  if (/[a-z]/i.test(text)) {
    return {
      error: "That's romaji. Switch to a Japanese keyboard (typing \"ka\" on one gives か), or tap the kana on the keypad below.",
    };
  }
  const chars = [...text];
  if (!chars.every((ch) => isHiraganaChar(ch) || isKatakanaChar(ch))) {
    return { error: "That isn't kana. Type hiragana or katakana - kanji and other characters don't count here." };
  }
  if (chars.length > 3) return { error: "That's more than one sound. Type just the kana for this one." };
  return { text };
}

function makeQuiz(script: KanaScript): QuizDefinition {
  const items = buildItems(script);
  const byId = new Map(items.map((item) => [item.id, item]));
  const entryByChar = new Map<string, KanaEntry>();
  for (const e of KANA) entryByChar.set(charOf(e, script) ?? "", e);
  const otherScript = script === "hiragana" ? "katakana" : "hiragana";

  const groups: KanaGroup[] = ["Basic", "Voiced ゛", "Half-voiced ゜", "Combined", "Special"];
  if (script === "katakana") groups.push("Foreign sounds");

  return {
    deck: script,
    languageCode: "ja",
    statsKey: script,
    answerSize: "letter",
    audioSrc: (item) =>
      KANA_AUDIO_TEXTS.has(item.answer) ? `/api/tts?lang=ja&text=${encodeURIComponent(item.answer)}` : null,
    title: script === "hiragana" ? "Hiragana quiz" : "Katakana quiz",
    intro: `You'll see an English word with the sound in bold, plus its romaji. Write it in ${script} - type it with a Japanese keyboard, or tap the keypad (゛ ゜ and 小 change the last kana).`,
    defaultPrompt: `Write the ${script} for the bold sound.`,
    placeholder: script === "hiragana" ? "あ" : "ア",
    inputLang: "ja",
    contextLabel: "In the Japanese word",
    items,
    groups,
    itemById: (id) => byId.get(id),
    variantCode: (item, variantIndex) => item.variants[variantIndex]?.code ?? item.code,
    grade(item, variantIndex, input): Grade {
      const normalized = normalize(input);
      if ("error" in normalized) return { status: "invalid", message: normalized.error };
      if (normalized.text === item.answer) return { status: "correct" };
      const variant = item.variants[variantIndex] ?? item.variants[0];
      return { status: "wrong", given: normalized.text, message: explainKanaWrong(script, item, variant, normalized.text) };
    },
    answerLabel(item) {
      if (item.id.includes(":p-")) return `particle "${item.code}"`;
      const entry = entryByChar.get(item.answer);
      if (!entry) return null;
      const other = script === "hiragana" ? entry.kata : entry.hira;
      return other && entry.group !== "Special" ? `${entry.romaji} · ${otherScript} ${other}` : entry.romaji;
    },
  };
}

export const HIRAGANA_QUIZ = makeQuiz("hiragana");
export const KATAKANA_QUIZ = makeQuiz("katakana");
