"use client";

import { useRef, useState } from "react";
import { clsx } from "clsx";

export function AudioButton({
  wordId,
  size = "md",
  className,
}: {
  wordId: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function play(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (status === "loading") return;

    if (!audioRef.current) {
      audioRef.current = new Audio(`/api/words/${wordId}/audio`);
      audioRef.current.addEventListener("ended", () => setStatus("idle"));
      audioRef.current.addEventListener("error", () => setStatus("error"));
    }

    try {
      setStatus("loading");
      await audioRef.current.play();
      setStatus("playing");
    } catch {
      setStatus("error");
    }
  }

  const dim = size === "sm" ? "h-7 w-7" : "h-9 w-9";

  return (
    <button
      type="button"
      onClick={play}
      title={status === "error" ? "Couldn't play audio" : "Play pronunciation"}
      className={clsx(
        dim,
        "shrink-0 inline-flex items-center justify-center rounded-full border transition-colors",
        status === "error"
          ? "border-red-300 text-red-500"
          : "border-border text-accent hover:bg-accent-soft",
        className,
      )}
    >
      {status === "loading" ? (
        <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : status === "playing" ? (
        <SpeakerWaveIcon className="h-4 w-4" />
      ) : (
        <SpeakerIcon className="h-4 w-4" />
      )}
    </button>
  );
}

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 9.5v5h3.5L13 19V5L7.5 9.5H4Z"
        fill="currentColor"
      />
      <path
        d="M16.5 8.5a4.5 4.5 0 0 1 0 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SpeakerWaveIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 9.5v5h3.5L13 19V5L7.5 9.5H4Z" fill="currentColor" />
      <path
        d="M16.5 8.5a4.5 4.5 0 0 1 0 7M19 6a8 8 0 0 1 0 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
