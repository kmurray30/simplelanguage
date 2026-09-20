import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { OPENAI_MODEL } from "./constants";
import {
  TranslateResponseSchema,
  SuggestionsResponseSchema,
  type Direction,
  type TranslateResponse,
  type SuggestionsResponse,
} from "./schemas";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TRANSLATOR_SYSTEM_PROMPT = `You are a Mandarin Chinese tutor helping an English-speaking student build a
personal vocabulary list. You are given either an English phrase (possibly informal or
annotated with context in parentheses) or a Chinese phrase (hanzi or pinyin), plus a
direction to translate in.

Rules:
- Always prefer the natural, commonly-used real-world translation over a stiff literal one.
- Propose 3-5 distinct candidates that vary by register, formality, or context where that
  makes sense (e.g. formal vs casual, spoken vs written) - don't pad with near-duplicates.
- Never include pinyin/romanization anywhere in your output - that is computed separately.
- "phonetic" must be a rough, English-reader-friendly respelling of the pronunciation,
  using English spelling conventions a non-Chinese-speaker could sound out (e.g. "syeh-syeh"),
  NOT pinyin letters (pinyin x/q/c/zh/etc. are misleading to English readers if read literally).
- "usageNote" is one short sentence on how/when this is actually used in real life and how
  common it is.
- "confidence" (0-1) reflects how well this candidate matches the requested word/phrase and
  how commonly it's actually used - not how fluent the phrasing sounds.
- If given unstructured input like "thank you (silly and informal)", parse the intent and
  the parenthetical qualifier and let it steer which candidates you propose.`;

const SUGGESTIONS_SYSTEM_PROMPT = `You are a Mandarin Chinese tutor helping an English-speaking student expand
their vocabulary. You are given the student's current word list (hanzi + English gloss).
Suggest new, genuinely common and useful everyday words or short phrases they don't have yet -
prioritize high-frequency, practical vocabulary over obscure or academic words. For each,
include a one-sentence "whyNext" explaining why it's a good next word to learn.

Same field rules as translation: natural glosses, English-reader-friendly "phonetic" (not
pinyin), no romanization, one-sentence "usageNote", and "confidence" reflecting how commonly
the word is actually used in real life.`;

export async function generateTranslationCandidates(
  input: string,
  direction: Direction,
): Promise<TranslateResponse> {
  const directionHint =
    direction === "en2zh"
      ? "Direction: English -> Chinese. The input below is English (possibly informal/annotated)."
      : "Direction: Chinese -> English. The input below is Chinese (hanzi or pinyin).";

  const completion = await client.chat.completions.parse({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: TRANSLATOR_SYSTEM_PROMPT },
      { role: "user", content: `${directionHint}\n\nInput: ${input}` },
    ],
    response_format: zodResponseFormat(TranslateResponseSchema, "translate_response"),
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) throw new Error("OpenAI returned no parsed translation response");
  return parsed;
}

export async function generateNextWordSuggestions(
  knownWords: { nativeText: string; englishGloss: string }[],
  count: number,
): Promise<SuggestionsResponse> {
  const knownList =
    knownWords.length > 0
      ? knownWords.map((w) => `${w.nativeText} (${w.englishGloss})`).join(", ")
      : "(none yet - this is a brand new list)";

  const completion = await client.chat.completions.parse({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: SUGGESTIONS_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Words already known:\n${knownList}\n\nSuggest ${count} new words to learn next.`,
      },
    ],
    response_format: zodResponseFormat(SuggestionsResponseSchema, "suggestions_response"),
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) throw new Error("OpenAI returned no parsed suggestions response");
  return parsed;
}
