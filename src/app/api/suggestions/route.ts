import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CATEGORY_VALUES } from "@/lib/categories";
import { isLanguageCode } from "@/lib/languages";

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function GET(req: NextRequest) {
  const languageCode = req.nextUrl.searchParams.get("languageCode");
  if (!isLanguageCode(languageCode)) {
    return NextResponse.json({ error: "Missing or invalid languageCode" }, { status: 400 });
  }
  const count = Math.min(Number(req.nextUrl.searchParams.get("count") ?? 6) || 6, 12);
  const categoryParam = req.nextUrl.searchParams.get("category");
  const category =
    categoryParam && (CATEGORY_VALUES as readonly string[]).includes(categoryParam)
      ? categoryParam
      : null;

  const known = await prisma.word.findMany({ where: { languageCode }, select: { nativeText: true } });
  const knownNativeTexts = known.map((w) => w.nativeText);

  const [pool, categoryCountsRaw] = await Promise.all([
    prisma.suggestionPoolWord.findMany({
      where: {
        languageCode,
        ...(category && { category: category as (typeof CATEGORY_VALUES)[number] }),
        nativeText: { notIn: knownNativeTexts },
      },
      orderBy: { rank: "asc" },
      take: Math.max(count * 4, count),
    }),
    prisma.suggestionPoolWord.groupBy({
      by: ["category"],
      where: { languageCode, nativeText: { notIn: knownNativeTexts } },
      _count: { _all: true },
    }),
  ]);

  const suggestions = shuffle(pool)
    .slice(0, count)
    .map((w) => ({
      poolId: w.id,
      nativeText: w.nativeText,
      romanization: w.romanization,
      phonetic: w.phonetic,
      englishGloss: w.englishGloss,
      usageNote: w.usageNote,
      whyNext: w.whyNext,
      category: w.category,
    }));

  const categoryCounts = categoryCountsRaw
    .map((c) => ({ category: c.category, count: c._count._all }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ suggestions, categoryCounts });
}
