import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNextWordSuggestions } from "@/lib/openai";
import { toRomanization } from "@/lib/pinyin";

export async function GET(req: NextRequest) {
  const languageCode = req.nextUrl.searchParams.get("languageCode") ?? "zh";
  const count = Math.min(Number(req.nextUrl.searchParams.get("count") ?? 6) || 6, 12);

  const known = await prisma.word.findMany({
    where: { languageCode },
    select: { nativeText: true, englishGloss: true },
  });

  try {
    const { suggestions } = await generateNextWordSuggestions(known, count);
    const withRomanization = suggestions.map((s) => ({
      ...s,
      romanization: toRomanization(s.nativeText),
    }));
    return NextResponse.json({ suggestions: withRomanization });
  } catch (e) {
    console.error("suggestions failed", e);
    return NextResponse.json({ error: "Suggestion generation failed" }, { status: 502 });
  }
}
