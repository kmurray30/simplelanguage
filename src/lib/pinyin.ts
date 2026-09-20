import { pinyin } from "pinyin-pro";

/**
 * Deterministic hanzi -> pinyin (tone marks) conversion. Never trust an
 * LLM-produced romanization; this is the single source of truth for it.
 */
export function toRomanization(nativeText: string): string {
  return pinyin(nativeText, { toneType: "symbol" }).trim();
}
