import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isLanguageCode } from "@/lib/languages";
import type { SuggestionItem } from "@/types";

const MAX_RESULTS = 8;

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

// A dumb, fast filter over the pre-generated suggestion pool - no live OpenAI calls here. Live
// translation only happens when the user explicitly clicks "Find translations" (see /api/translate).
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

  const results: SuggestionItem[] = poolMatches
    .map((w) => ({ w, score: scorePoolMatch(w, q) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map(({ w }) => ({
      poolId: w.id,
      nativeText: w.nativeText,
      romanization: w.romanization,
      phonetic: w.phonetic,
      englishGloss: w.englishGloss,
      usageNote: w.usageNote,
      whyNext: w.whyNext,
      category: w.category,
    }));

  return NextResponse.json({ results });
}
