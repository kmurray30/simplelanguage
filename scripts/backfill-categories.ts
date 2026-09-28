/**
 * One-off: assign normalized categories to existing words created before the WordCategory
 * column existed (they default to OTHER at the DB level). Run once via Railway's
 * preDeployCommand, then remove.
 */
import { prisma } from "../src/lib/prisma";
import { categorizeWords } from "../src/lib/openai";

async function main() {
  const words = await prisma.word.findMany({
    where: { category: "OTHER" },
    select: { id: true, nativeText: true, englishGloss: true },
  });

  if (words.length === 0) {
    console.log("[backfill-categories] no words to categorize");
    return;
  }

  const { items } = await categorizeWords(words);
  for (const item of items) {
    await prisma.word.update({ where: { id: item.id }, data: { category: item.category } });
  }
  console.log(`[backfill-categories] categorized ${items.length}/${words.length} word(s)`);
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
