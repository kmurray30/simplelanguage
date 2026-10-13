"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";

// "Test" on a Learn deck: a drop-up with the ways to test yourself without a lesson.
export function TestMenu({ options, className }: { options: { label: string; href: string }[]; className?: string }) {
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
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={clsx(className, "flex items-center gap-1.5")}
      >
        Test
        <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden className={clsx("transition-transform", !open && "rotate-180")}>
          <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div role="menu" className="absolute left-0 bottom-full mb-2 z-20 min-w-36 rounded-xl border border-border bg-surface shadow-lg py-1 animate-fade-in-up">
          {options.map((o) => (
            <Link key={o.href} role="menuitem" href={o.href} className="block px-3.5 py-2 text-sm hover:bg-surface-muted transition-colors">
              {o.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
