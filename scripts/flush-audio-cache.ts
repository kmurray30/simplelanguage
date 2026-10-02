/**
 * One-time: clear every cached AudioClip so all words/suggestions regenerate their audio with
 * the corrected DeepInfra TTS request (max_new_tokens was missing, silently truncating audio to
 * ~1.1s via vLLM's stock fallback). Run once via Railway's preDeployCommand, then remove - see
 * scripts/backfill-categories.ts (git history) for the same established pattern.
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
