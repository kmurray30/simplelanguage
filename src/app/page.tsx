import { prisma } from "@/lib/prisma";
import { WordListView } from "@/components/WordListView";
import type { Word } from "@/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const words = await prisma.word.findMany({
    where: { languageCode: "zh" },
    orderBy: { createdAt: "desc" },
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

  return <WordListView initialWords={serialized} />;
}
