import { KOKORO_MODEL_PATH } from "./constants";

const DEEPINFRA_ENDPOINT = `https://api.deepinfra.com/v1/inference/${KOKORO_MODEL_PATH}`;

export class TtsError extends Error {}

/**
 * DeepInfra's exact response shape for Kokoro-82M was not verified against a live call
 * (this sandbox's network egress blocks api.deepinfra.com) - verify with a real request
 * once deployed, and adjust this function alone if the shape differs. Known/likely shapes,
 * handled in order:
 *  1. JSON body with a data URI or bare-base64 string under a common field name.
 *  2. Raw audio bytes returned directly (Content-Type: audio/*).
 */
function parseKokoroResponse(
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
): Promise<{ data: Buffer; mimeType: string }> {
  const token = process.env.DEEPINFRA_API_TOKEN;
  if (!token) throw new TtsError("DEEPINFRA_API_TOKEN is not set");

  const res = await fetch(DEEPINFRA_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, voice: voiceId }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new TtsError(`DeepInfra TTS request failed: ${res.status} ${res.statusText} - ${errBody.slice(0, 300)}`);
  }

  const contentType = res.headers.get("content-type");
  const bodyText = contentType && contentType.startsWith("audio/") ? "" : await res.text();

  return parseKokoroResponse(contentType, bodyText, async () => {
    // Re-fetch as buffer path only reachable when content-type is audio/*, where bodyText was
    // left empty above and the original response body is still unread.
    return res.arrayBuffer();
  });
}
