export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-surface-muted ${className}`} />;
}

export function SkeletonCandidateCard() {
  return (
    <div className="rounded-xl border border-border p-3.5 space-y-2.5">
      <div className="flex items-baseline gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}
