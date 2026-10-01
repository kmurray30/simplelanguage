import type { Direction } from "@/types";
import type { LanguageConfig } from "./languages";

export function detectDirection(text: string, lang: LanguageConfig): Direction {
  if (!lang.scriptPattern) return "toTarget"; // Latin-script target, can't auto-detect
  return lang.scriptPattern.test(text) ? "toEnglish" : "toTarget";
}
