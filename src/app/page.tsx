import { prisma } from "@/lib/prisma";
import { WordListView } from "@/components/WordListView";
import { DEFAULT_LANGUAGE, isLanguageCode } from "@/lib/languages";
import type { Word } from "@/types";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { lang } = await searchParams;
  const langParam = typeof lang === "string" ? lang : undefined;
  const languageCode = isLanguageCode(langParam) ? langParam : DEFAULT_LANGUAGE;

  const words = await prisma.word.findMany({
    where: { languageCode },
    orderBy: { createdAt: "desc" },
  });

  const serialized: Word[] = words.map((w) => ({
    id: w.id,
    languageCode: w.languageCode as typeof languageCode,
    nativeText: w.nativeText,
    romanization: w.romanization,
    phonetic: w.phonetic,
    englishGloss: w.englishGloss,
    usageNote: w.usageNote,
    category: w.category,
    hasAudio: w.audioClipId !== null,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  }));

  return <WordListView key={languageCode} initialWords={serialized} languageCode={languageCode} />;
}
