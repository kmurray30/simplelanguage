import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toRomanization } from "@/lib/pinyin";
import { WordUpdateSchema } from "@/lib/schemas";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const word = await prisma.word.findUnique({
    where: { id },
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
  if (!word) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ word: { ...word, hasAudio: word.audioClipId !== null } });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const parsed = WordUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.word.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { nativeText, englishGloss, phonetic, usageNote } = parsed.data;
  const nativeTextChanged = nativeText !== undefined && nativeText !== existing.nativeText;

  try {
    const word = await prisma.word.update({
      where: { id },
      data: {
        ...(nativeText !== undefined && { nativeText }),
        ...(englishGloss !== undefined && { englishGloss }),
        ...(phonetic !== undefined && { phonetic }),
        ...(usageNote !== undefined && { usageNote }),
        ...(nativeTextChanged && { romanization: toRomanization(nativeText!), audioClipId: null }),
      },
    });
    return NextResponse.json({ word });
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

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.word.delete({ where: { id } }).catch(() => null);
  return new NextResponse(null, { status: 204 });
}
