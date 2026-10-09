"use client";

import { clsx } from "clsx";
import { toKatakana, type KanaScript } from "@/lib/kana";

// The gojūon table, read across: a i u e o. Gaps keep や and わ in their columns.
const GRID: (string | null)[] = [
  "あ", "い", "う", "え", "お",
  "か", "き", "く", "け", "こ",
  "さ", "し", "す", "せ", "そ",
  "た", "ち", "つ", "て", "と",
  "な", "に", "ぬ", "ね", "の",
  "は", "ひ", "ふ", "へ", "ほ",
  "ま", "み", "む", "め", "も",
  "や", null, "ゆ", null, "よ",
  "ら", "り", "る", "れ", "ろ",
  "わ", null, "を", null, "ん",
];

// Modifier keys change the last kana typed, like a phone's Japanese keyboard: ゛ voices it (か -> が),
// ゜ makes the p-sound (は -> ぱ), 小 toggles small (や -> ゃ, つ -> っ). Each toggles back off.
const DAKUTEN: Record<string, string> = {};
const HANDAKUTEN: Record<string, string> = {};
for (const base of "かきくけこさしすせそたちつてとはひふへほ") {
  DAKUTEN[base] = String.fromCodePoint(base.codePointAt(0)! + 1);
}
for (const base of "はひふへほ") HANDAKUTEN[base] = String.fromCodePoint(base.codePointAt(0)! + 2);
const SMALL: Record<string, string> = {
  あ: "ぁ", い: "ぃ", う: "ぅ", え: "ぇ", お: "ぉ", つ: "っ", や: "ゃ", ゆ: "ゅ", よ: "ょ", わ: "ゎ",
};

function withKatakana(map: Record<string, string>): Record<string, string> {
  const out = { ...map };
  for (const [from, to] of Object.entries(map)) out[toKatakana(from)] = toKatakana(to);
  return out;
}

function invert(map: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(map).map(([a, b]) => [b, a]));
}

const DAKUTEN_ALL: Record<string, string> = { ...withKatakana(DAKUTEN), ウ: "ヴ" };
const HANDAKUTEN_ALL = withKatakana(HANDAKUTEN);
const SMALL_ALL = withKatakana(SMALL);
const UNDAKUTEN = invert(DAKUTEN_ALL);
const UNHANDAKUTEN = invert(HANDAKUTEN_ALL);
const UNSMALL = invert(SMALL_ALL);

export function modifyLast(value: string, kind: "dakuten" | "handakuten" | "small"): string {
  const chars = [...value];
  const last = chars.pop();
  if (!last) return value;
  // Strip any existing mark first, so ゛ on ぱ gives ば and ゜ on ば gives ぱ.
  const base = UNDAKUTEN[last] ?? UNHANDAKUTEN[last] ?? last;
  let next = last;
  if (kind === "dakuten") next = UNDAKUTEN[last] ? base : (DAKUTEN_ALL[base] ?? last);
  else if (kind === "handakuten") next = UNHANDAKUTEN[last] ? base : (HANDAKUTEN_ALL[base] ?? last);
  else next = SMALL_ALL[last] ?? UNSMALL[last] ?? last;
  return [...chars, next].join("");
}

const MAX_LENGTH = 3;

export function KanaKeypad({
  script,
  value,
  onChange,
}: {
  script: KanaScript;
  value: string;
  onChange: (value: string) => void;
}) {
  const convert = (ch: string) => (script === "katakana" ? toKatakana(ch) : ch);

  function type(ch: string) {
    onChange([...value].length >= MAX_LENGTH ? value : value + ch);
  }

  const keyClass = "native-text h-10 rounded-lg border text-lg transition-colors border-border bg-surface hover:bg-surface-muted";

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="grid grid-cols-5 gap-1.5">
        {GRID.map((ch, i) =>
          ch ? (
            <button key={ch} type="button" onClick={() => type(convert(ch))} aria-label={`Kana ${convert(ch)}`} className={keyClass}>
              {convert(ch)}
            </button>
          ) : (
            <span key={`gap-${i}`} aria-hidden />
          ),
        )}
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        <button type="button" onClick={() => onChange(modifyLast(value, "dakuten"))} aria-label="Add or remove ゛ (dakuten)" className={clsx(keyClass, "text-base")}>
          ゛
        </button>
        <button type="button" onClick={() => onChange(modifyLast(value, "handakuten"))} aria-label="Add or remove ゜ (handakuten)" className={clsx(keyClass, "text-base")}>
          ゜
        </button>
        <button type="button" onClick={() => onChange(modifyLast(value, "small"))} aria-label="Make the last kana small or full-size" className={clsx(keyClass, "text-base")}>
          小
        </button>
        {script === "katakana" ? (
          <button type="button" onClick={() => type("ー")} aria-label="Kana ー" className={keyClass}>
            ー
          </button>
        ) : (
          <span aria-hidden />
        )}
        <button type="button" onClick={() => onChange([...value].slice(0, -1).join(""))} aria-label="Delete the last kana" className={clsx(keyClass, "text-base")}>
          ⌫
        </button>
      </div>
      <p className="text-[11px] text-foreground-muted text-center">
        ゛ voices the last kana (か → が) · ゜ makes p (は → ぱ) · 小 makes it small (や → ゃ)
      </p>
    </div>
  );
}
