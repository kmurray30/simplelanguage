/**
 * One-time: actually call ElevenLabs for every language's default voice (this sandbox can't
 * reach api.elevenlabs.io, but production can), logging real success/failure so issues are
 * caught here instead of relying on manual testing. Run once via Railway's preDeployCommand,
 * then remove.
 */
import { synthesizeAudio, TtsError } from "../src/lib/tts";
import { LANGUAGES } from "../src/lib/languages";

const SAMPLES: Record<string, string> = {
  zh: "谢谢",
  fr: "merci",
  es: "gracias",
  ja: "ありがとう",
  ko: "감사합니다",
};

async function main() {
  console.log("[test-tts] starting");
  for (const lang of Object.values(LANGUAGES)) {
    const text = SAMPLES[lang.code];
    try {
      const { data, mimeType } = await synthesizeAudio(text, lang.defaultVoiceId);
      console.log(
        `[test-tts:${lang.code}] OK voice=${lang.defaultVoiceId} text="${text}" mime=${mimeType} bytes=${data.length}`,
      );
    } catch (e) {
      const message = e instanceof TtsError ? e.message : String(e);
      console.error(`[test-tts:${lang.code}] FAILED voice=${lang.defaultVoiceId} text="${text}" - ${message}`);
    }
  }
  console.log("[test-tts] done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
