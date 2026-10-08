import { Fragment } from "react";

// "**x**" marks the sound an "as in" example (or a quiz cue word) is illustrating.
export function Emphasis({ text }: { text: string }) {
  return text.split("**").map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-foreground">
        {part}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
