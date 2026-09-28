import type { Direction } from "@/types";

const CJK_PATTERN = /[一-鿿]/;

export function detectDirection(text: string): Direction {
  return CJK_PATTERN.test(text) ? "zh2en" : "en2zh";
}
