// Pre-written responses for wrong answers in the Symbols quiz. Nothing here is generated at runtime:
// every (question, wrong letter) pair resolves to fixed text, most specific rule first:
//
//   1. a hand-written response for that exact question + wrong letter
//   2. same-sound finals (ㄷ ㅅ ㅈ ㅊ ㅌ ㅆ ㅎ all end in t, etc.)
//   3. a letter that can never end a syllable (ㄸ ㅃ ㅉ) given for a final
//   4. plain / aspirated / tense mix-ups within a family (ㄱ ㅋ ㄲ, ㄷ ㅌ ㄸ, ㅂ ㅍ ㅃ, ㅈ ㅊ ㅉ)
//   5. hand-written vowel mix-ups, then y-glide and w-glide pairs
//   6. consonant-vs-vowel mix-ups
//   7. a generic "X is <sound>; this one is <sound>" built from the flashcard data

import { HANGUL_SYMBOLS } from "./hangul";
import { blankedWord, fullWord } from "./hangulBlocks";
import type { QuizItem, QuizVariant } from "./hangulQuiz";

const SYMBOL = new Map(HANGUL_SYMBOLS.map((s) => [s.jamo, s]));

// --- Plain / aspirated / tense families ---------------------------------------------------------

type Strength = "plain" | "aspirated" | "tense";

const STOP_FAMILIES: { letters: Record<Strength, string>; tip: string }[] = [
  {
    letters: { plain: "ㄱ", aspirated: "ㅋ", tense: "ㄲ" },
    tip: "Hold a hand in front of your mouth: ㅋ puffs air, ㄲ stays tight with no puff (like the k in \"sky\"), and ㄱ is the soft in-between one.",
  },
  {
    letters: { plain: "ㄷ", aspirated: "ㅌ", tense: "ㄸ" },
    tip: "Hold a hand in front of your mouth: ㅌ puffs air, ㄸ stays tight with no puff (like the t in \"stop\"), and ㄷ is the soft in-between one.",
  },
  {
    letters: { plain: "ㅂ", aspirated: "ㅍ", tense: "ㅃ" },
    tip: "Hold a hand in front of your mouth: ㅍ puffs air, ㅃ stays tight with no puff (like the p in \"spy\"), and ㅂ is the soft in-between one.",
  },
  {
    letters: { plain: "ㅈ", aspirated: "ㅊ", tense: "ㅉ" },
    tip: "Hold a hand in front of your mouth: ㅊ puffs air, ㅉ stays tight and clipped with no puff, and ㅈ is the soft in-between one.",
  },
];

const FEEL: Record<string, string> = {
  ㄱ: "the soft g (little air, between g and k)",
  ㅋ: "the k with a strong puff of air, like the k in \"kite\"",
  ㄲ: "the tight k with no puff, like the k in \"sky\"",
  ㄷ: "the soft d (little air)",
  ㅌ: "the t with a strong puff of air, like the t in \"top\"",
  ㄸ: "the tight t with no puff, like the t in \"stop\"",
  ㅂ: "the soft b (little air)",
  ㅍ: "the p with a strong puff of air, like the p in \"pie\"",
  ㅃ: "the tight p with no puff, like the p in \"spy\"",
  ㅈ: "the soft j (little air)",
  ㅊ: "the ch with a strong puff of air, like \"church\"",
  ㅉ: "the tight, clipped j with no puff",
};

function familyOf(jamo: string) {
  return STOP_FAMILIES.find((f) => Object.values(f.letters).includes(jamo));
}

// --- Final-position sound groups ---------------------------------------------------------------

const FINAL_GROUPS: { letters: string[]; sound: string }[] = [
  { letters: ["ㄷ", "ㅅ", "ㅈ", "ㅊ", "ㅌ", "ㅆ", "ㅎ"], sound: "t" },
  { letters: ["ㄱ", "ㅋ", "ㄲ"], sound: "k" },
  { letters: ["ㅂ", "ㅍ"], sound: "p" },
];

const NEVER_FINAL = new Set(["ㄸ", "ㅃ", "ㅉ"]);

// --- Hand-written responses --------------------------------------------------------------------

// Keyed `${item.id}|${given}` - position-aware.
const ITEM_SPECIFIC: Record<string, string> = {
  "i:ㅇ|ㅎ": "ㅎ is a real h sound (하 = ha). The letter that holds a syllable's place when it starts with a vowel sound is the silent ㅇ (아 = ah).",
  "i:ㅅ|ㅆ": "ㅆ is the tense, sharper s. Plain ㅅ is the ordinary s of \"sun\" - and it softens to sh before ㅣ (시 = shee).",
  "i:ㅆ|ㅅ": "ㅅ is the ordinary, relaxed s of \"sun\". The tense ㅆ is sharper and tighter, like holding the hiss of \"hiss\".",
  "i:ㅅ|ㅈ": "ㅈ is j (jump). Even when ㅅ sounds like \"sh\" before ㅣ, it is still ㅅ - there is no separate letter for sh.",
  "i:ㅆ|ㅈ": "ㅈ is j. Even when ㅆ sounds like a tense \"sh\" before ㅣ (씨), it is still ㅆ - there is no separate letter for sh.",
  "i:ㄹ|ㄴ": "ㄴ is a plain n, with the tongue pressed against the ridge behind your teeth. ㄹ at the start of a syllable is a quick tap - the \"tt\" of American \"butter\".",
  "f:ㄹ|ㄴ": "ㄴ is n (산 = san). At the end of a syllable the letter for l is ㄹ (물 = mul).",
  "f:ㅇ|ㄴ": "ㄴ is n (sun). The ng of \"sing\" is ㅇ at the end of a syllable (강 = gang).",
  "f:ㅇ|ㅁ": "ㅁ is m (hum) - lips closed. The ng of \"sing\" is ㅇ at the end of a syllable (강 = gang), with the back of the tongue raised and lips open.",
  "f:ㄴ|ㅇ": "ㅇ at the end of a syllable is ng (sing). The n of \"sun\" is ㄴ (산 = san).",
  "f:ㅁ|ㅇ": "ㅇ at the end of a syllable is ng (sing). The m of \"hum\" is ㅁ - lips closed (밤 = bam).",
  "f:ㅁ|ㄴ": "ㄴ is n (sun) - tongue on the ridge behind your teeth. For m (hum) close your lips: ㅁ.",
  "f:ㄴ|ㅁ": "ㅁ is m (hum) - lips closed. For n (sun) keep your lips open and press your tongue behind your teeth: ㄴ.",
  "m:ㄱ|ㅋ": "ㅋ always keeps its strong puff of air, even between vowels. Between vowels the plain ㄱ is simply voiced - a clear g (아가 = aga).",
  "m:ㄷ|ㅌ": "ㅌ always keeps its strong puff of air, even between vowels. Between vowels the plain ㄷ is simply voiced - a clear d (아다 = ada).",
  "m:ㅂ|ㅍ": "ㅍ always keeps its strong puff of air, even between vowels. Between vowels the plain ㅂ is simply voiced - a clear b (아바 = aba).",
  "m:ㅈ|ㅊ": "ㅊ always keeps its strong puff of air, even between vowels. Between vowels the plain ㅈ is simply voiced - a clear j (아자 = aja).",
};

// Keyed `${item.answer}|${given}` - applies in any position.
const PAIR_SPECIFIC: Record<string, string> = {
  "ㅓ|ㅗ": "ㅗ is the rounded \"oh\" (go) - lips pushed forward. ㅓ is \"uh\" (cup): mouth open and lips relaxed, not rounded.",
  "ㅗ|ㅓ": "ㅓ is \"uh\" (cup) - mouth open, lips relaxed. ㅗ is the rounded \"oh\": push your lips forward and hold them there.",
  "ㅓ|ㅏ": "ㅏ is the wide-open \"ah\" (father). ㅓ is \"uh\" (cup) - a more relaxed, mid-open mouth.",
  "ㅏ|ㅓ": "ㅓ is \"uh\" (cup) - mouth only half open. ㅏ is the wide-open \"ah\" (father).",
  "ㅜ|ㅡ": "ㅡ is the flat-lipped vowel (like the oo of \"good\" with a smile). ㅜ is \"oo\" with the lips rounded and pushed forward (moon).",
  "ㅡ|ㅜ": "ㅜ is \"oo\" with the lips rounded (moon). ㅡ is the same tongue position with the lips spread flat, as if smiling.",
  "ㅣ|ㅡ": "ㅡ is the flat-lipped \"eu\" with the tongue back. ㅣ is the bright \"ee\" of \"see\", with the tongue forward.",
  "ㅡ|ㅣ": "ㅣ is the bright \"ee\" of \"see\". ㅡ keeps the tongue further back with the lips spread flat - no English match.",
  "ㅐ|ㅔ": "ㅔ is romanized e. Today ㅐ and ㅔ sound identical (the e of \"bed\"), so you can't hear the difference - the code is what tells them apart: ae is ㅐ, e is ㅔ.",
  "ㅔ|ㅐ": "ㅐ is romanized ae. Today ㅐ and ㅔ sound identical (the e of \"bed\"), so you can't hear the difference - the code is what tells them apart: e is ㅔ, ae is ㅐ.",
  "ㅒ|ㅖ": "ㅖ is romanized ye. Today ㅒ and ㅖ sound identical (\"yeh\"), so the code is what tells them apart: yae is ㅒ, ye is ㅖ.",
  "ㅖ|ㅒ": "ㅒ is romanized yae. Today ㅒ and ㅖ sound identical (\"yeh\"), so the code is what tells them apart: ye is ㅖ, yae is ㅒ.",
  "ㅙ|ㅚ": "ㅚ is romanized oe. ㅙ, ㅚ and ㅞ all sound like \"weh\" today, so the code is what tells them apart: wae is ㅙ, oe is ㅚ, we is ㅞ.",
  "ㅙ|ㅞ": "ㅞ is romanized we. ㅙ, ㅚ and ㅞ all sound like \"weh\" today, so the code is what tells them apart: wae is ㅙ, oe is ㅚ, we is ㅞ.",
  "ㅚ|ㅙ": "ㅙ is romanized wae. ㅙ, ㅚ and ㅞ all sound like \"weh\" today, so the code is what tells them apart: wae is ㅙ, oe is ㅚ, we is ㅞ.",
  "ㅚ|ㅞ": "ㅞ is romanized we. ㅙ, ㅚ and ㅞ all sound like \"weh\" today, so the code is what tells them apart: wae is ㅙ, oe is ㅚ, we is ㅞ.",
  "ㅞ|ㅙ": "ㅙ is romanized wae. ㅙ, ㅚ and ㅞ all sound like \"weh\" today, so the code is what tells them apart: wae is ㅙ, oe is ㅚ, we is ㅞ. Korean spells English \"we\" with ㅞ (웹 web, 웨스트 west, 웰 well).",
  "ㅞ|ㅚ": "ㅚ is romanized oe. ㅙ, ㅚ and ㅞ all sound like \"weh\" today, so the code is what tells them apart: wae is ㅙ, oe is ㅚ, we is ㅞ. Korean spells English \"we\" with ㅞ (웹 web, 웨스트 west, 웰 well).",
  "ㅟ|ㅢ": "ㅢ starts with ㅡ (flat lips, eu) and slides into ㅣ. ㅟ starts with ㅜ (rounded lips, oo) and slides into ㅣ: \"wee\".",
  "ㅢ|ㅟ": "ㅟ starts with ㅜ (rounded lips) - \"wee\". ㅢ starts with ㅡ (flat lips) and slides into ㅣ: \"eu-ee\".",
  "ㅘ|ㅝ": "ㅝ is ㅜ + ㅓ: \"wuh\" (won, water). ㅘ is ㅗ + ㅏ: \"wah\" (wand, waffle).",
  "ㅝ|ㅘ": "ㅘ is ㅗ + ㅏ: \"wah\" (wand, waffle). ㅝ is ㅜ + ㅓ: \"wuh\" (won) - and Korean spells English \"water\" and \"watch\" with ㅝ (워터, 워치).",
  "ㅑ|ㅕ": "ㅕ is ㅓ with a y-glide: \"yuh\" (yuck). ㅑ is ㅏ with a y-glide: \"yah\" (yard).",
  "ㅕ|ㅑ": "ㅑ is ㅏ with a y-glide: \"yah\" (yard). ㅕ is ㅓ with a y-glide: \"yuh\" (yuck).",
  "ㅛ|ㅠ": "ㅠ is ㅜ with a y-glide: \"yoo\" (you). ㅛ is ㅗ with a y-glide: \"yoh\" (yoga).",
  "ㅠ|ㅛ": "ㅛ is ㅗ with a y-glide: \"yoh\" (yoga). ㅠ is ㅜ with a y-glide: \"yoo\" (you).",
  "ㅛ|ㅕ": "ㅕ is \"yuh\" (yuck) with the lips relaxed. ㅛ is \"yoh\" (yoga) with the lips rounded.",
  "ㅕ|ㅛ": "ㅛ is \"yoh\" (yoga) with the lips rounded. ㅕ is \"yuh\" (yuck) with the lips relaxed.",
  "ㅇ|ㅎ": "ㅎ is a real h sound. The letter that holds a syllable's place when it starts with a vowel sound is the silent ㅇ.",
  "ㄹ|ㄷ": "ㄷ is a stop - the tongue holds against the ridge behind your teeth and releases. ㄹ is a quick tap: the tongue just flicks it, like the \"tt\" of American \"butter\".",
  "ㅅ|ㅌ": "ㅌ is t with a puff of air (top). ㅅ is s (sun) - air hissing past the tongue.",
  "ㅊ|ㅅ": "ㅅ is s (or sh before ㅣ). ㅊ is ch (church) with a strong puff.",
  "ㅅ|ㅊ": "ㅊ is ch with a strong puff. ㅅ is s (sun), or sh before ㅣ - a smooth hiss, no ch.",
  "ㅎ|ㅇ": "ㅇ is silent at the start of a syllable. ㅎ is the breathy h (hat).",
  "ㅁ|ㅂ": "ㅂ is b - lips pop open (boy). ㅁ is m - lips stay closed and the sound goes through your nose (mom).",
  "ㅂ|ㅁ": "ㅁ is m - lips closed and the sound goes through your nose. ㅂ is b - lips pop open (boy).",
  "ㄴ|ㄷ": "ㄷ is d - the tongue pops away from the ridge behind your teeth (dog). ㄴ is n - the tongue stays there and the sound goes through your nose (no).",
  "ㄷ|ㄴ": "ㄴ is n - sound through your nose (no). ㄷ is d - the tongue pops away from the ridge behind your teeth (dog).",
};

// y-glide and w-glide pairs, so every "forgot the glide" slip gets a response without hand-writing each.
const Y_PAIRS: [string, string][] = [["ㅏ", "ㅑ"], ["ㅓ", "ㅕ"], ["ㅗ", "ㅛ"], ["ㅜ", "ㅠ"], ["ㅐ", "ㅒ"], ["ㅔ", "ㅖ"]];
const W_PAIRS: [string, string][] = [["ㅏ", "ㅘ"], ["ㅓ", "ㅝ"], ["ㅣ", "ㅟ"], ["ㅔ", "ㅞ"], ["ㅐ", "ㅙ"]];

function sound(jamo: string): string {
  return SYMBOL.get(jamo)?.sound ?? jamo;
}

function glideNote(answer: string, given: string): string | null {
  for (const [base, withY] of Y_PAIRS) {
    if (answer === base && given === withY) return `${given} is ${base} with a y-glide in front (${sound(given)}). This sound has no y - it is just ${sound(base)}.`;
    if (answer === withY && given === base) return `${given} has no y-glide (${sound(given)}). This sound starts with a y: ${given} plus a y-glide is ${answer} (${sound(answer)}).`;
  }
  for (const [base, withW] of W_PAIRS) {
    if (answer === base && given === withW) return `${given} adds a w-glide in front (${sound(given)}). This sound has no w - it is just ${sound(base)}.`;
    if (answer === withW && given === base) return `${given} has no w-glide (${sound(given)}). This sound starts with a w: ${answer} is ${sound(answer)}.`;
  }
  return null;
}

// --- Entry point -------------------------------------------------------------------------------

export function explainWrong(item: QuizItem, variant: QuizVariant, given: string): string {
  const message = baseExplanation(item, variant, given);
  // Merged vowels (ㅙ ㅚ ㅞ) are told apart by the Korean word, so name it.
  if (item.position === "vowel" && variant.ko) {
    return `${message} This word (${fullWord(variant.ko)}, ${variant.ko.gloss}) is spelled with ${item.answer}.`;
  }
  return message;
}

function baseExplanation(item: QuizItem, variant: QuizVariant, given: string): string {
  const specific = ITEM_SPECIFIC[`${item.id}|${given}`];
  if (specific) return specific;

  const givenSymbol = SYMBOL.get(given);
  const givenIsVowel = givenSymbol ? givenSymbol.kind === "Vowel" || givenSymbol.kind === "Compound vowel" : false;
  const answerIsVowel = item.position === "vowel";

  // The silent placeholder: any other consonant is simply the wrong kind of letter.
  if (item.id === "i:ㅇ" && !givenIsVowel) {
    return `${given} makes a sound (${sound(given)}). A syllable that starts with a vowel sound still needs a consonant letter first, so Korean uses the silent placeholder ㅇ.`;
  }

  if (item.position === "final") {
    const group = FINAL_GROUPS.find((g) => g.letters.includes(item.answer));
    if (group && group.letters.includes(given)) {
      const word = variant.ko ? fullWord(variant.ko) : null;
      const blank = variant.ko ? blankedWord(variant.ko) : null;
      const where = word && blank && variant.ko ? ` This word (${word}, ${variant.ko.gloss}) is spelled with ${item.answer}.` : ` This one is spelled with ${item.answer}.`;
      return `${given} sounds exactly the same as ${item.answer} at the end of a syllable - ${group.letters.join(" ")} all collapse to an unreleased ${group.sound} there, so your ear can't tell them apart.${where} Spellings like this are learned with the word.`;
    }
    if (NEVER_FINAL.has(given)) {
      return `${given} never ends a syllable - the tense consonants ㄸ ㅃ ㅉ only appear at the start. At the end of a syllable the sound ${item.code} is written ${item.answer}.`;
    }
  }

  const pair = PAIR_SPECIFIC[`${item.answer}|${given}`];
  if (pair) return pair;

  const family = familyOf(given);
  if (family && family === familyOf(item.answer)) {
    const medialNote = item.position === "medial" ? " Between vowels the plain letter is voiced, never puffed or tight." : "";
    return `${given} is ${FEEL[given]}. The sound here is ${FEEL[item.answer]} - that is ${item.answer}.${medialNote} ${family.tip}`;
  }

  if (answerIsVowel && givenIsVowel) {
    const glide = glideNote(item.answer, given);
    if (glide) return glide;
  }

  if (answerIsVowel && givenSymbol && !givenIsVowel) {
    return `${given} is a consonant (${sound(given)}). This question asks for a vowel - ${item.answer} is ${sound(item.answer)}.`;
  }
  if (!answerIsVowel && givenIsVowel) {
    return `${given} is a vowel (${sound(given)}). This question asks for a consonant - ${item.answer} is ${item.code}.`;
  }

  return `${given} is ${sound(given)} (${givenSymbol?.example.replace(/\*\*/g, "") ?? ""}). The sound here is ${item.code}, which is written ${item.answer}.`;
}
