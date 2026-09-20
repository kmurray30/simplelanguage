import { NextRequest, NextResponse } from "next/server";
import { generateTranslationCandidates } from "@/lib/openai";
import { toRomanization } from "@/lib/pinyin";
import { TranslateRequestSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = TranslateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { direction, input } = parsed.data;

  try {
    const { candidates } = await generateTranslationCandidates(input, direction);
    const withRomanization = candidates.map((c) => ({
      ...c,
      romanization: toRomanization(c.nativeText),
    }));
    return NextResponse.json({ candidates: withRomanization });
  } catch (e) {
    console.error("translate failed", e);
    return NextResponse.json({ error: "Translation generation failed" }, { status: 502 });
  }
}
