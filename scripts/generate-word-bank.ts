/**
 * One-time: populate SuggestionPoolWord with ~1000 ranked, categorized common Chinese words,
 * generated in batches (structured output can't reliably produce 1000 items in one call).
 * Run once via Railway's preDeployCommand, then remove - see scripts/backfill-categories.ts
 * for the same established pattern.
 */
import { prisma } from "../src/lib/prisma";
import { generateWordBankBatch } from "../src/lib/openai";
import { toRomanization } from "../src/lib/pinyin";

const TOTAL = 1000;
const BATCH_SIZE = 50;
const LANGUAGE_CODE = "zh";

async function main() {
  const seen = new Set<string>();
  let rank = 1;

  for (let offset = 0; offset < TOTAL; offset += BATCH_SIZE) {
    const rankRangeLabel = `${offset + 1}-${offset + BATCH_SIZE}`;
    const { items } = await generateWordBankBatch([...seen], BATCH_SIZE, rankRangeLabel);

    let inserted = 0;
    for (const item of items) {
      if (seen.has(item.nativeText)) continue;
      seen.add(item.nativeText);

      await prisma.suggestionPoolWord.upsert({
        where: {
          languageCode_nativeText_englishGloss: {
            languageCode: LANGUAGE_CODE,
            nativeText: item.nativeText,
            englishGloss: item.englishGloss,
          },
        },
        update: {},
        create: {
          languageCode: LANGUAGE_CODE,
          nativeText: item.nativeText,
          romanization: toRomanization(item.nativeText),
          phonetic: item.phonetic,
          englishGloss: item.englishGloss,
          usageNote: item.usageNote,
          whyNext: item.whyNext,
          category: item.category,
          rank: rank++,
        },
      });
      inserted++;
    }

    console.log(
      `[word-bank] batch ${rankRangeLabel}: got ${items.length} item(s), ${inserted} new, ${seen.size} total unique so far`,
    );
  }

  console.log(`[word-bank] done, ${seen.size} words inserted`);
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
