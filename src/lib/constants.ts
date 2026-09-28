// Kokoro-82M's zf_/zm_ "Mandarin" voices don't actually route Chinese text through a Chinese
// phonemizer on DeepInfra's hosted deployment - it mispronounces hanzi (an English voice
// reading out a fallback description instead of the actual pronunciation). Qwen3-TTS is
// Alibaba's own model with native Mandarin support, verified against a real call.
export const DEFAULT_ZH_VOICE = "Vivian";

export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna";

export const TTS_MODEL_PATH = "Qwen/Qwen3-TTS";
