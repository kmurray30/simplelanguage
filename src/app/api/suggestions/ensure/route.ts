import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { romanize } from "@/lib/romanize";
import { EnsureSuggestionSchema } from "@/lib/schemas";

// Promotes a live LLM-only search result into a real SuggestionPoolWord row, so it becomes
// audio-capable (and consistently trackable/dedupable going forward) the first time someone
// interacts with it, rather than requiring the full 1000-word bank to anticipate every word.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = EnsureSuggestionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { languageCode, nativeText, phonetic, englishGloss, usageNote, category } = parsed.data;
  const romanization = await romanize(languageCode, nativeText);

  const existing = await prisma.suggestionPoolWord.findUnique({
    where: { languageCode_nativeText_englishGloss: { languageCode, nativeText, englishGloss } },
  });
  if (existing) return NextResponse.json({ id: existing.id });

  const { _max } = await prisma.suggestionPoolWord.aggregate({
    where: { languageCode },
    _max: { rank: true },
  });

  const word = await prisma.suggestionPoolWord.create({
    data: {
      languageCode,
      nativeText,
      romanization,
      phonetic,
      englishGloss,
      usageNote,
      whyNext: "Found via search.",
      category,
      rank: (_max.rank ?? 0) + 1,
    },
  });
  return NextResponse.json({ id: word.id });
}
