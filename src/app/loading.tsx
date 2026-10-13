import { Skeleton } from "@/components/Skeleton";

// Next.js wraps page.tsx in a Suspense boundary using this as the fallback, so the shell below
// streams to the browser instantly while the word-list page's DB query is still running -
// instead of the whole response blocking on it.
export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
        <Skeleton className="h-9 w-full rounded-full" />
        <div className="flex gap-1.5">
          <Skeleton className="h-7 w-12 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border px-3 py-2 space-y-1.5">
              <div className="flex items-baseline gap-2">
                <Skeleton className="h-6 w-14" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-9 w-full rounded-full" />
      </div>
    </div>
  );
}
