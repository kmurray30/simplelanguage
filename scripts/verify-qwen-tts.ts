/**
 * One-off diagnostic: Kokoro-82M's zf_/zm_ Mandarin voices are producing wrong output (an
 * English fallback voice literally saying "Chinese letter" instead of pronouncing the hanzi) -
 * a known failure mode when a hosted Kokoro deployment doesn't have the Chinese g2p pipeline
 * (misaki[zh]) wired in, despite exposing zf_/zm_ voice names. Testing Qwen3-TTS (Alibaba's
 * own model, native Mandarin support) as a replacement. Try a few plausible request shapes
 * since the exact schema isn't confirmed from docs alone.
 */
async function tryRequest(label: string, body: Record<string, unknown>) {
  const token = process.env.DEEPINFRA_API_TOKEN;
  try {
    const res = await fetch("https://api.deepinfra.com/v1/inference/Qwen/Qwen3-TTS", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const contentType = res.headers.get("content-type");
    console.log(`[verify:qwen:${label}] status=${res.status} content-type=${contentType}`);
    if (contentType && contentType.startsWith("audio/")) {
      const buf = await res.arrayBuffer();
      console.log(`[verify:qwen:${label}] raw audio body, byteLength=${buf.byteLength}`);
      return;
    }
    const text = await res.text();
    console.log(`[verify:qwen:${label}] body (newlines stripped, first 1200): ${text.replace(/\n/g, " ").slice(0, 1200)}`);
    try {
      const json = JSON.parse(text);
      console.log(`[verify:qwen:${label}] top-level keys: ${Object.keys(json).join(", ")}`);
    } catch {
      // not JSON, fine
    }
  } catch (e) {
    console.log(`[verify:qwen:${label}] request failed: ${e instanceof Error ? e.message : e}`);
  }
}

async function main() {
  if (!process.env.DEEPINFRA_API_TOKEN) {
    console.log("[verify:qwen] DEEPINFRA_API_TOKEN not set, skipping");
    return;
  }
  // Field is "input" not "text", and "language" is a real enum incl. "Chinese" - confirmed
  // from a real 422 validation error on the first attempt.
  await tryRequest("input-chinese-vivian", { input: "你好，谢谢", voice: "Vivian", language: "Chinese" });
  await tryRequest("input-chinese-ryan", { input: "你好，谢谢", voice: "Ryan", language: "Chinese" });
  await tryRequest("input-auto-vivian", { input: "你好，谢谢", voice: "Vivian", language: "Auto" });
  await tryRequest("input-no-language", { input: "你好，谢谢", voice: "Vivian" });
}

main();
