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
    breakdown: w.breakdown,
    hasAudio: w.audioClipId !== null,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  }));

  return <FlashcardDeck key={languageCode} words={serialized} languageCode={languageCode} />;
}
