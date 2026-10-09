import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { OPENAI_MODEL } from "./constants";
import { CATEGORIES } from "./categories";
import type { LanguageConfig } from "./languages";
import {
  TranslateResponseSchema,
  WordBankBatchResponseSchema,
  CategorizeResponseSchema,
  WordBreakdownResponseSchema,
  type Direction,
  type TranslateResponse,
  type WordBankBatchResponse,
  type CategorizeResponse,
  type WordBreakdownResponse,
} from "./schemas";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CATEGORY_LIST_PROMPT = CATEGORIES.map((c) => `${c.value} (${c.label})`).join(", ");
const CATEGORY_RULE = `- "categories" must be every normalized value from this list that reasonably applies
  (most words fit more than one - e.g. a core everyday word like "hello" or "thanks" should
  include BASICS in addition to its more specific category like GREETINGS). Include at least
  one; use OTHER only if nothing else reasonably applies: ${CATEGORY_LIST_PROMPT}.`;

function translatorSystemPrompt(lang: LanguageConfig): string {
  const romanizationRule = lang.needsRomanization
    ? `- Never include romanization anywhere in your output - that is computed separately.`
    : `- This language already uses the Latin alphabet, so there is no separate romanization field.`;

  return `You are a ${lang.name} tutor helping an English-speaking student build a
personal vocabulary list. You are given either an English phrase (possibly informal or
annotated with context in parentheses) or a ${lang.name} phrase, plus a direction to translate in.

Rules:
- Always prefer the natural, commonly-used real-world translation over a stiff literal one.
- Propose 3-5 distinct candidates that vary by register, formality, or context where that
  makes sense (e.g. formal vs casual, spoken vs written) - don't pad with near-duplicates.
${romanizationRule}
- "phonetic" must be a rough, English-reader-friendly respelling of the pronunciation, using
  English spelling conventions a non-speaker could sound out (e.g. "syeh-syeh") - not the
  language's own romanization system's letters where those would mislead an English reader.
- "usageNote" is one short sentence on how/when this is actually used in real life and how
  common it is.
- "confidence" (0-1) reflects how well this candidate matches the requested word/phrase and
  how commonly it's actually used - not how fluent the phrasing sounds.
- If given unstructured input like "thank you (silly and informal)", parse the intent and
  the parenthetical qualifier and let it steer which candidates you propose.
${CATEGORY_RULE}`;
}

function wordBankSystemPrompt(lang: LanguageConfig): string {
  const romanizationNote = lang.needsRomanization
    ? "no romanization (computed separately)"
    : "no romanization needed (this language already uses the Latin alphabet)";

  return `You are building a reference word bank for an English-speaking student learning
${lang.name}: a ranked list of the most common and useful everyday ${lang.name} words/short
phrases, split into batches by rank range (e.g. "words ranked 1-50 by frequency/usefulness").
For each word, include a one-sentence "whyNext" explaining why it's a good word to learn.

You will be given a list of words already generated in earlier batches - never repeat any of
them, and don't repeat words within your own batch either.

Same field rules as translation, minus confidence (not applicable to a static reference list):
natural glosses, English-reader-friendly "phonetic", ${romanizationNote}, one-sentence
"usageNote".
${CATEGORY_RULE}`;
}

const CATEGORIZE_SYSTEM_PROMPT = `You are organizing a vocabulary list into normalized learning-unit
categories, the way a language course would group words into units (greetings, food, travel,
etc). You are given a list of words (id, native text, English gloss). For each one, assign every
category id from this fixed list that reasonably applies - most words fit more than one (e.g. a
core everyday word like "hello" or "thanks" should include BASICS in addition to its more
specific category like GREETINGS). Include at least one id per word; use OTHER only if nothing
else reasonably applies:
${CATEGORY_LIST_PROMPT}

Return one item per input id - don't skip any, don't invent new ids.`;

function wordBreakdownSystemPrompt(lang: LanguageConfig): string {
  return `You help an English-speaking student memorize ${lang.name} vocabulary by explaining
where a word comes from and how its parts fit together - the way a good teacher would when
asked "why does this word mean that?"

You are given a list of words (id, native text with romanization, English gloss). For each one,
write a short "breakdown" (2-5 sentences, plain prose, no markdown) that:
- If the word is made of multiple recognizable parts (morphemes, characters, or words), identify
  each part, its own literal meaning, and explain how they combine to produce the overall
  meaning. Example: Korean 안녕하세요 (annyeonghaseyo, "hello") breaks down as "annyeong" (安寧,
  peace/well-being) + "haseyo" (a polite/formal form of "to do/be"), literally something like
  "are you at peace" - used as a formal greeting.
- If there's other genuinely useful etymology or word-formation history that helps the word
  stick in memory (e.g. a character's original pictographic meaning, a loanword's source
  language, a sound pattern that recurs in related words), include it.
- Only include what actually helps recall the word. Skip trivia, historical anecdotes, or
  cultural facts that don't connect to the word's form or meaning.
- If the word is a single, non-decomposable unit with no useful internal structure, say so in
  one sentence and instead give the single best memory hook you can (a vivid image, a
  similar-sounding English word, a pattern it shares with a common related word) - never leave
  the student with nothing to hold onto.

Return one item per input id - don't skip any, don't invent new ids.`;
}

function directionHint(direction: Direction, lang: LanguageConfig): string {
  return direction === "toTarget"
    ? `Direction: English -> ${lang.name}. The input below is English (possibly informal/annotated).`
    : `Direction: ${lang.name} -> English. The input below is ${lang.name}.`;
}

export async function generateTranslationCandidates(
  input: string,
  direction: Direction,
  lang: LanguageConfig,
): Promise<TranslateResponse> {
  const completion = await client.chat.completions.parse({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: translatorSystemPrompt(lang) },
      { role: "user", content: `${directionHint(direction, lang)}\n\nInput: ${input}` },
    ],
    response_format: zodResponseFormat(TranslateResponseSchema, "translate_response"),
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) throw new Error("OpenAI returned no parsed translation response");
  return parsed;
}

export async function generateWordBankBatch(
  alreadyGenerated: string[],
  batchSize: number,
  rankRangeLabel: string,
  lang: LanguageConfig,
): Promise<WordBankBatchResponse> {
  const excludeList =
    alreadyGenerated.length > 0 ? alreadyGenerated.join(", ") : "(none yet - this is the first batch)";

  const completion = await client.chat.completions.parse({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: wordBankSystemPrompt(lang) },
      {
        role: "user",
        content: `Words already generated in earlier batches (never repeat these):\n${excludeList}\n\nGenerate exactly ${batchSize} new words for rank range ${rankRangeLabel}.`,
      },
    ],
    response_format: zodResponseFormat(WordBankBatchResponseSchema, "word_bank_batch_response"),
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) throw new Error("OpenAI returned no parsed word bank batch response");
  return parsed;
}

export async function categorizeWords(
  words: { id: string; nativeText: string; englishGloss: string }[],
): Promise<CategorizeResponse> {
  const list = words.map((w) => `${w.id}: ${w.nativeText} (${w.englishGloss})`).join("\n");

  const completion = await client.chat.completions.parse({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: CATEGORIZE_SYSTEM_PROMPT },
      { role: "user", content: `Words:\n${list}` },
    ],
    response_format: zodResponseFormat(CategorizeResponseSchema, "categorize_response"),
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) throw new Error("OpenAI returned no parsed categorize response");
  return parsed;
}

export async function generateWordBreakdowns(
  words: { id: string; nativeText: string; englishGloss: string; romanization: string }[],
  lang: LanguageConfig,
): Promise<WordBreakdownResponse> {
  const list = words
    .map(
      (w) =>
        `${w.id}: ${w.nativeText}${w.romanization ? ` (${w.romanization})` : ""} - ${w.englishGloss}`,
    )
    .join("\n");

  const completion = await client.chat.completions.parse({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: wordBreakdownSystemPrompt(lang) },
      { role: "user", content: `Words:\n${list}` },
    ],
    response_format: zodResponseFormat(WordBreakdownResponseSchema, "word_breakdown_response"),
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) throw new Error("OpenAI returned no parsed word breakdown response");
  return parsed;
}
