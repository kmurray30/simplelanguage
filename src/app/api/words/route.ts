import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toRomanization } from "@/lib/pinyin";
import { WordCreateSchema } from "@/lib/schemas";

export async function GET(req: NextRequest) {
  const languageCode = req.nextUrl.searchParams.get("languageCode") ?? "zh";

  const words = await prisma.word.findMany({
    where: { languageCode },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      languageCode: true,
      nativeText: true,
      romanization: true,
      phonetic: true,
      englishGloss: true,
      usageNote: true,
      audioClipId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    words: words.map((w) => ({ ...w, hasAudio: w.audioClipId !== null })),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = WordCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { languageCode, nativeText, englishGloss, phonetic, usageNote } = parsed.data;
  const romanization = toRomanization(nativeText);

  try {
    const word = await prisma.word.create({
      data: { languageCode, nativeText, romanization, phonetic, englishGloss, usageNote },
    });
    return NextResponse.json({ word }, { status: 201 });
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "code" in e && e.code === "P2002") {
      return NextResponse.json(
        { error: "A word with this native text and gloss already exists." },
        { status: 409 },
      );
    }
    throw e;
  }
}
