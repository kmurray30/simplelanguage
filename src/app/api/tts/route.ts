import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateAudioClip } from "@/lib/audioCache";
import { serveAudioClip } from "@/lib/serveAudioClip";
import { TtsError } from "@/lib/tts";
import { LANGUAGES, isLanguageCode, type LanguageCode } from "@/lib/languages";
import { HANGUL_AUDIO_TEXTS } from "@/lib/hangul";
import { KANA_AUDIO_TEXTS } from "@/lib/kana";

// Only texts the flashcard reference decks can ask for - this is not an open TTS endpoint, so a
// stray request can't burn ElevenLabs quota on arbitrary input.
const ALLOWED_TEXTS: Partial<Record<LanguageCode, ReadonlySet<string>>> = {
  ko: HANGUL_AUDIO_TEXTS,
  ja: KANA_AUDIO_TEXTS,
};

export async function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get("lang");
  const text = req.nextUrl.searchParams.get("text") ?? "";
  if (!isLanguageCode(lang) || !ALLOWED_TEXTS[lang]?.has(text)) {
    return NextResponse.json({ error: "Unknown text" }, { status: 400 });
  }

  const language = await prisma.language.findUnique({ where: { code: lang } });
  const voiceId = language?.defaultVoiceId ?? LANGUAGES[lang].defaultVoiceId;

  try {
    const clip = await getOrCreateAudioClip(lang, text, voiceId);
    return serveAudioClip(req, clip);
  } catch (e) {
    const message = e instanceof TtsError ? e.message : "Failed to synthesize audio";
    console.error(`[tts] synthesis failed for ${lang} "${text}":`, message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
