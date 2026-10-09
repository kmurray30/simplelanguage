import { ELEVENLABS_MODEL_ID } from "./constants";

export class TtsError extends Error {}

export async function synthesizeAudio(
  text: string,
  voiceId: string,
): Promise<{ data: Buffer; mimeType: string }> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new TtsError("ELEVENLABS_API_KEY is not set");

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    // eleven_multilingual_v2 infers the spoken language from the voice + text itself (no
    // language_code param - that's only honored by the Turbo/Flash v2.5 models), and is
    // ElevenLabs' established high-quality model for natural-sounding multilingual speech.
    body: JSON.stringify({
      text,
      model_id: ELEVENLABS_MODEL_ID,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new TtsError(`ElevenLabs TTS request failed: ${res.status} ${res.statusText} - ${errBody.slice(0, 300)}`);
  }

  const mimeType = res.headers.get("content-type") || "audio/mpeg";
  const data = Buffer.from(await res.arrayBuffer());
  return { data, mimeType };
}
