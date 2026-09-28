/**
 * One-off: confirm DeepInfra's Qwen3-TTS actually accepts "speed" and "instructions" params
 * (found via web research, not confirmed against the live API) before wiring them into
 * lib/tts.ts, to avoid guessing and silently breaking a working integration.
 */
async function tryRequest(label: string, body: Record<string, unknown>) {
  const token = process.env.DEEPINFRA_API_TOKEN;
  try {
    const res = await fetch("https://api.deepinfra.com/v1/inference/Qwen/Qwen3-TTS", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    const preview = res.ok
      ? `SUCCESS - keys: ${Object.keys(JSON.parse(text)).join(", ")}`
      : text.replace(/\n/g, " ").slice(0, 500);
    console.log(`[verify:speed:${label}] status=${res.status} ${preview}`);
  } catch (e) {
    console.log(`[verify:speed:${label}] request failed: ${e instanceof Error ? e.message : e}`);
  }
}

async function main() {
  if (!process.env.DEEPINFRA_API_TOKEN) {
    console.log("[verify:speed] DEEPINFRA_API_TOKEN not set, skipping");
    return;
  }
  await tryRequest("with-speed-0.85", {
    input: "你好，谢谢",
    voice: "Vivian",
    language: "Chinese",
    speed: 0.85,
  });
  await tryRequest("with-instructions", {
    input: "你好，谢谢",
    voice: "Vivian",
    language: "Chinese",
    instructions: "Speak slowly and clearly, enunciating each syllable distinctly, as if teaching a language learner.",
  });
  await tryRequest("with-both", {
    input: "你好，谢谢",
    voice: "Vivian",
    language: "Chinese",
    speed: 0.85,
    instructions: "Speak slowly and clearly, enunciating each syllable distinctly, as if teaching a language learner.",
  });
}

main();
