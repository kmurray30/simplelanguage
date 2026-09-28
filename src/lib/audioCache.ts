import { prisma } from "./prisma";
import { synthesizeAudio } from "./tts";
import { DEFAULT_ZH_VOICE } from "./constants";

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

/**
 * Fire-and-forget: synthesize and cache audio for a word right away instead of waiting for
 * its first play request. Safe to call redundantly - getOrCreateAudioClip is idempotent per
 * (languageCode, text, voiceId), and this never throws into the caller.
 */
export function triggerAudioGeneration(word: {
  id: string;
  languageCode: string;
  nativeText: string;
}) {
  void (async () => {
    try {
      const language = await prisma.language.findUnique({ where: { code: word.languageCode } });
      const voiceId = language?.defaultVoiceId ?? DEFAULT_ZH_VOICE;
      const clip = await getOrCreateAudioClip(word.languageCode, word.nativeText, voiceId);
      await prisma.word.update({ where: { id: word.id }, data: { audioClipId: clip.id } });
    } catch (e) {
      console.error(`[audioCache] background synthesis failed for word ${word.id}:`, e);
    }
  })();
}
