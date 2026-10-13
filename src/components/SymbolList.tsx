"use client";

import Link from "next/link";
import { useState } from "react";
import { clsx } from "clsx";
import { Modal } from "./Modal";
import { TeachContent } from "./QuizCards";
import { BAND_STYLE } from "./learnShared";
import { buildQuiz } from "@/lib/quizzes";
import { bandOf } from "@/lib/mastery";
import type { QuizType } from "@/lib/decks";
import type { ItemStatDTO } from "@/lib/quizSelection";
import type { LanguageCode } from "@/types";

// The whole deck at a glance: each symbol with its sound underneath, tinted by progress. Tapping one
// opens its full card (sound, cue word, notes, mnemonic).
export function SymbolList({ deck, languageCode, stats }: { deck: QuizType; languageCode: LanguageCode; stats: ItemStatDTO[] }) {
  const quiz = buildQuiz({ deck, languageCode });
  const [open, setOpen] = useState<string | null>(null);
  // One clock per mount, so the render stays pure.
  const [now] = useState(() => Date.now());
  const byId = new Map(stats.map((s) => [s.itemId, s]));
  const openItem = open ? quiz.itemById(open) : undefined;

  return (
    <div className="mx-auto max-w-lg w-full px-4 sm:px-6 py-8 flex flex-col gap-5">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-lg font-medium">{quiz.title.replace(/ quiz$/i, "")}</h1>
        <Link href={`/learn?lang=${languageCode}`} className="text-sm text-foreground-muted hover:text-foreground">
          &larr; Learn
        </Link>
      </div>

      {quiz.groups.map((group) => (
        <section key={group} className="flex flex-col gap-2">
          <h2 className="text-[11px] uppercase tracking-wide text-foreground-muted">{group}</h2>
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
            {quiz.items
              .filter((item) => item.group === group)
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setOpen(item.id)}
                  className={clsx(
                    "rounded-xl border flex flex-col items-center justify-center gap-0.5 py-2 px-1 hover:brightness-95 transition",
                    BAND_STYLE[bandOf(byId.get(item.id), now)],
                  )}
                >
                  <span className={clsx("native-text leading-tight text-foreground", quiz.answerSize === "word" ? "text-lg" : "text-2xl")}>
                    {item.answer}
                  </span>
                  <span className="text-[11px] text-foreground-muted truncate max-w-full">{item.code}</span>
                </button>
              ))}
          </div>
        </section>
      ))}

      <Modal open={!!openItem} onClose={() => setOpen(null)}>
        {openItem && (
          <div className="p-6 flex flex-col items-center gap-3 text-center">
            <TeachContent quiz={quiz} pick={{ itemId: openItem.id, variantIndex: 0 }} />
            <button
              type="button"
              onClick={() => setOpen(null)}
              className="mt-1 px-4 py-2 rounded-full text-sm border border-border hover:bg-surface-muted transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
