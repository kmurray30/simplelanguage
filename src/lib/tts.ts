import { TTS_MODEL_PATH } from "./constants";

const DEEPINFRA_ENDPOINT = `https://api.deepinfra.com/v1/inference/${TTS_MODEL_PATH}`;

export class TtsError extends Error {}

/**
 * Verified against a real DeepInfra call: response is JSON with
 * { input_character_length, output_format, audio: "data:audio/wav;base64,..." }.
 * Handled generically in case the exact field name ever changes:
 *  1. JSON body with a data URI or bare-base64 string under a common field name.
 *  2. Raw audio bytes returned directly (Content-Type: audio/*).
 */
function parseTtsResponse(
  contentType: string | null,
  bodyText: string,
  bodyBuffer: () => Promise<ArrayBuffer>,
): Promise<{ data: Buffer; mimeType: string }> | { data: Buffer; mimeType: string } {
  if (contentType && contentType.startsWith("audio/")) {
    return bodyBuffer().then((buf) => ({ data: Buffer.from(buf), mimeType: contentType }));
  }

  let json: Record<string, unknown>;
  try {
    json = JSON.parse(bodyText);
  } catch {
    throw new TtsError(`Unrecognized DeepInfra response (not JSON, not audio/*): ${bodyText.slice(0, 200)}`);
  }

  const candidateFields = ["audio", "output", "audio_base64", "audio_data", "data"];
  for (const field of candidateFields) {
    const value = json[field];
    if (typeof value === "string" && value.length > 0) {
      const dataUriMatch = value.match(/^data:(audio\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (dataUriMatch) {
        return { data: Buffer.from(dataUriMatch[2], "base64"), mimeType: dataUriMatch[1] };
      }
      // Bare base64 string, no data URI wrapper - assume wav unless told otherwise.
      const outputFormat = typeof json.output_format === "string" ? json.output_format : "wav";
      return { data: Buffer.from(value, "base64"), mimeType: `audio/${outputFormat}` };
    }
  }

  throw new TtsError(
    `DeepInfra response JSON didn't match any known audio field (checked: ${candidateFields.join(", ")}): ${bodyText.slice(0, 200)}`,
  );
}

export async function synthesizeAudio(
  text: string,
  voiceId: string,
  ttsLanguage: string,
): Promise<{ data: Buffer; mimeType: string }> {
  const token = process.env.DEEPINFRA_API_TOKEN;
  if (!token) throw new TtsError("DEEPINFRA_API_TOKEN is not set");

  const res = await fetch(DEEPINFRA_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    // "speed" and "instructions" verified against a real DeepInfra call (both accepted, 200).
    // Slightly slower + an explicit clarity instruction, since this is for language learners.
    body: JSON.stringify({
      input: text,
      voice: voiceId,
      language: ttsLanguage,
      speed: 0.85,
      instructions: "Speak slowly and clearly, enunciating each syllable distinctly, as if teaching a language learner.",
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new TtsError(`DeepInfra TTS request failed: ${res.status} ${res.statusText} - ${errBody.slice(0, 300)}`);
  }

  const contentType = res.headers.get("content-type");
  const bodyText = contentType && contentType.startsWith("audio/") ? "" : await res.text();

  return parseTtsResponse(contentType, bodyText, async () => {
    // Re-fetch as buffer path only reachable when content-type is audio/*, where bodyText was
    // left empty above and the original response body is still unread.
    return res.arrayBuffer();
  });
}
