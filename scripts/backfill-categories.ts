/**
 * One-time: re-categorize every existing Word with the full set of relevant categories, not
 * just one. Categories used to be single-valued, so a core word like "hello" or "thanks" only
 * ever got its most specific tag (e.g. GREETINGS) and never also BASICS. Run once via Railway's
 * preDeployCommand, then remove.
 */
import { prisma } from "../src/lib/prisma";
import { categorizeWords } from "../src/lib/openai";

const BATCH_SIZE = 50;

async function main() {
  const words = await prisma.word.findMany({
    select: { id: true, nativeText: true, englishGloss: true },
  });
  console.log(`[backfill-categories] ${words.length} word(s) to re-categorize`);

  let done = 0;
  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const batch = words.slice(i, i + BATCH_SIZE);
    const { items } = await categorizeWords(batch);
    const categoriesById = new Map(items.map((it) => [it.id, it.categories]));

    for (const w of batch) {
      const categories = categoriesById.get(w.id);
      if (!categories || categories.length === 0) {
        console.error(`[backfill-categories] no categories returned for ${w.id} (${w.nativeText}) - left unchanged`);
        continue;
      }
      await prisma.word.update({ where: { id: w.id }, data: { categories } });
    }
    done += batch.length;
    console.log(`[backfill-categories] ${done}/${words.length} done`);
  }

  console.log("[backfill-categories] done");
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
