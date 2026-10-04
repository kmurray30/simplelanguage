import { prisma } from "@/lib/prisma";
import { FlashcardDeck } from "@/components/FlashcardDeck";
import { DEFAULT_LANGUAGE, isLanguageCode } from "@/lib/languages";
import type { Word } from "@/types";

export const dynamic = "force-dynamic";

export default async function FlashcardsPage({ searchParams }: PageProps<"/flashcards">) {
  const { lang } = await searchParams;
  const langParam = typeof lang === "string" ? lang : undefined;
  const languageCode = isLanguageCode(langParam) ? langParam : DEFAULT_LANGUAGE;

  const words = await prisma.word.findMany({
    where: { languageCode },
    orderBy: { createdAt: "asc" },
    // FlashcardDeck never shows "breakdown" - leaving it out keeps the query and page payload small.
    select: {
      id: true,
      languageCode: true,
      nativeText: true,
      romanization: true,
      phonetic: true,
      englishGloss: true,
      usageNote: true,
      categories: true,
      starred: true,
      audioClipId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const serialized: Word[] = words.map((w) => ({
    id: w.id,
    languageCode: w.languageCode as typeof languageCode,
    nativeText: w.nativeText,
    romanization: w.romanization,
    phonetic: w.phonetic,
    englishGloss: w.englishGloss,
    usageNote: w.usageNote,
    categories: w.categories,
    breakdown: null,
    starred: w.starred,
    hasAudio: w.audioClipId !== null,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  }));

  return <FlashcardDeck key={languageCode} words={serialized} languageCode={languageCode} />;
}
