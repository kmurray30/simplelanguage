// Pre-written responses for wrong answers in the Hiragana and Katakana quizzes. Nothing here is
// generated at runtime: every (question, wrong answer) resolves to fixed text, most specific first:
//
//   1. a hand-written response for that exact question + answer (particles, rare twins)
//   2. the right sound in the wrong script (カ typed for か)
//   3. same-sound twins (じ/ぢ, ず/づ, お/を) - the context word decides
//   4. small vs full-size kana (きや for きゃ, つ for っ) and half-typed combinations (き for きゃ)
//   5. voicing marks ゛ ゜ (か vs が, ば vs ぱ)
//   6. look-alike shapes, with a tip for telling them apart
//   7. a generic "X is <sound>; this one is <sound>"

import { KANA, isHiraganaChar, isKatakanaChar, toHiragana, toKatakana, type KanaScript } from "./kana";
import type { QuizItem, QuizVariant } from "./quizTypes";

// --- Sounds ------------------------------------------------------------------------------------

const SPECIAL_SOUND: Record<string, string> = {
  っ: "a small tsu (a pause)",
  ッ: "a small tsu (a pause)",
  ゃ: "a small ya",
  ゅ: "a small yu",
  ょ: "a small yo",
  ャ: "a small ya",
  ュ: "a small yu",
  ョ: "a small yo",
  ー: "the long-vowel mark",
  ぁ: "a small a",
  ぃ: "a small i",
  ぅ: "a small u",
  ぇ: "a small e",
  ぉ: "a small o",
  ァ: "a small a",
  ィ: "a small i",
  ゥ: "a small u",
  ェ: "a small e",
  ォ: "a small o",
};

const SOUND = new Map<string, string>();
for (const e of KANA) {
  if (e.group === "Special") continue;
  if (e.hira) SOUND.set(e.hira, e.romaji);
  SOUND.set(e.kata, e.romaji);
}

export function soundOf(text: string): string {
  const known = SOUND.get(text) ?? SPECIAL_SOUND[text];
  if (known) return known.startsWith("a ") || known.startsWith("the ") ? known : `"${known}"`;
  return [...text].map((ch) => soundOf(ch)).join(" + ");
}

// --- Relations ---------------------------------------------------------------------------------

// Small kana and their full-size twins.
const SMALL_TO_BIG: Record<string, string> = {
  っ: "つ", ゃ: "や", ゅ: "ゆ", ょ: "よ", ぁ: "あ", ぃ: "い", ぅ: "う", ぇ: "え", ぉ: "お",
  ッ: "ツ", ャ: "ヤ", ュ: "ユ", ョ: "ヨ", ァ: "ア", ィ: "イ", ゥ: "ウ", ェ: "エ", ォ: "オ",
};

function enlarge(text: string): string {
  return [...text].map((ch) => SMALL_TO_BIG[ch] ?? ch).join("");
}

// Voicing: が is か + 1 code point and ぱ is は + 2, in both scripts. ヴ is the odd one out.
const VOICED = new Set(KANA.filter((e) => e.group === "Voiced ゛").flatMap((e) => [e.hira, e.kata]));
const HALF_VOICED = new Set(KANA.filter((e) => e.group === "Half-voiced ゜").flatMap((e) => [e.hira, e.kata]));

function unvoice(ch: string): string {
  if (ch === "ヴ") return "ウ";
  if (VOICED.has(ch)) return String.fromCodePoint(ch.codePointAt(0)! - 1);
  if (HALF_VOICED.has(ch)) return String.fromCodePoint(ch.codePointAt(0)! - 2);
  return ch;
}

function markOf(ch: string): string {
  if (ch === "ヴ" || VOICED.has(ch)) return "the two marks ゛ (dakuten)";
  if (HALF_VOICED.has(ch)) return "the small circle ゜ (handakuten)";
  return "no mark";
}

// Same sound, different kana: the everyday spelling first.
const SAME_SOUND: [string, string, string][] = [
  ["じ", "ぢ", "ji"],
  ["ず", "づ", "zu"],
  ["お", "を", "o"],
  ["ジ", "ヂ", "ji"],
  ["ズ", "ヅ", "zu"],
  ["オ", "ヲ", "o"],
];

// Kana that look almost alike within one script, with a tip for telling them apart.
const LOOKALIKES: { chars: string; tip: string }[] = [
  { chars: "ぬめ", tip: "ぬ ends in a small loop at the bottom right; め doesn't." },
  { chars: "ねれわ", tip: "ね ends in a loop; れ and わ don't. れ's tail kicks out to the right; わ's curls back in." },
  { chars: "るろ", tip: "る ends in a small loop at the bottom; ろ doesn't." },
  { chars: "はほ", tip: "ほ has two crossbars on the right; は has one." },
  { chars: "ほま", tip: "ほ has a separate vertical stroke on the left; ま doesn't." },
  { chars: "いり", tip: "い's longer stroke is on the left; り's longer stroke is on the right." },
  { chars: "こに", tip: "に has a vertical stroke on the left; こ is just the two short lines." },
  { chars: "たな", tip: "な ends in a small loop at the bottom right; た doesn't." },
  { chars: "さき", tip: "き has two crossbars; さ has one." },
  { chars: "あお", tip: "お has a small dot at the top right; あ doesn't." },
  { chars: "すむ", tip: "む has an extra short stroke at the top right; す doesn't." },
  { chars: "しつ", tip: "し is a tall hook that opens up and to the right; つ is a wide arc that opens downward." },
  { chars: "のめ", tip: "め has an extra crossing stroke; の is a single swirl." },
  { chars: "シツ", tip: "シ's two short strokes are stacked on the left and its long stroke sweeps up; ツ's sit side by side along the top and its long stroke sweeps down." },
  { chars: "ソン", tip: "ソ's short stroke sits at the top and its long stroke sweeps down; ン's short stroke is on the left and its long stroke sweeps up." },
  { chars: "クタ", tip: "タ is ク with an extra short stroke inside it." },
  { chars: "クケ", tip: "ケ has a separate horizontal bar; ク is just two strokes." },
  { chars: "ウワフ", tip: "ウ has a short stroke on top; ワ is the same shape without it; フ is a single stroke with no left side." },
  { chars: "ノメ", tip: "メ has a second, crossing stroke; ノ is a single stroke." },
  { chars: "スヌ", tip: "ヌ has an extra short stroke crossing its tail; ス doesn't." },
  { chars: "コユ", tip: "ユ's bottom line sticks out past the corner; コ is a plain corner." },
  { chars: "チテ", tip: "テ has two horizontal bars on top; チ has one bar crossed by a downward stroke." },
  { chars: "ミニ", tip: "ミ has three slanted strokes; ニ has two horizontal ones." },
];

// Hiragana/katakana pairs that look almost the same, so the script slip is easy to make.
const CROSS_SCRIPT_TWINS = new Set(["へ", "ヘ", "べ", "ベ", "ぺ", "ペ", "り", "リ", "か", "カ", "き", "キ", "や", "ヤ", "も", "モ", "せ", "セ"]);

// --- Hand-written responses --------------------------------------------------------------------

const ITEM_SPECIFIC: Record<string, string> = {
  "h:p-wa|わ": "わ is \"wa\" inside words, but the topic particle is always written は - a spelling left over from older Japanese. So 私は is watashi wa, written with は.",
  "h:p-e|え": "え is the plain vowel \"e\", but the direction particle (\"to, toward\") is always written へ: 学校へ, gakkō e.",
  "h:p-o|お": "お is the plain \"o\", but the object particle is always written を: りんごを, ringo o. を is used for nothing else.",
  "h:わ|は": "は is pronounced \"wa\" only as the topic particle. Inside words, \"wa\" is わ.",
  "h:え|へ": "へ is pronounced \"e\" only as the direction particle. Everywhere else, the vowel \"e\" is え.",
  "h:お|を": "を sounds the same but is only used as the object particle. Everywhere else, \"o\" is お.",
  "k:オ|ヲ": "ヲ sounds the same but is almost never used. \"o\" in katakana is オ.",
  "h:じ|ぢ": "ぢ sounds exactly the same, but it's rare - only a handful of words use it (はなぢ, nosebleed). The everyday \"ji\" is じ.",
  "h:ず|づ": "づ sounds exactly the same, but it's rare - only a handful of words use it (つづく, to continue). The everyday \"zu\" is ず.",
  "k:ジ|ヂ": "ヂ sounds exactly the same, but it's almost never used. The everyday \"ji\" in katakana is ジ.",
  "k:ズ|ヅ": "ヅ sounds exactly the same, but it's almost never used. The everyday \"zu\" in katakana is ズ.",
  "h:っ|つ": "Full-size つ is the syllable \"tsu\". The pause that doubles a consonant is the small っ.",
  "k:ッ|ツ": "Full-size ツ is the syllable \"tsu\". The pause that doubles a consonant is the small ッ.",
  "k:ヴ|ブ": "ブ is \"bu\". A real v sound is written ウ with the two marks ゛: ヴ. (Many everyday words just use b instead - バイオリン for violin - but this card asks for the v.)",
};

// --- Entry point -------------------------------------------------------------------------------

function scriptOf(text: string): KanaScript | null {
  const chars = [...text];
  if (chars.every(isHiraganaChar)) return "hiragana";
  if (chars.every(isKatakanaChar)) return "katakana";
  return null;
}

export function explainKanaWrong(script: KanaScript, item: QuizItem, variant: QuizVariant, given: string): string {
  const specific = ITEM_SPECIFIC[`${item.id}|${given}`];
  if (specific) return specific;

  const answer = item.answer;
  const code = item.code;

  // The right sound in the other script.
  const givenScript = scriptOf(given);
  if (givenScript && givenScript !== script) {
    const converted = script === "hiragana" ? toHiragana(given) : toKatakana(given);
    if (converted === answer) {
      const twins = CROSS_SCRIPT_TWINS.has(given) ? " The two look almost identical, so it's an easy slip." : "";
      return `${given} is ${givenScript} for the same sound. This quiz asks for ${script}: ${answer}.${twins}`;
    }
    return `${given} is ${givenScript} (${soundOf(given)}). This quiz asks for ${script} - "${code}" is ${answer}.`;
  }

  // Same sound, different kana: the context word decides.
  for (const [everyday, rare] of SAME_SOUND) {
    if ((given === everyday && answer === rare) || (given === rare && answer === everyday)) {
      if (variant.context) {
        return `${given} sounds exactly the same, but this word (${variant.context.full}, ${variant.context.gloss}) is one of the few spelled with ${answer}.`;
      }
      return `${given} sounds exactly the same as ${answer}. ${everyday} is the usual spelling; ${rare} only appears in a few words.`;
    }
  }

  // Small vs full-size.
  if (enlarge(given) === enlarge(answer)) {
    const answerHasSmall = [...answer].some((ch) => SMALL_TO_BIG[ch]);
    if (answerHasSmall) {
      const small = [...answer].find((ch) => SMALL_TO_BIG[ch])!;
      return `With a full-size ${SMALL_TO_BIG[small]}, ${given} is read as separate beats (${soundOf(given)}). Make it small - ${small} - to fuse them into one: ${answer}, "${code}".`;
    }
    return `${given} uses the small version, which doesn't make a syllable on its own. "${code}" is the full-size ${answer}.`;
  }
  const answerChars = [...answer];
  if (answerChars.length === 2 && given === answerChars[0]) {
    return `${given} alone is ${soundOf(given)}. Add a small ${answerChars[1]} after it to make one syllable, "${code}": ${answer}.`;
  }

  // Voicing marks.
  const givenChars = [...given];
  const sameShape =
    givenChars.length === answerChars.length &&
    givenChars.every((ch, i) => (i === 0 ? unvoice(ch) === unvoice(answerChars[0]) : ch === answerChars[i]));
  if (sameShape && given !== answer) {
    return `${given} is ${soundOf(given)} (${markOf(givenChars[0])}). "${code}" needs ${markOf(answerChars[0])}: ${answer}.`;
  }

  // Look-alikes.
  if (givenChars.length === 1 && answerChars.length === 1) {
    const pair = LOOKALIKES.find((l) => l.chars.includes(given) && l.chars.includes(answer));
    if (pair) return `${given} is ${soundOf(given)} - easy to mix up with ${answer}, "${code}". ${pair.tip}`;
  }

  return `${given} is ${soundOf(given)}. The sound here is "${code}", which is ${answer}.`;
}
