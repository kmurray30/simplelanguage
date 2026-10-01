import { PrismaClient } from "@prisma/client";
import { LANGUAGES } from "../src/lib/languages";

const prisma = new PrismaClient();

async function main() {
  for (const lang of Object.values(LANGUAGES)) {
    await prisma.language.upsert({
      where: { code: lang.code },
      update: { name: lang.name, defaultVoiceId: lang.defaultVoiceId },
      create: {
        code: lang.code,
        name: lang.name,
        defaultVoiceId: lang.defaultVoiceId,
      },
    });

    // Self-heal: unlink any word in this language whose cached audio was generated with a
    // voice that's no longer this language's default (e.g. after switching TTS voices) so
    // it regenerates on next play. Scoped per-language so one language's voice change can't
    // wrongly wipe another language's audio.
    const stale = await prisma.word.updateMany({
      where: {
        languageCode: lang.code,
        audioClip: { voiceId: { not: lang.defaultVoiceId } },
      },
      data: { audioClipId: null },
    });
    if (stale.count > 0) {
      console.log(
        `Unlinked ${stale.count} ${lang.code} word(s) with stale-voice audio for regeneration.`,
      );
    }
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
