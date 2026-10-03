/**
 * One-time: list the voices actually usable by this ElevenLabs API key (premade defaults +
 * anything already added to the account), since shared-library voices 402 on the free tier via
 * the API ("Free users cannot use library voices via the API"). Run once via Railway's
 * preDeployCommand, then remove.
 */
async function main() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("[list-voices] ELEVENLABS_API_KEY is not set");
    process.exit(1);
  }

  const res = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": apiKey },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[list-voices] FAILED ${res.status} ${res.statusText} - ${body.slice(0, 500)}`);
    process.exit(1);
  }

  const json = (await res.json()) as {
    voices: Array<{
      voice_id: string;
      name: string;
      category: string;
      labels?: Record<string, string>;
    }>;
  };

  console.log(`[list-voices] account has ${json.voices.length} usable voices`);
  for (const v of json.voices) {
    console.log(
      `[list-voices] id=${v.voice_id} name="${v.name}" category=${v.category} labels=${JSON.stringify(v.labels ?? {})}`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
