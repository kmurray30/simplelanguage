import type {
  Word,
  TranslationCandidate,
  SuggestionItem,
  CategoryCount,
  Direction,
  WordCategory,
  LanguageCode,
} from "@/types";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.toString?.() || body?.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchWords(languageCode: LanguageCode): Promise<Word[]> {
  const res = await fetch(`/api/words?languageCode=${languageCode}`);
  const data = await handle<{ words: Word[] }>(res);
  return data.words;
}

export async function createWord(input: {
  languageCode: LanguageCode;
  nativeText: string;
  englishGloss: string;
  phonetic: string;
  usageNote?: string;
  categories: WordCategory[];
}): Promise<Word> {
  const res = await fetch("/api/words", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await handle<{ word: Word }>(res);
  return data.word;
}

export async function updateWord(
  id: string,
  input: Partial<{
    nativeText: string;
    englishGloss: string;
    phonetic: string;
    usageNote: string | null;
    categories: WordCategory[];
  }>,
): Promise<Word> {
  const res = await fetch(`/api/words/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await handle<{ word: Word }>(res);
  return data.word;
}

export async function deleteWord(id: string): Promise<void> {
  const res = await fetch(`/api/words/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(`Failed to delete word: ${res.status}`);
}

export async function translate(
  languageCode: LanguageCode,
  input: string,
  direction: Direction,
): Promise<TranslationCandidate[]> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ languageCode, direction, input }),
  });
  const data = await handle<{ candidates: TranslationCandidate[] }>(res);
  return data.candidates;
}

export async function fetchSuggestions(
  languageCode: LanguageCode,
  count = 6,
  category?: WordCategory | "all",
): Promise<{ suggestions: SuggestionItem[]; categoryCounts: CategoryCount[] }> {
  const categoryQuery = category && category !== "all" ? `&category=${category}` : "";
  const res = await fetch(
    `/api/suggestions?languageCode=${languageCode}&count=${count}${categoryQuery}`,
  );
  return handle<{ suggestions: SuggestionItem[]; categoryCounts: CategoryCount[] }>(res);
}

export async function searchSuggestions(
  languageCode: LanguageCode,
  q: string,
): Promise<SuggestionItem[]> {
  const res = await fetch(
    `/api/suggestions/search?languageCode=${languageCode}&q=${encodeURIComponent(q)}`,
  );
  const data = await handle<{ results: SuggestionItem[] }>(res);
  return data.results;
}
