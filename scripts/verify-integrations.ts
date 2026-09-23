/**
 * One-off diagnostic: makes real calls to DeepInfra Kokoro-82M and OpenAI to confirm the exact
 * response shapes lib/tts.ts and lib/openai.ts need to handle, since this can only be run from
 * an environment with real network access (not the sandbox this was developed in). Run once via
 * Railway's pre-deploy command, read the output in deploy logs, then remove.
 */
async function verifyDeepInfra() {
  const token = process.env.DEEPINFRA_API_TOKEN;
  if (!token) {
    console.log("[verify:deepinfra] DEEPINFRA_API_TOKEN not set, skipping");
    return;
  }
  try {
    const res = await fetch("https://api.deepinfra.com/v1/inference/hexgrad/Kokoro-82M", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: "你好", voice: "zf_xiaobei" }),
    });
    const contentType = res.headers.get("content-type");
    console.log(`[verify:deepinfra] status=${res.status} content-type=${contentType}`);
    if (contentType && contentType.startsWith("audio/")) {
      const buf = await res.arrayBuffer();
      console.log(`[verify:deepinfra] raw audio body, byteLength=${buf.byteLength}`);
    } else {
      const text = await res.text();
      console.log(`[verify:deepinfra] body (first 1500 chars): ${text.slice(0, 1500)}`);
      try {
        const json = JSON.parse(text);
        console.log(`[verify:deepinfra] top-level keys: ${Object.keys(json).join(", ")}`);
        for (const [k, v] of Object.entries(json)) {
          const preview = typeof v === "string" ? v.slice(0, 80) : JSON.stringify(v)?.slice(0, 80);
          console.log(`[verify:deepinfra] key=${k} type=${typeof v} preview=${preview}`);
        }
      } catch {
        console.log("[verify:deepinfra] body is not JSON");
      }
    }
  } catch (e) {
    console.log(`[verify:deepinfra] request failed: ${e instanceof Error ? e.message : e}`);
  }
}

async function verifyOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";
  if (!apiKey) {
    console.log("[verify:openai] OPENAI_API_KEY not set, skipping");
    return;
  }
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Reply with exactly: OK" }],
        max_tokens: 5,
      }),
    });
    const text = await res.text();
    console.log(`[verify:openai] model=${model} status=${res.status}`);
    console.log(`[verify:openai] body (first 1000 chars): ${text.slice(0, 1000)}`);
  } catch (e) {
    console.log(`[verify:openai] request failed: ${e instanceof Error ? e.message : e}`);
  }
}

async function main() {
  await verifyDeepInfra();
  await verifyOpenAI();
}

main();
