"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import { SITE_NAME } from "@/lib/site";
import { LANGUAGES, LANGUAGE_CODES, DEFAULT_LANGUAGE, isLanguageCode, type LanguageCode } from "@/lib/languages";

// Flashcards, quizzes and lessons all live under Learn, so the tab stays highlighted on /flashcards too.
const links = [
  { href: "/", label: "List", match: (pathname: string) => pathname === "/" },
  {
    href: "/learn",
    label: "Learn",
    match: (pathname: string) => pathname.startsWith("/learn") || pathname.startsWith("/flashcards"),
  },
];

// The current language's flag as a button; opens a list of every language (flag + name) to switch.
function LanguageMenu({ current, onSelect }: { current: LanguageCode; onSelect: (code: LanguageCode) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${LANGUAGES[current].name}`}
        className="flex items-center gap-1.5 rounded-full pl-2 pr-2.5 h-9 border border-border hover:bg-surface-muted transition-colors"
      >
        <span className="text-xl leading-none" aria-hidden>
          {LANGUAGES[current].flag}
        </span>
        <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden className={clsx("text-foreground-muted transition-transform", open && "rotate-180")}>
          <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Choose a language"
          className="absolute left-0 top-full mt-2 z-30 min-w-44 rounded-xl border border-border bg-surface shadow-lg py-1"
        >
          {LANGUAGE_CODES.map((code) => (
            <li key={code} role="option" aria-selected={code === current}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (code !== current) onSelect(code);
                }}
                className={clsx(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors hover:bg-surface-muted",
                  code === current && "bg-accent-soft",
                )}
              >
                <span className="text-xl leading-none" aria-hidden>
                  {LANGUAGES[code].flag}
                </span>
                <span className="flex-1">{LANGUAGES[code].name}</span>
                {code === current && <span aria-hidden>✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const langParam = searchParams.get("lang");
  const languageCode = isLanguageCode(langParam) ? langParam : DEFAULT_LANGUAGE;

  function switchLanguage(code: LanguageCode) {
    try {
      localStorage.setItem("lang", code);
    } catch {
      // localStorage can be unavailable (private browsing, disabled storage) - navigation below still works
    }
    // Imperative DOM write so the accent/font swap instantly on click, since client-side
    // navigation won't re-run the no-FOUC <head> script that sets this on initial load.
    document.documentElement.dataset.lang = code;
    router.push(`${pathname}?lang=${code}`);
  }

  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <LanguageMenu current={languageCode} onSelect={switchLanguage} />
          <Link href={`/?lang=${languageCode}`} className="text-base font-semibold tracking-tight shrink-0">
            {SITE_NAME}
          </Link>
        </div>

        <nav className="flex items-center gap-1 shrink-0">
          {links.map((link) => {
            const active = link.match(pathname);
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
