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
    // "breakdown" can be a long LLM-generated paragraph per word and is only ever shown in the
    // detail dialog, which fetches it fresh on open (also picks up generation finishing after
    // this page loaded) - excluding it here keeps the initial page payload and query small.
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

  return <WordListView key={languageCode} initialWords={serialized} languageCode={languageCode} />;
}
