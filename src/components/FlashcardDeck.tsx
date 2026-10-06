"use client";

import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AudioButton } from "./AudioButton";
import { LANGUAGES } from "@/lib/languages";
import { HANGUL_SYLLABLES, HANGUL_SYMBOLS } from "@/lib/hangul";
import { DECK_LABELS, availableDecks, type DeckType } from "@/lib/decks";
import { clsx } from "clsx";
import type { Word, LanguageCode } from "@/types";

type FrontSide = "en" | "native";

type Face = {
  primary: string;
  primaryNative?: boolean; // native-script styling (native font, largest size)
  primaryLarge?: boolean; // for short non-native primaries like "g / k" or "ga"
  secondary?: string; // may contain **emphasis** markers
  tertiary?: string; // rendered in italics, quoted
  note?: string;
};

type FlashCard = {
  id: string;
  label?: string; // small caption on the native face, e.g. the syllable section
  native: Face;
  english: Face;
  audioSrc?: string;
};

function ttsSrc(languageCode: LanguageCode, text: string): string {
  return `/api/tts?lang=${languageCode}&text=${encodeURIComponent(text)}`;
}

function wordCards(words: Word[]): FlashCard[] {
  return words.map((w) => ({
    id: `word:${w.id}`,
    native: {
      primary: w.nativeText,
      primaryNative: true,
      secondary: w.romanization || undefined,
      tertiary: w.phonetic,
    },
    english: { primary: w.englishGloss, note: w.usageNote ?? undefined },
    audioSrc: `/api/words/${w.id}/audio`,
  }));
}

function symbolCards(languageCode: LanguageCode): FlashCard[] {
  return HANGUL_SYMBOLS.map((s) => ({
    id: `symbol:${s.jamo}`,
    label: s.kind,
    native: { primary: s.jamo, primaryNative: true, secondary: s.name },
    english: { primary: s.sound, primaryLarge: true, secondary: s.example, note: s.detail },
    audioSrc: ttsSrc(languageCode, s.audioSyllable),
  }));
}

function syllableCards(languageCode: LanguageCode): FlashCard[] {
  return HANGUL_SYLLABLES.map((s) => ({
    id: `syllable:${s.section}:${s.block}`,
    label: s.section,
    native: { primary: s.block, primaryNative: true },
    english: { primary: s.rr, primaryLarge: true, secondary: s.respell, note: s.note },
    audioSrc: ttsSrc(languageCode, s.block),
  }));
}

// "**x**" marks the sound an "as in" example is illustrating.
function renderEmphasis(text: string): ReactNode {
  const parts = text.split("**");
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-foreground">
        {part}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

export function FlashcardDeck({
  words,
  languageCode,
  initialDeck,
}: {
  words: Word[];
  languageCode: LanguageCode;
  initialDeck: DeckType;
}) {
  const lang = LANGUAGES[languageCode];
  const decks = availableDecks(languageCode);
  const [deck, setDeck] = useState<DeckType>(initialDeck);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState(0);
  const [frontSide, setFrontSide] = useState<FrontSide>("en");

  const cards = useMemo<FlashCard[]>(() => {
    if (deck === "symbols") return symbolCards(languageCode);
    if (deck === "syllables") return syllableCards(languageCode);
    return wordCards(words);
  }, [deck, words, languageCode]);

  const card = cards[index];
  const visibleSide: FrontSide = flipped ? (frontSide === "en" ? "native" : "en") : frontSide;

  function switchDeck(next: DeckType) {
    if (next === deck) return;
    setDeck(next);
    setIndex(0);
    setFlipped(false);
    setDirection(0);
    // Native history API so the deck survives a reload/back without a server round trip - the
    // App Router keeps useSearchParams in sync with pushState/replaceState.
    const url = new URL(window.location.href);
    url.searchParams.set("lang", languageCode);
    url.searchParams.set("deck", next);
    window.history.replaceState(null, "", url.toString());
  }

  // Auto-plays whenever the native-language face becomes the visible one - via flip, the
  // front-side toggle, or navigating to a new card while already showing it first. Plays
  // directly (independent of the AudioButton below) since AnimatePresence's mode="wait" delays
  // mounting the next card's button until the previous one's exit animation finishes.
  useEffect(() => {
    if (visibleSide !== "native" || !card?.audioSrc) return;
    const audio = new Audio(card.audioSrc);
    audio.play().catch((err) => console.error("[FlashcardDeck] autoplay failed", err));
    return () => audio.pause();
  }, [visibleSide, card]);

  // No manual useCallback: the React Compiler memoizes this itself (and its lint rule rejects a
  // hand-written dependency list that doesn't match what it infers).
  function go(delta: number) {
    setDirection(delta);
    setIndex((i) => Math.max(0, Math.min(cards.length - 1, i + delta)));
    setFlipped(false);
  }

  useEffect(() => {
    const total = cards.length;
    function navigate(delta: number) {
      setDirection(delta);
      setIndex((i) => Math.max(0, Math.min(total - 1, i + delta)));
      setFlipped(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") navigate(1);
      else if (e.key === "ArrowLeft") navigate(-1);
      else if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cards.length]);

  const sideLabels: Record<FrontSide, string> =
    deck === "words"
      ? { en: "English first", native: `${lang.nativeName} first` }
      : { en: "Sound first", native: "한글 first" };

  function renderFace(side: FrontSide, rotateDeg: 0 | 180) {
    if (!card) return null;
    const face = side === "native" ? card.native : card.english;
    return (
      <div
        className={clsx(
          "absolute inset-0 [backface-visibility:hidden] rounded-3xl border border-border shadow-sm flex flex-col items-center justify-center gap-3 p-8",
          side === "native" ? "bg-surface" : "bg-accent-soft",
        )}
        style={{ transform: `rotateY(${rotateDeg}deg)` }}
      >
        {side === "native" && card.label && (
          <span className="absolute top-4 text-[11px] uppercase tracking-wide text-foreground-muted">
            {card.label}
          </span>
        )}
        <span
          className={clsx(
            "text-center",
            face.primaryNative
              ? "native-text text-6xl"
              : face.primaryLarge
                ? "text-4xl font-medium"
                : "text-2xl font-medium",
          )}
        >
          {face.primary}
        </span>
        {face.secondary && (
          <span className="text-lg text-foreground-muted text-center">
            {renderEmphasis(face.secondary)}
          </span>
        )}
        {face.tertiary && (
          <span className="text-sm italic text-foreground-muted">&ldquo;{face.tertiary}&rdquo;</span>
        )}
        {face.note && (
          <p className="text-sm text-foreground-muted text-center max-w-sm">{face.note}</p>
        )}
        {side === "native" && card.audioSrc && (
          <div onClick={(e) => e.stopPropagation()} className="mt-2">
            <AudioButton src={card.audioSrc} />
          </div>
        )}
        <span className="absolute bottom-4 text-[11px] text-foreground-muted">tap to flip</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg w-full px-4 sm:px-6 py-10 flex flex-col items-center gap-6">
      <div className="flex items-center gap-4">
        {decks.length > 1 && (
          <div className="flex rounded-full border border-border p-0.5 text-xs">
            {decks.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => switchDeck(d)}
                className={clsx(
                  "px-2.5 py-1 rounded-full transition-colors",
                  deck === d
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground-muted hover:text-foreground",
                )}
              >
                {DECK_LABELS[d]}
              </button>
            ))}
          </div>
        )}
        {card && (
          <span className="text-xs text-foreground-muted tabular-nums">
            {index + 1} / {cards.length}
          </span>
        )}
      </div>

      {!card ? (
        <div className="w-full py-16 text-center">
          <p className="text-sm text-foreground-muted">
            You don&apos;t have any words yet. Add some from the list view to start studying.
          </p>
        </div>
      ) : (
        <>
          <div className="relative w-full h-72 [perspective:1200px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={card.id}
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
                  {renderFace(frontSide === "en" ? "native" : "en", 180)}
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
              disabled={index === cards.length - 1}
              className="px-4 py-2 rounded-full text-sm border border-border disabled:opacity-30 hover:bg-surface-muted transition-colors"
            >
              Next &rarr;
            </button>
          </div>

          <div className="flex rounded-full border border-border p-0.5 text-xs">
            {(["en", "native"] as FrontSide[]).map((side) => (
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
                {sideLabels[side]}
              </button>
            ))}
          </div>
        </>
      )}

      <p className="text-[11px] text-foreground-muted">Tip: space to flip, ← → to navigate</p>
    </div>
  );
}
