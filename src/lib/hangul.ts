// Hand-authored Hangul reference data for the Korean "Symbols" and "Syllables" flashcard decks.
//
// Everything pronunciation-related here is deliberately NOT derived from the hangul-romanization
// library used for word romanization: that library transliterates letter-by-letter (닭 -> "dalk",
// 값 -> "gapt", 시 -> "si"), which is exactly wrong for the cases a learner needs. The 40 jamo
// entries plus the small rule set / explicit lists below are the whole correctness surface, so
// keep them reviewable in this one file.
//
// Romanization shown is Revised Romanization (RR). "respell" is an English-reader-friendly
// rendering of the actual sound (so 시 is "shee" even though RR writes "si").

// Unicode precomposed-syllable order (U+AC00 = 가 = initial 0, vowel 0, no final).
const INITIALS = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"] as const;
const VOWELS = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"] as const;
const FINALS = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"] as const;

type Initial = (typeof INITIALS)[number];
type Vowel = (typeof VOWELS)[number];
type Final = (typeof FINALS)[number];

export function composeSyllable(initial: Initial, vowel: Vowel, final: Final = ""): string {
  const i = INITIALS.indexOf(initial);
  const v = VOWELS.indexOf(vowel);
  const f = FINALS.indexOf(final);
  return String.fromCharCode(0xac00 + (i * 21 + v) * 28 + f);
}

// --- Per-jamo sound pieces used to build syllable cards ---------------------------------------

// RR and respelling coincide for initials; the sound differences are in the symbol cards' notes.
const INITIAL_SOUND: Record<Initial, string> = {
  ㄱ: "g", ㄲ: "kk", ㄴ: "n", ㄷ: "d", ㄸ: "tt", ㄹ: "r", ㅁ: "m", ㅂ: "b", ㅃ: "pp",
  ㅅ: "s", ㅆ: "ss", ㅇ: "", ㅈ: "j", ㅉ: "jj", ㅊ: "ch", ㅋ: "k", ㅌ: "t", ㅍ: "p", ㅎ: "h",
};

const VOWEL_RR: Record<Vowel, string> = {
  ㅏ: "a", ㅐ: "ae", ㅑ: "ya", ㅒ: "yae", ㅓ: "eo", ㅔ: "e", ㅕ: "yeo", ㅖ: "ye", ㅗ: "o", ㅘ: "wa",
  ㅙ: "wae", ㅚ: "oe", ㅛ: "yo", ㅜ: "u", ㅝ: "wo", ㅞ: "we", ㅟ: "wi", ㅠ: "yu", ㅡ: "eu", ㅢ: "ui", ㅣ: "i",
};

const VOWEL_RESPELL: Record<Vowel, string> = {
  ㅏ: "ah", ㅐ: "eh", ㅑ: "yah", ㅒ: "yeh", ㅓ: "uh", ㅔ: "eh", ㅕ: "yuh", ㅖ: "yeh", ㅗ: "oh", ㅘ: "wah",
  ㅙ: "weh", ㅚ: "weh", ㅛ: "yoh", ㅜ: "oo", ㅝ: "wuh", ㅞ: "weh", ㅟ: "wee", ㅠ: "yoo", ㅡ: "eu", ㅢ: "eu-ee", ㅣ: "ee",
};

// The seven sounds a syllable can end in. Every other final letter neutralizes to one of these.
const FINAL_SOUND: Partial<Record<Final, string>> = {
  ㄱ: "k", ㄴ: "n", ㄷ: "t", ㄹ: "l", ㅁ: "m", ㅂ: "p", ㅇ: "ng",
};

// Vowels that palatalize a preceding ㅅ/ㅆ into "sh" (시 = shee, 샤 = shah, 쉬 = shwee).
const PALATAL_VOWELS = new Set<Vowel>(["ㅣ", "ㅑ", "ㅒ", "ㅕ", "ㅖ", "ㅛ", "ㅠ", "ㅟ", "ㅢ"]);
// Vowels starting with a y-glide that ㅈ/ㅉ/ㅊ (and a palatalized ㅅ/ㅆ) absorb: 쟤 sounds like 제.
const Y_VOWELS = new Set<Vowel>(["ㅑ", "ㅒ", "ㅕ", "ㅖ", "ㅛ", "ㅠ"]);

type SyllableSection =
  | "Basic"
  | "Tense consonants"
  | "Compound vowels"
  | "Final sounds"
  | "Neutralized finals"
  | "Double finals"
  | "Tricky ones";

export type HangulSyllable = {
  block: string;
  section: SyllableSection;
  rr: string;
  respell: string;
  note?: string;
};

function buildSyllable(
  section: SyllableSection,
  initial: Initial,
  vowel: Vowel,
  final: Final = "",
  extraNote?: string,
): HangulSyllable {
  const block = composeSyllable(initial, vowel, final);
  const notes: string[] = [];

  let onset = INITIAL_SOUND[initial];
  let vowelRespell = VOWEL_RESPELL[vowel];

  const isS = initial === "ㅅ" || initial === "ㅆ";
  if (isS && PALATAL_VOWELS.has(vowel)) {
    onset = initial === "ㅅ" ? "sh" : "ssh";
    notes.push(`${initial} before ${vowel} sounds like "sh"`);
  }
  if ((isS && PALATAL_VOWELS.has(vowel)) || initial === "ㅈ" || initial === "ㅉ" || initial === "ㅊ") {
    if (Y_VOWELS.has(vowel)) {
      vowelRespell = vowelRespell.replace(/^y/, "");
      if (!isS) notes.push(`the "y" is silent after ${initial} (${block} sounds like ${composeSyllable(initial, dropGlide(vowel), final)})`);
    }
  }
  if (initial !== "ㅇ" && vowel === "ㅖ") {
    vowelRespell = "eh";
    notes.push(`ㅖ after a consonant is pronounced like ㅔ ("eh")`);
  }
  if (initial !== "ㅇ" && vowel === "ㅢ") {
    vowelRespell = "ee";
    notes.push(`ㅢ after a consonant is pronounced "ee"`);
  }
  if (initial === "ㅇ" && vowel === "ㅢ") {
    notes.push(`word-initial: ㅡ+ㅣ blended · as the possessive particle: "eh" · after a consonant: "ee"`);
  }
  if (initial === "ㄹ") notes.push(`ㄹ at a syllable start is a quick tap, like the "tt" in American "butter"`);
  if (vowel === "ㅡ") notes.push(`ㅡ: say "oo" as in "good" with your lips spread flat`);
  if (vowel === "ㅐ" || vowel === "ㅔ") notes.push(`ㅐ and ㅔ sound the same in modern speech ("e" in "bed")`);
  if (vowel === "ㅒ" && initial === "ㅇ") notes.push(`ㅒ and ㅖ sound the same in modern speech`);
  if (vowel === "ㅙ" || vowel === "ㅚ" || vowel === "ㅞ") notes.push(`ㅙ, ㅚ and ㅞ all sound like "we" in "wet" in modern speech`);

  const finalSound = final ? (FINAL_SOUND[final] ?? "") : "";
  if (final) {
    const unreleased = finalSound === "k" || finalSound === "t" || finalSound === "p";
    notes.push(`final ${final} → "${finalSound}"${unreleased ? " (unreleased - the tongue stops the air, no puff)" : ""}`);
  }
  if (extraNote) notes.push(extraNote);

  return {
    block,
    section,
    rr: `${INITIAL_SOUND[initial]}${VOWEL_RR[vowel]}${finalSound}`,
    respell: `${onset}${vowelRespell}${finalSound}`,
    note: notes.length ? notes.join(" · ") : undefined,
  };
}

function dropGlide(vowel: Vowel): Vowel {
  const map: Partial<Record<Vowel, Vowel>> = { ㅑ: "ㅏ", ㅒ: "ㅐ", ㅕ: "ㅓ", ㅖ: "ㅔ", ㅛ: "ㅗ", ㅠ: "ㅜ" };
  return map[vowel] ?? vowel;
}

const BASIC_CONSONANTS: Initial[] = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const TENSE_CONSONANTS: Initial[] = ["ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ"];
const BASIC_VOWELS: Vowel[] = ["ㅏ", "ㅑ", "ㅓ", "ㅕ", "ㅗ", "ㅛ", "ㅜ", "ㅠ", "ㅡ", "ㅣ"];
const COMPOUND_VOWELS: Vowel[] = ["ㅐ", "ㅒ", "ㅔ", "ㅖ", "ㅘ", "ㅙ", "ㅚ", "ㅝ", "ㅞ", "ㅟ", "ㅢ"];
const SEVEN_FINALS: Final[] = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅇ"];

// Explicit cards where the written final letter(s) and the spoken sound differ.
type ExplicitSyllable = { block: string; rr: string; respell: string; note: string };

const NEUTRALIZED_FINALS: ExplicitSyllable[] = [
  { block: "옷", rr: "ot", respell: "oht", note: `final ㅅ → "t"` },
  { block: "꽃", rr: "kkot", respell: "kkoht", note: `final ㅊ → "t"` },
  { block: "낮", rr: "nat", respell: "naht", note: `final ㅈ → "t"` },
  { block: "빛", rr: "bit", respell: "beet", note: `final ㅊ → "t"` },
  { block: "밭", rr: "bat", respell: "baht", note: `final ㅌ → "t"` },
  { block: "있", rr: "it", respell: "eet", note: `final ㅆ → "t"` },
  { block: "밖", rr: "bak", respell: "bahk", note: `final ㄲ → "k"` },
  { block: "부엌", rr: "bueok", respell: "boo-uhk", note: `final ㅋ → "k"` },
  { block: "앞", rr: "ap", respell: "ahp", note: `final ㅍ → "p"` },
  { block: "히읗", rr: "hieut", respell: "hee-eut", note: `final ㅎ → "t" (rare - this is the letter's own name)` },
];

const DOUBLE_FINALS: ExplicitSyllable[] = [
  { block: "닭", rr: "dak", respell: "dahk", note: `ㄺ → only the ㄱ is pronounced` },
  { block: "읽", rr: "ik", respell: "eek", note: `ㄺ → only the ㄱ is pronounced` },
  { block: "삶", rr: "sam", respell: "sahm", note: `ㄻ → only the ㅁ is pronounced` },
  { block: "값", rr: "gap", respell: "gahp", note: `ㅄ → only the ㅂ is pronounced` },
  { block: "없", rr: "eop", respell: "uhp", note: `ㅄ → only the ㅂ is pronounced` },
  { block: "앉", rr: "an", respell: "ahn", note: `ㄵ → only the ㄴ is pronounced` },
  { block: "않", rr: "an", respell: "ahn", note: `ㄶ → only the ㄴ is pronounced` },
  { block: "넓", rr: "neol", respell: "nuhl", note: `ㄼ → usually only the ㄹ is pronounced` },
  { block: "밟", rr: "bap", respell: "bahp", note: `ㄼ → the exception: 밟 takes the ㅂ, not the ㄹ` },
  { block: "핥", rr: "hal", respell: "hahl", note: `ㄾ → only the ㄹ is pronounced` },
  { block: "읊", rr: "eup", respell: "eup", note: `ㄿ → only the ㅍ is pronounced (as "p")` },
  { block: "잃", rr: "il", respell: "eel", note: `ㅀ → only the ㄹ is pronounced` },
  { block: "몫", rr: "mok", respell: "mohk", note: `ㄳ → only the ㄱ is pronounced` },
];

function section(
  name: SyllableSection,
  initials: Initial[],
  vowels: Vowel[],
  finals: Final[] = [""],
): HangulSyllable[] {
  const out: HangulSyllable[] = [];
  for (const i of initials) for (const v of vowels) for (const f of finals) out.push(buildSyllable(name, i, v, f));
  return out;
}

function explicit(name: SyllableSection, items: ExplicitSyllable[]): HangulSyllable[] {
  return items.map((it) => ({ block: it.block, section: name, rr: it.rr, respell: it.respell, note: it.note }));
}

export const HANGUL_SYLLABLES: HangulSyllable[] = [
  ...section("Basic", BASIC_CONSONANTS, BASIC_VOWELS),
  ...section("Tense consonants", TENSE_CONSONANTS, BASIC_VOWELS),
  ...section("Compound vowels", ["ㅇ"], COMPOUND_VOWELS),
  buildSyllable("Compound vowels", "ㄱ", "ㅘ"),
  buildSyllable("Compound vowels", "ㄱ", "ㅝ"),
  buildSyllable("Compound vowels", "ㄱ", "ㅟ"),
  buildSyllable("Compound vowels", "ㄱ", "ㅚ"),
  buildSyllable("Compound vowels", "ㅅ", "ㅟ"),
  buildSyllable("Compound vowels", "ㅈ", "ㅟ"),
  buildSyllable("Compound vowels", "ㅁ", "ㅝ"),
  buildSyllable("Compound vowels", "ㅂ", "ㅘ"),
  buildSyllable("Compound vowels", "ㄷ", "ㅙ"),
  buildSyllable("Compound vowels", "ㄱ", "ㅖ"),
  buildSyllable("Compound vowels", "ㅎ", "ㅖ"),
  buildSyllable("Compound vowels", "ㄹ", "ㅖ"),
  buildSyllable("Compound vowels", "ㅈ", "ㅒ"),
  buildSyllable("Compound vowels", "ㄱ", "ㅒ"),
  buildSyllable("Compound vowels", "ㅎ", "ㅢ"),
  buildSyllable("Compound vowels", "ㄴ", "ㅢ"),
  buildSyllable("Compound vowels", "ㄸ", "ㅢ"),
  ...section("Final sounds", ["ㄱ"], ["ㅏ"], SEVEN_FINALS),
  ...section("Final sounds", ["ㅇ"], ["ㅏ"], SEVEN_FINALS),
  ...explicit("Neutralized finals", NEUTRALIZED_FINALS),
  ...explicit("Double finals", DOUBLE_FINALS),
  buildSyllable("Tricky ones", "ㅅ", "ㅣ"),
  buildSyllable("Tricky ones", "ㅆ", "ㅣ"),
  buildSyllable("Tricky ones", "ㅅ", "ㅑ"),
  buildSyllable("Tricky ones", "ㅅ", "ㅛ"),
  buildSyllable("Tricky ones", "ㅅ", "ㅠ"),
  buildSyllable("Tricky ones", "ㅅ", "ㅟ"),
  buildSyllable("Tricky ones", "ㅆ", "ㅢ"),
  buildSyllable("Tricky ones", "ㅇ", "ㅢ"),
  buildSyllable("Tricky ones", "ㅎ", "ㅢ"),
  buildSyllable("Tricky ones", "ㄴ", "ㅢ"),
  buildSyllable("Tricky ones", "ㄸ", "ㅢ"),
  buildSyllable("Tricky ones", "ㄱ", "ㅖ"),
  buildSyllable("Tricky ones", "ㅎ", "ㅖ"),
  buildSyllable("Tricky ones", "ㄹ", "ㅖ"),
  buildSyllable("Tricky ones", "ㅈ", "ㅒ"),
];

// --- Symbol cards ----------------------------------------------------------------------------

export type HangulSymbol = {
  jamo: string;
  kind: "Consonant" | "Tense consonant" | "Vowel" | "Compound vowel";
  name: string; // letter name + its RR, e.g. "기역 · giyeok"
  sound: string; // headline, e.g. "g / k" (start / end of syllable)
  example: string; // "as in" examples; **x** marks the sound being illustrated
  detail: string; // position / articulation notes
  audioSyllable: string; // what to play - TTS reads a lone letter by its name, so use a syllable
};

const c = (
  jamo: string,
  name: string,
  sound: string,
  example: string,
  detail: string,
  audioSyllable: string,
  kind: HangulSymbol["kind"] = "Consonant",
): HangulSymbol => ({ jamo, kind, name, sound, example, detail, audioSyllable });

const v = (jamo: string, rr: string, example: string, detail: string, kind: HangulSymbol["kind"] = "Vowel"): HangulSymbol => ({
  jamo,
  kind,
  name: `${composeSyllable("ㅇ", jamo as Vowel)} · ${rr}`,
  sound: rr,
  example,
  detail,
  audioSyllable: composeSyllable("ㅇ", jamo as Vowel),
});

export const HANGUL_SYMBOLS: HangulSymbol[] = [
  c("ㄱ", "기역 · giyeok", "g / k", "**g**o · wal**k**", `Start of a syllable: a soft "g" with little air (between English g and k). End of a syllable: an unreleased "k".`, "가"),
  c("ㄴ", "니은 · nieun", "n", "**n**o · su**n**", `"n" at the start or end of a syllable.`, "나"),
  c("ㄷ", "디귿 · digeut", "d / t", "**d**og · ca**t**", `Start: a soft "d" with little air. End: an unreleased "t".`, "다"),
  c("ㄹ", "리을 · rieul", "r / l", "American bu**tt**er · fee**l**", `Start or between vowels: a quick tap, like the "tt" in American "butter" or Spanish "pero". End of a syllable: "l". Doubled across syllables (ㄹㄹ): "ll".`, "라"),
  c("ㅁ", "미음 · mieum", "m", "**m**om · hu**m**", `"m" at the start or end of a syllable.`, "마"),
  c("ㅂ", "비읍 · bieup", "b / p", "**b**oy · cu**p**", `Start: a soft "b" with little air. End: an unreleased "p".`, "바"),
  c("ㅅ", "시옷 · siot", "s", "**s**nake · 시 = **sh**ee · ca**t**", `Start: "s" - but "sh" before ㅣ and the y-vowels (시 shee, 샤 shah, 쇼 shoh, 슈 shoo). End of a syllable: "t".`, "사"),
  c("ㅇ", "이응 · ieung", "– / ng", "si**ng**", `Start of a syllable: silent - a placeholder so the vowel can stand alone (아 = "ah"). End of a syllable: "ng".`, "앙"),
  c("ㅈ", "지읒 · jieut", "j", "**j**ump", `Start: a soft "j" with little air (between English j and ch). End of a syllable: "t". A following y-glide is silent (쟈 = 자).`, "자"),
  c("ㅊ", "치읓 · chieut", "ch", "**ch**urch", `"ch" with a strong puff of air. End of a syllable: "t".`, "차"),
  c("ㅋ", "키읔 · kieuk", "k", "**k**ite", `"k" with a strong puff of air - the aspirated partner of ㄱ. End of a syllable: "k".`, "카"),
  c("ㅌ", "티읕 · tieut", "t", "**t**op", `"t" with a strong puff of air - the aspirated partner of ㄷ. End of a syllable: "t".`, "타"),
  c("ㅍ", "피읖 · pieup", "p", "**p**ie", `"p" with a strong puff of air - the aspirated partner of ㅂ. End of a syllable: "p".`, "파"),
  c("ㅎ", "히읗 · hieut", "h", "**h**at", `"h". At the end of a syllable (rare) it sounds like "t"; it often aspirates a neighboring consonant (좋다 = jota).`, "하"),
  c("ㄲ", "쌍기역 · ssanggiyeok", "kk", "s**k**y · 밖 = bahk", `Tense "k": no puff of air, throat tight - like the k in English "sky". End of a syllable: "k".`, "까", "Tense consonant"),
  c("ㄸ", "쌍디귿 · ssangdigeut", "tt", "s**t**op", `Tense "t": no puff of air, throat tight - like the t in English "stop". Never ends a syllable.`, "따", "Tense consonant"),
  c("ㅃ", "쌍비읍 · ssangbieup", "pp", "s**p**y", `Tense "p": no puff of air, throat tight - like the p in English "spy". Never ends a syllable.`, "빠", "Tense consonant"),
  c("ㅆ", "쌍시옷 · ssangsiot", "ss", "hi**ss** · 씨 = **ssh**ee · 있 = eet", `A tense, sharp "s" (throat tight). "ssh" before ㅣ and the y-vowels. End of a syllable: "t".`, "싸", "Tense consonant"),
  c("ㅉ", "쌍지읒 · ssangjieut", "jj", "a tight, clipped **j**eep", `Tense "j": no puff of air, throat tight, clipped. Never ends a syllable.`, "짜", "Tense consonant"),
  v("ㅏ", "a", "f**a**ther", `Open "ah".`),
  v("ㅑ", "ya", "**ya**rd", `"yah" - ㅏ with a y-glide.`),
  v("ㅓ", "eo", "c**u**p", `"uh" - mouth open, lips unrounded. Not "oh", and not the rounded "aw" of "saw".`),
  v("ㅕ", "yeo", "**yu**ck", `"yuh" - ㅓ with a y-glide.`),
  v("ㅗ", "o", "g**o**", `A pure "oh" - no "w" tail at the end, lips rounded.`),
  v("ㅛ", "yo", "**yo**ga", `"yoh" - ㅗ with a y-glide.`),
  v("ㅜ", "u", "m**oo**n", `"oo", lips rounded.`),
  v("ㅠ", "yu", "**you**", `"yoo" - ㅜ with a y-glide.`),
  v("ㅡ", "eu", "g**oo**d, lips spread flat", `No English equivalent: say the "oo" of "good" but spread your lips flat as if smiling.`),
  v("ㅣ", "i", "s**ee**", `"ee".`),
  v("ㅐ", "ae", "b**e**d", `"eh". Historically "a" as in "cat", but in modern speech ㅐ and ㅔ are pronounced identically - textbooks that distinguish them describe an old distinction.`, "Compound vowel"),
  v("ㅒ", "yae", "**ye**s", `"yeh" - identical to ㅖ in modern speech.`, "Compound vowel"),
  v("ㅔ", "e", "b**e**d", `"eh" - identical to ㅐ in modern speech.`, "Compound vowel"),
  v("ㅖ", "ye", "**ye**s", `"yeh". After a consonant it loses the glide and sounds like ㅔ: 계 = geh, 혜 = heh, 례 = reh.`, "Compound vowel"),
  v("ㅘ", "wa", "w**a**nd", `"wah" (ㅗ + ㅏ).`, "Compound vowel"),
  v("ㅙ", "wae", "**we**t", `"weh". In modern speech ㅙ, ㅚ and ㅞ all sound the same.`, "Compound vowel"),
  v("ㅚ", "oe", "**we**t", `"weh" in modern speech (historically a rounded "ö"). Same as ㅙ and ㅞ today.`, "Compound vowel"),
  v("ㅝ", "wo", "**wo**n", `"wuh" (ㅜ + ㅓ).`, "Compound vowel"),
  v("ㅞ", "we", "**we**t", `"weh". Same as ㅙ and ㅚ in modern speech.`, "Compound vowel"),
  v("ㅟ", "wi", "**wee**k", `"wee" (ㅜ + ㅣ).`, "Compound vowel"),
  v("ㅢ", "ui", "ㅡ + ㅣ blended", `Three readings: at the start of a word, ㅡ and ㅣ blended quickly ("eu-ee"); as the possessive particle 의, "eh"; after a consonant (희, 늬), just "ee".`, "Compound vowel"),
];

// Every text the flashcard decks may ask the TTS endpoint for - the endpoint rejects anything else.
export const HANGUL_AUDIO_TEXTS: ReadonlySet<string> = new Set([
  ...HANGUL_SYMBOLS.map((s) => s.audioSyllable),
  ...HANGUL_SYLLABLES.map((s) => s.block),
]);
