"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import { LANGUAGES, LANGUAGE_CODES, DEFAULT_LANGUAGE, isLanguageCode } from "@/lib/languages";

const links = [
  { href: "/", label: "List" },
  { href: "/flashcards", label: "Flashcards" },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const langParam = searchParams.get("lang");
  const languageCode = isLanguageCode(langParam) ? langParam : DEFAULT_LANGUAGE;
  const lang = LANGUAGES[languageCode];

  function switchLanguage(code: typeof languageCode) {
    try {
      localStorage.setItem("lang", code);
    } catch {
      // localStorage can be unavailable (private browsing, disabled storage) - navigation below still works
    }
    // Imperative DOM write so the accent/font swap instantly on click, since client-side
    // navigation won't re-run the no-FOUC <head> script that sets this on initial load.
    // eslint-disable-next-line react-hooks/immutability
    document.documentElement.dataset.lang = code;
    router.push(`${pathname}?lang=${code}`);
  }

  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <Link href={`/?lang=${languageCode}`} className="flex items-baseline gap-2 shrink-0">
          <span className="text-xl" aria-hidden>
            {lang.flag}
          </span>
          <span className="text-sm text-foreground-muted">Vocab</span>
        </Link>

        <div className="flex items-center gap-1 overflow-x-auto">
          {LANGUAGE_CODES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => switchLanguage(code)}
              title={LANGUAGES[code].name}
              aria-label={LANGUAGES[code].name}
              aria-pressed={code === languageCode}
              className={clsx(
                "shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-base transition-colors",
                code === languageCode
                  ? "bg-accent-soft ring-1 ring-accent"
                  : "opacity-60 hover:opacity-100 hover:bg-surface-muted",
              )}
            >
              {LANGUAGES[code].flag}
            </button>
          ))}
        </div>

        <nav className="flex items-center gap-1 shrink-0">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={`${link.href}?lang=${languageCode}`}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-sm transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground-muted hover:text-foreground hover:bg-surface-muted",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
