import { Fragment } from "react";

// "**x**" marks the sound an "as in" example (or a quiz cue word) is illustrating. `highlight`
// makes it unmistakable in text that is already dark and heavy (the quiz question): the rest of
// the word is dimmed by the caller and the marked letters get bold, accent colour and an underline.
export function Emphasis({ text, highlight = false }: { text: string; highlight?: boolean }) {
  return text.split("**").map((part, i) =>
    i % 2 === 1 ? (
      <strong
        key={i}
        className={
          highlight
            ? "font-bold text-accent underline decoration-2 underline-offset-4"
            : "font-bold text-foreground"
        }
      >
        {part}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
