/**
 * One-off: clear all cached AudioClips so every word regenerates its audio on next
 * play/creation using the new speed/instructions TTS params. Safe - AudioClip is a pure
 * cache; Word.audioClipId nulls out automatically (optional relation, default SetNull).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const { count } = await prisma.audioClip.deleteMany({});
  console.log(`[regenerate-audio] cleared ${count} cached audio clip(s)`);
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
