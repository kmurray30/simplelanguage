import { Fragment } from "react";

// "**x**" marks the sound an "as in" example (or a quiz cue word) is illustrating. `highlight`
// makes it unmistakable in text that is already dark and heavy (the quiz question): the rest of
// the word is dimmed by the caller and the marked letters get bold on a soft highlighter-style
// background (no underline or accent text: that reads as a hyperlink).
export function Emphasis({ text, highlight = false }: { text: string; highlight?: boolean }) {
  return text.split("**").map((part, i) =>
    i % 2 === 1 ? (
      <strong
        key={i}
        className={
          highlight
            ? "font-bold text-foreground bg-accent-soft rounded px-0.5 [box-decoration-break:clone]"
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
