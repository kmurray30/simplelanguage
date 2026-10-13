import { clsx } from "clsx";
import { REVIEWED_AT } from "@/lib/mastery";

// How well the app reckons you know something right now (0-100, after forgetting), as a number
// and a thin bar. null = never practised.
export function Proficiency({ value, className }: { value: number | null; className?: string }) {
  return (
    <div className={clsx("w-full max-w-xs flex flex-col gap-1", className)}>
      <div className="flex items-baseline justify-between text-xs">
        <span className="uppercase tracking-wide text-foreground-muted">Proficiency</span>
        <span className="tabular-nums font-medium">{value === null ? "Not practised yet" : `${value}/100`}</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-muted overflow-hidden" aria-hidden>
        <div
          className={clsx("h-full rounded-full", (value ?? 0) >= REVIEWED_AT ? "bg-success" : "bg-accent")}
          style={{ width: `${value ?? 0}%` }}
        />
      </div>
    </div>
  );
}
