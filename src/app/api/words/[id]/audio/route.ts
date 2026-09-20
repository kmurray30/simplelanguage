import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateAudioClip } from "@/lib/audioCache";
import { TtsError } from "@/lib/tts";
import { DEFAULT_ZH_VOICE } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const word = await prisma.word.findUnique({
    where: { id },
    include: { audioClip: true, language: true },
  });
  if (!word) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let clip = word.audioClip;
  if (!clip) {
    const voiceId = word.language.defaultVoiceId ?? DEFAULT_ZH_VOICE;
    try {
      clip = await getOrCreateAudioClip(word.languageCode, word.nativeText, voiceId);
    } catch (e) {
      const message = e instanceof TtsError ? e.message : "Failed to synthesize audio";
      return NextResponse.json({ error: message }, { status: 502 });
    }
    await prisma.word.update({ where: { id: word.id }, data: { audioClipId: clip.id } });
  }

  return new NextResponse(clip.audioData as unknown as BodyInit, {
    headers: {
      "Content-Type": clip.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
