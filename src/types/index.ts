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
  category: WordCategory;
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
  category: WordCategory;
};

export type TranslationCandidate = WordDraft & {
  confidence: number;
};

export type SuggestionItem = WordDraft & {
  whyNext: string;
  poolId: string;
};

// A quick-add search result, merging the pre-generated suggestion pool (fast, audio-capable)
// with fresh LLM candidates for words the pool doesn't have yet. `poolId` is set once the item
// is backed by a real SuggestionPoolWord row - present from the start for pool hits, or filled
// in lazily (via /api/suggestions/ensure) the first time an LLM-only result's audio is played.
export type SearchResultItem = WordDraft & {
  source: "pool" | "llm";
  poolId: string | null;
  whyNext: string | null;
};

export type CategoryCount = {
  category: WordCategory;
  count: number;
};
