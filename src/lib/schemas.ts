import { z } from "zod";
import { CATEGORY_VALUES } from "./categories";

export const WordCategorySchema = z.enum(CATEGORY_VALUES);
export type WordCategory = z.infer<typeof WordCategorySchema>;

export const TranslationCandidateSchema = z.object({
  nativeText: z.string().min(1),
  phonetic: z.string().min(1),
  englishGloss: z.string().min(1),
  usageNote: z.string().min(1),
  confidence: z.number().min(0).max(1),
  category: WordCategorySchema,
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
  category: WordCategorySchema,
});
export type WordBankItem = z.infer<typeof WordBankItemSchema>;

export const WordBankBatchResponseSchema = z.object({
  items: z.array(WordBankItemSchema),
});
export type WordBankBatchResponse = z.infer<typeof WordBankBatchResponseSchema>;

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
  category: WordCategorySchema,
});

export const WordUpdateSchema = z.object({
  nativeText: z.string().min(1).optional(),
  englishGloss: z.string().min(1).optional(),
  phonetic: z.string().min(1).optional(),
  usageNote: z.string().nullable().optional(),
  category: WordCategorySchema.optional(),
});

export const CategorizeRequestItemSchema = z.object({
  id: z.string().min(1),
  nativeText: z.string().min(1),
  englishGloss: z.string().min(1),
});

export const CategorizeResponseSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1), category: WordCategorySchema })),
});
export type CategorizeResponse = z.infer<typeof CategorizeResponseSchema>;
