import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateAudioClip } from "@/lib/audioCache";
import { serveAudioClip } from "@/lib/serveAudioClip";
import { TtsError } from "@/lib/tts";
import { LANGUAGES, DEFAULT_LANGUAGE, type LanguageCode } from "@/lib/languages";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;

  const word = await prisma.suggestionPoolWord.findUnique({
    where: { id },
    include: { audioClip: true },
  });
  if (!word) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let clip = word.audioClip;
  if (!clip) {
    const language = await prisma.language.findUnique({ where: { code: word.languageCode } });
    const fallbackConfig = LANGUAGES[word.languageCode as LanguageCode] ?? LANGUAGES[DEFAULT_LANGUAGE];
    const voiceId = language?.defaultVoiceId ?? fallbackConfig.defaultVoiceId;
    try {
      clip = await getOrCreateAudioClip(word.languageCode, word.nativeText, voiceId);
    } catch (e) {
      const message = e instanceof TtsError ? e.message : "Failed to synthesize audio";
      console.error(`[audio] synthesis failed for suggestion pool word ${word.id}:`, message);
      return NextResponse.json({ error: message }, { status: 502 });
    }
    await prisma.suggestionPoolWord.update({ where: { id: word.id }, data: { audioClipId: clip.id } });
  }

  return serveAudioClip(req, clip);
}
