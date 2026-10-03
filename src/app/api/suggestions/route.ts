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

  const [pool, eligibleForCounts] = await Promise.all([
    prisma.suggestionPoolWord.findMany({
      where: {
        languageCode,
        ...(category && { categories: { has: category as (typeof CATEGORY_VALUES)[number] } }),
        nativeText: { notIn: knownNativeTexts },
      },
      orderBy: { rank: "asc" },
      take: Math.max(count * 4, count),
    }),
    prisma.suggestionPoolWord.findMany({
      where: { languageCode, nativeText: { notIn: knownNativeTexts } },
      select: { categories: true },
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
      categories: w.categories,
    }));

  // No groupBy over an array column - tally each word's categories in JS instead (pool size
  // per language is small enough, in the thousands, that this is cheap).
  const countByCategory = new Map<string, number>();
  for (const w of eligibleForCounts) {
    for (const c of w.categories) {
      countByCategory.set(c, (countByCategory.get(c) ?? 0) + 1);
    }
  }
  const categoryCounts = Array.from(countByCategory.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ suggestions, categoryCounts });
}
