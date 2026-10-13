import { NextResponse, type NextRequest } from "next/server";
import { isLanguageCode } from "@/lib/languages";

// The language lives in the URL (?lang=) so every page can render for it server-side, and in a
// cookie so the app reopens in the language you last used:
//   - no ?lang= on a page -> redirect to the remembered language
//   - a stale link or bookmark (a fresh navigation, not a click inside the app) whose ?lang= differs
//     from the remembered language -> the remembered language wins
//   - otherwise the URL's language is the one you're using now, so remember it
export const LANG_COOKIE = "lang";

export function proxy(request: NextRequest) {
  const { nextUrl } = request;
  const remembered = request.cookies.get(LANG_COOKIE)?.value;
  const rememberedLang = isLanguageCode(remembered) ? remembered : null;
  const requested = nextUrl.searchParams.get(LANG_COOKIE);
  const requestedLang = isLanguageCode(requested) ? requested : null;

  // Typed address, bookmark or home-screen shortcut: the browser reports no initiating site.
  const isFreshNavigation =
    request.headers.get("sec-fetch-dest") === "document" && request.headers.get("sec-fetch-site") === "none";

  const redirectTo = !requestedLang
    ? rememberedLang
    : rememberedLang && requestedLang !== rememberedLang && isFreshNavigation
      ? rememberedLang
      : null;
  if (redirectTo) {
    const url = nextUrl.clone();
    url.searchParams.set(LANG_COOKIE, redirectTo);
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  if (requestedLang && requestedLang !== rememberedLang) {
    response.cookies.set(LANG_COOKIE, requestedLang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  return response;
}

// Pages only - not API routes, Next internals or files with an extension (icons, fonts...).
export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
