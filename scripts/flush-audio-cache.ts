/**
 * One-time: clear every cached AudioClip so all words/suggestions regenerate their audio with
 * the trailing-pause-padding fix for Qwen3-TTS's early-stop-on-short-input truncation. Run once
 * via Railway's preDeployCommand, then remove.
 */
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("[flush-audio-cache] starting");
  const words = await prisma.word.updateMany({
    where: { audioClipId: { not: null } },
    data: { audioClipId: null },
  });
  const pool = await prisma.suggestionPoolWord.updateMany({
    where: { audioClipId: { not: null } },
    data: { audioClipId: null },
  });
  const clips = await prisma.audioClip.deleteMany({});

  console.log(
    `[flush-audio-cache] unlinked ${words.count} word(s), ${pool.count} pool word(s), deleted ${clips.count} cached clip(s)`,
  );
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
