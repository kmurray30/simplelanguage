/**
 * One-time: generate the memorization "breakdown" (morpheme/component breakdown + useful
 * etymology) for every existing Word that predates this feature. New words get theirs
 * generated async right after creation - this just catches up words added before that existed.
 * Run once via Railway's preDeployCommand, then remove.
 */
import { prisma } from "../src/lib/prisma";
import { generateWordBreakdowns } from "../src/lib/openai";
import { LANGUAGES, DEFAULT_LANGUAGE, type LanguageCode } from "../src/lib/languages";

const BATCH_SIZE = 15;

async function main() {
  console.log("[backfill-breakdowns] starting");
  const words = await prisma.word.findMany({
    where: { breakdown: null },
    select: { id: true, languageCode: true, nativeText: true, englishGloss: true, romanization: true },
  });
  console.log(`[backfill-breakdowns] ${words.length} word(s) need a breakdown`);

  const byLanguage = new Map<string, typeof words>();
  for (const w of words) {
    const list = byLanguage.get(w.languageCode) ?? [];
    list.push(w);
    byLanguage.set(w.languageCode, list);
  }

  let done = 0;
  for (const [languageCode, langWords] of byLanguage) {
    const lang = LANGUAGES[languageCode as LanguageCode] ?? LANGUAGES[DEFAULT_LANGUAGE];
    for (let i = 0; i < langWords.length; i += BATCH_SIZE) {
      const batch = langWords.slice(i, i + BATCH_SIZE);
      const { items } = await generateWordBreakdowns(batch, lang);
      const breakdownById = new Map(items.map((it) => [it.id, it.breakdown]));

      for (const w of batch) {
        const breakdown = breakdownById.get(w.id);
        if (!breakdown) {
          console.error(`[backfill-breakdowns] no breakdown returned for ${w.id} (${w.nativeText}) - left unchanged`);
          continue;
        }
        await prisma.word.update({ where: { id: w.id }, data: { breakdown } });
      }
      done += batch.length;
      console.log(`[backfill-breakdowns] ${done}/${words.length} done`);
    }
  }

  console.log("[backfill-breakdowns] done");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
