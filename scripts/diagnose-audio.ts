/**
 * One-time read-only diagnostic: for every word, report whether it has a cached AudioClip, when
 * that clip was created, its voice, and its byte size (a short/truncated clip is proportionally
 * tiny). Run once via Railway's preDeployCommand, then remove.
 */
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("[diagnose-audio] starting");
  const words = await prisma.word.findMany({
    include: { audioClip: true },
    orderBy: { createdAt: "asc" },
  });

  for (const w of words) {
    if (!w.audioClip) {
      console.log(`[diagnose-audio] ${w.languageCode} "${w.nativeText}" - no cached clip (audioClipId null)`);
      continue;
    }
    const bytes = (w.audioClip.audioData as unknown as Buffer).length;
    console.log(
      `[diagnose-audio] ${w.languageCode} "${w.nativeText}" - clip id=${w.audioClip.id} created ${w.audioClip.createdAt.toISOString()}, voice=${w.audioClip.voiceId}, mime=${w.audioClip.mimeType}, ${bytes} bytes`,
    );
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
