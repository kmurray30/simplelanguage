import { PrismaClient } from "@prisma/client";
import { DEFAULT_ZH_VOICE } from "../src/lib/constants";

const prisma = new PrismaClient();

async function main() {
  await prisma.language.upsert({
    where: { code: "zh" },
    update: { defaultVoiceId: DEFAULT_ZH_VOICE },
    create: {
      code: "zh",
      name: "Chinese",
      defaultVoiceId: DEFAULT_ZH_VOICE,
    },
  });

  // Self-heal: unlink any word whose cached audio was generated with a voice that's no longer
  // the default (e.g. after switching TTS providers/voices) so it regenerates on next play.
  const stale = await prisma.word.updateMany({
    where: { audioClip: { voiceId: { not: DEFAULT_ZH_VOICE } } },
    data: { audioClipId: null },
  });
  if (stale.count > 0) {
    console.log(`Unlinked ${stale.count} word(s) with stale-voice audio for regeneration.`);
  }
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
