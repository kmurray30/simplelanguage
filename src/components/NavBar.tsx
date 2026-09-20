"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const links = [
  { href: "/", label: "List" },
  { href: "/flashcards", label: "Flashcards" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="hanzi text-xl font-medium text-accent">词汇</span>
          <span className="text-sm text-foreground-muted">Vocab</span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
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
