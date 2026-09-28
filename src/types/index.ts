export type { WordCategory } from "@/lib/categories";
import type { WordCategory } from "@/lib/categories";

export type Word = {
  id: string;
  languageCode: string;
  nativeText: string;
  romanization: string;
  phonetic: string;
  englishGloss: string;
  usageNote: string | null;
  category: WordCategory;
  hasAudio: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TranslationCandidate = {
  nativeText: string;
  romanization: string;
  phonetic: string;
  englishGloss: string;
  usageNote: string;
  confidence: number;
  category: WordCategory;
};

export type SuggestionItem = TranslationCandidate & {
  whyNext: string;
};

export type Direction = "en2zh" | "zh2en";
