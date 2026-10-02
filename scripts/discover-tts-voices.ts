/**
 * One-time: query ElevenLabs' shared-voice library for a handful of candidate native voices per
 * target language, logging voice_id/name/gender/accent/description so real voice IDs can be
 * picked for src/lib/languages.ts (this sandbox can't reach api.elevenlabs.io directly). Run once
 * via Railway's preDeployCommand, then remove.
 */
const LANGUAGES: { code: string; name: string }[] = [
  { code: "zh", name: "Chinese" },
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
];

async function main() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not set");

  for (const lang of LANGUAGES) {
    const url = `https://api.elevenlabs.io/v1/shared-voices?language=${lang.code}&page_size=10`;
    const res = await fetch(url, { headers: { "xi-api-key": apiKey } });
    if (!res.ok) {
      console.error(`[discover-voices:${lang.code}] request failed: ${res.status} ${await res.text()}`);
      continue;
    }
    const data = (await res.json()) as {
      voices: Array<{
        voice_id: string;
        name: string;
        gender?: string;
        accent?: string;
        age?: string;
        description?: string;
        language?: string;
        locale?: string;
        use_case?: string;
        cloned_by_count?: number;
        free_users_allowed?: boolean;
      }>;
    };
    console.log(`[discover-voices:${lang.code}] ${lang.name} - ${data.voices?.length ?? 0} voice(s)`);
    for (const v of data.voices ?? []) {
      console.log(
        `[discover-voices:${lang.code}]   id=${v.voice_id} name="${v.name}" gender=${v.gender} accent=${v.accent} age=${v.age} locale=${v.locale} use_case=${v.use_case} free=${v.free_users_allowed} desc="${v.description}"`,
      );
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
