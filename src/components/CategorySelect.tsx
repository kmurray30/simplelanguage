"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { CATEGORIES } from "@/lib/categories";
import type { WordCategory } from "@/types";

// Room the open list needs below the button before it flips upward (max-h-56 + margin).
const LIST_SPACE_PX = 240;

// A word can belong to more than one category (e.g. "hello" is both GREETINGS and BASICS), so
// this is a multi-select dropdown: one compact button that summarizes the choices, opening a
// checklist. The full chip grid took up most of the add/edit dialog.
export function CategorySelect({
  value,
  onChange,
}: {
  value: WordCategory[];
  onChange: (value: WordCategory[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function toggleOpen() {
    if (!open && rootRef.current) {
      const rect = rootRef.current.getBoundingClientRect();
      setDropUp(window.innerHeight - rect.bottom < LIST_SPACE_PX && rect.top > window.innerHeight - rect.bottom);
    }
    setOpen(!open);
  }

  function toggle(category: WordCategory) {
    if (value.includes(category)) {
      onChange(value.filter((c) => c !== category));
    } else {
      onChange([...value, category]);
    }
  }

  const selectedLabels = CATEGORIES.filter((c) => value.includes(c.value)).map((c) => c.label);

  return (
    <div
      ref={rootRef}
      className="relative"
      onKeyDown={(e) => {
        // Escape closes just the list - without this it would also close the surrounding dialog.
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        onClick={toggleOpen}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-accent/40"
      >
        <span className={clsx("truncate", selectedLabels.length === 0 && "text-foreground-muted")}>
          {selectedLabels.length === 0 ? "Select categories" : selectedLabels.join(", ")}
        </span>
        <span className="flex items-center gap-2 shrink-0 text-foreground-muted">
          {selectedLabels.length > 1 && <span className="text-xs tabular-nums">{selectedLabels.length}</span>}
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            aria-hidden
            className={clsx("transition-transform", open && "rotate-180")}
          >
            <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-multiselectable
          aria-label="Categories"
          className={clsx(
            "absolute z-10 left-0 right-0 max-h-56 overflow-y-auto overscroll-contain rounded-lg border border-border bg-surface shadow-lg py-1",
            dropUp ? "bottom-full mb-1" : "top-full mt-1",
          )}
        >
          {CATEGORIES.map((c) => {
            const selected = value.includes(c.value);
            return (
              <li key={c.value} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => toggle(c.value)}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-left hover:bg-surface-muted transition-colors"
                >
                  <span
                    aria-hidden
                    className={clsx(
                      "w-4 h-4 shrink-0 rounded border flex items-center justify-center text-[10px] leading-none",
                      selected ? "bg-accent border-accent text-accent-foreground" : "border-border",
                    )}
                  >
                    {selected && "✓"}
                  </span>
                  {c.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
