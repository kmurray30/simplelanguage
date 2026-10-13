import type { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LEARNER_COOKIE, LEARNER_COOKIE_OPTIONS, isLearnerId } from "@/lib/learner";

// The learner behind a save request, created on first save. Call `remember` on the response so a
// new learner's cookie is set.
export async function resolveLearner(req: NextRequest) {
  const cookieId = req.cookies.get(LEARNER_COOKIE)?.value;
  const existing = isLearnerId(cookieId) ? await prisma.learner.findUnique({ where: { id: cookieId } }) : null;
  const learnerId = existing?.id ?? (await prisma.learner.create({ data: {} })).id;
  return {
    learnerId,
    remember(res: NextResponse) {
      if (!existing) res.cookies.set(LEARNER_COOKIE, learnerId, LEARNER_COOKIE_OPTIONS);
      return res;
    },
  };
}
