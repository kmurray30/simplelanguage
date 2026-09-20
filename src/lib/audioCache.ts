import { prisma } from "./prisma";
import { synthesizeAudio } from "./tts";

/**
 * Returns the cached AudioClip for (languageCode, text, voiceId), synthesizing and storing
 * it on first use. The unique constraint on AudioClip guards against a race between two
 * concurrent first-plays of the same word.
 */
export async function getOrCreateAudioClip(languageCode: string, text: string, voiceId: string) {
  const existing = await prisma.audioClip.findUnique({
    where: { languageCode_text_voiceId: { languageCode, text, voiceId } },
  });
  if (existing) return existing;

  const { data, mimeType } = await synthesizeAudio(text, voiceId);

  try {
    return await prisma.audioClip.create({
      data: { languageCode, text, voiceId, audioData: new Uint8Array(data), mimeType },
    });
  } catch {
    // Lost the race with a concurrent first-play - the row now exists, fetch it.
    const clip = await prisma.audioClip.findUnique({
      where: { languageCode_text_voiceId: { languageCode, text, voiceId } },
    });
    if (!clip) throw new Error("AudioClip creation failed and no existing clip found");
    return clip;
  }
}
