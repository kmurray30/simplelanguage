import { prisma } from "@/lib/prisma";
import { FlashcardDeck } from "@/components/FlashcardDeck";
import type { Word } from "@/types";

export const dynamic = "force-dynamic";

export default async function FlashcardsPage() {
  const words = await prisma.word.findMany({
    where: { languageCode: "zh" },
    orderBy: { createdAt: "asc" },
  });

  const serialized: Word[] = words.map((w) => ({
    id: w.id,
    languageCode: w.languageCode,
    nativeText: w.nativeText,
    romanization: w.romanization,
    phonetic: w.phonetic,
    englishGloss: w.englishGloss,
    usageNote: w.usageNote,
    hasAudio: w.audioClipId !== null,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  }));

  return <FlashcardDeck words={serialized} />;
}
