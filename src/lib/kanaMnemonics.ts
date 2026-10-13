// Picture mnemonics for the 46 basic kana, from Tofugu's hiragana and katakana mnemonic charts
// (tofugu.com). Each picture lives in public/mnemonics/<script>/<file>.png, cropped from the chart.

import type { KanaScript } from "./kana";

export type Mnemonic = { src: string; caption: string };

// hiragana, katakana, file name, hiragana caption, katakana caption
const TABLE: [string, string, string, string, string][] = [
  ["あ", "ア", "a", "Find the capital A in あ", "Find the capital A in ア"],
  ["い", "イ", "i", "A couple of eels (i)", "An eagle"],
  ["う", "ウ", "u", "Find the U in the う", "Looks like the hiragana う"],
  ["え", "エ", "e", "An exotic bird", "A girder an engineer would use"],
  ["お", "オ", "o", "Two letter o symbols", "An opera singer: \"Ohhhhh ♪\""],
  ["か", "カ", "ka", "Someone doing the \"can-can\" (ka) dance", "Looks like the hiragana か"],
  ["き", "キ", "ki", "A key (ki)", "A key"],
  ["く", "ク", "ku", "The mouth of a cuckoo (ku) bird saying \"ku ku, ku ku!\"", "A cook's hat"],
  ["け", "ケ", "ke", "A keg", "The letter K"],
  ["こ", "コ", "ko", "A couple of co-habitating (ko) worms", "Two 90° corners"],
  ["さ", "サ", "sa", "A weird (sa) sign", "A sardine and a salmon on a skewer"],
  ["し", "シ", "shi", "A poor seal (shi)", "She has a weird face"],
  ["す", "ス", "su", "A swing (su) throwing that poor kid off of it", "A superman suit"],
  ["せ", "セ", "se", "How sexy is that tooth?", "Looks like the hiragana せ"],
  ["そ", "ソ", "so", "A songbird", "A needle and a thread to sew"],
  ["た", "タ", "ta", "This kana looks like \"ta\"", "Tako (\"kite\" in Japanese) with a taco design on it"],
  ["ち", "チ", "chi", "Where's the chin?", "A cheerleader doing a cheer"],
  ["つ", "ツ", "tsu", "Two (tsu) fish", "Two needles and a thread"],
  ["て", "テ", "te", "Ten", "A telephone pole"],
  ["と", "ト", "to", "A toe with a little splinter in it", "A totem pole"],
  ["な", "ナ", "na", "The naughty (na) nun is praying in front of the cross", "A narwhal"],
  ["に", "ニ", "ni", "A needle (ni) pulling a thread", "A couple of needles"],
  ["ぬ", "ヌ", "nu", "Some noodles (nu)", "Some noodles"],
  ["ね", "ネ", "ne", "Neko is Japanese for \"cat\" - it's Nelly the neko!", "A horse jumping over a hurdle: \"Neigh!\""],
  ["の", "ノ", "no", "A pig nose", "A really long nose"],
  ["は", "ハ", "ha", "This kana looks like \"ha\"", "A rice paddy hat"],
  ["ひ", "ヒ", "hi", "He (hi) has a big nose", "He is saying \"he he hee!\""],
  ["ふ", "フ", "fu", "A fu-reaky hula dancer", "A flag that's triangle shaped"],
  ["へ", "ヘ", "he", "The famous mountain, Mt. Saint Helens", "Looks like the hiragana へ"],
  ["ほ", "ホ", "ho", "A mutated Santa Claus uttering \"ho ho ho\"", "A holy cross with holy light coming off it"],
  ["ま", "マ", "ma", "Imagine your ma looking like this. Aghh!", "Look at all the angles and all the math stuff"],
  ["み", "ミ", "mi", "Who just turned 21? Me (mi)!", "Three missiles"],
  ["む", "ム", "mu", "\"Moooooo\" (mu), says the cow", "Looks like a cow's face: \"moooo\""],
  ["め", "メ", "me", "め (me) is Japanese for \"eye\"", "An X mark over someone's め (\"eye\" in Japanese)"],
  ["も", "モ", "mo", "Catch more fish, so add more worms to your hook", "Looks like the hiragana も"],
  ["や", "ヤ", "ya", "A yak", "Looks like the hiragana や"],
  ["ゆ", "ユ", "yu", "A unique (yu) looking fish", "You have a hook for a hand"],
  ["よ", "ヨ", "yo", "The hitchhiker is yelling \"yo! yo!\"", "A yogi doing some yoga"],
  ["ら", "ラ", "ra", "The rapper is rapping at the DJ table", "A raptor wearing sunglasses like a rapper"],
  ["り", "リ", "ri", "The reeds (ri) are swaying in the wind", "Looks like the hiragana り"],
  ["る", "ル", "ru", "る is a crazier route (ru)", "Two routes"],
  ["れ", "レ", "re", "This guy is retching up his dinner", "Look at the beautiful red hair Rei has!"],
  ["ろ", "ロ", "ro", "A plain old road, especially compared to る", "A square shaped road"],
  ["わ", "ワ", "wa", "A wasp flying straight up", "A question mark: \"What????\""],
  ["を", "ヲ", "wo", "Whoa! (wo) There's a boomerang in his mouth", "A dog woofing so hard its tongue is flying out"],
  ["ん", "ン", "n", "This kana looks just like a lowercase n", "A man with one eye: \"Mnn, why only one eye?\""],
];

const BY_CHAR = new Map<string, Mnemonic>();
for (const [hira, kata, file, hiraCaption, kataCaption] of TABLE) {
  BY_CHAR.set(hira, { src: `/mnemonics/hiragana/${file}.png`, caption: hiraCaption });
  BY_CHAR.set(kata, { src: `/mnemonics/katakana/${file}.png`, caption: kataCaption });
}

export const MNEMONIC_CREDIT = "Mnemonic by Tofugu";

// The picture mnemonic for a basic kana in either script, or undefined (voiced kana, combinations...).
export function kanaMnemonic(char: string, script?: KanaScript): Mnemonic | undefined {
  const m = BY_CHAR.get(char);
  if (!m || (script && !m.src.includes(`/${script}/`))) return undefined;
  return m;
}
