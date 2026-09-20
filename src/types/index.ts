export type Word = {
  id: string;
  languageCode: string;
  nativeText: string;
  romanization: string;
  phonetic: string;
  englishGloss: string;
  usageNote: string | null;
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
};

export type SuggestionItem = TranslationCandidate & {
  whyNext: string;
};

export type Direction = "en2zh" | "zh2en";
