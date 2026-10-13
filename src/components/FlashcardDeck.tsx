"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AudioButton } from "./AudioButton";
import { Emphasis } from "./Emphasis";
import { LANGUAGES } from "@/lib/languages";
import { HANGUL_SYLLABLES, HANGUL_SYMBOLS } from "@/lib/hangul";
import { CUES, KANA, kanaNote, type KanaScript } from "@/lib/kana";
import { kanaMnemonic, MNEMONIC_CREDIT, type Mnemonic } from "@/lib/kanaMnemonics";
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
  mnemonic?: Mnemonic; // picture mnemonic, behind a small button so it doesn't give the card away
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

function kanaCards(script: KanaScript): FlashCard[] {
  return KANA.flatMap((entry) => {
    const char = script === "hiragana" ? entry.hira : entry.kata;
    if (!char) return [];
    const other = script === "hiragana" ? entry.kata : entry.hira;
    return [
      {
        id: `${script}:${char}`,
        native: { primary: char, size: "huge" as const },
        english: {
          label: entry.group,
          primary: entry.romaji,
          size: "large" as const,
          // The same sound in the other script - a different letter, so it doesn't give this card away.
          caption: other && entry.group !== "Special" ? `${script === "hiragana" ? "katakana" : "hiragana"} ${other}` : undefined,
          secondary: CUES[entry.romaji]?.[0],
          note: kanaNote(entry, script),
          mnemonic: kanaMnemonic(char, script),
        },
        // No audio: single kana read out by a TTS voice came out wrong too often.
        audioOn: "en" as const,
      },
    ];
  });
}

const PRIMARY_CLASS: Record<Face["size"], string> = {
  huge: "native-text text-8xl",
  native: "native-text text-6xl",
  large: "text-4xl font-medium",
  normal: "text-2xl font-medium",
};

const REFERENCE_FRONT_LABEL: Record<DeckType, string> = {
  words: "Word",
  symbols: "Symbol",
  syllables: "Syllable",
  hiragana: "Hiragana",
  katakana: "Katakana",
};

// Cards slide in from the side you're moving towards and out the other, tilting as they go, so the
// direction is obvious: next comes in from the right, previous from the left.
const SLIDE = {
  enter: (dir: number) => ({ x: dir >= 0 ? "70%" : "-70%", rotate: dir >= 0 ? 6 : -6, opacity: 0, scale: 0.92 }),
  center: { x: 0, rotate: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir >= 0 ? "-70%" : "70%", rotate: dir >= 0 ? -6 : 6, opacity: 0, scale: 0.92 }),
};

function SideButton({ side, disabled, onClick }: { side: "left" | "right"; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === "left" ? "Previous card" : "Next card"}
      className={clsx(
        "absolute top-1/2 -translate-y-1/2 z-10 w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-border bg-surface/95 shadow-md",
        "flex items-center justify-center text-2xl text-foreground hover:bg-surface-muted active:scale-95 transition disabled:opacity-0 disabled:pointer-events-none",
        side === "left" ? "left-1 sm:-left-7" : "right-1 sm:-right-7",
      )}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <path
          d={side === "left" ? "M15 5 8 12l7 7" : "M9 5l7 7-7 7"}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

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
  const [mnemonicOpen, setMnemonicOpen] = useState(false);

  const cards = useMemo<FlashCard[]>(() => {
    if (deck === "symbols") return symbolCards(languageCode);
    if (deck === "syllables") return syllableCards(languageCode);
    if (deck === "hiragana" || deck === "katakana") return kanaCards(deck);
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
    setMnemonicOpen(false);
  }

  // A tap anywhere on the card flips it, back and forth; moving is the side buttons (or ← →).
  function flip() {
    setFlipped((f) => !f);
    setMnemonicOpen(false);
  }

  useEffect(() => {
    const last = cards.length - 1;
    function navigate(delta: number) {
      const target = Math.max(0, Math.min(last, index + delta));
      if (target === index) return;
      setDirection(delta);
      setIndex(target);
      setFlipped(false);
      setMnemonicOpen(false);
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
          { side: "native", label: `${REFERENCE_FRONT_LABEL[deck]} first` },
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
        {face.mnemonic && (
          <div onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setMnemonicOpen((o) => !o)}
              aria-expanded={mnemonicOpen}
              aria-label="Show the picture mnemonic"
              title="Picture mnemonic"
              className={clsx(
                "absolute top-3 right-3 w-8 h-8 rounded-full border border-border bg-surface text-sm flex items-center justify-center transition-colors",
                mnemonicOpen ? "ring-2 ring-accent" : "hover:bg-surface-muted",
              )}
            >
              💡
            </button>
            {mnemonicOpen && (
              <div className="absolute inset-x-14 top-12 z-10 rounded-xl border border-border bg-surface shadow-lg p-3 flex flex-col items-center gap-1.5 animate-fade-in-up cursor-default">
                {/* eslint-disable-next-line @next/next/no-img-element -- tiny static crops */}
                <img src={face.mnemonic.src} alt="" width={124} height={128} className="w-[124px] h-[128px] rounded-lg bg-white object-contain" />
                <p className="text-sm text-center">{face.mnemonic.caption}</p>
                <p className="text-[10px] text-foreground-muted">{MNEMONIC_CREDIT}</p>
              </div>
            )}
          </div>
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
          <div className="relative w-full">
            <div
              role="button"
              tabIndex={0}
              aria-label="Flashcard: tap to flip"
              onClick={flip}
              onKeyDown={(e) => {
                // Space is handled globally (also covers an unfocused card); Enter only fires
                // here, so handling Space too would double-toggle and cancel itself out.
                if (e.key === "Enter") {
                  e.preventDefault();
                  flip();
                }
              }}
              className={clsx(
                "relative w-full rounded-3xl [perspective:1200px] cursor-pointer select-none [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
                deck === "words" ? "h-72" : "h-96",
              )}
            >
              <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                <motion.div
                  key={card.id}
                  custom={direction}
                  variants={SLIDE}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
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

            <SideButton side="left" disabled={index === 0} onClick={() => go(-1)} />
            <SideButton side="right" disabled={index === cards.length - 1} onClick={() => go(1)} />
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

      <p className="text-[11px] text-foreground-muted text-center">Tap the card to flip it · space and ← → work too</p>
    </div>
  );
}
