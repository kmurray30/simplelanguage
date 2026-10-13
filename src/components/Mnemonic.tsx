"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { MNEMONIC_CREDIT, type Mnemonic } from "@/lib/kanaMnemonics";

// A picture that makes a letter's shape stick (basic kana), with its one-line story.
export function MnemonicFigure({ mnemonic, className }: { mnemonic: Mnemonic; className?: string }) {
  return (
    <figure className={clsx("flex flex-col items-center gap-1.5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny static crops; next/image adds nothing here */}
      <img src={mnemonic.src} alt="" width={124} height={128} className="w-[124px] h-[128px] rounded-xl bg-white p-1 object-contain" />
      <figcaption className="text-sm text-center max-w-xs">
        {mnemonic.caption}
        <span className="block text-[10px] text-foreground-muted">{MNEMONIC_CREDIT}</span>
      </figcaption>
    </figure>
  );
}

// A small 💡 button that pops the mnemonic up over whatever it sits on. The popover is placed
// against the nearest positioned ancestor, so callers choose where it lands.
export function MnemonicTip({
  mnemonic,
  buttonClassName,
  popoverClassName = "left-1/2 -translate-x-1/2 top-full mt-2 w-60",
}: {
  mnemonic: Mnemonic;
  buttonClassName?: string;
  popoverClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

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
    // Clicks inside never reach the card underneath (flashcards flip on any tap).
    <span ref={rootRef} className="contents" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Show the picture mnemonic"
        title="Picture mnemonic"
        className={clsx(
          "w-8 h-8 rounded-full border border-border bg-surface text-sm flex items-center justify-center transition-colors shrink-0",
          open ? "ring-2 ring-accent" : "hover:bg-surface-muted",
          buttonClassName,
        )}
      >
        💡
      </button>
      {open && (
        <span
          role="dialog"
          aria-label="Picture mnemonic"
          className={clsx(
            "absolute z-30 rounded-xl border border-border bg-surface shadow-lg p-3 flex flex-col items-center gap-1.5 animate-fade-in-up cursor-default text-foreground",
            popoverClassName,
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny static crops */}
          <img src={mnemonic.src} alt="" width={124} height={128} className="w-[124px] h-[128px] rounded-lg bg-white object-contain" />
          <span className="text-sm text-center">{mnemonic.caption}</span>
          <span className="text-[10px] text-foreground-muted">{MNEMONIC_CREDIT}</span>
        </span>
      )}
    </span>
  );
}
