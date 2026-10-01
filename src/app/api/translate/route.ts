import { NextRequest, NextResponse } from "next/server";
import { generateTranslationCandidates } from "@/lib/openai";
import { romanize } from "@/lib/romanize";
import { TranslateRequestSchema } from "@/lib/schemas";
import { LANGUAGES } from "@/lib/languages";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = TranslateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { languageCode, direction, input } = parsed.data;
  const lang = LANGUAGES[languageCode];

  try {
    const { candidates } = await generateTranslationCandidates(input, direction, lang);
    const withRomanization = await Promise.all(
      candidates.map(async (c) => ({
        ...c,
        romanization: await romanize(languageCode, c.nativeText),
      })),
    );
    return NextResponse.json({ candidates: withRomanization });
  } catch (e) {
    console.error("translate failed", e);
    return NextResponse.json({ error: "Translation generation failed" }, { status: 502 });
  }
}
