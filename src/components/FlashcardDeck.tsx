"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AudioButton } from "./AudioButton";
import { clsx } from "clsx";
import type { Word } from "@/types";

type FrontSide = "en" | "zh";

export function FlashcardDeck({ words }: { words: Word[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState(0);
  const [frontSide, setFrontSide] = useState<FrontSide>("en");

  const word = words[index];
  const visibleSide: FrontSide = flipped ? (frontSide === "en" ? "zh" : "en") : frontSide;

  // Auto-plays whenever the Chinese face becomes the visible one - via flip, the front-side
  // toggle, or navigating to a new card while already showing Chinese first. Plays directly
  // (independent of the AudioButton below) since AnimatePresence's mode="wait" delays mounting
  // the next card's button until the previous one's exit animation finishes.
  useEffect(() => {
    if (visibleSide !== "zh" || !word) return;
    const audio = new Audio(`/api/words/${word.id}/audio`);
    audio.play().catch((err) => console.error("[FlashcardDeck] autoplay failed", err));
    return () => audio.pause();
  }, [visibleSide, word]);

  const go = useCallback(
    (delta: number) => {
      setDirection(delta);
      setIndex((i) => Math.max(0, Math.min(words.length - 1, i + delta)));
      setFlipped(false);
    },
    [words.length],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (words.length === 0) {
    return (
      <div className="mx-auto max-w-lg w-full px-4 py-16 text-center">
        <p className="text-sm text-foreground-muted">
          You don&apos;t have any words yet. Add some from the list view to start studying.
        </p>
      </div>
    );
  }

  function renderFace(side: FrontSide, rotateDeg: 0 | 180) {
    return (
      <div
        className={clsx(
          "absolute inset-0 [backface-visibility:hidden] rounded-3xl border border-border shadow-sm flex flex-col items-center justify-center gap-3 p-8",
          side === "zh" ? "bg-surface" : "bg-accent-soft",
        )}
        style={{ transform: `rotateY(${rotateDeg}deg)` }}
      >
        {side === "zh" ? (
          <>
            <span className="hanzi text-6xl">{word.nativeText}</span>
            <span className="text-lg text-foreground-muted">{word.romanization}</span>
            <span className="text-sm italic text-foreground-muted">
              &ldquo;{word.phonetic}&rdquo;
            </span>
            <div onClick={(e) => e.stopPropagation()} className="mt-2">
              <AudioButton src={`/api/words/${word.id}/audio`} />
            </div>
          </>
        ) : (
          <>
            <span className="text-2xl font-medium text-center">{word.englishGloss}</span>
            {word.usageNote && (
              <p className="text-sm text-foreground-muted text-center max-w-sm">
                {word.usageNote}
              </p>
            )}
          </>
        )}
        <span className="absolute bottom-4 text-[11px] text-foreground-muted">tap to flip</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg w-full px-4 sm:px-6 py-10 flex flex-col items-center gap-6">
      <div className="flex items-center gap-4">
        <span className="text-xs text-foreground-muted tabular-nums">
          {index + 1} / {words.length}
        </span>
        <div className="flex rounded-full border border-border p-0.5 text-xs">
          {(["en", "zh"] as FrontSide[]).map((side) => (
            <button
              key={side}
              type="button"
              onClick={() => {
                setFrontSide(side);
                setFlipped(false);
              }}
              className={clsx(
                "px-2.5 py-1 rounded-full transition-colors",
                frontSide === side
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground-muted hover:text-foreground",
              )}
            >
              {side === "en" ? "English first" : "中文 first"}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full h-72 [perspective:1200px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={word.id}
            custom={direction}
            initial={{ opacity: 0, x: direction >= 0 ? 24 : -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction >= 0 ? -24 : 24 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0"
          >
            <div
              role="button"
              tabIndex={0}
              onClick={() => setFlipped((f) => !f)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setFlipped((f) => !f);
                }
              }}
              className="w-full h-full cursor-pointer [transform-style:preserve-3d] transition-transform duration-500"
              style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
            >
              {renderFace(frontSide, 0)}
              {renderFace(frontSide === "en" ? "zh" : "en", 180)}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => go(-1)}
          disabled={index === 0}
          className="px-4 py-2 rounded-full text-sm border border-border disabled:opacity-30 hover:bg-surface-muted transition-colors"
        >
          &larr; Prev
        </button>
        <button
          onClick={() => setFlipped((f) => !f)}
          className="px-4 py-2 rounded-full text-sm bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
        >
          Flip
        </button>
        <button
          onClick={() => go(1)}
          disabled={index === words.length - 1}
          className="px-4 py-2 rounded-full text-sm border border-border disabled:opacity-30 hover:bg-surface-muted transition-colors"
        >
          Next &rarr;
        </button>
      </div>
      <p className="text-[11px] text-foreground-muted">
        Tip: space to flip, ← → to navigate
      </p>
    </div>
  );
}
