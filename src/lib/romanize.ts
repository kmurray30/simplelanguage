import { pinyin } from "pinyin-pro";
import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";
import { convert as convertHangul } from "hangul-romanization";
import type { LanguageCode } from "./languages";

function romanizeZh(nativeText: string): string {
  return pinyin(nativeText, { toneType: "symbol" }).trim();
}

// Kuroshiro's kuromoji analyzer loads a dictionary (tens of MB) on init - expensive, so it's
// lazily initialized once per server process and reused, never re-created per request.
let kuroshiroPromise: Promise<Kuroshiro> | null = null;
function getKuroshiro(): Promise<Kuroshiro> {
  if (!kuroshiroPromise) {
    kuroshiroPromise = (async () => {
      const k = new Kuroshiro();
      await k.init(new KuromojiAnalyzer());
      return k;
    })();
  }
  return kuroshiroPromise;
}

async function romanizeJa(nativeText: string): Promise<string> {
  const k = await getKuroshiro();
  const romaji = await k.convert(nativeText, { to: "romaji", mode: "normal" });
  return romaji.trim();
}

function romanizeKo(nativeText: string): string {
  return convertHangul(nativeText).trim();
}

/**
 * Deterministic native-text -> romanization, dispatched per language. Never trust an
 * LLM-produced romanization; this is the single source of truth. Returns "" for languages that
 * don't use romanization (French, Spanish already use the Latin script).
 */
export async function romanize(languageCode: LanguageCode, nativeText: string): Promise<string> {
  switch (languageCode) {
    case "zh":
      return romanizeZh(nativeText);
    case "ja":
      return romanizeJa(nativeText);
    case "ko":
      return romanizeKo(nativeText);
    case "fr":
    case "es":
      return "";
  }
}
