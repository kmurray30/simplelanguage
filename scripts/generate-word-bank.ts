/**
 * One-time: populate SuggestionPoolWord with ~1000 ranked, categorized common words per
 * language, generated in batches (structured output can't reliably produce 1000 items in one
 * call). Run once via Railway's preDeployCommand, then remove - see
 * scripts/backfill-categories.ts for the same established pattern.
 */
import { prisma } from "../src/lib/prisma";
import { generateWordBankBatch } from "../src/lib/openai";
import { romanize } from "../src/lib/romanize";
import { LANGUAGES, type LanguageCode } from "../src/lib/languages";

const TOTAL = 1000;
const BATCH_SIZE = 50;
const LANGUAGE_CODES: LanguageCode[] = ["fr", "es", "ja", "ko"];

async function generateForLanguage(languageCode: LanguageCode) {
  const lang = LANGUAGES[languageCode];
  const seen = new Set<string>();
  let rank = 1;

  for (let offset = 0; offset < TOTAL; offset += BATCH_SIZE) {
    const rankRangeLabel = `${offset + 1}-${offset + BATCH_SIZE}`;
    const { items } = await generateWordBankBatch([...seen], BATCH_SIZE, rankRangeLabel, lang);

    let inserted = 0;
    for (const item of items) {
      if (seen.has(item.nativeText)) continue;
      seen.add(item.nativeText);

      await prisma.suggestionPoolWord.upsert({
        where: {
          languageCode_nativeText_englishGloss: {
            languageCode,
            nativeText: item.nativeText,
            englishGloss: item.englishGloss,
          },
        },
        update: {},
        create: {
          languageCode,
          nativeText: item.nativeText,
          romanization: await romanize(languageCode, item.nativeText),
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
      `[word-bank:${languageCode}] batch ${rankRangeLabel}: got ${items.length} item(s), ${inserted} new, ${seen.size} total unique so far`,
    );
  }

  console.log(`[word-bank:${languageCode}] done, ${seen.size} words inserted`);
}

async function main() {
  console.log(`[word-bank] starting generation for: ${LANGUAGE_CODES.join(", ")}`);
  await Promise.all(LANGUAGE_CODES.map((code) => generateForLanguage(code)));
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
