// Single source of truth for everything that varies per learning language: TTS voice/language
// name, whether native text needs a separate romanization field, UI copy, script-based
// direction-detection pattern, font, and accent theme. Adding a 6th language is a config-only
// change here (plus seeding its SuggestionPoolWord bank) - nothing else should hardcode a
// language name or "zh" again.

export type LanguageCode = "zh" | "fr" | "es" | "ja" | "ko";

export type LanguageConfig = {
  code: LanguageCode;
  name: string; // "Chinese" - used in LLM prompts and UI direction labels
  nativeName: string; // "中文" - used in UI direction labels
  flag: string; // emoji for the language switcher
  ttsLanguage: string; // Qwen3-TTS `language` request field value
  defaultVoiceId: string; // Qwen3-TTS preset voice name
  needsRomanization: boolean;
  nativeFieldLabel: string; // e.g. "Chinese (hanzi)" - add/edit dialog field label
  nativeTextPlaceholder: string; // e.g. "e.g. 谢谢 or xièxie"
  // "{value}" is replaced with the actual romanization by the component rendering it.
  romanizationFooterNote: string | null;
  // Matches native-script text for direction auto-detection; null means the target language
  // shares English's Latin script, so auto-detection isn't possible - default to "toTarget".
  scriptPattern: RegExp | null;
  fontVar: string | null; // CSS var name for native-text font, or null to use the default sans
  accent: {
    light: { accent: string; accentForeground: string; accentSoft: string };
    dark: { accent: string; accentForeground: string; accentSoft: string };
  };
};

export const LANGUAGES: Record<LanguageCode, LanguageConfig> = {
  zh: {
    code: "zh",
    name: "Chinese",
    nativeName: "中文",
    flag: "🇨🇳",
    ttsLanguage: "Chinese",
    defaultVoiceId: "Vivian",
    needsRomanization: true,
    nativeFieldLabel: "Chinese (hanzi)",
    nativeTextPlaceholder: "e.g. 谢谢 or xièxie",
    romanizationFooterNote: "Pinyin ({value}) is computed automatically from the hanzi.",
    scriptPattern: /[一-鿿]/,
    fontVar: "--font-noto-sc",
    accent: {
      light: { accent: "#b8452f", accentForeground: "#fffaf5", accentSoft: "#f6e2db" },
      dark: { accent: "#e07a5f", accentForeground: "#1a1108", accentSoft: "#3a2620" },
    },
  },
  fr: {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    ttsLanguage: "French",
    defaultVoiceId: "Dylan",
    needsRomanization: false,
    nativeFieldLabel: "French",
    nativeTextPlaceholder: "e.g. merci",
    romanizationFooterNote: null,
    scriptPattern: null,
    fontVar: null,
    accent: {
      light: { accent: "#2d5fa6", accentForeground: "#f5f9ff", accentSoft: "#dbe8f7" },
      dark: { accent: "#6ca6e0", accentForeground: "#0d1b2a", accentSoft: "#1f3350" },
    },
  },
  es: {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    ttsLanguage: "Spanish",
    defaultVoiceId: "Eric",
    needsRomanization: false,
    nativeFieldLabel: "Spanish",
    nativeTextPlaceholder: "e.g. gracias",
    romanizationFooterNote: null,
    scriptPattern: null,
    fontVar: null,
    accent: {
      light: { accent: "#c08a12", accentForeground: "#fff8ec", accentSoft: "#f5e3c2" },
      dark: { accent: "#e0b24f", accentForeground: "#241705", accentSoft: "#3d2e12" },
    },
  },
  ja: {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    flag: "🇯🇵",
    ttsLanguage: "Japanese",
    defaultVoiceId: "Ono_Anna",
    needsRomanization: true,
    nativeFieldLabel: "Japanese (kanji/kana)",
    nativeTextPlaceholder: "e.g. ありがとう or arigatou",
    romanizationFooterNote:
      "Romaji ({value}) is computed automatically (best-effort for common words).",
    scriptPattern: /[぀-ヿ一-鿿]/,
    fontVar: "--font-noto-jp",
    accent: {
      light: { accent: "#c23a6b", accentForeground: "#fff5f8", accentSoft: "#f5dbe6" },
      dark: { accent: "#e8789f", accentForeground: "#2a0c18", accentSoft: "#3d1b29" },
    },
  },
  ko: {
    code: "ko",
    name: "Korean",
    nativeName: "한국어",
    flag: "🇰🇷",
    ttsLanguage: "Korean",
    defaultVoiceId: "Sohee",
    needsRomanization: true,
    nativeFieldLabel: "Korean (Hangul)",
    nativeTextPlaceholder: "e.g. 감사합니다 or gamsahamnida",
    romanizationFooterNote: "Romanization ({value}) is computed automatically.",
    scriptPattern: /[가-힣]/,
    fontVar: "--font-noto-kr",
    accent: {
      light: { accent: "#1f7a6e", accentForeground: "#f2fbf9", accentSoft: "#d7ece8" },
      dark: { accent: "#4fb8a8", accentForeground: "#06211d", accentSoft: "#163631" },
    },
  },
};

export const DEFAULT_LANGUAGE: LanguageCode = "zh";
export const LANGUAGE_CODES = Object.keys(LANGUAGES) as [LanguageCode, ...LanguageCode[]];

export function isLanguageCode(value: string | null | undefined): value is LanguageCode {
  return !!value && value in LANGUAGES;
}
