import { cookies } from "next/headers";

// Anonymous identity for quiz history. The cookie holds a Learner id; the row is only created when
// the first quiz is saved (server components can't set cookies, so only the save route does).
export const LEARNER_COOKIE = "lid";

// cuid ids are lowercase alphanumeric - rejecting anything else keeps junk cookie values out of queries.
const LEARNER_ID_PATTERN = /^[a-z0-9]{20,40}$/;

export function isLearnerId(value: string | undefined | null): value is string {
  return typeof value === "string" && LEARNER_ID_PATTERN.test(value);
}

export async function readLearnerId(): Promise<string | null> {
  const value = (await cookies()).get(LEARNER_COOKIE)?.value;
  return isLearnerId(value) ? value : null;
}

export const LEARNER_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};
