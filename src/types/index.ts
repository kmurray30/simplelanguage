export type { WordCategory } from "@/lib/categories";
import type { WordCategory } from "@/lib/categories";
export type { LanguageCode } from "@/lib/languages";
import type { LanguageCode } from "@/lib/languages";
export type { Direction } from "@/lib/schemas";

export type Word = {
  id: string;
  languageCode: LanguageCode;
  nativeText: string;
  romanization: string;
  phonetic: string;
  englishGloss: string;
  usageNote: string | null;
  categories: WordCategory[];
  breakdown: string | null;
  starred: boolean;
  hasAudio: boolean;
  createdAt: string;
  updatedAt: string;
};

// Common shape for anything that can seed the add-word confirm screen, whether picked from a
// live translation candidate or a pre-generated suggestion - neither "confidence" (translation
// match quality) nor "whyNext" (suggestion rationale) is meaningful once a word is selected.
export type WordDraft = {
  nativeText: string;
  romanization: string;
  phonetic: string;
  englishGloss: string;
  usageNote: string;
  categories: WordCategory[];
};

export type TranslationCandidate = WordDraft & {
  confidence: number;
};

export type SuggestionItem = WordDraft & {
  whyNext: string;
  poolId: string;
};

export type CategoryCount = {
  category: WordCategory;
  count: number;
};
