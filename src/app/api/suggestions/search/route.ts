import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTranslationCandidates } from "@/lib/openai";
import { romanize } from "@/lib/romanize";
import { detectDirection } from "@/lib/text";
import { LANGUAGES, isLanguageCode } from "@/lib/languages";
import type { SearchResultItem } from "@/types";

const MAX_RESULTS = 8;
const MIN_POOL_MATCHES_BEFORE_LLM_FALLBACK = 5;

function scorePoolMatch(
  item: { nativeText: string; englishGloss: string; romanization: string; usageNote: string; whyNext: string },
  q: string,
): number {
  const qLower = q.toLowerCase();
  const glossLower = item.englishGloss.toLowerCase();
  if (item.nativeText === q) return 100;
  if (item.nativeText.includes(q)) return 90;
  if (glossLower === qLower) return 80;
  if (glossLower.startsWith(qLower)) return 70;
  if (glossLower.includes(qLower)) return 60;
  if (item.romanization.toLowerCase().includes(qLower)) return 50;
  if (item.usageNote.toLowerCase().includes(qLower) || item.whyNext.toLowerCase().includes(qLower)) return 20;
  return 10;
}

export async function GET(req: NextRequest) {
  const languageCode = req.nextUrl.searchParams.get("languageCode");
  if (!isLanguageCode(languageCode)) {
    return NextResponse.json({ error: "Missing or invalid languageCode" }, { status: 400 });
  }
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ results: [] });

  const known = await prisma.word.findMany({ where: { languageCode }, select: { nativeText: true } });
  const knownNativeTexts = known.map((w) => w.nativeText);

  const poolMatches = await prisma.suggestionPoolWord.findMany({
    where: {
      languageCode,
      nativeText: { notIn: knownNativeTexts },
      OR: [
        { nativeText: { contains: q, mode: "insensitive" } },
        { romanization: { contains: q, mode: "insensitive" } },
        { englishGloss: { contains: q, mode: "insensitive" } },
        { usageNote: { contains: q, mode: "insensitive" } },
        { whyNext: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 40,
  });

  const poolResults: SearchResultItem[] = poolMatches
    .map((w) => ({ w, score: scorePoolMatch(w, q) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map(({ w }) => ({
      source: "pool" as const,
      poolId: w.id,
      nativeText: w.nativeText,
      romanization: w.romanization,
      phonetic: w.phonetic,
      englishGloss: w.englishGloss,
      usageNote: w.usageNote,
      whyNext: w.whyNext,
      category: w.category,
    }));

  let llmResults: SearchResultItem[] = [];
  if (poolResults.length < MIN_POOL_MATCHES_BEFORE_LLM_FALLBACK && q.length >= 2) {
    try {
      const lang = LANGUAGES[languageCode];
      const { candidates } = await generateTranslationCandidates(q, detectDirection(q, lang), lang);
      const poolNativeTexts = new Set(poolResults.map((r) => r.nativeText));
      llmResults = await Promise.all(
        candidates
          .filter((c) => !poolNativeTexts.has(c.nativeText) && !knownNativeTexts.includes(c.nativeText))
          .map(async (c) => ({
            source: "llm" as const,
            poolId: null,
            nativeText: c.nativeText,
            romanization: await romanize(languageCode, c.nativeText),
            phonetic: c.phonetic,
            englishGloss: c.englishGloss,
            usageNote: c.usageNote,
            whyNext: null,
            category: c.category,
          })),
      );
    } catch (e) {
      // Best-effort supplement - the pool results (if any) still stand on their own.
      console.error("search: live translation fallback failed", e);
    }
  }

  const results = [...poolResults, ...llmResults].slice(0, MAX_RESULTS);
  return NextResponse.json({ results });
}
