"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AudioButton } from "./AudioButton";
import { Emphasis } from "./Emphasis";
import { LANGUAGES } from "@/lib/languages";
import { HANGUL_SYLLABLES, HANGUL_SYMBOLS } from "@/lib/hangul";
import { DECK_LABELS, availableDecks, type DeckType } from "@/lib/decks";
import { clsx } from "clsx";
import type { Word, LanguageCode } from "@/types";

type FrontSide = "en" | "native";

type Face = {
  label?: string; // small uppercase caption at the top of the face
  primary: string;
  size: "huge" | "native" | "large" | "normal";
  caption?: string; // small muted line, e.g. a letter's name
  secondary?: string; // may contain **emphasis** markers
  tertiary?: string; // rendered in italics, quoted
  note?: string;
};

type FlashCard = {
  id: string;
  native: Face;
  english: Face;
  audioSrc?: string;
  audioOn: FrontSide; // the face that shows the audio button and auto-plays when it appears
};

function ttsSrc(languageCode: LanguageCode, text: string): string {
  return `/api/tts?lang=${languageCode}&text=${encodeURIComponent(text)}`;
}

function wordCards(words: Word[]): FlashCard[] {
  return words.map((w) => ({
    id: `word:${w.id}`,
    native: {
      primary: w.nativeText,
      size: "native",
      secondary: w.romanization || undefined,
      tertiary: w.phonetic,
    },
    english: { primary: w.englishGloss, size: "normal", note: w.usageNote ?? undefined },
    audioSrc: `/api/words/${w.id}/audio`,
    audioOn: "native",
  }));
}

// Reference decks: the "native" face is only the symbol itself, the "english" face is
// everything about it (sound, name, example, audio, notes) but deliberately NOT the symbol - so
// either face works as the prompt and you can quiz yourself in both directions.
function symbolCards(languageCode: LanguageCode): FlashCard[] {
  return HANGUL_SYMBOLS.map((s) => ({
    id: `symbol:${s.jamo}`,
    native: { primary: s.jamo, size: "huge" },
    english: {
      label: s.kind,
      primary: s.sound,
      size: "large",
      caption: s.name,
      secondary: s.example,
      note: s.detail,
    },
    audioSrc: ttsSrc(languageCode, s.audioSyllable),
    audioOn: "en",
  }));
}

function syllableCards(languageCode: LanguageCode): FlashCard[] {
  return HANGUL_SYLLABLES.map((s) => ({
    id: `syllable:${s.section}:${s.block}`,
    native: { primary: s.block, size: "huge" },
    english: {
      label: s.section,
      primary: s.rr,
      size: "large",
      tertiary: s.respell,
      note: s.note,
    },
    audioSrc: ttsSrc(languageCode, s.block),
    audioOn: "en",
  }));
}

const PRIMARY_CLASS: Record<Face["size"], string> = {
  huge: "native-text text-8xl",
  native: "native-text text-6xl",
  large: "text-4xl font-medium",
  normal: "text-2xl font-medium",
};

// Words flip between English and the native script; reference decks start on the bare symbol.
function defaultFront(deck: DeckType): FrontSide {
  return deck === "words" ? "en" : "native";
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
  const [frontSide, setFrontSide] = useState<FrontSide>(defaultFront(initialDeck));

  const cards = useMemo<FlashCard[]>(() => {
    if (deck === "symbols") return symbolCards(languageCode);
    if (deck === "syllables") return syllableCards(languageCode);
    return wordCards(words);
  }, [deck, words, languageCode]);

  const card = cards[index];

  function switchDeck(next: DeckType) {
    if (next === deck) return;
    setDeck(next);
    setIndex(0);
    setFlipped(false);
    setDirection(0);
    setFrontSide(defaultFront(next));
    // Native history API so the deck survives a reload/back without a server round trip - the
    // App Router keeps useSearchParams in sync with pushState/replaceState.
    const url = new URL(window.location.href);
    url.searchParams.set("lang", languageCode);
    url.searchParams.set("deck", next);
    window.history.replaceState(null, "", url.toString());
  }

  // No manual useCallback: the React Compiler memoizes this itself (and its lint rule rejects a
  // hand-written dependency list that doesn't match what it infers). Does nothing at either end
  // of the deck, so the card doesn't reset or jump when there's nowhere to go.
  function go(delta: number) {
    const target = Math.max(0, Math.min(cards.length - 1, index + delta));
    if (target === index) return;
    setDirection(delta);
    setIndex(target);
    setFlipped(false);
  }

  // Reveal first, then move on: the first activation flips the card, the next one advances.
  function flipOrAdvance() {
    if (flipped) go(1);
    else setFlipped(true);
  }

  // Only the far-left fifth of the card goes back; everywhere else flips, then advances.
  function handleCardClick(e: React.MouseEvent<HTMLDivElement>) {
    // detail === 0 means a keyboard/assistive-tech activation with no real pointer position.
    if (e.detail === 0) {
      flipOrAdvance();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    if (x < 1 / 5) go(-1);
    else flipOrAdvance();
  }

  useEffect(() => {
    const last = cards.length - 1;
    function navigate(delta: number) {
      const target = Math.max(0, Math.min(last, index + delta));
      if (target === index) return;
      setDirection(delta);
      setIndex(target);
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
  }, [cards.length, index]);

  const sideOptions: { side: FrontSide; label: string }[] =
    deck === "words"
      ? [
          { side: "en", label: "English first" },
          { side: "native", label: `${lang.nativeName} first` },
        ]
      : [
          { side: "native", label: deck === "symbols" ? "Symbol first" : "Syllable first" },
          { side: "en", label: "Details first" },
        ];

  function renderFace(side: FrontSide, rotateDeg: 0 | 180) {
    if (!card) return null;
    const face = side === "native" ? card.native : card.english;
    return (
      <div
        className={clsx(
          "absolute inset-0 [backface-visibility:hidden] rounded-3xl border border-border shadow-sm flex flex-col items-center justify-center gap-2 p-6",
          side === "native" ? "bg-surface" : "bg-accent-soft",
        )}
        style={{ transform: `rotateY(${rotateDeg}deg)` }}
      >
        {face.label && (
          <span className="absolute top-4 text-[11px] uppercase tracking-wide text-foreground-muted">
            {face.label}
          </span>
        )}
        <span className={clsx("text-center", PRIMARY_CLASS[face.size])}>{face.primary}</span>
        {face.caption && (
          <span className="native-text text-sm text-foreground-muted text-center">{face.caption}</span>
        )}
        {face.secondary && (
          <span className="text-lg text-foreground-muted text-center">
            <Emphasis text={face.secondary} />
          </span>
        )}
        {face.tertiary && (
          <span className="text-sm italic text-foreground-muted">&ldquo;{face.tertiary}&rdquo;</span>
        )}
        {card.audioSrc && card.audioOn === side && (
          <div onClick={(e) => e.stopPropagation()} className="mt-1">
            <AudioButton src={card.audioSrc} />
          </div>
        )}
        {face.note && (
          <p className="text-sm text-foreground-muted text-center max-w-sm">{face.note}</p>
        )}
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
          <div
            role="button"
            tabIndex={0}
            aria-label="Flashcard: tap to flip, tap again for the next card, tap the far left to go back"
            onClick={handleCardClick}
            onKeyDown={(e) => {
              // Space is handled globally (also covers an unfocused card); Enter only fires
              // here, so handling Space too would double-toggle and cancel itself out.
              if (e.key === "Enter") {
                e.preventDefault();
                flipOrAdvance();
              }
            }}
            className={clsx(
              "relative w-full rounded-3xl [perspective:1200px] cursor-pointer select-none [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
              deck === "words" ? "h-72" : "h-96",
            )}
          >
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
                  className="w-full h-full [transform-style:preserve-3d] transition-transform duration-500"
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
            {sideOptions.map(({ side, label }) => (
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
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      <p className="text-[11px] text-foreground-muted text-center">
        Tap the card to flip it, tap again for the next one · tap the far left to go back · space
        and ← → work too
      </p>
    </div>
  );
}
