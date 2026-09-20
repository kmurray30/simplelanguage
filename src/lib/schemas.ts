import { z } from "zod";

export const TranslationCandidateSchema = z.object({
  nativeText: z.string().min(1),
  phonetic: z.string().min(1),
  englishGloss: z.string().min(1),
  usageNote: z.string().min(1),
  confidence: z.number().min(0).max(1),
});
export type TranslationCandidate = z.infer<typeof TranslationCandidateSchema>;

export const TranslateResponseSchema = z.object({
  candidates: z.array(TranslationCandidateSchema).min(1).max(5),
});
export type TranslateResponse = z.infer<typeof TranslateResponseSchema>;

export const SuggestionItemSchema = TranslationCandidateSchema.extend({
  whyNext: z.string().min(1),
});
export type SuggestionItem = z.infer<typeof SuggestionItemSchema>;

export const SuggestionsResponseSchema = z.object({
  suggestions: z.array(SuggestionItemSchema).min(1),
});
export type SuggestionsResponse = z.infer<typeof SuggestionsResponseSchema>;

export const Direction = z.enum(["en2zh", "zh2en"]);
export type Direction = z.infer<typeof Direction>;

export const TranslateRequestSchema = z.object({
  languageCode: z.string().min(1).default("zh"),
  direction: Direction,
  input: z.string().min(1).max(500),
});

export const WordCreateSchema = z.object({
  languageCode: z.string().min(1).default("zh"),
  nativeText: z.string().min(1),
  englishGloss: z.string().min(1),
  phonetic: z.string().min(1),
  usageNote: z.string().optional(),
});

export const WordUpdateSchema = z.object({
  nativeText: z.string().min(1).optional(),
  englishGloss: z.string().min(1).optional(),
  phonetic: z.string().min(1).optional(),
  usageNote: z.string().nullable().optional(),
});
