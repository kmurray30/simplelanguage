import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Noto_Sans_SC, Noto_Sans_JP, Noto_Sans_KR } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import { LANGUAGE_CODES, DEFAULT_LANGUAGE } from "@/lib/languages";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// `subsets` only controls what next/font preloads, not which unicode-range @font-face blocks
// are included (Google Fonts always returns the full family CSS) - and these CJK families
// don't expose a CJK-named subset to select anyway, so preload is disabled instead.
// Note: Turbopack builds can intermittently fail resolving these fonts with "next/font/google
// queries have exactly one entry" (vercel/next.js#99114, a Google Fonts CDN response shape
// Turbopack mis-serializes) - a plain retry of the build (not a Railway "redeploy", which
// replays the prior build rather than re-fetching) has resolved it every time so far.
const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sc",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  preload: false,
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-jp",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  preload: false,
});

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-kr",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "Vocab",
  description: "A personal vocabulary flashcard app.",
};

// Sets data-lang before first paint so the right accent color/font apply with no flash.
// Keep LANGUAGE_CODES/DEFAULT_LANGUAGE in sync with src/lib/languages.ts - this runs
// before any JS module graph loads, so it can't import that file directly.
const noFoucScript = `(function() {
  try {
    var valid = ${JSON.stringify(LANGUAGE_CODES)};
    var params = new URLSearchParams(location.search);
    var lang = params.get("lang") || localStorage.getItem("lang") || ${JSON.stringify(DEFAULT_LANGUAGE)};
    if (valid.indexOf(lang) === -1) lang = ${JSON.stringify(DEFAULT_LANGUAGE)};
    document.documentElement.dataset.lang = lang;
  } catch (e) {}
})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${notoSansSC.variable} ${notoSansJP.variable} ${notoSansKR.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFoucScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <Suspense fallback={<div className="h-14 border-b border-border bg-surface/80" />}>
          <NavBar />
        </Suspense>
        <div className="flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
