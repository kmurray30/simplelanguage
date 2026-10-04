import { z } from "zod";
import { CATEGORY_VALUES } from "./categories";
import { LANGUAGE_CODES } from "./languages";

export const WordCategorySchema = z.enum(CATEGORY_VALUES);
export type WordCategory = z.infer<typeof WordCategorySchema>;

export const LanguageCodeSchema = z.enum(LANGUAGE_CODES);

export const TranslationCandidateSchema = z.object({
  nativeText: z.string().min(1),
  phonetic: z.string().min(1),
  englishGloss: z.string().min(1),
  usageNote: z.string().min(1),
  confidence: z.number().min(0).max(1),
  categories: z.array(WordCategorySchema).min(1),
});
export type TranslationCandidate = z.infer<typeof TranslationCandidateSchema>;

export const TranslateResponseSchema = z.object({
  candidates: z.array(TranslationCandidateSchema).min(1).max(5),
});
export type TranslateResponse = z.infer<typeof TranslateResponseSchema>;

// Shape for scripts/generate-word-bank.ts's one-time, batched pool generation - no
// "confidence" (that's specific to matching an ad-hoc translation query, not a static pool
// entry) and no romanization (server-computed via pinyin-pro, same as everywhere else).
export const WordBankItemSchema = z.object({
  nativeText: z.string().min(1),
  phonetic: z.string().min(1),
  englishGloss: z.string().min(1),
  usageNote: z.string().min(1),
  whyNext: z.string().min(1),
  categories: z.array(WordCategorySchema).min(1),
});
export type WordBankItem = z.infer<typeof WordBankItemSchema>;

export const WordBankBatchResponseSchema = z.object({
  items: z.array(WordBankItemSchema),
});
export type WordBankBatchResponse = z.infer<typeof WordBankBatchResponseSchema>;

export const Direction = z.enum(["toTarget", "toEnglish"]);
export type Direction = z.infer<typeof Direction>;

export const TranslateRequestSchema = z.object({
  languageCode: LanguageCodeSchema,
  direction: Direction,
  input: z.string().min(1).max(500),
});

export const WordCreateSchema = z.object({
  languageCode: LanguageCodeSchema,
  nativeText: z.string().min(1),
  englishGloss: z.string().min(1),
  phonetic: z.string().min(1),
  usageNote: z.string().optional(),
  categories: z.array(WordCategorySchema).min(1),
});

export const WordUpdateSchema = z.object({
  nativeText: z.string().min(1).optional(),
  englishGloss: z.string().min(1).optional(),
  phonetic: z.string().min(1).optional(),
  usageNote: z.string().nullable().optional(),
  categories: z.array(WordCategorySchema).min(1).optional(),
});

export const CategorizeRequestItemSchema = z.object({
  id: z.string().min(1),
  nativeText: z.string().min(1),
  englishGloss: z.string().min(1),
});

export const CategorizeResponseSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1), categories: z.array(WordCategorySchema).min(1) })),
});
export type CategorizeResponse = z.infer<typeof CategorizeResponseSchema>;

export const WordBreakdownResponseSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1), breakdown: z.string().min(1) })),
});
export type WordBreakdownResponse = z.infer<typeof WordBreakdownResponseSchema>;
