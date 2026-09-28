import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateAudioClip } from "@/lib/audioCache";
import { TtsError } from "@/lib/tts";
import { DEFAULT_ZH_VOICE } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
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
      console.error(`[audio] synthesis failed for word ${word.id}:`, message);
      return NextResponse.json({ error: message }, { status: 502 });
    }
    await prisma.word.update({ where: { id: word.id }, data: { audioClipId: clip.id } });
  }

  // Safari (and other strict UAs) require a real 206 response to a Range request before an
  // <audio> element will play at all - a plain 200 with the full body is not enough.
  const data = clip.audioData as unknown as Buffer;
  const total = data.length;
  const range = req.headers.get("range");

  const baseHeaders = {
    "Content-Type": clip.mimeType,
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
  };

  if (range) {
    const match = range.match(/^bytes=(\d*)-(\d*)$/);
    if (match) {
      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2] ? parseInt(match[2], 10) : total - 1;
      const clampedEnd = Math.min(end, total - 1);

      if (start <= clampedEnd && start < total) {
        const chunk = data.subarray(start, clampedEnd + 1);
        return new NextResponse(chunk as unknown as BodyInit, {
          status: 206,
          headers: {
            ...baseHeaders,
            "Content-Range": `bytes ${start}-${clampedEnd}/${total}`,
            "Content-Length": String(chunk.length),
          },
        });
      }

      return new NextResponse(null, {
        status: 416,
        headers: { ...baseHeaders, "Content-Range": `bytes */${total}` },
      });
    }
  }

  return new NextResponse(data as unknown as BodyInit, {
    headers: { ...baseHeaders, "Content-Length": String(total) },
  });
}
