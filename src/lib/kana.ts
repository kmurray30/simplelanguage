// Hand-authored reference data for the Japanese Hiragana and Katakana flashcard decks and quizzes.
//
// Romanization is modified Hepburn (shi, chi, tsu, fu, ji), which is what learners and signs use.
// Cue words prefer English words with the same sound, or Japanese words English already borrowed
// (karaoke, sushi, tsunami), where the bold part IS the kana's sound. Nothing here is generated at
// runtime; this file plus src/lib/kanaQuiz.ts is the whole correctness surface.

export type KanaScript = "hiragana" | "katakana";

export type KanaGroup = "Basic" | "Voiced ゛" | "Half-voiced ゜" | "Combined" | "Special" | "Foreign sounds";

export type KanaEntry = {
  hira: string | null; // null for katakana-only entries (ー and foreign sounds)
  kata: string;
  romaji: string; // the sound, as shown on cards and as the quiz's code
  group: KanaGroup;
};

// --- Script conversion -------------------------------------------------------------------------

// Hiragana U+3041..U+3096 and katakana U+30A1..U+30F6 are laid out in the same order, 0x60 apart.
export function toKatakana(text: string): string {
  return [...text]
    .map((ch) => {
      const code = ch.codePointAt(0)!;
      return code >= 0x3041 && code <= 0x3096 ? String.fromCodePoint(code + 0x60) : ch;
    })
    .join("");
}

export function toHiragana(text: string): string {
  return [...text]
    .map((ch) => {
      const code = ch.codePointAt(0)!;
      return code >= 0x30a1 && code <= 0x30f6 ? String.fromCodePoint(code - 0x60) : ch;
    })
    .join("");
}

export function isHiraganaChar(ch: string): boolean {
  const code = ch.codePointAt(0)!;
  return code >= 0x3041 && code <= 0x3096;
}

export function isKatakanaChar(ch: string): boolean {
  const code = ch.codePointAt(0)!;
  return (code >= 0x30a1 && code <= 0x30fa) || ch === "ー";
}

// --- The table ---------------------------------------------------------------------------------

function rows(group: KanaGroup, spec: string): KanaEntry[] {
  return spec
    .trim()
    .split(/\s*\|\s*/)
    .map((row) => {
      const [hira, kata, romaji] = row.split(" ");
      return { hira, kata, romaji, group };
    });
}

const BASIC = rows(
  "Basic",
  `あ ア a | い イ i | う ウ u | え エ e | お オ o |
   か カ ka | き キ ki | く ク ku | け ケ ke | こ コ ko |
   さ サ sa | し シ shi | す ス su | せ セ se | そ ソ so |
   た タ ta | ち チ chi | つ ツ tsu | て テ te | と ト to |
   な ナ na | に ニ ni | ぬ ヌ nu | ね ネ ne | の ノ no |
   は ハ ha | ひ ヒ hi | ふ フ fu | へ ヘ he | ほ ホ ho |
   ま マ ma | み ミ mi | む ム mu | め メ me | も モ mo |
   や ヤ ya | ゆ ユ yu | よ ヨ yo |
   ら ラ ra | り リ ri | る ル ru | れ レ re | ろ ロ ro |
   わ ワ wa | を ヲ o | ん ン n`,
);

const VOICED = rows(
  "Voiced ゛",
  `が ガ ga | ぎ ギ gi | ぐ グ gu | げ ゲ ge | ご ゴ go |
   ざ ザ za | じ ジ ji | ず ズ zu | ぜ ゼ ze | ぞ ゾ zo |
   だ ダ da | ぢ ヂ ji | づ ヅ zu | で デ de | ど ド do |
   ば バ ba | び ビ bi | ぶ ブ bu | べ ベ be | ぼ ボ bo`,
);

const HALF_VOICED = rows("Half-voiced ゜", `ぱ パ pa | ぴ ピ pi | ぷ プ pu | ぺ ペ pe | ぽ ポ po`);

// き + small ゃ = one syllable "kya". The consonant part of each combination's romaji:
const COMBINING: [string, string][] = [
  ["き", "ky"], ["し", "sh"], ["ち", "ch"], ["に", "ny"], ["ひ", "hy"], ["み", "my"], ["り", "ry"],
  ["ぎ", "gy"], ["じ", "j"], ["び", "by"], ["ぴ", "py"],
];

const COMBINED: KanaEntry[] = COMBINING.flatMap(([base, consonant]) =>
  (
    [
      ["ゃ", "a"],
      ["ゅ", "u"],
      ["ょ", "o"],
    ] as const
  ).map(([small, vowel]) => ({
    hira: base + small,
    kata: toKatakana(base + small),
    romaji: consonant + vowel,
    group: "Combined" as const,
  })),
);

const SPECIAL: KanaEntry[] = [
  { hira: "っ", kata: "ッ", romaji: "(pause)", group: "Special" },
  { hira: "ゃ", kata: "ャ", romaji: "(small ya)", group: "Special" },
  { hira: "ゅ", kata: "ュ", romaji: "(small yu)", group: "Special" },
  { hira: "ょ", kata: "ョ", romaji: "(small yo)", group: "Special" },
  { hira: null, kata: "ー", romaji: "(long vowel)", group: "Special" },
];

// Katakana-only spellings for sounds Japanese borrowed from other languages.
const FOREIGN: KanaEntry[] = (
  [
    ["ファ", "fa"], ["フィ", "fi"], ["フェ", "fe"], ["フォ", "fo"], ["フュ", "fyu"],
    ["ウィ", "wi"], ["ウェ", "we"], ["ウォ", "wo"],
    ["ヴァ", "va"], ["ヴィ", "vi"], ["ヴ", "vu"], ["ヴェ", "ve"], ["ヴォ", "vo"],
    ["シェ", "she"], ["ジェ", "je"], ["チェ", "che"],
    ["ティ", "ti"], ["ディ", "di"], ["トゥ", "tu"], ["ドゥ", "du"], ["テュ", "tyu"], ["デュ", "dyu"],
    ["ツァ", "tsa"], ["ツィ", "tsi"], ["ツェ", "tse"], ["ツォ", "tso"], ["イェ", "ye"],
  ] as const
).map(([kata, romaji]) => ({ hira: null, kata, romaji, group: "Foreign sounds" as const }));

export const KANA: KanaEntry[] = [...BASIC, ...VOICED, ...HALF_VOICED, ...COMBINED, ...SPECIAL, ...FOREIGN];

// --- Cue words, keyed by sound -----------------------------------------------------------------
// "**x**" marks the part that sounds like the kana. The romaji code is always shown alongside, so a
// cue only has to point at the sound, not spell it.

export const CUES: Record<string, string[]> = {
  a: ["f**a**ther", "sp**a**"],
  i: ["s**ee**", "m**ee**t"],
  u: ["m**oo**n, with relaxed lips", "f**oo**d, with relaxed lips"],
  e: ["b**e**d", "p**e**n"],
  o: ["g**o**", "b**o**ne"],
  ka: ["**ka**raoke", "**ca**lm"],
  ki: ["**key**", "**ki**mono"],
  ku: ["**coo**l", "**coo**p"],
  ke: ["**ke**g", "**ke**ttle"],
  ko: ["**ko**i", "**co**ke"],
  sa: ["**sa**murai", "**sa**lsa"],
  shi: ["**shee**p", "**she**"],
  su: ["**su**shi", "**sue**"],
  se: ["**se**t", "**se**nd"],
  so: ["**so**da", "**so**ul"],
  ta: ["**ta**ngo", "**ta**co"],
  chi: ["**chee**se", "**chee**r"],
  tsu: ["**tsu**nami", "ca**ts** + oo, said as one sound"],
  te: ["**te**n", "**te**st"],
  to: ["**to**fu", "**to**ast"],
  na: ["**na**chos", "**Na**goya"],
  ni: ["**knee**", "**nee**d"],
  nu: ["**noo**dle", "**noo**n"],
  ne: ["**ne**t", "**ne**ck"],
  no: ["**no**", "**no**te"],
  ha: ["**ha**iku", "**ha**ha"],
  hi: ["**he**", "**hee**l"],
  fu: ["**Fu**ji", "**foo**d, said softly with no teeth on the lip"],
  he: ["**he**n", "**he**lp"],
  ho: ["**ho**tel", "**ho**pe"],
  ma: ["**ma**nga", "**ma**ma"],
  mi: ["**mi**so", "**me**"],
  mu: ["**moo**", "**moo**d"],
  me: ["**me**t", "**me**ss"],
  mo: ["**mo**chi", "**mo**ld"],
  ya: ["**ya**rd", "**Ya**hoo"],
  yu: ["**you**", "**yu**zu"],
  yo: ["**yo**ga", "**yo**yo"],
  ra: ["**ra**men", "ka**ra**oke"],
  ri: ["o**ri**gami", "a**ri**a"],
  ru: ["Pe**ru**, with a tapped r", "**ru**by, with a tapped r"],
  re: ["**re**d, with a tapped r", "**re**st, with a tapped r"],
  ro: ["**ro**bot, with a tapped r", "**ro**se, with a tapped r"],
  wa: ["**wa**sabi", "**wa**ffle"],
  n: ["su**n**", "ba**n**d"],
  ga: ["**ga**rden", "**ga**la"],
  gi: ["**gee**se", "**gee**k"],
  gu: ["**goo**", "**goo**se"],
  ge: ["**ge**t", "**gue**ss"],
  go: ["**go**", "**go**ld"],
  za: ["**Za**ra"],
  ji: ["**jee**p", "**gi**n"],
  zu: ["**zoo**", "**zoo**m"],
  ze: ["**ze**st", "**ze**ppelin"],
  zo: ["**zo**ne", "**zo**mbie"],
  da: ["**da**shi", "**da**d"],
  de: ["**de**sk", "**de**n"],
  do: ["**do**pe", "**do**ze"],
  ba: ["**ba**nzai", "**ba**r"],
  bi: ["**bee**", "**bee**p"],
  bu: ["**boo**", "**boo**t"],
  be: ["**be**d", "**be**t"],
  bo: ["**bo**nsai", "**bo**ne"],
  pa: ["**pa**pa", "**pa**lm"],
  pi: ["**pee**k", "**pee**p"],
  pu: ["**poo**l", "**poo**dle"],
  pe: ["**pe**n", "**pe**t"],
  po: ["**po**ke", "**po**le"],
  kya: ["ba**ck ya**rd"],
  kyu: ["**cu**te", "**Kyu**shu"],
  kyo: ["**Kyo**to", "To**kyo**"],
  sha: ["**sha**mpoo", "**Sha**nghai"],
  shu: ["**shoe**", "**shoo**t"],
  sho: ["**sho**w", "**Sho**gun"],
  cha: ["**cha**-cha", "**cha**kra"],
  chu: ["**chew**", "**choo**-choo"],
  cho: ["**cho**se", "**cho**ke"],
  nya: ["ca**ny**on"],
  nyu: ["**new**, said \"nyoo\""],
  nyo: ["ca**ny**on's \"ny\" + **o**h"],
  hya: ["**h** + **ya**rd, blended"],
  hyu: ["**hu**ge", "**hu**man"],
  hyo: ["**h** + **yo**ga, blended"],
  mya: ["**m** + **ya**rd, blended"],
  myu: ["**mu**sic", "**mu**le"],
  myo: ["**m** + **yo**ga, blended"],
  rya: ["a tapped **r** + **ya**rd"],
  ryu: ["a tapped **r** + **you**"],
  ryo: ["a tapped **r** + **yo**ga"],
  gya: ["bi**g ya**rd"],
  gyu: ["bi**g you**"],
  gyo: ["bi**g yo**yo"],
  ja: ["**ja**r", "**ja**zz"],
  ju: ["**ju**do", "**ju**ice"],
  jo: ["**jo**ke", "**Jo**e"],
  bya: ["**b** + **ya**rd, blended"],
  byu: ["**beau**ty", "**bu**gle"],
  byo: ["**b** + **yo**ga, blended"],
  pya: ["**p** + **ya**rd, blended"],
  pyu: ["**pu**ny", "**pu**re"],
  pyo: ["**p** + **yo**ga, blended"],
  fa: ["**fa**ther"],
  fi: ["**fee**"],
  fe: ["**fe**d"],
  fo: ["**pho**ne"],
  fyu: ["**fu**se"],
  wi: ["**wee**k"],
  we: ["**we**t"],
  wo: ["**wa**ter"],
  va: ["**va**st"],
  vi: ["**vee**"],
  vu: ["**voo**doo"],
  ve: ["**ve**st"],
  vo: ["**vo**te"],
  she: ["**she**d"],
  je: ["**je**t"],
  che: ["**che**ss"],
  ti: ["**tea**"],
  di: ["**dee**p"],
  tu: ["**too**"],
  du: ["**do**, \"doo\""],
  tyu: ["**Tu**esday, said \"tyoo\""],
  dyu: ["**du**ke, said \"dyook\""],
  tsa: ["ca**ts** + ah"],
  tsi: ["ca**ts** + ee"],
  tse: ["ca**ts** + eh"],
  tso: ["ca**ts** + oh"],
  ye: ["**ye**s"],
};

// --- Notes -------------------------------------------------------------------------------------
// Keyed by the kana itself (script-specific) first, then by sound.

const R_NOTE =
  "Japanese r is a quick tap of the tongue - somewhere between English r, l and d, like the \"tt\" in American \"butter\".";

const SOUND_NOTES: Record<string, string> = {
  u: "Lips stay relaxed - less rounded than English \"oo\". Between voiceless consonants it often nearly disappears (です sounds like \"dess\").",
  shi: "Written shi, not \"si\": the s softens to sh before i.",
  chi: "Written chi, not \"ti\": the t becomes ch before i.",
  tsu: "Written tsu, not \"tu\": the t becomes ts before u. Don't confuse it with the small っ/ッ, which doubles the next consonant instead.",
  fu: "Between h and f: blow gently through relaxed lips, without touching your teeth to your lip.",
  ra: R_NOTE,
  ri: R_NOTE,
  ru: R_NOTE,
  re: R_NOTE,
  ro: R_NOTE,
  n: "The only kana that is a consonant on its own. It sounds n, m before b/p/m (さんぽ sampo) or ng before k/g (ぎんこう ginkō), depending on what follows.",
  wa: "わ/ワ is \"wa\" inside words. The topic particle, also pronounced \"wa\", is written with は.",
  ga: "Some speakers soften g to ng in the middle of a word; the plain g is always correct.",
};

const KANA_NOTES: Record<string, string> = {
  は: "は is \"ha\" - except as the topic particle, where it's pronounced \"wa\" (私は, watashi wa).",
  へ: "へ is \"he\" - except as the direction particle, where it's pronounced \"e\" (学校へ, gakkō e). It looks almost the same as katakana ヘ.",
  を: "Pronounced just \"o\", the same as お. It is only used for the object particle (りんごを食べる, ringo o taberu).",
  ヲ: "Pronounced \"o\", the same as オ. Almost never used in katakana.",
  じ: "じ is the everyday \"ji\". ぢ sounds exactly the same but only appears in a few words (はなぢ, nosebleed).",
  ぢ: "Sounds exactly like じ. Used only in a few words, mostly where a ち gets voiced (はな + ち = はなぢ, nosebleed).",
  ず: "ず is the everyday \"zu\". づ sounds exactly the same but only appears in a few words (つづく, to continue).",
  づ: "Sounds exactly like ず. Used only in a few words, mostly where a つ gets voiced (つづく, to continue; みかづき, crescent moon).",
  ジ: "ジ is the everyday \"ji\" in katakana; ヂ is almost never used.",
  ヂ: "Sounds exactly like ジ, and is almost never used.",
  ズ: "ズ is the everyday \"zu\" in katakana; ヅ is almost never used.",
  ヅ: "Sounds exactly like ズ, and is almost never used.",
  っ: "Small tsu has no sound of its own: it doubles the next consonant with a tiny pause (きって, kitte, \"stamp\").",
  ッ: "Small tsu has no sound of its own: it doubles the next consonant with a tiny pause (ベッド, beddo, \"bed\").",
  ゃ: "Small ya joins the kana before it into one syllable: き + ゃ = きゃ (kya). Full-size や would make two (き や, ki-ya).",
  ゅ: "Small yu joins the kana before it into one syllable: き + ゅ = きゅ (kyu).",
  ょ: "Small yo joins the kana before it into one syllable: き + ょ = きょ (kyo).",
  ャ: "Small ya joins the kana before it into one syllable: キ + ャ = キャ (kya).",
  ュ: "Small yu joins the kana before it into one syllable: キ + ュ = キュ (kyu).",
  ョ: "Small yo joins the kana before it into one syllable: キ + ョ = キョ (kyo).",
  ー: "Katakana's long-vowel mark: it stretches the vowel before it (コーヒー, kōhī, \"coffee\"). Hiragana doubles the vowel instead (おかあさん).",
  ヴ: "Used for a v sound in foreign words (ヴァイオリン, violin). Many words just use b instead (バイオリン).",
};

export function kanaNote(entry: KanaEntry, script: KanaScript): string | undefined {
  const char = script === "hiragana" ? entry.hira : entry.kata;
  if (char && KANA_NOTES[char]) return KANA_NOTES[char];
  if (entry.group === "Combined" && char) {
    const [base, small] = [...char];
    // Each small ゃゅょ/ャュョ sits one code point before its full-size twin.
    const big = String.fromCodePoint(small.codePointAt(0)! + 1);
    return `${base} + small ${small} = one syllable, "${entry.romaji}". With a full-size ${big} it would be two syllables (${base}${big}).`;
  }
  if (entry.group === "Foreign sounds") {
    return "Used for foreign words: a small vowel kana after another kana makes a sound Japanese doesn't otherwise have.";
  }
  return SOUND_NOTES[entry.romaji];
}

// Every text a kana card may ask the TTS endpoint for (marks with no sound of their own excluded).
export const KANA_AUDIO_TEXTS: ReadonlySet<string> = new Set(
  KANA.filter((e) => e.group !== "Special").flatMap((e) => [e.hira, e.kata].filter((c): c is string => c !== null)),
);

// --- Kana -> romaji ------------------------------------------------------------------------------
// Used to accept a Japanese word typed as its kana reading. Returns null for anything that isn't kana.

const ROMAJI = new Map<string, string>();
for (const e of KANA) {
  if (e.group === "Special") continue;
  if (e.hira) ROMAJI.set(e.hira, e.romaji);
  ROMAJI.set(e.kata, e.romaji);
}

export function kanaToRomaji(text: string): string | null {
  const chars = [...text];
  let out = "";
  let doubleNext = false;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === "っ" || ch === "ッ") {
      doubleNext = true;
      continue;
    }
    if (ch === "ー") {
      const lastVowel = out.match(/[aeiou](?!.*[aeiou])/)?.[0];
      if (lastVowel) out += lastVowel;
      continue;
    }
    const pair = ROMAJI.get(ch + (chars[i + 1] ?? ""));
    const romaji = pair ?? ROMAJI.get(ch);
    if (!romaji) return null;
    if (pair) i++;
    out += doubleNext ? (romaji.startsWith("ch") ? "t" : romaji[0]) + romaji : romaji;
    doubleNext = false;
  }
  return out;
}
