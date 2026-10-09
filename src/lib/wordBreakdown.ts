import { prisma } from "./prisma";
import { generateWordBreakdowns } from "./openai";
import { LANGUAGES, DEFAULT_LANGUAGE, type LanguageCode } from "./languages";

/**
 * Fire-and-forget: generate and store a word's memorization breakdown right after creation
 * (or after its native text changes) instead of blocking the save. Never throws into the caller.
 */
export function triggerBreakdownGeneration(word: {
  id: string;
  languageCode: string;
  nativeText: string;
  englishGloss: string;
  romanization: string;
}) {
  void (async () => {
    try {
      const lang = LANGUAGES[word.languageCode as LanguageCode] ?? LANGUAGES[DEFAULT_LANGUAGE];
      const { items } = await generateWordBreakdowns([word], lang);
      const breakdown = items[0]?.breakdown;
      if (!breakdown) throw new Error("no breakdown returned");
      await prisma.word.update({ where: { id: word.id }, data: { breakdown } });
    } catch (e) {
      console.error(`[wordBreakdown] background generation failed for word ${word.id}:`, e);
    }
  })();
}
